const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { donationApi } from '../api.js';
import StudentLayout from '../components/StudentLayout.js';

export default {
    name: 'DonationPage',
    components: { StudentLayout },
    setup() {
        const loading = ref(false);
        const donations = ref([]);
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

        onMounted(loadDonations);

        return {
            loading,
            donations,
            dialogVisible,
            newDonation,
            statusMap,
            formatDate,
            addDonation
        };
    },
    template: `
        <StudentLayout>
            <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">我的捐赠</h2>
                <el-button type="success" @click="dialogVisible = true">申请捐赠图书</el-button>
            </div>

            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-table :data="donations" v-loading="loading" empty-text="暂无捐赠记录">
                    <el-table-column prop="title" label="书名" min-width="150" />
                    <el-table-column prop="author" label="作者" width="120" />
                    <el-table-column prop="publisher" label="出版社" width="150" />
                    <el-table-column prop="tags" label="标签" width="120" />
                    <el-table-column prop="reason" label="捐赠说明" min-width="150" />
                    <el-table-column prop="created_at" label="申请时间" width="180">
                        <template #default="scope">
                            {{ formatDate(scope.row.created_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                            <el-tag :type="scope.row.status === 'approved' ? 'success' : (scope.row.status === 'rejected' ? 'danger' : 'warning')">
                                {{ statusMap[scope.row.status] }}
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>
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
