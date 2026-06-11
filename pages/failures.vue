<template>
    <div class="failures-page">
        <div class="failures-content">
            <div class="page-header">
                <div class="eyebrow">FDIC failures</div>
                <h1 class="page-title">Bank failures</h1>
                <p class="page-subtitle">
                    Every FDIC-insured institution failure recorded since 1934, newest first. Filter
                    by state and year.
                </p>
            </div>

            <v-card variant="outlined" class="filters-card mb-4">
                <div class="filters-grid pa-4">
                    <v-autocomplete
                        v-model="filters.state"
                        :items="stateItems"
                        item-title="name"
                        item-value="code"
                        label="State"
                        variant="outlined"
                        density="compact"
                        clearable
                        hide-details
                    />
                    <v-text-field
                        v-model="filters.year"
                        label="Year"
                        placeholder="2024"
                        type="number"
                        variant="outlined"
                        density="compact"
                        clearable
                        hide-details
                    />
                    <v-btn color="primary" variant="flat" :loading="loading" @click="applyFilters">
                        <v-icon class="mr-1">mdi-filter</v-icon> Apply
                    </v-btn>
                </div>
            </v-card>

            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable>
                {{ error }}
            </v-alert>

            <v-card variant="outlined">
                <v-data-table-server
                    :headers="headers"
                    :items="rows"
                    :items-length="meta.total"
                    :loading="loading"
                    :page="page"
                    :items-per-page="meta.limit"
                    :items-per-page-options="[25, 50, 100]"
                    density="comfortable"
                    hover
                    @update:options="onTableUpdate"
                >
                    <template v-slot:item.NAME="{ item }">
                        <NuxtLink :to="`/banks/${item.CERT}`" class="bank-link">
                            {{ item.NAME }}
                        </NuxtLink>
                    </template>
                    <template v-slot:item.location="{ item }">
                        <span class="muted">{{ item.CITY }}, {{ item.PSTALP }}</span>
                    </template>
                    <template v-slot:item.RESTYPE1="{ item }">
                        <v-chip
                            size="x-small"
                            variant="tonal"
                            :color="item.RESTYPE1 === 'PO' ? 'error' : 'warning'"
                        >
                            {{ item.RESTYPE1 || '—' }}
                        </v-chip>
                    </template>
                    <template v-slot:item.QBFASSET="{ item }">
                        <span class="num">{{ formatThousands(item.QBFASSET) }}</span>
                    </template>
                    <template v-slot:item.QBFDEP="{ item }">
                        <span class="num">{{ formatThousands(item.QBFDEP) }}</span>
                    </template>
                    <template v-slot:item.COST="{ item }">
                        <span class="num">{{ formatThousands(item.COST) }}</span>
                    </template>
                    <template v-slot:no-data>
                        <v-empty-state
                            headline="No failures match"
                            text="Try a different filter."
                            icon="mdi-shield-check"
                        />
                    </template>
                </v-data-table-server>
            </v-card>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { US_STATES } from '~/utils/usStates';
    import { formatThousands } from '~/utils/format';

    interface FailureRow {
        CERT: number;
        NAME: string;
        CITY?: string;
        PSTALP?: string;
        FAILDATE?: string;
        BIDNAME?: string;
        RESTYPE1?: string;
        COST?: number | null;
        QBFASSET?: number;
        QBFDEP?: number;
        [key: string]: any;
    }

    interface ListResponse {
        rows: FailureRow[];
        total: number;
        limit: number;
        offset: number;
    }

    const route = useRoute();
    const router = useRouter();

    const filters = reactive({
        state: (route.query.state as string) || '',
        year: (route.query.year as string) || '',
    });

    const page = ref(Math.max(1, Number(route.query.page) || 1));
    const rows = ref<FailureRow[]>([]);
    const meta = reactive({ total: 0, limit: 50, offset: 0 });
    const loading = ref(false);
    const error = ref<string | null>(null);

    const stateItems = computed(() => [{ code: '', name: 'All states' }, ...US_STATES]);

    const headers = [
        { title: 'Failure date', key: 'FAILDATE', sortable: false, width: 130 },
        { title: 'Institution', key: 'NAME', sortable: false, minWidth: 240 },
        { title: 'Location', key: 'location', sortable: false, width: 160 },
        { title: 'Resolution', key: 'RESTYPE1', sortable: false, width: 110 },
        { title: 'Acquirer', key: 'BIDNAME', sortable: false, minWidth: 200 },
        {
            title: 'Assets at failure',
            key: 'QBFASSET',
            align: 'end' as const,
            sortable: false,
            width: 150,
        },
        { title: 'Deposits', key: 'QBFDEP', align: 'end' as const, sortable: false, width: 140 },
        { title: 'Est. DIF cost', key: 'COST', align: 'end' as const, sortable: false, width: 130 },
    ];

    async function load() {
        loading.value = true;
        error.value = null;
        try {
            const limit = meta.limit;
            const offset = (page.value - 1) * limit;
            const data = await $fetch<ListResponse>('/api/fdic/failures', {
                query: {
                    state: filters.state || undefined,
                    year: filters.year || undefined,
                    limit,
                    offset,
                },
            });
            rows.value = data.rows;
            meta.total = data.total;
            meta.limit = data.limit;
            meta.offset = data.offset;
        } catch (e: any) {
            error.value = e?.statusMessage || e?.message || 'Failed to load failures';
            rows.value = [];
            meta.total = 0;
        } finally {
            loading.value = false;
        }
    }

    function syncRoute() {
        const query: Record<string, string> = {};
        if (filters.state) query.state = filters.state;
        if (filters.year) query.year = filters.year;
        if (page.value !== 1) query.page = String(page.value);
        router.replace({ query });
    }

    function applyFilters() {
        page.value = 1;
        syncRoute();
        load();
    }

    function onTableUpdate(opts: { page: number; itemsPerPage: number }) {
        const limit = opts.itemsPerPage || 50;
        const limitChanged = limit !== meta.limit;
        meta.limit = limit;
        page.value = limitChanged ? 1 : opts.page || 1;
        syncRoute();
        load();
    }

    onMounted(load);
</script>

<style scoped>
    .failures-page {
        height: 100%;
        overflow-y: auto;
        padding: 32px 24px 48px;
    }

    .failures-content {
        max-width: 1400px;
        margin: 0 auto;
    }

    .page-header {
        margin-bottom: 24px;
    }

    .eyebrow {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--lv-green, #3fea00);
        margin-bottom: 4px;
    }

    .page-title {
        font-family: var(--font-headline);
        font-weight: 400;
        font-size: 1.75rem;
        margin-bottom: 4px;
    }

    .page-subtitle {
        color: var(--lv-silver, #a0aec0);
        margin-bottom: 0;
    }

    .filters-grid {
        display: grid;
        grid-template-columns: 2fr 1fr auto;
        gap: 12px;
        align-items: center;
    }

    @media (max-width: 700px) {
        .filters-grid {
            grid-template-columns: 1fr;
        }
    }

    .bank-link {
        color: var(--lv-text-primary, #ffffff);
        text-decoration: none;
        font-weight: 500;
    }

    .bank-link:hover {
        color: var(--lv-green, #3fea00);
        text-decoration: underline;
    }

    .num {
        font-family: var(--font-mono);
        font-size: 0.85rem;
    }

    .muted {
        color: var(--lv-silver, #a0aec0);
    }
</style>
