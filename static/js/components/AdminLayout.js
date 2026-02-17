const { ref, computed } = Vue;

export default {
    name: 'AdminLayout',
    setup() {
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
        const route = VueRouter.useRoute();

        const activeMenu = computed(() => {
            return route.path;
        });

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        return {
            user,
            activeMenu,
            logout
        };
    },
    template: `
        <div style="display: flex; min-height: 100vh; background: #F5F5F7;">
            <!-- 侧边栏 -->
            <el-aside width="240px" style="background: #FFFFFF; box-shadow: 2px 0 8px rgba(0,0,0,0.04);">
                <!-- Logo 区域 -->
                <div style="height: 64px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #F0F0F0;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                        </div>
                        <span style="font-size: 16px; font-weight: 600; color: #1D1D1F;">图书管理</span>
                    </div>
                </div>

                <el-menu
                    :default-active="activeMenu"
                    router
                    style="border-right: none; background: transparent;"
                    active-text-color="#7C3AED"
                >
                    <el-menu-item index="/admin" style="margin: 8px 12px; border-radius: 12px; height: 48px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <path d="M3 3v18h18"></path>
                            <path d="M18 17V9"></path>
                            <path d="M13 17V5"></path>
                            <path d="M8 17v-3"></path>
                        </svg>
                        <span>数据看板</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/books" style="margin: 4px 12px; border-radius: 12px; height: 48px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <span>图书管理</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/borrows" style="margin: 4px 12px; border-radius: 12px; height: 48px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        <span>借阅审核</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/donations" style="margin: 4px 12px; border-radius: 12px; height: 48px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        <span>捐赠审核</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/wishlists" style="margin: 4px 12px; border-radius: 12px; height: 48px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 18.45 18.09 22.27 12 17.47 5.91 22.27 6 18.45 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span>心愿单</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/settings" style="margin: 4px 12px; border-radius: 12px; height: 48px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span>系统设置</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/users" style="margin: 4px 12px; border-radius: 12px; height: 48px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>用户管理</span>
                    </el-menu-item>
                </el-menu>
            </el-aside>

            <!-- 主内容区 -->
            <el-container style="flex: 1;">
                <!-- 顶部栏 -->
                <el-header style="background: #FFFFFF; border-bottom: 1px solid #F0F0F0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 64px;">
                    <div style="font-size: 14px; color: #8E8E93;">
                        管理后台
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                                {{ user?.name?.charAt(0) || '管' }}
                            </div>
                            <span style="font-weight: 500; color: #1D1D1F;">{{ user?.name }}</span>
                        </div>
                        <div style="cursor: pointer; padding: 6px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;" @click="logout">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <span style="color: #EF4444; font-size: 13px;">退出</span>
                        </div>
                    </div>
                </el-header>

                <!-- 内容 -->
                <el-main style="padding: 24px; background: #F5F5F7;">
                    <router-view />
                </el-main>
            </el-container>
        </div>
    `
};
