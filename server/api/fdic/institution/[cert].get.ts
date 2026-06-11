/**
 * GET /api/fdic/institution/:cert
 *
 * Returns a single FDIC institution by certificate number, plus the most
 * recent quarterly Call Report financials and any failure record (if the
 * institution has failed).
 */
import { fdicFetch, reformatFdicDate } from '~/server/utils/fdic';

const INSTITUTION_FIELDS = [
    'CERT',
    'NAME',
    'NAMEFULL',
    'CITY',
    'STALP',
    'ZIP',
    'ADDRESS',
    'COUNTY',
    'BKCLASS',
    'REGAGNT',
    'FED_RSSD',
    'ESTYMD',
    'INSDATE',
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
    'PRIORNAME1',
    'PRIORNAME2',
    'PRIORNAME3',
    'PRIORNAME4',
    'PRIORNAME5',
    'PRIORNAME6',
    'CONSERVE',
    'INACTIVE',
    'ENDEFYMD',
    'CB',
    'TRUST',
    'INTERNET',
].join(',');

const FINANCIAL_FIELDS = [
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

    const [{ rows: institutions }, { rows: financials }, { rows: failures }] = await Promise.all([
        fdicFetch('institutions', {
            filters: `CERT:${cert}`,
            fields: INSTITUTION_FIELDS,
            limit: 1,
        }),
        fdicFetch('financials', {
            filters: `CERT:${cert}`,
            fields: FINANCIAL_FIELDS,
            sort_by: 'REPDTE',
            sort_order: 'DESC',
            limit: 1,
        }),
        fdicFetch('failures', {
            filters: `CERT:${cert}`,
            limit: 1,
        }),
    ]);

    const institution = institutions[0] ?? null;
    if (!institution) {
        throw createError({ statusCode: 404, statusMessage: `FDIC institution ${cert} not found` });
    }

    const priorNames = [
        institution.PRIORNAME1,
        institution.PRIORNAME2,
        institution.PRIORNAME3,
        institution.PRIORNAME4,
        institution.PRIORNAME5,
        institution.PRIORNAME6,
    ].filter((n: any) => n && String(n).trim());

    return {
        institution: {
            ...institution,
            ESTYMD: reformatFdicDate(institution.ESTYMD),
            INSDATE: reformatFdicDate(institution.INSDATE),
            ENDEFYMD: reformatFdicDate(institution.ENDEFYMD),
            priorNames,
        },
        latestFinancials: financials[0] ?? null,
        failure: failures[0] ?? null,
    };
});
