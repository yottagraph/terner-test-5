<template>
    <div class="fact-row">
        <div class="fact-label">{{ label }}</div>
        <div class="fact-value"><slot /></div>
    </div>
</template>

<script setup lang="ts">
    defineProps<{ label: string }>();
</script>

<style scoped>
    .fact-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        padding: 4px 0;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
    }

    .fact-row:last-child {
        border-bottom: none;
    }

    .fact-label {
        font-family: var(--font-mono);
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--lv-silver, #a0aec0);
        flex-shrink: 0;
    }

    .fact-value {
        text-align: right;
        font-size: 0.9rem;
    }
</style>
