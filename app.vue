<template>
    <v-app class="theme-brand">
        <template v-if="showAppFramework">
            <AppHeader />

            <v-navigation-drawer permanent app width="220">
                <div class="nav-section">
                    <div class="nav-eyebrow">FDIC Explorer</div>
                </div>
                <v-list nav density="compact">
                    <v-list-item
                        prepend-icon="mdi-view-dashboard-outline"
                        title="Overview"
                        to="/"
                        exact
                    />
                    <v-list-item prepend-icon="mdi-bank" title="Institutions" to="/banks" />
                    <v-list-item
                        prepend-icon="mdi-alert-octagon-outline"
                        title="Failures"
                        to="/failures"
                    />
                </v-list>
                <template v-slot:append>
                    <div class="nav-footer">
                        <div class="nav-eyebrow">Source</div>
                        <a
                            href="https://banks.data.fdic.gov/"
                            target="_blank"
                            rel="noopener"
                            class="nav-link-external"
                        >
                            <v-icon size="small">mdi-open-in-new</v-icon>
                            BankFind Suite
                        </a>
                    </div>
                </template>
            </v-navigation-drawer>

            <v-main class="fill-height">
                <ServerStatus />
                <NuxtPage />
            </v-main>

            <!-- Global Dialogs -->
            <v-dialog v-model="state.showSettingsDialog" max-width="600">
                <SettingsDialog />
            </v-dialog>

            <!-- Global Notifications -->
            <NotificationContainer />

            <!-- Server Status Footer -->
            <ServerStatusFooter />
        </template>
        <template v-else>
            <NuxtPage />
        </template>
    </v-app>
</template>

<script setup lang="ts">
    import { state } from './utils/appState';

    const route = useRoute();
    const { userName } = useUserState();

    const noFrameworkRoutes = ['/login', '/a0callback', '/logout', '/pending'];

    const showAppFramework = computed(() => {
        if (noFrameworkRoutes.includes(route.path)) {
            return false;
        }
        if (!userName.value) {
            return false;
        }
        return true;
    });
</script>

<style scoped>
    .nav-section {
        padding: 16px 16px 8px;
    }

    .nav-eyebrow {
        font-family: var(--font-mono);
        font-size: 0.65rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--lv-silver, #a0aec0);
        opacity: 0.8;
    }

    .nav-footer {
        padding: 12px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .nav-link-external {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--lv-silver, #a0aec0);
        text-decoration: none;
        font-size: 0.85rem;
        margin-top: 6px;
    }

    .nav-link-external:hover {
        color: var(--lv-green, #3fea00);
    }
</style>
