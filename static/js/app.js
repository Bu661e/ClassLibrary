const { createApp, ref } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

import LoginPage from './pages/LoginPage.js';
import HomePage from './pages/HomePage.js';

const App = {
    setup() {
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const isLoggedIn = Vue.computed(() => !!user.value);
        const isAdmin = Vue.computed(() => user.value?.is_admin || false);

        const logout = async () => {
            try {
                await authApi.logout();
            } finally {
                localStorage.removeItem('user');
                window.location.href = '/#/login';
            }
        };

        return { user, isLoggedIn, isAdmin, logout };
    },
    template: `
        <router-view />
    `
};

const routes = [
    { path: '/login', component: LoginPage },
    { path: '/', component: HomePage }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const user = localStorage.getItem('user');
    if (to.path !== '/login' && !user) {
        next('/login');
    } else {
        next();
    }
});

createApp(App).use(router).use(ElementPlus).mount('#app');
