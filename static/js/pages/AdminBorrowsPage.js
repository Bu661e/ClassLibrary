const { ref, onMounted, computed } = Vue;
const { ElMessage } = ElementPlus;
import { adminApi, authApi } from '../api.js';

const AdminBorrowsPage = {
    setup() {
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
        const activeTab = ref('borrow');
        const borrowRecords = ref([]);
        const returnRecords = ref([]);
        const loading = ref(false);

        // 检查是否是管理员
        const isAdmin = computed(() => user.value?.is_admin || false);

        const statusMap = {
            'pending': '待审核',
            'donor_pending': '待捐赠者确认',
            'return_pending': '待归还确认'
        };

        // 格式化日期
        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN');
        };

        // 获取待处理借阅列表
        const fetchBorrowRecords = async () => {
            try {
                loading.value = true;
                // 获取 pending 和 donor_pending 状态的记录
                const pendingRes = await adminApi.getBorrows('pending');
                const donorPendingRes = await adminApi.getBorrows('donor_pending');
                
                const pending = pendingRes.data || [];
                const donorPending = donorPendingRes.data || [];
                
                borrowRecords.value = [...pending, ...donorPending];
            } catch (error) {
                ElMessage.error('获取借阅申请失败: ' + error.message);
            } finally {
                loading.value = false;
            }
        };

        // 获取待处理归还列表
        const fetchReturnRecords = async () => {
            try {
                loading.value = true;
                const res = await adminApi.getBorrows('return_pending');
                returnRecords.value = res.data || [];
            } catch (error) {
                ElMessage.error('获取归还申请失败: ' + error.message);
            } finally {
                loading.value = false;
            }
        };

        // 通过借阅
        const approveBorrow = async (id) => {
            try {
                await adminApi.approveBorrow(id);
                ElMessage.success('已通过借阅申请');
                fetchBorrowRecords();
            } catch (error) {
                ElMessage.error('操作失败: ' + error.message);
            }
        };

        // 拒绝借阅
        const rejectBorrow = async (id) => {
            try {
                await adminApi.rejectBorrow(id);
                ElMessage.success('已拒绝借阅申请');
                fetchBorrowRecords();
            } catch (error) {
                ElMessage.error('操作失败: ' + error.message);
            }
        };

        // 确认归还
        const confirmReturn = async (id) => {
            try {
                await adminApi.confirmReturn(id);
                ElMessage.success('已确认收书');
                fetchReturnRecords();
            } catch (error) {
                ElMessage.error('操作失败: ' + error.message);
            }
        };

        // 切换标签页时加载数据
        const handleTabChange = (tab) => {
            if (tab === 'borrow') {
                fetchBorrowRecords();
            } else {
                fetchReturnRecords();
            }
        };

        // 登出
        const logout = async () => {
            try {
                await authApi.logout();
            } finally {
                localStorage.removeItem('user');
                window.location.href = '/#/login';
            }
        };

        onMounted(() => {
            // 非管理员跳回首页
            if (!isAdmin.value) {
                ElMessage.warning('您没有权限访问此页面');
                window.location.href = '/#/';
                return;
            }
            fetchBorrowRecords();
        });

        return {
            user,
            isAdmin,
            activeTab,
            borrowRecords,
            returnRecords,
            loading,
            statusMap,
            formatDate,
            approveBorrow,
            rejectBorrow,
            confirmReturn,
            handleTabChange,
            logout
        };
    },
    template: `
        <div v-loading="loading">
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">借阅审核</h2>
            </div>

            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-tabs v-model="activeTab" @tab-change="handleTabChange" style="padding: 16px;">
                    <!-- 待处理借阅标签 -->
                    <el-tab-pane label="待处理借阅" name="borrow">
                        <el-table :data="borrowRecords" style="width: 100%">
                            <el-table-column prop="book_title" label="书名" min-width="200">
                                <template #default="scope">
                                    <strong>{{ scope.row.book_title }}</strong>
                                </template>
                            </el-table-column>
                            <el-table-column prop="borrower_name" label="借阅人" width="120">
                                <template #default="scope">
                                    {{ scope.row.borrower_name }}
                                    <div class="student-id">{{ scope.row.borrower_student_id }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="created_at" label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="140">
                                <template #default="scope">
                                    <el-tag :type="scope.row.status === 'pending' ? 'warning' : 'info'">
                                        {{ statusMap[scope.row.status] }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="180" fixed="right">
                                <template #default="scope">
                                    <el-button 
                                        type="success" 
                                        size="small" 
                                        @click="approveBorrow(scope.row.id)"
                                        :disabled="scope.row.status !== 'pending'"
                                    >
                                        通过
                                    </el-button>
                                    <el-button 
                                        type="danger" 
                                        size="small" 
                                        @click="rejectBorrow(scope.row.id)"
                                        :disabled="scope.row.status !== 'pending'"
                                    >
                                        拒绝
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <el-empty v-if="!loading && borrowRecords.length === 0" description="暂无待处理借阅申请" />
                    </el-tab-pane>

                    <!-- 待处理归还标签 -->
                    <el-tab-pane label="待处理归还" name="return">
                        <el-table :data="returnRecords" v-loading="loading" style="width: 100%">
                            <el-table-column prop="book_title" label="书名" min-width="200">
                                <template #default="scope">
                                    <strong>{{ scope.row.book_title }}</strong>
                                </template>
                            </el-table-column>
                            <el-table-column prop="borrower_name" label="借阅人" width="120">
                                <template #default="scope">
                                    {{ scope.row.borrower_name }}
                                    <div class="student-id">{{ scope.row.borrower_student_id }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="created_at" label="申请时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="140">
                                <template #default="scope">
                                    <el-tag type="primary">
                                        {{ statusMap[scope.row.status] }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="120" fixed="right">
                                <template #default="scope">
                                    <el-button 
                                        type="primary" 
                                        size="small" 
                                        @click="confirmReturn(scope.row.id)"
                                    >
                                        确认收书
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <el-empty v-if="!loading && returnRecords.length === 0" description="暂无待处理归还申请" />
                    </el-tab-pane>
                </el-tabs>
            </div>
        </div>
    `
};

export default AdminBorrowsPage;
