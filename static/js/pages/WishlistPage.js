const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { wishlistApi } from '../api.js';
import StudentLayout from '../components/StudentLayout.js';

export default {
    name: 'WishlistPage',
    components: { StudentLayout },
    setup() {
        const loading = ref(false);
        const wishlists = ref([]);
        const dialogVisible = ref(false);
        const newWish = ref({
            book_title: '',
            author: '',
            publisher: '',
            isbn: '',
            reason: ''
        });

        const statusMap = {
            'pending': '待处理',
            'fulfilled': '已满足',
            'rejected': '已拒绝'
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN');
        };

        const loadWishlists = async () => {
            loading.value = true;
            try {
                const res = await wishlistApi.list();
                wishlists.value = res.wishlists || [];
            } catch (error) {
                ElMessage.error('加载失败');
            } finally {
                loading.value = false;
            }
        };

        const addWish = async () => {
            if (!newWish.value.book_title) {
                ElMessage.warning('请输入书名');
                return;
            }
            loading.value = true;
            try {
                await wishlistApi.add(newWish.value);
                ElMessage.success('已提交心愿单');
                dialogVisible.value = false;
                newWish.value = {
                    book_title: '',
                    author: '',
                    publisher: '',
                    isbn: '',
                    reason: ''
                };
                loadWishlists();
            } catch (error) {
                ElMessage.error(error.message || '提交失败');
            } finally {
                loading.value = false;
            }
        };

        const deleteWish = async (id) => {
            try {
                await ElMessageBox.confirm('确认删除此心愿？', '确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await wishlistApi.delete(id);
                ElMessage.success('已删除');
                loadWishlists();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '操作失败');
                }
            }
        };

        onMounted(loadWishlists);

        return {
            loading,
            wishlists,
            dialogVisible,
            newWish,
            statusMap,
            formatDate,
            addWish,
            deleteWish
        };
    },
    template: `
        <StudentLayout>
            <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">心愿单</h2>
                <el-button type="primary" @click="dialogVisible = true">添加心愿</el-button>
            </div>

            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-table :data="wishlists" v-loading="loading" empty-text="暂无心愿">
                    <el-table-column prop="book_title" label="书名" min-width="150" />
                    <el-table-column prop="author" label="作者" width="120" />
                    <el-table-column prop="publisher" label="出版社" width="150" />
                    <el-table-column prop="reason" label="想看原因" min-width="150" />
                    <el-table-column prop="created_at" label="提交时间" width="180">
                        <template #default="scope">
                            {{ formatDate(scope.row.created_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                            <el-tag :type="scope.row.status === 'fulfilled' ? 'success' : (scope.row.status === 'rejected' ? 'danger' : 'warning')">
                                {{ statusMap[scope.row.status] }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" fixed="right">
                        <template #default="scope">
                            <el-button
                                v-if="scope.row.status === 'pending'"
                                type="danger"
                                size="small"
                                @click="deleteWish(scope.row.id)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 添加心愿弹窗 -->
            <el-dialog v-model="dialogVisible" title="添加心愿" width="500px">
                <el-form :model="newWish" label-width="80px">
                    <el-form-item label="书名" required>
                        <el-input v-model="newWish.book_title" placeholder="请输入书名" />
                    </el-form-item>
                    <el-form-item label="作者">
                        <el-input v-model="newWish.author" placeholder="请输入作者" />
                    </el-form-item>
                    <el-form-item label="出版社">
                        <el-input v-model="newWish.publisher" placeholder="请输入出版社" />
                    </el-form-item>
                    <el-form-item label="ISBN">
                        <el-input v-model="newWish.isbn" placeholder="请输入ISBN" />
                    </el-form-item>
                    <el-form-item label="原因">
                        <el-input v-model="newWish.reason" type="textarea" placeholder="为什么想看这本书？" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="addWish">提交</el-button>
                </template>
            </el-dialog>
        </StudentLayout>
    `
};
