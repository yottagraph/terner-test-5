/**
 * Display formatters for FDIC data. The Call Report API reports dollar
 * figures in thousands of USD, so most values get scaled to billions/millions
 * before display.
 */

const NF_INT = new Intl.NumberFormat('en-US');
const NF_DEC2 = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * Render a Call-Report dollar figure (input is THOUSANDS of USD) as a compact
 * human-readable currency string with B / M / K suffixes.
 */
export function formatThousands(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    const dollars = Number(value) * 1000;
    return formatCurrency(dollars);
}

/** Render an absolute USD figure with B / M / K suffixes. */
export function formatCurrency(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    const v = Number(value);
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}$${NF_DEC2.format(abs / 1e12)}T`;
    if (abs >= 1e9) return `${sign}$${NF_DEC2.format(abs / 1e9)}B`;
    if (abs >= 1e6) return `${sign}$${NF_DEC2.format(abs / 1e6)}M`;
    if (abs >= 1e3) return `${sign}$${NF_DEC2.format(abs / 1e3)}K`;
    return `${sign}$${NF_INT.format(abs)}`;
}

export function formatNumber(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    return NF_INT.format(Number(value));
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
    if (value == null || Number.isNaN(value)) return '—';
    return `${Number(value).toFixed(digits)}%`;
}

/** Convert an FDIC compact YYYYMMDD date to a friendly "Q4 2025"-style label. */
export function formatQuarter(repdate: string | number | null | undefined): string {
    if (!repdate) return '—';
    const s = String(repdate);
    if (s.length !== 8) return s;
    const year = s.slice(0, 4);
    const mm = s.slice(4, 6);
    const quarter = { '03': 'Q1', '06': 'Q2', '09': 'Q3', '12': 'Q4' }[mm] ?? mm;
    return `${quarter} ${year}`;
}

/** Convert an FDIC compact YYYYMMDD date to ISO YYYY-MM-DD. */
export function formatRepDateIso(repdate: string | number | null | undefined): string {
    if (!repdate) return '';
    const s = String(repdate);
    if (s.length !== 8) return s;
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export const CHARTER_CLASS_LABELS: Record<string, string> = {
    N: 'National (OCC)',
    NM: 'State, Non-member',
    SM: 'State, Fed Member',
    SB: 'Savings Bank',
    SA: 'Savings Association (OTS)',
    OI: 'Insured U.S. Branch of Foreign Bank',
    NC: 'Non-insured Commercial',
    NS: 'Non-insured Stock Savings',
};
