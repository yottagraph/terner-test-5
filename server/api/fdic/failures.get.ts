/**
 * GET /api/fdic/failures
 *
 * Lists FDIC-insured bank failures, newest first. Optional filters by state
 * and year. Returns a normalised `{ rows, total }` payload.
 */
import { fdicFetch, reformatFdicDate } from '~/server/utils/fdic';

const FIELDS = [
    'CERT',
    'NAME',
    'CITY',
    'CITYST',
    'BIDNAME',
    'BIDCITY',
    'BIDSTATE',
    'FAILDATE',
    'FAILYR',
    'RESDATE',
    'RESTYPE',
    'RESTYPE1',
    'CHCLASS1',
    'COST',
    'QBFASSET',
    'QBFDEP',
    'PSTALP',
    'SAVR',
    'FUND',
].join(',');

export default defineEventHandler(async (event) => {
    const q = getQuery(event);
    const filters: string[] = [];

    if (q.state) {
        const code = String(q.state)
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 2);
        if (code.length === 2) filters.push(`PSTALP:${code}`);
    }
    if (q.year) {
        const year = String(q.year)
            .replace(/[^0-9]/g, '')
            .slice(0, 4);
        if (year.length === 4) filters.push(`FAILYR:${year}`);
    }

    const limit = Math.min(Math.max(Number(q.limit ?? 50) || 50, 1), 500);
    const offset = Math.max(Number(q.offset ?? 0) || 0, 0);

    const { rows, total } = await fdicFetch('failures', {
        filters: filters.join(' AND ') || undefined,
        fields: FIELDS,
        sort_by: 'FAILDATE',
        sort_order: 'DESC',
        limit,
        offset,
    });

    return {
        rows: rows.map((r: any) => ({
            ...r,
            FAILDATE: reformatFdicDate(r.FAILDATE),
            RESDATE: reformatFdicDate(r.RESDATE),
        })),
        total,
        limit,
        offset,
    };
});
