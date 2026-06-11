/**
 * GET /api/fdic/institutions
 *
 * Searches the FDIC BankFind institutions endpoint with paging, name search,
 * state filter, charter-class filter, and active flag. Returns a normalised
 * `{ rows, total }` payload the UI can render directly.
 *
 * Query params:
 *   q         - name substring (matched against NAME)
 *   state     - 2-letter state code (STALP)
 *   bkclass   - charter class code (e.g. N, NM, SM, SB, SA)
 *   active    - "1" (default), "0", or "all"
 *   limit     - rows per page (default 25, max 200)
 *   offset    - paging offset (default 0)
 *   sort      - field to sort by (default ASSET); use prefix "-" for desc
 */
import { fdicFetch } from '~/server/utils/fdic';

const FIELDS = [
    'CERT',
    'NAME',
    'CITY',
    'STALP',
    'ZIP',
    'ADDRESS',
    'BKCLASS',
    'REGAGNT',
    'FED_RSSD',
    'ESTYMD',
    'ACTIVE',
    'NAMEHCR',
    'WEBADDR',
    'FDICREGN',
    'SPECGRPN',
    'OFFICES',
    'ASSET',
    'DEP',
    'NETINC',
    'EQ',
    'INSDATE',
].join(',');

const ALLOWED_SORT = new Set([
    'ASSET',
    'NAME',
    'STALP',
    'CITY',
    'ESTYMD',
    'OFFICES',
    'NETINC',
    'DEP',
    'EQ',
]);

export default defineEventHandler(async (event) => {
    const q = getQuery(event);
    const filters: string[] = [];

    const active = String(q.active ?? '1');
    if (active === '1') filters.push('ACTIVE:1');
    else if (active === '0') filters.push('ACTIVE:0');

    if (q.state) {
        const code = String(q.state)
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 2);
        if (code.length === 2) filters.push(`STALP:${code}`);
    }

    if (q.bkclass) {
        const cls = String(q.bkclass)
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 4);
        if (cls) filters.push(`BKCLASS:${cls}`);
    }

    const search = (q.q ? String(q.q) : '').trim();
    // Quote+wildcard for substring match. FDIC search does case-insensitive contains.
    const searchParam = search ? `NAME:${JSON.stringify(`*${search}*`)}` : undefined;

    const limit = Math.min(Math.max(Number(q.limit ?? 25) || 25, 1), 200);
    const offset = Math.max(Number(q.offset ?? 0) || 0, 0);

    const sortRaw = String(q.sort ?? '-ASSET');
    const sortDesc = sortRaw.startsWith('-');
    const sortField = sortRaw.replace(/^[-+]/, '').toUpperCase();
    const sortBy = ALLOWED_SORT.has(sortField) ? sortField : 'ASSET';
    const sortOrder = sortDesc ? 'DESC' : 'ASC';

    const { rows, total } = await fdicFetch('institutions', {
        filters: filters.join(' AND ') || undefined,
        search: searchParam,
        fields: FIELDS,
        limit,
        offset,
        sort_by: sortBy,
        sort_order: sortOrder,
    });

    return { rows, total, limit, offset, sort: `${sortDesc ? '-' : ''}${sortBy}` };
});
