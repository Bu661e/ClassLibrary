const { createApp, ref } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

import { authApi } from './api.js';
import LoginPage from './pages/LoginPage.js';
import HomePage from './pages/HomePage.js';
import MyBorrowsPage from './pages/MyBorrowsPage.js';
import AdminBorrowsPage from './pages/AdminBorrowsPage.js';
import BookDetailPage from './pages/BookDetailPage.js';
import DonorConfirmsPage from './pages/DonorConfirmsPage.js';
import AdminDashboardPage from './pages/AdminDashboardPage.js';
import AdminUsersPage from './pages/AdminUsersPage.js';
import AdminBooksPage from './pages/AdminBooksPage.js';
import AdminSettingsPage from './pages/AdminSettingsPage.js';
import AdminDonationsPage from './pages/AdminDonationsPage.js';
import AdminWishlistsPage from './pages/AdminWishlistsPage.js';
import WishlistPage from './pages/WishlistPage.js';
import DonationPage from './pages/DonationPage.js';
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
    { path: '/wishlist', component: WishlistPage },
    { path: '/donations', component: DonationPage },
    {
        path: '/admin',
        component: AdminLayout,
        children: [
            { path: '', component: AdminDashboardPage },
            { path: 'books', component: AdminBooksPage },
            { path: 'borrows', component: AdminBorrowsPage },
            { path: 'donations', component: AdminDonationsPage },
            { path: 'wishlists', component: AdminWishlistsPage },
            { path: 'settings', component: AdminSettingsPage },
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
    } else if (user) {
        const userData = JSON.parse(user);
        // 管理员访问首页或学生页面时，跳转到管理后台
        if (to.path === '/' || to.path.startsWith('/my-') || to.path.startsWith('/donor') || to.path.startsWith('/wishlist') || to.path.startsWith('/donation')) {
            if (userData.is_admin) {
                next('/admin');
            } else {
                next();
            }
        } else {
            next();
        }
    } else {
        next();
    }
});

createApp(App).use(router).use(ElementPlus).mount('#app');
