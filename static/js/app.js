const { createApp, ref } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

import LoginPage from './pages/LoginPage.js';
import HomePage from './pages/HomePage.js';
import MyBorrowsPage from './pages/MyBorrowsPage.js';
import AdminBorrowsPage from './pages/AdminBorrowsPage.js';
import BookDetailPage from './pages/BookDetailPage.js';
import DonorConfirmsPage from './pages/DonorConfirmsPage.js';
import AdminDashboardPage from './pages/AdminDashboardPage.js';
import AdminUsersPage from './pages/AdminUsersPage.js';
import AdminBooksPage from './pages/AdminBooksPage.js';
import AdminLayout from './components/AdminLayout.js';

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
    { path: '/', component: HomePage },
    { path: '/books/:id', component: BookDetailPage },
    { path: '/my-borrows', component: MyBorrowsPage },
    { path: '/donor-confirms', component: DonorConfirmsPage },
    {
        path: '/admin',
        component: AdminLayout,
        children: [
            { path: '', component: AdminDashboardPage },
            { path: 'books', component: AdminBooksPage },
            { path: 'borrows', component: AdminBorrowsPage },
            { path: 'users', component: AdminUsersPage }
        ]
    }
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
