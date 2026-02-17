const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { donorApi } from '../api.js';

export default {
    name: 'DonorConfirmsPage',
    setup() {
        const confirms = ref([]);
        const loading = ref(false);
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const loadConfirms = async () => {
            loading.value = true;
            try {
                const res = await donorApi.getConfirms();
                confirms.value = res.confirms || [];
            } catch (error) {
                ElMessage.error('加载待确认列表失败');
            } finally {
                loading.value = false;
            }
        };

        const handleApprove = async (confirm) => {
            try {
                await ElMessageBox.confirm(
                    `确认同意将您的捐赠图书《${confirm.borrow_record.book_title}》借给${confirm.borrow_record.borrower_name}?`,
                    '确认借阅',
                    {
                        confirmButtonText: '同意',
                        cancelButtonText: '取消',
                        type: 'info'
                    }
                );

                await donorApi.approve(confirm.id);
                ElMessage.success('已同意借阅');
                loadConfirms();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '操作失败');
                }
            }
        };

        const handleReject = async (confirm) => {
            try {
                await ElMessageBox.confirm(
                    `确认拒绝将您的捐赠图书《${confirm.borrow_record.book_title}》借给${confirm.borrow_record.borrower_name}?`,
                    '拒绝借阅',
                    {
                        confirmButtonText: '拒绝',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                );

                await donorApi.reject(confirm.id);
                ElMessage.success('已拒绝借阅');
                loadConfirms();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '操作失败');
                }
            }
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        };

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        onMounted(loadConfirms);

        return {
            confirms,
            loading,
            user,
            handleApprove,
            handleReject,
            formatDate,
            logout
        };
    },
    template: `
        <div>
            <!-- 顶部导航栏 -->
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>班级图书共享管理系统</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="primary" size="small" @click="$router.push('/')">返回首页</el-button>
                    <el-button type="info" size="small" @click="$router.push('/my-borrows')">我的借阅</el-button>
                    <el-button type="danger" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main v-loading="loading">
                <el-card>
                    <template #header>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="margin: 0;">待确认的借阅申请</h2>
                            <el-button type="primary" size="small" @click="loadConfirms">
                                刷新
                            </el-button>
                        </div>
                    </template>

                    <el-alert
                        v-if="confirms.length === 0 && !loading"
                        type="info"
                        :closable="false"
                        show-icon
                        style="margin-bottom: 20px;"
                    >
                        <template #title>
                            暂无待确认的借阅申请
                        </template>
                    </el-alert>

                    <el-table v-else :data="confirms" border style="width: 100%">
                        <el-table-column prop="id" label="确认ID" width="80" />
                        <el-table-column prop="borrow_record.book_title" label="图书名称" min-width="150" />
                        <el-table-column prop="borrow_record.borrower_name" label="借阅人" width="120" />
                        <el-table-column prop="borrow_record.request_at" label="申请时间" width="180">
                            <template #default="scope">
                                {{ formatDate(scope.row.borrow_record.request_at) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="scope">
                                <el-button
                                    type="success"
                                    size="small"
                                    @click="handleApprove(scope.row)"
                                >
                                    同意
                                </el-button>
                                <el-button
                                    type="danger"
                                    size="small"
                                    @click="handleReject(scope.row)"
                                >
                                    拒绝
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>

                <!-- 说明信息 -->
                <el-card style="margin-top: 20px;">
                    <template #header>
                        <h3 style="margin: 0;">说明</h3>
                    </template>
                    <el-alert type="info" :closable="false">
                        <p>当您捐赠的图书被申请借阅时，需要您确认是否同意。</p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>同意后，借阅申请将进入管理员审核流程</li>
                            <li>拒绝后，图书将恢复为"在库"状态，其他同学可继续申请</li>
                        </ul>
                    </el-alert>
                </el-card>
            </el-main>
        </div>
    `
};
