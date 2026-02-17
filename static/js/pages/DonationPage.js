const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { donationApi, donorApi } from '../api.js';
import StudentLayout from '../components/StudentLayout.js';

export default {
    name: 'DonationPage',
    components: { StudentLayout },
    setup() {
        const loading = ref(false);
        const donations = ref([]);  // 捐赠申请记录
        const donatedBooks = ref([]);  // 已捐赠的图书
        const dialogVisible = ref(false);
        const newDonation = ref({
            title: '',
            author: '',
            publisher: '',
            isbn: '',
            tags: '',
            reason: ''
        });

        const statusMap = {
            'pending': '待审核',
            'approved': '已入库',
            'rejected': '已拒绝'
        };

        const bookStatusMap = {
            'available': '在库',
            'pending_borrow': '借阅审核中',
            'borrowed': '已借出',
            'pending_return': '归还审核中',
            'unavailable': '已报废'
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN');
        };

        const loadDonations = async () => {
            loading.value = true;
            try {
                const res = await donationApi.list();
                donations.value = res.donations || [];
                donatedBooks.value = res.donated_books || [];
            } catch (error) {
                ElMessage.error('加载失败');
            } finally {
                loading.value = false;
            }
        };

        const addDonation = async () => {
            if (!newDonation.value.title) {
                ElMessage.warning('请输入书名');
                return;
            }
            loading.value = true;
            try {
                await donationApi.add(newDonation.value);
                ElMessage.success('已提交捐赠申请');
                dialogVisible.value = false;
                newDonation.value = {
                    title: '',
                    author: '',
                    publisher: '',
                    isbn: '',
                    tags: '',
                    reason: ''
                };
                loadDonations();
            } catch (error) {
                ElMessage.error(error.message || '提交失败');
            } finally {
                loading.value = false;
            }
        };

        // 同意借阅
        const handleApprove = async (book) => {
            const confirm = book.pending_confirm;
            if (!confirm) return;

            try {
                await ElMessageBox.confirm(
                    `确认同意将您的捐赠图书《${book.title}》借给${confirm.borrow_record.borrower_name}?`,
                    '确认借阅',
                    {
                        confirmButtonText: '同意',
                        cancelButtonText: '取消',
                        type: 'info'
                    }
                );

                await donorApi.approve(confirm.id);
                ElMessage.success('已同意借阅');
                loadDonations();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '操作失败');
                }
            }
        };

        // 拒绝借阅
        const handleReject = async (book) => {
            const confirm = book.pending_confirm;
            if (!confirm) return;

            try {
                await ElMessageBox.confirm(
                    `确认拒绝将您的捐赠图书《${book.title}》借给${confirm.borrow_record.borrower_name}?`,
                    '拒绝借阅',
                    {
                        confirmButtonText: '拒绝',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                );

                await donorApi.reject(confirm.id);
                ElMessage.success('已拒绝借阅');
                loadDonations();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '操作失败');
                }
            }
        };

        // 合并两个列表，统一显示
        const allItems = ref([]);

        const loadAllItems = () => {
            const items = [];

            // 添加捐赠申请记录（只显示 pending 和 rejected，approved 的已经在图书中显示了）
            donations.value.forEach(d => {
                if (d.status === 'approved') {
                    return; // 跳过已批准的申请，因为对应的图书已经在下面显示了
                }
                items.push({
                    type: 'request',
                    id: d.id,
                    title: d.title,
                    author: d.author || '-',
                    publisher: d.publisher || '-',
                    tags: d.tags || '-',
                    isbn: d.isbn || '-',
                    reason: d.reason || '-',
                    status: d.status,
                    created_at: d.created_at
                });
            });

            // 添加已捐赠的图书
            donatedBooks.value.forEach(b => {
                items.push({
                    type: 'book',
                    id: b.id,
                    title: b.title,
                    author: b.author || '-',
                    publisher: b.publisher || '-',
                    tags: b.tags || '-',
                    isbn: b.isbn || '-',
                    reason: '-',
                    status: b.status,
                    created_at: b.created_at,
                    has_pending_confirm: b.has_pending_confirm,
                    pending_confirm: b.pending_confirm
                });
            });

            // 按时间排序（最新的在前）
            items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            allItems.value = items;
        };

        // 监听数据变化，重新构建列表
        Vue.watch([donations, donatedBooks], () => {
            loadAllItems();
        }, { immediate: true });

        onMounted(loadDonations);

        return {
            loading,
            donations,
            donatedBooks,
            allItems,
            dialogVisible,
            newDonation,
            statusMap,
            bookStatusMap,
            formatDate,
            addDonation,
            handleApprove,
            handleReject,
            loadDonations
        };
    },
    template: `
        <StudentLayout>
            <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">我的捐赠</h2>
                <div style="display: flex; gap: 12px;">
                    <el-button type="primary" @click="loadDonations">刷新</el-button>
                    <el-button type="success" @click="dialogVisible = true">申请捐赠图书</el-button>
                </div>
            </div>

            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-table :data="allItems" v-loading="loading" empty-text="暂无捐赠记录" :header-cell-style="{padding: '8px'}" :cell-style="{padding: '6px 8px'}">
                    <el-table-column label="类型" width="70">
                        <template #default="scope">
                            <el-tag :type="scope.row.type === 'request' ? 'warning' : 'success'" size="small">
                                {{ scope.row.type === 'request' ? '申请' : '已入库' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="title" label="书名" width="200" />
                    <el-table-column prop="author" label="作者" width="80" />
                    <el-table-column prop="publisher" label="出版社" width="150" />
                    <el-table-column prop="tags" label="标签" width="80" />
                    <el-table-column prop="isbn" label="ISBN" width="100" />
                    <el-table-column prop="created_at" label="时间" width="200">
                        <template #default="scope">
                            {{ formatDate(scope.row.created_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="130">
                        <template #default="scope">
                            <template v-if="scope.row.type === 'request'">
                                <el-tag :type="scope.row.status === 'approved' ? 'success' : (scope.row.status === 'rejected' ? 'danger' : 'warning')" size="small">
                                    {{ statusMap[scope.row.status] }}
                                </el-tag>
                            </template>
                            <template v-else>
                                <el-tag :type="scope.row.status === 'available' ? 'success' : (scope.row.status === 'unavailable' ? 'info' : 'warning')" size="small">
                                    {{ bookStatusMap[scope.row.status] }}
                                </el-tag>
                            </template>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template #default="scope">
                            <!-- 申请中的捐赠 -->
                            <template v-if="scope.row.type === 'request'">
                                <span style="color: #9CA3AF; font-size: 13px;">等待审核</span>
                            </template>
                            <!-- 已入库的图书 - 待确认借阅 -->
                            <template v-else-if="scope.row.has_pending_confirm">
                                <div style="font-size: 12px; color: #F59E0B; margin-bottom: 4px;">
                                    {{ scope.row.pending_confirm?.borrow_record?.borrower_name }} 申请借阅
                                </div>
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
                            <!-- 已入库的图书 - 无待确认 -->
                            <template v-else>
                                <span style="color: #9CA3AF; font-size: 13px;">-</span>
                            </template>
                        </template>
                    </el-table-column>
                    </el-table>
                </div>
            </div>

            <!-- 说明信息 -->
            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 20px; margin-top: 20px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1D1D1F;">说明</h3>
                <el-alert type="info" :closable="false">
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li><strong>申请中</strong>：您提交的捐赠申请，等待管理员审核</li>
                        <li><strong>已入库</strong>：您的捐赠已通过审核，图书已在班级图书馆中</li>
                        <li>当有人申请借阅您捐赠的图书时，您需要在此页面<strong>同意</strong>或<strong>拒绝</strong>借阅请求</li>
                    </ul>
                </el-alert>
            </div>

            <!-- 添加捐赠弹窗 -->
            <el-dialog v-model="dialogVisible" title="申请捐赠图书" width="500px">
                <el-form :model="newDonation" label-width="80px">
                    <el-form-item label="书名" required>
                        <el-input v-model="newDonation.title" placeholder="请输入书名" />
                    </el-form-item>
                    <el-form-item label="作者">
                        <el-input v-model="newDonation.author" placeholder="请输入作者" />
                    </el-form-item>
                    <el-form-item label="出版社">
                        <el-input v-model="newDonation.publisher" placeholder="请输入出版社" />
                    </el-form-item>
                    <el-form-item label="ISBN">
                        <el-input v-model="newDonation.isbn" placeholder="请输入ISBN" />
                    </el-form-item>
                    <el-form-item label="标签">
                        <el-input v-model="newDonation.tags" placeholder="多个标签用逗号分隔" />
                    </el-form-item>
                    <el-form-item label="说明">
                        <el-input v-model="newDonation.reason" type="textarea" placeholder="捐赠说明" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="addDonation">提交申请</el-button>
                </template>
            </el-dialog>
        </StudentLayout>
    `
};
