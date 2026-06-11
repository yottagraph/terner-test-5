<template>
    <div class="banks-page">
        <div class="banks-content">
            <div class="page-header">
                <div>
                    <div class="eyebrow">Institutions</div>
                    <h1 class="page-title">FDIC-insured banks</h1>
                    <p class="page-subtitle">
                        Search ~{{ formatNumber(meta.total) }} institutions by name, state, and
                        charter class.
                    </p>
                </div>
            </div>

            <v-card variant="outlined" class="filters-card mb-4">
                <div class="filters-grid pa-4">
                    <v-text-field
                        v-model="filters.q"
                        label="Search by name"
                        placeholder="JPMorgan, Wells Fargo, Goldman..."
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="compact"
                        clearable
                        hide-details
                        @keyup.enter="applyFilters"
                    />
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
                    <v-select
                        v-model="filters.bkclass"
                        :items="charterClassItems"
                        item-title="title"
                        item-value="value"
                        label="Charter class"
                        variant="outlined"
                        density="compact"
                        clearable
                        hide-details
                    />
                    <v-select
                        v-model="filters.active"
                        :items="activeItems"
                        item-title="title"
                        item-value="value"
                        label="Status"
                        variant="outlined"
                        density="compact"
                        hide-details
                    />
                    <v-btn color="primary" variant="flat" :loading="loading" @click="applyFilters">
                        <v-icon class="mr-1">mdi-magnify</v-icon> Search
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
                        <span class="muted">{{ item.CITY }}, {{ item.STALP }}</span>
                    </template>
                    <template v-slot:item.BKCLASS="{ item }">
                        <v-chip size="x-small" variant="tonal" color="primary">
                            {{ item.BKCLASS || '—' }}
                        </v-chip>
                    </template>
                    <template v-slot:item.ASSET="{ item }">
                        <span class="num">{{ formatThousands(item.ASSET) }}</span>
                    </template>
                    <template v-slot:item.DEP="{ item }">
                        <span class="num">{{ formatThousands(item.DEP) }}</span>
                    </template>
                    <template v-slot:item.OFFICES="{ item }">
                        <span class="num">{{ formatNumber(item.OFFICES) }}</span>
                    </template>
                    <template v-slot:item.ACTIVE="{ item }">
                        <v-chip
                            v-if="item.ACTIVE === 1"
                            size="x-small"
                            variant="tonal"
                            color="success"
                            >Active</v-chip
                        >
                        <v-chip v-else size="x-small" variant="tonal" color="error"
                            >Inactive</v-chip
                        >
                    </template>
                    <template v-slot:no-data>
                        <v-empty-state
                            headline="No matches"
                            text="Try widening your filters."
                            icon="mdi-database-off"
                        />
                    </template>
                </v-data-table-server>
            </v-card>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { US_STATES } from '~/utils/usStates';
    import { CHARTER_CLASS_LABELS, formatNumber, formatThousands } from '~/utils/format';

    interface InstitutionRow {
        CERT: number;
        NAME: string;
        CITY?: string;
        STALP?: string;
        BKCLASS?: string;
        ASSET?: number;
        DEP?: number;
        OFFICES?: number;
        ACTIVE?: number;
        [key: string]: any;
    }

    interface ListResponse {
        rows: InstitutionRow[];
        total: number;
        limit: number;
        offset: number;
        sort: string;
    }

    const route = useRoute();
    const router = useRouter();

    const filters = reactive({
        q: (route.query.q as string) || '',
        state: (route.query.state as string) || '',
        bkclass: (route.query.bkclass as string) || '',
        active: (route.query.active as string) || '1',
    });

    const sort = ref((route.query.sort as string) || '-ASSET');
    const page = ref(Math.max(1, Number(route.query.page) || 1));

    const rows = ref<InstitutionRow[]>([]);
    const meta = reactive({ total: 0, limit: 25, offset: 0 });
    const loading = ref(false);
    const error = ref<string | null>(null);

    const stateItems = computed(() => [{ code: '', name: 'All states' }, ...US_STATES]);

    const charterClassItems = computed(() => [
        { value: '', title: 'All charter classes' },
        ...Object.entries(CHARTER_CLASS_LABELS).map(([value, title]) => ({
            value,
            title: `${value} — ${title}`,
        })),
    ]);

    const activeItems = [
        { value: '1', title: 'Active only' },
        { value: '0', title: 'Inactive only' },
        { value: 'all', title: 'All statuses' },
    ];

    const headers = [
        { title: 'Bank', key: 'NAME', sortable: true, minWidth: 280 },
        { title: 'Location', key: 'location', sortable: false, width: 140 },
        { title: 'Class', key: 'BKCLASS', sortable: false, width: 90 },
        { title: 'Total assets', key: 'ASSET', sortable: true, align: 'end' as const, width: 140 },
        { title: 'Deposits', key: 'DEP', sortable: true, align: 'end' as const, width: 140 },
        { title: 'Offices', key: 'OFFICES', sortable: true, align: 'end' as const, width: 100 },
        { title: 'Status', key: 'ACTIVE', sortable: false, width: 110 },
    ];

    async function load() {
        loading.value = true;
        error.value = null;
        try {
            const limit = meta.limit;
            const offset = (page.value - 1) * limit;
            const data = await $fetch<ListResponse>('/api/fdic/institutions', {
                query: {
                    q: filters.q || undefined,
                    state: filters.state || undefined,
                    bkclass: filters.bkclass || undefined,
                    active: filters.active,
                    limit,
                    offset,
                    sort: sort.value,
                },
            });
            rows.value = data.rows;
            meta.total = data.total;
            meta.limit = data.limit;
            meta.offset = data.offset;
        } catch (e: any) {
            error.value = e?.statusMessage || e?.message || 'Failed to load institutions';
            rows.value = [];
            meta.total = 0;
        } finally {
            loading.value = false;
        }
    }

    function syncRoute() {
        const query: Record<string, string> = {};
        if (filters.q) query.q = filters.q;
        if (filters.state) query.state = filters.state;
        if (filters.bkclass) query.bkclass = filters.bkclass;
        if (filters.active !== '1') query.active = filters.active;
        if (page.value !== 1) query.page = String(page.value);
        if (sort.value !== '-ASSET') query.sort = sort.value;
        router.replace({ query });
    }

    function applyFilters() {
        page.value = 1;
        syncRoute();
        load();
    }

    function onTableUpdate(opts: {
        page: number;
        itemsPerPage: number;
        sortBy: { key: string; order: 'asc' | 'desc' }[];
    }) {
        const limit = opts.itemsPerPage || 25;
        const limitChanged = limit !== meta.limit;
        meta.limit = limit;
        page.value = limitChanged ? 1 : opts.page || 1;

        if (opts.sortBy?.length) {
            const s = opts.sortBy[0];
            sort.value = `${s.order === 'desc' ? '-' : ''}${s.key}`;
        } else {
            sort.value = '-ASSET';
        }

        syncRoute();
        load();
    }

    onMounted(load);
</script>

<style scoped>
    .banks-page {
        height: 100%;
        overflow-y: auto;
        padding: 32px 24px 48px;
    }

    .banks-content {
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
        grid-template-columns: 2fr 1.4fr 1.5fr 1fr auto;
        gap: 12px;
        align-items: center;
    }

    @media (max-width: 900px) {
        .filters-grid {
            grid-template-columns: 1fr 1fr;
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
        font-size: 0.9rem;
    }

    .muted {
        color: var(--lv-silver, #a0aec0);
    }
</style>
