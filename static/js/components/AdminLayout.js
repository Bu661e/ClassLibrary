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
        <div style="display: flex; height: 100vh;">
            <!-- 侧边栏 -->
            <el-aside width="200px" style="background: #545c64;">
                <div style="height: 60px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: bold; border-bottom: 1px solid #4a5258;">
                    管理后台
                </div>
                <el-menu
                    :default-active="activeMenu"
                    router
                    background-color="#545c64"
                    text-color="#fff"
                    active-text-color="#409EFF"
                >
                    <el-menu-item index="/admin">
                        <el-icon><data-analysis /></el-icon>
                        <span>数据看板</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/books">
                        <el-icon><reading /></el-icon>
                        <span>图书管理</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/borrows">
                        <el-icon><document /></el-icon>
                        <span>借阅审核</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/donations">
                        <el-icon><present /></el-icon>
                        <span>捐赠审核</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/wishlists">
                        <el-icon><star /></el-icon>
                        <span>心愿单</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/settings">
                        <el-icon><setting /></el-icon>
                        <span>系统设置</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/users">
                        <el-icon><user /></el-icon>
                        <span>用户管理</span>
                    </el-menu-item>
                </el-menu>
            </el-aside>

            <!-- 主内容区 -->
            <el-container>
                <!-- 顶部栏 -->
                <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                    <div>
                        <el-button type="primary" size="small" @click="$router.push('/')">
                            返回首页
                        </el-button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>欢迎，{{ user?.name }}</span>
                        <el-button type="danger" size="small" @click="logout">退出</el-button>
                    </div>
                </el-header>

                <!-- 内容 -->
                <el-main style="background: #f0f2f5;">
                    <router-view />
                </el-main>
            </el-container>
        </div>
    `
};
