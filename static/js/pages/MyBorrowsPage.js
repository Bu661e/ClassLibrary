const { ref, computed, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { borrowApi } from '../api.js';
import StudentLayout from '../components/StudentLayout.js';

export default {
    name: 'MyBorrowsPage',
    components: { StudentLayout },
    setup() {
        const records = ref([]);
        const loading = ref(false);
        const activeTab = ref('current');

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

        const getRemainingDays = (record) => {
            if (record.status !== 'approved' || !record.approve_at) return null;
            const approveDate = new Date(record.approve_at);
            const maxDays = 30;
            const dueDate = new Date(approveDate);
            dueDate.setDate(dueDate.getDate() + maxDays);
            const now = new Date();
            const diffTime = dueDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN');
        };

        onMounted(loadRecords);

        return {
            records,
            loading,
            activeTab,
            currentRecords,
            historyRecords,
            handleReturn,
            getStatusText,
            getStatusType,
            getRemainingDays,
            formatDate
        };
    },
    template: `
        <StudentLayout>
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">我的借阅</h2>
            </div>

            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-tabs v-model="activeTab" style="padding: 0 20px;">
                    <el-tab-pane label="当前借阅" name="current">
                        <el-table :data="currentRecords" v-loading="loading" empty-text="暂无借阅记录">
                            <el-table-column prop="book_title" label="书名" min-width="180" />
                            <el-table-column label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" width="100">
                                <template #default="scope">
                                    <el-tag :type="getStatusType(scope.row.status)" size="small">
                                        {{ getStatusText(scope.row.status) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="剩余天数" width="100">
                                <template #default="scope">
                                    <span v-if="scope.row.status === 'approved'">
                                        <span :style="{ color: getRemainingDays(scope.row) <= 3 ? '#F56C6C' : (getRemainingDays(scope.row) <= 7 ? '#E6A23C' : '#67C23A') }">
                                            {{ getRemainingDays(scope.row) }}天
                                        </span>
                                    </span>
                                    <span v-else>-</span>
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
                        <el-table :data="historyRecords" v-loading="loading" empty-text="暂无历史记录">
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
            </div>
        </StudentLayout>
    `
};
