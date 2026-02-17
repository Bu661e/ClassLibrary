const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { donationApi } from '../api.js';

export default {
    name: 'AdminDonationsPage',
    setup() {
        const loading = ref(false);
        const donations = ref([]);
        const activeTab = ref('pending');
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const statusMap = {
            'pending': '待审核',
            'approved': '已入库',
            'rejected': '已拒绝'
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN');
        };

        const loadDonations = async (status) => {
            loading.value = true;
            try {
                const res = await donationApi.adminList(status);
                donations.value = res.donations || [];
            } catch (error) {
                ElMessage.error('加载失败');
            } finally {
                loading.value = false;
            }
        };

        const handleTabChange = (tab) => {
            if (tab === 'pending') {
                loadDonations('pending');
            } else if (tab === 'approved') {
                loadDonations('approved');
            } else if (tab === 'rejected') {
                loadDonations('rejected');
            } else {
                loadDonations('');
            }
        };

        const approveDonation = async (id) => {
            try {
                await ElMessageBox.confirm('确认批准此捐赠申请？批准后图书将自动入库。', '确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await donationApi.approve(id);
                ElMessage.success('已批准，图书已入库');
                loadDonations('pending');
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '操作失败');
                }
            }
        };

        const rejectDonation = async (id) => {
            try {
                await ElMessageBox.confirm('确认拒绝此捐赠申请？', '确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await donationApi.reject(id);
                ElMessage.success('已拒绝');
                loadDonations('pending');
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
            loadDonations('pending');
        });

        return {
            loading,
            donations,
            activeTab,
            user,
            statusMap,
            formatDate,
            handleTabChange,
            approveDonation,
            rejectDonation,
            logout
        };
    },
    template: `
        <div>
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>捐赠审核</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="primary" size="small" @click="$router.push('/admin')">返回首页</el-button>
                    <el-button type="danger" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main v-loading="loading">
                <el-tabs v-model="activeTab" @tab-change="handleTabChange">
                    <el-tab-pane label="待审核" name="pending">
                        <el-table :data="donations" style="width: 100%">
                            <el-table-column prop="title" label="书名" min-width="150" />
                            <el-table-column prop="author" label="作者" width="120" />
                            <el-table-column prop="user_name" label="捐赠人" width="100" />
                            <el-table-column prop="reason" label="捐赠说明" min-width="150" />
                            <el-table-column prop="created_at" label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="180" fixed="right">
                                <template #default="scope">
                                    <el-button type="success" size="small" @click="approveDonation(scope.row.id)">
                                        批准入库
                                    </el-button>
                                    <el-button type="danger" size="small" @click="rejectDonation(scope.row.id)">
                                        拒绝
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-empty v-if="!loading && donations.length === 0" description="暂无待审核的捐赠申请" />
                    </el-tab-pane>

                    <el-tab-pane label="已通过" name="approved">
                        <el-table :data="donations" style="width: 100%">
                            <el-table-column prop="title" label="书名" min-width="150" />
                            <el-table-column prop="author" label="作者" width="120" />
                            <el-table-column prop="user_name" label="捐赠人" width="100" />
                            <el-table-column prop="created_at" label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="100">
                                <template #default="scope">
                                    <el-tag type="success">已入库</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>

                    <el-tab-pane label="已拒绝" name="rejected">
                        <el-table :data="donations" style="width: 100%">
                            <el-table-column prop="title" label="书名" min-width="150" />
                            <el-table-column prop="author" label="作者" width="120" />
                            <el-table-column prop="user_name" label="捐赠人" width="100" />
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
