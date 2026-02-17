const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { wishlistApi } from '../api.js';

export default {
    name: 'WishlistPage',
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
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

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

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        onMounted(loadWishlists);

        return {
            loading,
            wishlists,
            dialogVisible,
            newWish,
            user,
            statusMap,
            formatDate,
            addWish,
            deleteWish,
            logout
        };
    },
    template: `
        <div>
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>我的心愿单</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="primary" size="small" @click="$router.push('/')">返回首页</el-button>
                    <el-button type="danger" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main v-loading="loading">
                <div style="margin-bottom: 20px;">
                    <el-button type="primary" @click="dialogVisible = true">添加心愿</el-button>
                </div>

                <el-table :data="wishlists" style="width: 100%">
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

                <el-empty v-if="!loading && wishlists.length === 0" description="暂无心愿单" />

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
            </el-main>
        </div>
    `
};
