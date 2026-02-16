const { ref, onMounted, computed } = Vue;

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
                ElementPlus.ElMessage.error('获取借阅申请失败: ' + error.message);
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
                ElementPlus.ElMessage.error('获取归还申请失败: ' + error.message);
            } finally {
                loading.value = false;
            }
        };

        // 通过借阅
        const approveBorrow = async (id) => {
            try {
                await adminApi.approveBorrow(id);
                ElementPlus.ElMessage.success('已通过借阅申请');
                fetchBorrowRecords();
            } catch (error) {
                ElementPlus.ElMessage.error('操作失败: ' + error.message);
            }
        };

        // 拒绝借阅
        const rejectBorrow = async (id) => {
            try {
                await adminApi.rejectBorrow(id);
                ElementPlus.ElMessage.success('已拒绝借阅申请');
                fetchBorrowRecords();
            } catch (error) {
                ElementPlus.ElMessage.error('操作失败: ' + error.message);
            }
        };

        // 确认归还
        const confirmReturn = async (id) => {
            try {
                await adminApi.confirmReturn(id);
                ElementPlus.ElMessage.success('已确认收书');
                fetchReturnRecords();
            } catch (error) {
                ElementPlus.ElMessage.error('操作失败: ' + error.message);
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
                ElementPlus.ElMessage.warning('您没有权限访问此页面');
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
        <div class="admin-borrows-page">
            <!-- 顶部导航栏 -->
            <el-header class="header">
                <div class="header-content">
                    <h1 class="logo">图书管理系统</h1>
                    <div class="nav-menu">
                        <el-link type="primary" href="/#/">首页</el-link>
                        <el-link type="primary" href="/#/my-borrows">我的借阅</el-link>
                        <el-link type="primary" href="/#/admin/borrows" v-if="isAdmin">借阅审核</el-link>
                    </div>
                    <div class="user-info">
                        <el-tag type="danger" v-if="isAdmin">管理员</el-tag>
                        <span class="username">{{ user?.name }}</span>
                        <el-button type="danger" size="small" @click="logout">退出</el-button>
                    </div>
                </div>
            </el-header>

            <!-- 主内容区 -->
            <el-main class="main-content">
                <h2 class="page-title">借阅审核</h2>
                
                <el-tabs v-model="activeTab" @tab-change="handleTabChange" type="border-card">
                    <!-- 待处理借阅标签 -->
                    <el-tab-pane label="待处理借阅" name="borrow">
                        <el-table :data="borrowRecords" v-loading="loading" style="width: 100%">
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
            </el-main>
        </div>
    `
};

export default AdminBorrowsPage;
