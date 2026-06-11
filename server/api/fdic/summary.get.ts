/**
 * GET /api/fdic/summary
 *
 * Aggregate stats for the dashboard: counts of active vs inactive
 * institutions, top-N banks by total assets, breakdown by charter class,
 * breakdown by state, and recent failures.
 */
import { fdicFetch, reformatFdicDate } from '~/server/utils/fdic';

const TOP_FIELDS = [
    'CERT',
    'NAME',
    'CITY',
    'STALP',
    'BKCLASS',
    'ASSET',
    'DEP',
    'NETINC',
    'OFFICES',
].join(',');

const CHARTER_CLASSES = ['N', 'NM', 'SM', 'SB', 'SA', 'OI', 'NC', 'NS'];

export default defineEventHandler(async () => {
    const [active, inactive, topByAssets, recentFailures, ...byClass] = await Promise.all([
        fdicFetch('institutions', { filters: 'ACTIVE:1', limit: 1, fields: 'CERT' }),
        fdicFetch('institutions', { filters: 'ACTIVE:0', limit: 1, fields: 'CERT' }),
        fdicFetch('institutions', {
            filters: 'ACTIVE:1',
            fields: TOP_FIELDS,
            sort_by: 'ASSET',
            sort_order: 'DESC',
            limit: 10,
        }),
        fdicFetch('failures', {
            fields: 'CERT,NAME,CITY,PSTALP,FAILDATE,COST,QBFASSET,BIDNAME',
            sort_by: 'FAILDATE',
            sort_order: 'DESC',
            limit: 5,
        }),
        ...CHARTER_CLASSES.map((cls) =>
            fdicFetch('institutions', {
                filters: `ACTIVE:1 AND BKCLASS:${cls}`,
                limit: 1,
                fields: 'CERT',
            }).then(({ total }) => ({ class: cls, count: total }))
        ),
    ]);

    return {
        counts: {
            active: active.total,
            inactive: inactive.total,
            total: active.total + inactive.total,
        },
        byCharterClass: (byClass as { class: string; count: number }[]).filter((c) => c.count > 0),
        topByAssets: topByAssets.rows,
        recentFailures: recentFailures.rows.map((r: any) => ({
            ...r,
            FAILDATE: reformatFdicDate(r.FAILDATE),
        })),
    };
});
