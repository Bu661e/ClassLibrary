const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { donorApi } from '../api.js';
import StudentLayout from '../components/StudentLayout.js';

export default {
    name: 'DonorConfirmsPage',
    components: { StudentLayout },
    setup() {
        const confirms = ref([]);
        const loading = ref(false);

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

        onMounted(loadConfirms);

        return {
            confirms,
            loading,
            handleApprove,
            handleReject,
            formatDate,
            loadConfirms
        };
    },
    template: `
        <StudentLayout>
            <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">捐赠确认</h2>
                <el-button type="primary" size="small" @click="loadConfirms">刷新</el-button>
            </div>

            <!-- 待确认列表 -->
            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 24px;">
                <div style="padding: 16px 20px; border-bottom: 1px solid #F0F0F0;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1D1D1F;">待确认的借阅申请</h3>
                </div>

                <el-alert
                    v-if="confirms.length === 0 && !loading"
                    type="info"
                    :closable="false"
                    show-icon
                    style="margin: 20px;"
                >
                    <template #title>
                        暂无待确认的借阅申请
                    </template>
                </el-alert>

                <el-table v-else :data="confirms" v-loading="loading">
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
            </div>

            <!-- 说明信息 -->
            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 20px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1D1D1F;">说明</h3>
                <el-alert type="info" :closable="false">
                    <p>当您捐赠的图书被申请借阅时，需要您确认是否同意。</p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>同意后，借阅申请将进入管理员审核流程</li>
                        <li>拒绝后，图书将恢复为"在库"状态，其他同学可继续申请</li>
                    </ul>
                </el-alert>
            </div>
        </StudentLayout>
    `
};
