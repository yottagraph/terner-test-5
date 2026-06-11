<template>
    <v-card variant="outlined" class="stat-card">
        <div class="d-flex align-center stat-card-inner">
            <v-icon v-if="icon" :icon="icon" :color="iconColor" size="32" class="mr-3" />
            <div class="flex-grow-1 min-w-0">
                <div class="stat-label">{{ label }}</div>
                <div class="stat-value">
                    <v-progress-circular
                        v-if="loading && !value"
                        size="20"
                        width="2"
                        indeterminate
                        color="primary"
                    />
                    <template v-else>{{ value || '—' }}</template>
                </div>
            </div>
        </div>
    </v-card>
</template>

<script setup lang="ts">
    interface Props {
        label: string;
        value?: string | number | null;
        icon?: string;
        iconColor?: string;
        loading?: boolean;
    }

    withDefaults(defineProps<Props>(), {
        icon: undefined,
        iconColor: 'primary',
        loading: false,
        value: null,
    });
</script>

<style scoped>
    .stat-card {
        padding: 16px;
        height: 100%;
    }

    .stat-card-inner {
        gap: 8px;
    }

    .stat-label {
        font-size: 0.75rem;
        font-family: var(--font-mono);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--lv-silver, #a0aec0);
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .stat-value {
        font-family: var(--font-headline);
        font-size: 1.5rem;
        font-weight: 400;
        color: var(--lv-text-primary, #ffffff);
        line-height: 1.1;
    }
</style>
