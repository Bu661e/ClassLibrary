const { ref, onMounted } = Vue;
const { ElMessage } = ElementPlus;
import { adminApi } from '../api.js';

export default {
    name: 'AdminDashboardPage',
    setup() {
        const stats = ref({
            total_books: 0,
            available_books: 0,
            borrowed_books: 0,
            total_users: 0
        });
        const popularBooks = ref([]);
        const topReaders = ref([]);
        const overdueRecords = ref([]);
        const loading = ref(false);
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const loadDashboard = async () => {
            loading.value = true;
            try {
                const res = await adminApi.getDashboard();
                stats.value = res.stats;
                popularBooks.value = res.popular_books || [];
                topReaders.value = res.top_readers || [];
                overdueRecords.value = res.overdue || [];
            } catch (error) {
                ElMessage.error('加载数据失败');
            } finally {
                loading.value = false;
            }
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        };

        const sendReminder = async () => {
            if (overdueRecords.value.length === 0) {
                ElMessage.warning('没有逾期记录');
                return;
            }

            try {
                const recordIds = overdueRecords.value.map(r => r.id);
                const res = await adminApi.sendReminder(recordIds);
                ElMessage.success(res.message);
            } catch (error) {
                ElMessage.error(error.message || '发送提醒失败');
            }
        };

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        onMounted(loadDashboard);

        return {
            stats,
            popularBooks,
            topReaders,
            overdueRecords,
            loading,
            user,
            formatDate,
            sendReminder,
            logout
        };
    },
    template: `
        <div>
            <!-- 顶部导航栏 -->
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>班级图书共享管理系统 - 管理后台</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="primary" size="small" @click="$router.push('/admin/borrows')">借阅审核</el-button>
                    <el-button type="success" size="small" @click="$router.push('/admin/books')">图书管理</el-button>
                    <el-button type="warning" size="small" @click="$router.push('/admin/users')">用户管理</el-button>
                    <el-button type="info" size="small" @click="$router.push('/')">返回首页</el-button>
                    <el-button type="danger" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main v-loading="loading">
                <!-- 统计卡片 -->
                <el-row :gutter="20" style="margin-bottom: 20px;">
                    <el-col :span="6">
                        <el-card shadow="hover" style="text-align: center;">
                            <el-statistic title="图书总数" :value="stats.total_books">
                                <template #prefix>
                                    <el-icon style="vertical-align: middle;"><reading /></el-icon>
                                </template>
                            </el-statistic>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" style="text-align: center;">
                            <el-statistic title="在库图书" :value="stats.available_books" value-style="color: #67C23A;">
                                <template #prefix>
                                    <el-icon style="vertical-align: middle;"><circle-check /></el-icon>
                                </template>
                            </el-statistic>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" style="text-align: center;">
                            <el-statistic title="已借出" :value="stats.borrowed_books" value-style="color: #E6A23C;">
                                <template #prefix>
                                    <el-icon style="vertical-align: middle;"><notebook /></el-icon>
                                </template>
                            </el-statistic>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" style="text-align: center;">
                            <el-statistic title="注册用户" :value="stats.total_users">
                                <template #prefix>
                                    <el-icon style="vertical-align: middle;"><user /></el-icon>
                                </template>
                            </el-statistic>
                        </el-card>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <!-- 热门图书排行 -->
                    <el-col :span="12">
                        <el-card>
                            <template #header>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <h3 style="margin: 0;">热门图书排行榜</h3>
                                </div>
                            </template>
                            <el-table :data="popularBooks" style="width: 100%">
                                <el-table-column type="index" label="排名" width="60" />
                                <el-table-column prop="title" label="书名" />
                                <el-table-column prop="count" label="借阅次数" width="100" />
                            </el-table>
                            <el-empty v-if="popularBooks.length === 0" description="暂无数据" />
                        </el-card>
                    </el-col>

                    <!-- 阅读达人排行 -->
                    <el-col :span="12">
                        <el-card>
                            <template #header>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <h3 style="margin: 0;">阅读达人排行榜</h3>
                                </div>
                            </template>
                            <el-table :data="topReaders" style="width: 100%">
                                <el-table-column type="index" label="排名" width="60" />
                                <el-table-column prop="name" label="姓名" />
                                <el-table-column prop="count" label="借阅次数" width="100" />
                            </el-table>
                            <el-empty v-if="topReaders.length === 0" description="暂无数据" />
                        </el-card>
                    </el-col>
                </el-row>

                <!-- 逾期列表 -->
                <el-card style="margin-top: 20px;">
                    <template #header>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; color: #F56C6C;">逾期未还图书</h3>
                            <div>
                                <el-button type="warning" size="small" @click="sendReminder" :disabled="overdueRecords.length === 0">
                                    一键提醒
                                </el-button>
                                <el-button type="primary" size="small" @click="loadDashboard">
                                    刷新
                                </el-button>
                            </div>
                        </div>
                    </template>
                    <el-table :data="overdueRecords" style="width: 100%">
                        <el-table-column prop="book_title" label="图书名称" />
                        <el-table-column prop="borrower_name" label="借阅人" width="120" />
                        <el-table-column prop="approve_at" label="借阅日期" width="120">
                            <template #default="scope">
                                {{ formatDate(scope.row.approve_at) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="100">
                            <template #default>
                                <el-tag type="danger">逾期</el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty v-if="overdueRecords.length === 0" description="暂无逾期图书" />
                </el-card>
            </el-main>
        </div>
    `
};
