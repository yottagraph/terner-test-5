<template>
    <div class="detail-page">
        <div class="detail-content">
            <NuxtLink to="/banks" class="back-link">
                <v-icon size="small">mdi-arrow-left</v-icon> Back to all banks
            </NuxtLink>

            <v-alert v-if="error" type="error" variant="tonal" class="mb-6" closable>
                {{ error }}
            </v-alert>

            <template v-if="loading">
                <v-skeleton-loader type="article, list-item-three-line, list-item-three-line" />
            </template>

            <template v-else-if="data">
                <div class="detail-header">
                    <div>
                        <div class="eyebrow">
                            FDIC Certificate {{ data.institution.CERT }}
                            <v-chip
                                v-if="data.institution.ACTIVE === 1"
                                size="x-small"
                                variant="tonal"
                                color="success"
                                class="ml-2"
                                >Active</v-chip
                            >
                            <v-chip v-else size="x-small" variant="tonal" color="error" class="ml-2"
                                >Inactive</v-chip
                            >
                        </div>
                        <h1 class="bank-name">{{ data.institution.NAME }}</h1>
                        <p class="bank-tagline">
                            {{ data.institution.ADDRESS }} · {{ data.institution.CITY }},
                            {{ data.institution.STALP }} {{ data.institution.ZIP }}
                            <a
                                v-if="data.institution.WEBADDR"
                                :href="websiteUrl"
                                target="_blank"
                                rel="noopener"
                                class="ml-2"
                            >
                                <v-icon size="small">mdi-open-in-new</v-icon>
                                {{ data.institution.WEBADDR }}
                            </a>
                        </p>
                    </div>
                </div>

                <v-row dense class="mb-2">
                    <v-col cols="12" sm="6" md="3">
                        <StatCard
                            label="Total assets"
                            :value="formatThousands(latest?.ASSET ?? data.institution.ASSET)"
                            icon="mdi-cash-multiple"
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <StatCard
                            label="Total deposits"
                            :value="formatThousands(latest?.DEP ?? data.institution.DEP)"
                            icon="mdi-bank-transfer-in"
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <StatCard
                            label="Net income (qtr)"
                            :value="formatThousands(latest?.NETINC)"
                            icon="mdi-trending-up"
                        />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <StatCard
                            label="Equity"
                            :value="formatThousands(latest?.EQ ?? data.institution.EQ)"
                            icon="mdi-shield-bank"
                        />
                    </v-col>
                </v-row>

                <v-row dense>
                    <v-col cols="12" md="7">
                        <v-card variant="outlined" class="mb-4">
                            <v-card-title class="d-flex align-center">
                                <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
                                Quarterly trend
                            </v-card-title>
                            <v-card-subtitle>
                                Last
                                {{ financials.length || 0 }}
                                quarters of Call Report data
                            </v-card-subtitle>
                            <v-divider />

                            <v-card-text v-if="financialsLoading" class="text-center">
                                <v-progress-circular indeterminate color="primary" />
                            </v-card-text>

                            <div v-else-if="financials.length" class="trend-grid">
                                <TrendBlock
                                    label="Total assets"
                                    :values="seriesAssets"
                                    :latest="latest?.ASSET"
                                    :previous="previous?.ASSET"
                                    formatter="thousands"
                                    color="#3FEA00"
                                />
                                <TrendBlock
                                    label="Total deposits"
                                    :values="seriesDeposits"
                                    :latest="latest?.DEP"
                                    :previous="previous?.DEP"
                                    formatter="thousands"
                                    color="#3FEA00"
                                />
                                <TrendBlock
                                    label="Net income"
                                    :values="seriesNetinc"
                                    :latest="latest?.NETINC"
                                    :previous="previous?.NETINC"
                                    formatter="thousands"
                                    color="#FF5C00"
                                />
                                <TrendBlock
                                    label="Return on equity"
                                    :values="seriesRoe"
                                    :latest="latest?.ROE"
                                    :previous="previous?.ROE"
                                    formatter="percent"
                                    color="#003BFF"
                                />
                                <TrendBlock
                                    label="Return on assets"
                                    :values="seriesRoa"
                                    :latest="latest?.ROA"
                                    :previous="previous?.ROA"
                                    formatter="percent"
                                    color="#003BFF"
                                />
                                <TrendBlock
                                    label="Net interest margin"
                                    :values="seriesNim"
                                    :latest="latest?.NIMY"
                                    :previous="previous?.NIMY"
                                    formatter="percent"
                                    color="#003BFF"
                                />
                            </div>

                            <v-card-text v-else class="text-center text-medium-emphasis">
                                No quarterly Call Report data available.
                            </v-card-text>
                        </v-card>

                        <v-card v-if="financials.length" variant="outlined">
                            <v-card-title class="d-flex align-center">
                                <v-icon class="mr-2" color="primary">mdi-table</v-icon>
                                Quarterly Call Reports
                            </v-card-title>
                            <v-divider />
                            <v-data-table
                                :headers="quarterHeaders"
                                :items="financials"
                                density="compact"
                                :items-per-page="12"
                                hover
                            >
                                <template v-slot:item.REPDTE="{ item }">
                                    {{ formatQuarter(item.REPDTE) }}
                                </template>
                                <template v-slot:item.ASSET="{ item }">
                                    <span class="num">{{ formatThousands(item.ASSET) }}</span>
                                </template>
                                <template v-slot:item.DEP="{ item }">
                                    <span class="num">{{ formatThousands(item.DEP) }}</span>
                                </template>
                                <template v-slot:item.NETINC="{ item }">
                                    <span class="num">{{ formatThousands(item.NETINC) }}</span>
                                </template>
                                <template v-slot:item.ROE="{ item }">
                                    <span class="num">{{ formatPercent(item.ROE) }}</span>
                                </template>
                                <template v-slot:item.NIMY="{ item }">
                                    <span class="num">{{ formatPercent(item.NIMY) }}</span>
                                </template>
                                <template v-slot:item.NUMEMP="{ item }">
                                    <span class="num">{{ formatNumber(item.NUMEMP) }}</span>
                                </template>
                            </v-data-table>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="5">
                        <v-card variant="outlined" class="mb-4">
                            <v-card-title class="d-flex align-center">
                                <v-icon class="mr-2" color="primary"
                                    >mdi-card-account-details</v-icon
                                >
                                Profile
                            </v-card-title>
                            <v-divider />
                            <div class="profile-grid pa-4">
                                <FactRow label="Charter class">
                                    <code class="class-code">{{ data.institution.BKCLASS }}</code>
                                    <span class="ml-2 muted">
                                        {{ charterLabel(data.institution.BKCLASS) }}
                                    </span>
                                </FactRow>
                                <FactRow label="Regulator">
                                    {{ data.institution.REGAGNT || '—' }}
                                </FactRow>
                                <FactRow label="FDIC region">
                                    {{ data.institution.FDICREGN || '—' }}
                                </FactRow>
                                <FactRow label="Specialization">
                                    {{ data.institution.SPECGRPN || '—' }}
                                </FactRow>
                                <FactRow label="Holding company">
                                    {{ data.institution.NAMEHCR || 'Independent' }}
                                </FactRow>
                                <FactRow label="Established">
                                    {{ data.institution.ESTYMD || '—' }}
                                </FactRow>
                                <FactRow label="FDIC insured since">
                                    {{ data.institution.INSDATE || '—' }}
                                </FactRow>
                                <FactRow label="Offices">
                                    {{ formatNumber(data.institution.OFFICES) }}
                                </FactRow>
                                <FactRow label="Federal Reserve RSSD">
                                    <code class="rssd">{{ data.institution.FED_RSSD || '—' }}</code>
                                </FactRow>
                                <FactRow v-if="latest?.NUMEMP" label="Employees (FTE)">
                                    {{ formatNumber(latest.NUMEMP) }}
                                </FactRow>
                            </div>
                        </v-card>

                        <v-card
                            v-if="data.institution.priorNames.length"
                            variant="outlined"
                            class="mb-4"
                        >
                            <v-card-title class="d-flex align-center">
                                <v-icon class="mr-2">mdi-history</v-icon> Prior names
                            </v-card-title>
                            <v-divider />
                            <v-list density="compact">
                                <v-list-item
                                    v-for="(name, i) in data.institution.priorNames"
                                    :key="i"
                                >
                                    <v-list-item-title>{{ name }}</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-card>

                        <v-card v-if="data.failure" variant="outlined" color="error" class="mb-4">
                            <v-card-title class="d-flex align-center">
                                <v-icon class="mr-2" color="error">mdi-alert-octagon</v-icon>
                                Bank failure
                            </v-card-title>
                            <v-divider />
                            <div class="profile-grid pa-4">
                                <FactRow label="Failure date">
                                    {{ failureDate }}
                                </FactRow>
                                <FactRow label="Resolution type">
                                    {{ data.failure.RESTYPE1 || data.failure.RESTYPE || '—' }}
                                </FactRow>
                                <FactRow label="Acquirer">
                                    {{ data.failure.BIDNAME || 'Payout (no acquirer)' }}
                                </FactRow>
                                <FactRow label="Estimated loss to DIF">
                                    {{ formatThousands(data.failure.COST) }}
                                </FactRow>
                                <FactRow label="Assets at failure">
                                    {{ formatThousands(data.failure.QBFASSET) }}
                                </FactRow>
                                <FactRow label="Deposits at failure">
                                    {{ formatThousands(data.failure.QBFDEP) }}
                                </FactRow>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
    import StatCard from '~/components/StatCard.vue';
    import TrendBlock from '~/components/TrendBlock.vue';
    import FactRow from '~/components/FactRow.vue';
    import {
        CHARTER_CLASS_LABELS,
        formatNumber,
        formatPercent,
        formatQuarter,
        formatThousands,
    } from '~/utils/format';

    function reformatFdicDate(value: unknown): string | null {
        if (!value) return null;
        const s = String(value).trim();
        if (!s) return null;
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!m) return s;
        const [, mm, dd, yy] = m;
        return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }

    const route = useRoute();
    const cert = computed(() => String(route.params.cert));

    interface DetailResponse {
        institution: {
            CERT: number;
            NAME: string;
            ADDRESS?: string;
            CITY?: string;
            STALP?: string;
            ZIP?: string;
            BKCLASS?: string;
            REGAGNT?: string;
            FED_RSSD?: string | number;
            ESTYMD?: string | null;
            INSDATE?: string | null;
            ENDEFYMD?: string | null;
            ACTIVE?: number;
            NAMEHCR?: string;
            WEBADDR?: string;
            FDICREGN?: string;
            SPECGRPN?: string;
            OFFICES?: number;
            ASSET?: number;
            DEP?: number;
            NETINC?: number;
            EQ?: number;
            priorNames: string[];
            [key: string]: any;
        };
        latestFinancials: any | null;
        failure: any | null;
    }

    const data = ref<DetailResponse | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const financials = ref<any[]>([]);
    const financialsLoading = ref(false);

    function charterLabel(code: string | null | undefined): string {
        if (!code) return '—';
        return CHARTER_CLASS_LABELS[code] ?? code;
    }

    const websiteUrl = computed(() => {
        const w = data.value?.institution?.WEBADDR;
        if (!w) return undefined;
        return /^https?:/.test(w) ? w : `https://${w}`;
    });

    const failureDate = computed(() => {
        const v = data.value?.failure?.FAILDATE;
        return v ? reformatFdicDate(v) : '—';
    });

    // Financial series are sorted DESC by REPDTE in the API. Reverse for trend display.
    const orderedFinancials = computed(() => [...financials.value].reverse());

    const latest = computed(() => financials.value[0] ?? null);
    const previous = computed(() => financials.value[1] ?? null);

    const seriesAssets = computed(() => orderedFinancials.value.map((f) => f.ASSET));
    const seriesDeposits = computed(() => orderedFinancials.value.map((f) => f.DEP));
    const seriesNetinc = computed(() => orderedFinancials.value.map((f) => f.NETINC));
    const seriesRoe = computed(() => orderedFinancials.value.map((f) => f.ROE));
    const seriesRoa = computed(() => orderedFinancials.value.map((f) => f.ROA));
    const seriesNim = computed(() => orderedFinancials.value.map((f) => f.NIMY));

    const quarterHeaders = [
        { title: 'Quarter', key: 'REPDTE', sortable: true },
        { title: 'Assets', key: 'ASSET', align: 'end' as const, sortable: true },
        { title: 'Deposits', key: 'DEP', align: 'end' as const, sortable: true },
        { title: 'Net income', key: 'NETINC', align: 'end' as const, sortable: true },
        { title: 'ROE', key: 'ROE', align: 'end' as const, sortable: true },
        { title: 'NIM', key: 'NIMY', align: 'end' as const, sortable: true },
        { title: 'Employees', key: 'NUMEMP', align: 'end' as const, sortable: true },
    ];

    async function load() {
        loading.value = true;
        error.value = null;
        try {
            data.value = await $fetch<DetailResponse>(`/api/fdic/institution/${cert.value}`);
        } catch (e: any) {
            error.value = e?.statusMessage || e?.message || 'Failed to load institution';
        } finally {
            loading.value = false;
        }
    }

    async function loadFinancials() {
        financialsLoading.value = true;
        try {
            const r = await $fetch<{ rows: any[] }>(
                `/api/fdic/institution/${cert.value}/financials`,
                {
                    query: { limit: 24 },
                }
            );
            financials.value = r.rows;
        } catch {
            financials.value = [];
        } finally {
            financialsLoading.value = false;
        }
    }

    onMounted(() => {
        load();
        loadFinancials();
    });

    watch(cert, () => {
        load();
        loadFinancials();
    });
</script>

<style scoped>
    .detail-page {
        height: 100%;
        overflow-y: auto;
        padding: 24px 24px 48px;
    }

    .detail-content {
        max-width: 1400px;
        margin: 0 auto;
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--lv-silver, #a0aec0);
        text-decoration: none;
        font-size: 0.85rem;
        margin-bottom: 16px;
    }

    .back-link:hover {
        color: var(--lv-green, #3fea00);
    }

    .detail-header {
        margin-bottom: 24px;
    }

    .eyebrow {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--lv-green, #3fea00);
        margin-bottom: 6px;
    }

    .bank-name {
        font-family: var(--font-headline);
        font-weight: 400;
        font-size: 2rem;
        margin-bottom: 6px;
        line-height: 1.2;
    }

    .bank-tagline {
        color: var(--lv-silver, #a0aec0);
        font-size: 0.95rem;
        margin: 0;
    }

    .bank-tagline a {
        color: var(--lv-green, #3fea00);
        text-decoration: none;
    }

    .bank-tagline a:hover {
        text-decoration: underline;
    }

    .trend-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding: 16px;
    }

    @media (max-width: 600px) {
        .trend-grid {
            grid-template-columns: 1fr;
        }
    }

    .profile-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .num {
        font-family: var(--font-mono);
        font-size: 0.85rem;
    }

    .class-code {
        font-family: var(--font-mono);
        background: rgba(255, 255, 255, 0.06);
        padding: 2px 6px;
        border-radius: 3px;
        color: var(--lv-green, #3fea00);
    }

    .rssd {
        font-family: var(--font-mono);
        font-size: 0.85rem;
    }

    .muted {
        color: var(--lv-silver, #a0aec0);
        font-size: 0.85rem;
    }
</style>
