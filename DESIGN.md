# terner test 5 — FDIC Institutions Explorer

## Vision

https://banks.data.fdic.gov/api/institutions — public JSON API, no API key, a
few thousand records (small/fast fetch), and every record is an organization
with a strong ID (FDIC cert number), a location, and clean fields.

please onboard this data source.

## Status

**Initial build complete.** A Nuxt + Vuetify SPA that exposes the FDIC
BankFind Suite API as a browsable, searchable explorer. Three top-level
views (Overview, Institutions, Failures) and a per-bank detail page with
24 quarters of Call Report trend data.

## Architecture

The app is a thin presentation layer over the FDIC BankFind Suite API
(`https://banks.data.fdic.gov/api/*`). The API is public, requires no
key, and serves JSON as `{ meta, data: [{ data: {...}, score }] }`.

Data flow:

```
browser → /api/fdic/* (Nitro server route) → banks.data.fdic.gov → JSON
```

Server routes proxy the FDIC API so the browser hits same-origin URLs
(no CORS) and the UI receives normalised `{ rows, total }` payloads
ready for `<v-data-table-server>` paging.

### Server routes (`server/api/fdic/`)

| Route                                        | Purpose                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| `GET /api/fdic/summary`                      | Dashboard aggregates (counts, top-by-assets, by class, recent failures)     |
| `GET /api/fdic/institutions`                 | Searchable, filterable, paginated list (name, state, charter class, active) |
| `GET /api/fdic/institution/:cert`            | One institution + latest Call Report + failure record (if any)              |
| `GET /api/fdic/institution/:cert/financials` | Up to 80 quarters of Call Report history                                    |
| `GET /api/fdic/failures`                     | Bank failure history with state and year filters                            |

Shared helper `server/utils/fdic.ts` (`fdicFetch`, `reformatFdicDate`,
`formatRepDate`) handles request building, JSON normalisation, and
date-format conversion.

### Pages

| Page                     | Path           | What it does                                                                                                           |
| ------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pages/index.vue`        | `/`            | Dashboard: industry counts, largest banks, charter mix, recent failures                                                |
| `pages/banks/index.vue`  | `/banks`       | Searchable table — name search, state + charter filters, server-side paging + sort                                     |
| `pages/banks/[cert].vue` | `/banks/:cert` | Detail: profile, prior names, 4 KPI cards, 6 sparkline trends, quarterly Call Report table, failure card if applicable |
| `pages/failures.vue`     | `/failures`    | Failures table — state and year filters, links to bank detail                                                          |

### Components

- `StatCard.vue` — labelled metric tile used on overview + detail pages
- `SparklineChart.vue` — dependency-free SVG sparkline (gradient area + line + last-point dot)
- `TrendBlock.vue` — sparkline + latest value + QoQ delta chip
- `FactRow.vue` — label/value row used in the detail-page profile

### Navigation

Permanent left sidebar in `app.vue` (Overview / Institutions / Failures)
with a footer link out to `banks.data.fdic.gov`.

## Modules

- **Overview dashboard** — `/` — high-level industry view sourced from `/api/fdic/summary`.
- **Institutions search** — `/banks` — text search + filters over the ~32K-record institution corpus.
- **Bank detail** — `/banks/:cert` — full FDIC profile + 24 quarters of Call Report trends.
- **Failures explorer** — `/failures` — paginated history of all FDIC-insured failures since 1934.

## Notes for future work

- The platform's Lovelace knowledge graph also ingests FDIC data
  (`fdic` / `fdic_failure` / `fdic_history` sources — see
  `.agents/skills/data-model/fdic/`). A future iteration could swap the
  direct-API server routes for `useElementalClient()` calls so the same
  UI surfaces graph relationships (acquirer chains, holding-company
  rollups, structure-change events) alongside the raw BankFind data.
- Server routes are pure passthrough — no caching layer. If the FDIC
  API's per-IP rate-limit ever becomes a problem, add a short-TTL cache
  (Firestore / KV) keyed on the request URL.
