<template>
    <div class="trend-block">
        <div class="trend-header">
            <div class="trend-label">{{ label }}</div>
            <div v-if="changeText" class="trend-delta" :class="deltaClass">
                <v-icon size="x-small">{{ deltaIcon }}</v-icon>
                {{ changeText }}
            </div>
        </div>
        <div class="trend-value">{{ formattedLatest }}</div>
        <div class="sparkline-wrap">
            <SparklineChart :values="values" :color="color" :height="48" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import SparklineChart from '~/components/SparklineChart.vue';
    import { formatPercent, formatThousands } from '~/utils/format';

    interface Props {
        label: string;
        values: (number | null | undefined)[];
        latest?: number | null;
        previous?: number | null;
        formatter?: 'thousands' | 'percent' | 'number';
        color?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        formatter: 'thousands',
        color: '#3FEA00',
        latest: null,
        previous: null,
    });

    function fmt(v: number | null | undefined): string {
        if (v == null || Number.isNaN(Number(v))) return '—';
        if (props.formatter === 'thousands') return formatThousands(v);
        if (props.formatter === 'percent') return formatPercent(v);
        return new Intl.NumberFormat('en-US').format(Number(v));
    }

    const formattedLatest = computed(() => fmt(props.latest));

    const change = computed(() => {
        if (
            props.latest == null ||
            props.previous == null ||
            Number.isNaN(Number(props.latest)) ||
            Number.isNaN(Number(props.previous))
        )
            return null;
        const a = Number(props.latest);
        const b = Number(props.previous);
        if (b === 0) return null;
        return ((a - b) / Math.abs(b)) * 100;
    });

    const changeText = computed(() => {
        if (change.value == null) return '';
        const v = change.value;
        const sign = v > 0 ? '+' : '';
        return `${sign}${v.toFixed(1)}%`;
    });

    const deltaClass = computed(() => {
        if (change.value == null) return '';
        return change.value >= 0 ? 'delta-pos' : 'delta-neg';
    });

    const deltaIcon = computed(() => {
        if (change.value == null) return 'mdi-minus';
        return change.value >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down';
    });
</script>

<style scoped>
    .trend-block {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 4px;
        padding: 12px;
    }

    .trend-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    .trend-label {
        font-family: var(--font-mono);
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--lv-silver, #a0aec0);
    }

    .trend-delta {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        font-family: var(--font-mono);
        font-size: 0.75rem;
    }

    .delta-pos {
        color: #3fea00;
    }

    .delta-neg {
        color: #ff5c00;
    }

    .trend-value {
        font-family: var(--font-headline);
        font-size: 1.25rem;
        margin-bottom: 6px;
    }

    .sparkline-wrap {
        height: 48px;
    }
</style>
