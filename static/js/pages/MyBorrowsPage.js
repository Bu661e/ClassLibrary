const { ref, computed, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { borrowApi } from '../api.js';

export default {
    name: 'MyBorrowsPage',
    setup() {
        const records = ref([]);
        const loading = ref(false);
        const activeTab = ref('current');
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const statusMap = {
            'pending': '待审核',
            'donor_pending': '待捐赠者确认',
            'approved': '借阅中',
            'return_pending': '归还审核中',
            'completed': '已完成',
            'rejected': '已拒绝'
        };

        const statusTypeMap = {
            'pending': 'warning',
            'donor_pending': 'info',
            'approved': 'success',
            'return_pending': 'warning',
            'completed': 'success',
            'rejected': 'danger'
        };

        const currentRecords = computed(() =>
            records.value.filter(r => ['approved', 'pending', 'donor_pending', 'return_pending'].includes(r.status))
        );

        const historyRecords = computed(() =>
            records.value.filter(r => ['completed', 'rejected'].includes(r.status))
        );

        const loadRecords = async () => {
            loading.value = true;
            try {
                const res = await borrowApi.list();
                records.value = res.records || [];
            } catch (error) {
                ElMessage.error('加载借阅记录失败');
            } finally {
                loading.value = false;
            }
        };

        const handleReturn = async (record) => {
            try {
                await ElMessageBox.confirm(
                    `确定要申请归还《${record.book_title}》吗？`,
                    '确认归还',
                    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
                );
                await borrowApi.return(record.id);
                ElMessage.success('归还申请已提交');
                loadRecords();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '申请失败');
                }
            }
        };

        const getStatusText = (status) => statusMap[status] || status;
        const getStatusType = (status) => statusTypeMap[status] || 'info';

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN');
        };

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        onMounted(loadRecords);

        return {
            records,
            loading,
            activeTab,
            user,
            currentRecords,
            historyRecords,
            handleReturn,
            getStatusText,
            getStatusType,
            formatDate,
            logout
        };
    },
    template: `
        <div>
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>我的借阅</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="primary" size="small" @click="$router.push('/')">返回首页</el-button>
                    <el-button type="danger" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main v-loading="loading">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="当前借阅" name="current">
                        <el-table :data="currentRecords" style="width: 100%" empty-text="暂无借阅记录">
                            <el-table-column prop="book_title" label="书名" min-width="200" />
                            <el-table-column label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" width="120">
                                <template #default="scope">
                                    <el-tag :type="getStatusType(scope.row.status)" size="small">
                                        {{ getStatusText(scope.row.status) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="120" fixed="right">
                                <template #default="scope">
                                    <el-button
                                        v-if="scope.row.status === 'approved'"
                                        type="primary"
                                        size="small"
                                        @click="handleReturn(scope.row)"
                                    >
                                        申请归还
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>

                    <el-tab-pane label="历史记录" name="history">
                        <el-table :data="historyRecords" style="width: 100%" empty-text="暂无历史记录">
                            <el-table-column prop="book_title" label="书名" min-width="200" />
                            <el-table-column label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="完成时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.updated_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" width="100">
                                <template #default="scope">
                                    <el-tag :type="getStatusType(scope.row.status)" size="small">
                                        {{ getStatusText(scope.row.status) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>
            </el-main>
        </div>
    `
};
