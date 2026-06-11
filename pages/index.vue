<template>
    <div class="overview-page">
        <div class="overview-content">
            <div class="hero">
                <div class="eyebrow">FDIC BankFind Suite</div>
                <h1 class="hero-title">{{ appName || 'FDIC Institutions Explorer' }}</h1>
                <p class="hero-subtitle">
                    Public profile, financial, and failure data for every FDIC-insured depository
                    institution in the United States — sourced live from
                    <code>banks.data.fdic.gov</code>.
                </p>
            </div>

            <v-alert v-if="error" type="error" variant="tonal" class="mb-6" closable>
                {{ error }}
            </v-alert>

            <v-row v-if="!error" class="mb-6" dense>
                <v-col cols="12" sm="6" md="3">
                    <StatCard
                        label="Active institutions"
                        :value="formatNumber(summary?.counts.active)"
                        icon="mdi-bank"
                        :loading="loading"
                    />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <StatCard
                        label="Inactive (closed/merged)"
                        :value="formatNumber(summary?.counts.inactive)"
                        icon="mdi-bank-off"
                        :loading="loading"
                    />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <StatCard
                        label="Total tracked"
                        :value="formatNumber(summary?.counts.total)"
                        icon="mdi-database"
                        :loading="loading"
                    />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <StatCard
                        label="Industry total assets"
                        :value="totalAssetsLabel"
                        icon="mdi-cash-multiple"
                        :loading="loading"
                    />
                </v-col>
            </v-row>

            <v-row dense>
                <v-col cols="12" md="7">
                    <v-card variant="outlined" class="overview-card">
                        <v-card-title class="d-flex align-center">
                            <v-icon class="mr-2" color="primary">mdi-trophy-outline</v-icon>
                            Largest active institutions
                        </v-card-title>
                        <v-card-subtitle>By total assets, latest Call Report</v-card-subtitle>
                        <v-divider />
                        <v-list density="compact" v-if="summary?.topByAssets.length">
                            <v-list-item
                                v-for="(bank, idx) in summary.topByAssets"
                                :key="bank.CERT"
                                :to="`/banks/${bank.CERT}`"
                                class="bank-row"
                            >
                                <template v-slot:prepend>
                                    <span class="rank-number">{{ idx + 1 }}</span>
                                </template>
                                <v-list-item-title class="bank-name">{{
                                    bank.NAME
                                }}</v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ bank.CITY }}, {{ bank.STALP }} ·
                                    <span class="charter-class">{{
                                        charterLabel(bank.BKCLASS)
                                    }}</span>
                                </v-list-item-subtitle>
                                <template v-slot:append>
                                    <span class="asset-value">{{
                                        formatThousands(bank.ASSET)
                                    }}</span>
                                </template>
                            </v-list-item>
                        </v-list>
                        <v-card-text v-else-if="loading" class="text-center">
                            <v-progress-circular indeterminate color="primary" />
                        </v-card-text>
                        <v-card-actions class="px-4 pb-3">
                            <v-spacer />
                            <v-btn
                                size="small"
                                variant="text"
                                color="primary"
                                to="/banks"
                                append-icon="mdi-arrow-right"
                            >
                                Explore all banks
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>

                <v-col cols="12" md="5">
                    <v-card variant="outlined" class="overview-card">
                        <v-card-title class="d-flex align-center">
                            <v-icon class="mr-2" color="primary">mdi-shield-bank-outline</v-icon>
                            Active by charter class
                        </v-card-title>
                        <v-card-subtitle>Distribution of FDIC charter types</v-card-subtitle>
                        <v-divider />
                        <v-list density="compact">
                            <v-list-item
                                v-for="row in summary?.byCharterClass ?? []"
                                :key="row.class"
                            >
                                <v-list-item-title>
                                    <code class="class-code">{{ row.class }}</code>
                                    <span class="class-name">{{ charterLabel(row.class) }}</span>
                                </v-list-item-title>
                                <template v-slot:append>
                                    <span class="class-count">{{ formatNumber(row.count) }}</span>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card>

                    <v-card variant="outlined" class="overview-card mt-4">
                        <v-card-title class="d-flex align-center">
                            <v-icon class="mr-2" color="error">mdi-alert-octagon-outline</v-icon>
                            Most recent failures
                        </v-card-title>
                        <v-card-subtitle>From the FDIC Failures API</v-card-subtitle>
                        <v-divider />
                        <v-list density="compact" v-if="summary?.recentFailures.length">
                            <v-list-item
                                v-for="f in summary.recentFailures"
                                :key="f.CERT"
                                :to="`/banks/${f.CERT}`"
                            >
                                <v-list-item-title>{{ f.NAME }}</v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ f.CITY }}, {{ f.PSTALP }} · {{ f.FAILDATE }} ·
                                    <span class="acquirer">→ {{ f.BIDNAME || 'Payout' }}</span>
                                </v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                        <v-card-actions class="px-4 pb-3">
                            <v-spacer />
                            <v-btn
                                size="small"
                                variant="text"
                                color="primary"
                                to="/failures"
                                append-icon="mdi-arrow-right"
                            >
                                All failures
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>

            <div class="data-source-footer mt-8">
                <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
                Data source:
                <a href="https://banks.data.fdic.gov/" target="_blank" rel="noopener">
                    FDIC BankFind Suite API
                </a>
                · public, no API key, ~{{ summary ? formatNumber(summary.counts.active) : '4,300' }}
                active records.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {
        formatNumber,
        formatThousands,
        formatCurrency,
        CHARTER_CLASS_LABELS,
    } from '~/utils/format';
    import StatCard from '~/components/StatCard.vue';

    interface SummaryResponse {
        counts: { active: number; inactive: number; total: number };
        byCharterClass: { class: string; count: number }[];
        topByAssets: any[];
        recentFailures: any[];
    }

    const { appName } = useAppInfo();
    const summary = ref<SummaryResponse | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    function charterLabel(code: string | null | undefined): string {
        if (!code) return '—';
        return CHARTER_CLASS_LABELS[code] ?? code;
    }

    const totalAssetsLabel = computed(() => {
        if (!summary.value?.topByAssets) return '—';
        const totalThousands = summary.value.topByAssets.reduce(
            (sum, b) => sum + Number(b.ASSET || 0),
            0
        );
        return `${formatCurrency(totalThousands * 1000)}+`;
    });

    onMounted(async () => {
        try {
            summary.value = await $fetch<SummaryResponse>('/api/fdic/summary');
        } catch (e: any) {
            error.value = e?.statusMessage || e?.message || 'Failed to load FDIC summary';
        } finally {
            loading.value = false;
        }
    });
</script>

<style scoped>
    .overview-page {
        height: 100%;
        overflow-y: auto;
        padding: 32px 24px 48px;
    }

    .overview-content {
        max-width: 1200px;
        margin: 0 auto;
    }

    .hero {
        margin-bottom: 32px;
    }

    .eyebrow {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--lv-green, #3fea00);
        margin-bottom: 8px;
    }

    .hero-title {
        font-family: var(--font-headline);
        font-weight: 400;
        font-size: 2.25rem;
        letter-spacing: 0.01em;
        margin-bottom: 12px;
    }

    .hero-subtitle {
        color: var(--lv-silver, #a0aec0);
        font-size: 1rem;
        max-width: 720px;
        line-height: 1.5;
    }

    .hero-subtitle code {
        font-size: 0.85em;
        padding: 1px 6px;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 3px;
    }

    .overview-card {
        height: 100%;
    }

    .bank-row {
        padding-top: 8px;
        padding-bottom: 8px;
    }

    .rank-number {
        font-family: var(--font-mono);
        font-size: 0.85rem;
        color: var(--lv-silver, #a0aec0);
        width: 28px;
        display: inline-block;
        text-align: right;
        margin-right: 12px;
    }

    .bank-name {
        font-weight: 500;
    }

    .charter-class {
        opacity: 0.85;
    }

    .asset-value {
        font-family: var(--font-mono);
        font-size: 0.95rem;
        color: var(--lv-green, #3fea00);
    }

    .class-code {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        background: rgba(255, 255, 255, 0.06);
        padding: 2px 6px;
        border-radius: 3px;
        margin-right: 10px;
        color: var(--lv-green, #3fea00);
    }

    .class-name {
        color: var(--lv-silver, #a0aec0);
        font-size: 0.9rem;
    }

    .class-count {
        font-family: var(--font-mono);
        color: var(--lv-silver, #e5e5e5);
    }

    .acquirer {
        color: var(--lv-silver, #a0aec0);
    }

    .data-source-footer {
        font-size: 0.85rem;
        color: var(--lv-silver, #a0aec0);
        text-align: center;
        padding: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .data-source-footer a {
        color: var(--lv-green, #3fea00);
        text-decoration: none;
    }

    .data-source-footer a:hover {
        text-decoration: underline;
    }
</style>
