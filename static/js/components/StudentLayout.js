const { ref } = Vue;

export default {
    name: 'StudentLayout',
    props: {
        activeMenu: {
            type: String,
            default: '/'
        }
    },
    setup() {
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
        const isAdmin = ref(user.value?.is_admin || false);

        const menuItems = [
            { path: '/', label: '图书列表', icon: 'book' },
            { path: '/my-borrows', label: '我的借阅', icon: 'list' },
            { path: '/wishlist', label: '心愿单', icon: 'star' },
            { path: '/donations', label: '我的捐赠', icon: 'heart' }
        ];

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        return { user, isAdmin, menuItems, logout };
    },
    template: `
        <div style="display: flex; min-height: 100vh; background: #F5F5F7;">
            <!-- 左侧导航 -->
            <aside style="width: 220px; background: #FFFFFF; box-shadow: 2px 0 8px rgba(0,0,0,0.04); display: flex; flex-direction: column; flex-shrink: 0;">
                <!-- Logo -->
                <div style="padding: 14px; border-bottom: 1px solid #F0F0F0;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                        </div>
                        <span style="font-weight: 600; color: #1D1D1F; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">班级图书共享管理系统</span>
                    </div>
                </div>

                <!-- 菜单 -->
                <div style="flex: 1; padding: 12px 0;">
                    <div
                        v-for="item in menuItems"
                        :key="item.path"
                        @click="$router.push(item.path)"
                        :style="{
                            margin: '4px 12px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: $route.path === item.path ? '#7C3AED' : 'transparent',
                            color: $route.path === item.path ? 'white' : '#6B7280',
                            fontSize: '14px',
                            fontWeight: $route.path === item.path ? '500' : '400',
                            transition: 'all 0.2s'
                        }"
                    >
                        <svg v-if="item.icon === 'book'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <svg v-else-if="item.icon === 'list'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        <svg v-else-if="item.icon === 'star'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 18.45 18.18 22.27 12 17.47 5.82 22.27 7 18.45 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <svg v-else-if="item.icon === 'heart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {{ item.label }}
                    </div>
                </div>
            </aside>

            <!-- 主内容区 -->
            <div style="flex: 1; display: flex; flex-direction: column;">
                <!-- 顶部栏 -->
                <header style="background: #FFFFFF; border-bottom: 1px solid #F0F0F0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 64px; flex-shrink: 0;">
                    <div style="font-size: 14px; color: #8E8E93;"></div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div
                            v-if="isAdmin"
                            @click="$router.push('/admin')"
                            style="cursor: pointer; padding: 6px 12px; border-radius: 8px; background: #FEF3C7; color: #D97706; font-size: 13px; transition: all 0.2s;"
                        >
                            管理后台
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                                {{ user?.name?.charAt(0) || '学' }}
                            </div>
                            <span style="font-weight: 500; color: #1D1D1F;">{{ user?.name }}</span>
                        </div>
                        <div @click="logout" style="cursor: pointer; padding: 6px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <span style="color: #EF4444; font-size: 13px;">退出</span>
                        </div>
                    </div>
                </header>

                <!-- 内容区域 -->
                <main style="flex: 1; padding: 24px; overflow-y: auto; overflow-x: hidden;">
                    <slot></slot>
                </main>
            </div>
        </div>
    `
};
