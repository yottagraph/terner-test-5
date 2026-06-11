/**
 * FDIC BankFind Suite API helpers.
 *
 * The public FDIC API (no auth) at https://banks.data.fdic.gov/api/* returns
 * JSON of the shape { meta, data: [{ data: {...}, score }], totals }.
 *
 * `fdicFetch` wraps the request, normalises the result into a flat array of
 * record objects, and surfaces the total count for paging.
 */

const FDIC_BASE = 'https://banks.data.fdic.gov/api';

export interface FdicResult<T = Record<string, any>> {
    rows: T[];
    total: number;
}

export async function fdicFetch<T = Record<string, any>>(
    endpoint: string,
    params: Record<string, string | number | undefined> = {}
): Promise<FdicResult<T>> {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        search.set(k, String(v));
    }
    const url = `${FDIC_BASE}/${endpoint}${search.toString() ? `?${search}` : ''}`;

    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        // Light cache hint; FDIC API serves quarterly data and is fast.
        redirect: 'follow',
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw createError({
            statusCode: res.status,
            statusMessage: `FDIC API ${endpoint} returned ${res.status}`,
            data: { url, body: body.slice(0, 500) },
        });
    }

    const json: any = await res.json();
    const rows: T[] = Array.isArray(json?.data) ? json.data.map((d: any) => d?.data ?? d) : [];
    const total = Number(json?.meta?.total ?? json?.totals?.count ?? rows.length);
    return { rows, total };
}

/** Reformat FDIC date "M/D/YYYY" or "MM/DD/YYYY" → "YYYY-MM-DD". */
export function reformatFdicDate(value: unknown): string | null {
    if (!value) return null;
    const s = String(value).trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return s;
    const [, mm, dd, yy] = m;
    return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/** Compact YYYYMMDD report date → ISO YYYY-MM-DD. */
export function formatRepDate(value: unknown): string | null {
    if (!value) return null;
    const s = String(value);
    if (s.length !== 8) return s;
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
