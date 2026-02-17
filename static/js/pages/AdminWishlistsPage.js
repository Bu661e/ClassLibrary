const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { wishlistApi } from '../api.js';

export default {
    name: 'AdminWishlistsPage',
    setup() {
        const loading = ref(false);
        const wishlists = ref([]);
        const activeTab = ref('pending');
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const statusMap = {
            'pending': '待处理',
            'fulfilled': '已满足',
            'rejected': '已拒绝'
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN');
        };

        const loadWishlists = async (status) => {
            loading.value = true;
            try {
                const res = await wishlistApi.adminList(status);
                wishlists.value = res.wishlists || [];
            } catch (error) {
                ElMessage.error('加载失败');
            } finally {
                loading.value = false;
            }
        };

        const handleTabChange = (tab) => {
            if (tab === 'pending') {
                loadWishlists('pending');
            } else if (tab === 'fulfilled') {
                loadWishlists('fulfilled');
            } else if (tab === 'rejected') {
                loadWishlists('rejected');
            } else {
                loadWishlists('');
            }
        };

        const fulfillWishlist = async (id) => {
            try {
                await ElMessageBox.confirm('确认已满足此心愿？', '确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await wishlistApi.fulfill(id);
                ElMessage.success('已标记为已满足');
                loadWishlists('pending');
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '操作失败');
                }
            }
        };

        const rejectWishlist = async (id) => {
            try {
                await ElMessageBox.confirm('确认拒绝此心愿？', '确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await wishlistApi.reject(id);
                ElMessage.success('已拒绝');
                loadWishlists('pending');
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '操作失败');
                }
            }
        };

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        onMounted(() => {
            loadWishlists('pending');
        });

        return {
            loading,
            wishlists,
            activeTab,
            user,
            statusMap,
            formatDate,
            handleTabChange,
            fulfillWishlist,
            rejectWishlist,
            logout
        };
    },
    template: `
        <div>
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>心愿单管理</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="primary" size="small" @click="$router.push('/admin')">返回首页</el-button>
                    <el-button type="danger" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main v-loading="loading">
                <el-tabs v-model="activeTab" @tab-change="handleTabChange">
                    <el-tab-pane label="待处理" name="pending">
                        <el-table :data="wishlists" style="width: 100%">
                            <el-table-column prop="book_title" label="书名" min-width="150" />
                            <el-table-column prop="author" label="作者" width="120" />
                            <el-table-column prop="user_name" label="申请人" width="100" />
                            <el-table-column prop="reason" label="想看原因" min-width="150" />
                            <el-table-column prop="created_at" label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="180" fixed="right">
                                <template #default="scope">
                                    <el-button type="success" size="small" @click="fulfillWishlist(scope.row.id)">
                                        已满足
                                    </el-button>
                                    <el-button type="danger" size="small" @click="rejectWishlist(scope.row.id)">
                                        拒绝
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-empty v-if="!loading && wishlists.length === 0" description="暂无待处理的心愿单" />
                    </el-tab-pane>

                    <el-tab-pane label="已满足" name="fulfilled">
                        <el-table :data="wishlists" style="width: 100%">
                            <el-table-column prop="book_title" label="书名" min-width="150" />
                            <el-table-column prop="author" label="作者" width="120" />
                            <el-table-column prop="user_name" label="申请人" width="100" />
                            <el-table-column prop="created_at" label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="100">
                                <template #default="scope">
                                    <el-tag type="success">已满足</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>

                    <el-tab-pane label="已拒绝" name="rejected">
                        <el-table :data="wishlists" style="width: 100%">
                            <el-table-column prop="book_title" label="书名" min-width="150" />
                            <el-table-column prop="author" label="作者" width="120" />
                            <el-table-column prop="user_name" label="申请人" width="100" />
                            <el-table-column prop="created_at" label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="100">
                                <template #default="scope">
                                    <el-tag type="danger">已拒绝</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>
            </el-main>
        </div>
    `
};
