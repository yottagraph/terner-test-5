<template>
    <svg
        class="sparkline"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="none"
        :aria-label="ariaLabel"
        role="img"
    >
        <defs>
            <linearGradient :id="gradientId" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" :stop-color="color" stop-opacity="0.35" />
                <stop offset="100%" :stop-color="color" stop-opacity="0" />
            </linearGradient>
        </defs>
        <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradientId})`" stroke="none" />
        <path v-if="linePath" :d="linePath" :stroke="color" stroke-width="1.5" fill="none" />
        <circle v-if="lastPoint" :cx="lastPoint.x" :cy="lastPoint.y" r="2.5" :fill="color" />
    </svg>
</template>

<script setup lang="ts">
    interface Props {
        values: (number | null | undefined)[];
        color?: string;
        width?: number;
        height?: number;
        ariaLabel?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        color: '#3FEA00',
        width: 200,
        height: 60,
        ariaLabel: 'Sparkline',
    });

    const gradientId = `spark-grad-${Math.random().toString(36).slice(2, 9)}`;

    const points = computed(() => {
        const nums = props.values
            .map((v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v)))
            .filter((v): v is number => v !== null);
        if (nums.length < 2) return null;

        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const range = max - min || 1;
        const stepX = props.width / (nums.length - 1);
        const padY = 4;

        return nums.map((v, i) => ({
            x: i * stepX,
            y: padY + (1 - (v - min) / range) * (props.height - padY * 2),
        }));
    });

    const linePath = computed(() => {
        if (!points.value) return '';
        return points.value
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ');
    });

    const areaPath = computed(() => {
        if (!points.value) return '';
        const last = points.value[points.value.length - 1];
        const first = points.value[0];
        return `${linePath.value} L${last.x.toFixed(1)},${props.height} L${first.x.toFixed(1)},${props.height} Z`;
    });

    const lastPoint = computed(() => {
        if (!points.value) return null;
        return points.value[points.value.length - 1];
    });
</script>

<style scoped>
    .sparkline {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
