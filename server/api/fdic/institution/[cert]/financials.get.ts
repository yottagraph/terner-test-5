/**
 * GET /api/fdic/institution/:cert/financials
 *
 * Returns quarterly Call Report financials for one institution, ordered by
 * report-date descending. Useful for plotting trend charts of assets,
 * deposits, equity, and earnings over time.
 *
 * Query params:
 *   limit  - number of quarters to return (default 24, max 80)
 */
import { fdicFetch } from '~/server/utils/fdic';

const FIELDS = [
    'CERT',
    'REPDTE',
    'ASSET',
    'DEP',
    'LIAB',
    'EQ',
    'NETINC',
    'LNLSNET',
    'DEPINS',
    'DEPUNINS',
    'ROA',
    'ROE',
    'NIMY',
    'NUMEMP',
    'INTINC',
    'EINTEXP',
].join(',');

export default defineEventHandler(async (event) => {
    const cert = String(getRouterParam(event, 'cert') ?? '').replace(/[^0-9]/g, '');
    if (!cert) {
        throw createError({
            statusCode: 400,
            statusMessage: 'cert (FDIC certificate number) is required',
        });
    }

    const q = getQuery(event);
    const limit = Math.min(Math.max(Number(q.limit ?? 24) || 24, 1), 80);

    const { rows, total } = await fdicFetch('financials', {
        filters: `CERT:${cert}`,
        fields: FIELDS,
        sort_by: 'REPDTE',
        sort_order: 'DESC',
        limit,
    });

    return { rows, total, cert };
});
