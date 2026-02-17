const { ref, onMounted, watch } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { bookApi, adminApi } from '../api.js';

export default {
    name: 'AdminBooksPage',
    setup() {
        const books = ref([]);
        const users = ref([]);
        const loading = ref(false);
        const dialogVisible = ref(false);
        const editDialogVisible = ref(false);
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
        const editingBook = ref(null);
        const newBook = ref({
            title: '',
            author: '',
            publisher: '',
            isbn: '',
            tags: '',
            source: 'class',
            donor_id: null
        });

        const loadBooks = async () => {
            loading.value = true;
            try {
                const res = await bookApi.list();
                books.value = res.books || [];
            } catch (error) {
                ElMessage.error('加载图书列表失败');
            } finally {
                loading.value = false;
            }
        };

        const loadUsers = async () => {
            try {
                const res = await adminApi.getUsers();
                users.value = res.users || [];
            } catch (error) {
                ElMessage.error('加载用户列表失败');
            }
        };

        const showAddDialog = () => {
            dialogVisible.value = true;
            newBook.value = {
                title: '',
                author: '',
                publisher: '',
                isbn: '',
                tags: '',
                source: 'class',
                donor_id: null
            };
        };

        const handleAddBook = async () => {
            if (!newBook.value.title || !newBook.value.author || !newBook.value.publisher) {
                ElMessage.warning('请填写书名、作者和出版社');
                return;
            }

            if (newBook.value.source === 'donated' && !newBook.value.donor_id) {
                ElMessage.warning('请选择捐赠者');
                return;
            }

            try {
                await bookApi.create(newBook.value);
                ElMessage.success('图书录入成功');
                dialogVisible.value = false;
                loadBooks();
            } catch (error) {
                ElMessage.error(error.message || '录入失败');
            }
        };

        const showEditDialog = (book) => {
            editingBook.value = {
                ...book,
                tags: Array.isArray(book.tags) ? book.tags.join(',') : book.tags
            };
            editDialogVisible.value = true;
        };

        const handleEditBook = async () => {
            if (!editingBook.value.title || !editingBook.value.author || !editingBook.value.publisher) {
                ElMessage.warning('请填写书名、作者和出版社');
                return;
            }

            try {
                await bookApi.update(editingBook.value.id, {
                    title: editingBook.value.title,
                    author: editingBook.value.author,
                    publisher: editingBook.value.publisher,
                    isbn: editingBook.value.isbn,
                    tags: editingBook.value.tags
                });
                ElMessage.success('图书更新成功');
                editDialogVisible.value = false;
                loadBooks();
            } catch (error) {
                ElMessage.error(error.message || '更新失败');
            }
        };

        const handleChangeStatus = async (book) => {
            const statusOptions = [
                { value: 'available', label: '在库' },
                { value: 'pending_borrow', label: '借阅审核中' },
                { value: 'borrowed', label: '已借出' },
                { value: 'pending_return', label: '归还审核中' },
                { value: 'unavailable', label: '不可用' }
            ];

            try {
                const { value } = await ElMessageBox.prompt('请选择图书状态', '修改状态', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    inputType: 'select',
                    inputOptions: statusOptions,
                    inputValue: book.status,
                    inputValidator: (value) => {
                        return value ? true : '请选择状态';
                    }
                });

                await bookApi.updateStatus(book.id, value);
                ElMessage.success('状态更新成功');
                loadBooks();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '更新失败');
                }
            }
        };

        const getStatusText = (status) => {
            const map = {
                'available': '在库',
                'pending_borrow': '借阅审核中',
                'borrowed': '已借出',
                'pending_return': '归还审核中',
                'unavailable': '不可用'
            };
            return map[status] || status;
        };

        const getStatusType = (status) => {
            const map = {
                'available': 'success',
                'pending_borrow': 'warning',
                'borrowed': 'info',
                'pending_return': 'warning',
                'unavailable': 'danger'
            };
            return map[status] || 'info';
        };

        const getSourceText = (source) => {
            const map = {
                'class': '班级购买',
                'donated': '个人捐赠'
            };
            return map[source] || source;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        };

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        onMounted(() => {
            loadBooks();
            loadUsers();
        });

        return {
            books,
            users,
            loading,
            dialogVisible,
            editDialogVisible,
            user,
            editingBook,
            newBook,
            showAddDialog,
            handleAddBook,
            showEditDialog,
            handleEditBook,
            handleChangeStatus,
            getStatusText,
            getStatusType,
            getSourceText,
            formatDate,
            logout
        };
    },
    template: `
        <div v-loading="loading">
            <!-- 页面标题 -->
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">图书管理</h2>
            </div>

            <!-- 操作栏 -->
            <div style="background: #FFFFFF; border-radius: 12px; padding: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <el-button type="primary" @click="showAddDialog">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        录入图书
                    </el-button>
                    <el-button @click="loadBooks">刷新</el-button>
                </div>
            </div>

            <!-- 图书列表 -->
            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-table :data="books" style="width: 100%">
                        <el-table-column prop="id" label="ID" width="60" />
                        <el-table-column prop="title" label="书名" min-width="150" />
                        <el-table-column prop="author" label="作者" width="100" />
                        <el-table-column prop="publisher" label="出版社" width="120" />
                        <el-table-column prop="isbn" label="ISBN" width="120" />
                        <el-table-column prop="source" label="来源" width="100">
                            <template #default="scope">
                                {{ getSourceText(scope.row.source) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态" width="120">
                            <template #default="scope">
                                <el-tag :type="getStatusType(scope.row.status)" size="small">
                                    {{ getStatusText(scope.row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="created_at" label="录入时间" width="100">
                            <template #default="scope">
                                {{ formatDate(scope.row.created_at) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" fixed="right" width="180">
                            <template #default="scope">
                                <el-button type="primary" size="small" @click="showEditDialog(scope.row)">
                                    编辑
                                </el-button>
                                <el-button type="warning" size="small" @click="handleChangeStatus(scope.row)">
                                    状态
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

            <!-- 新增图书弹窗 -->
            <el-dialog v-model="dialogVisible" title="录入图书" width="500px">
                <el-form :model="newBook" label-width="80px">
                    <el-form-item label="书名" required>
                        <el-input v-model="newBook.title" placeholder="请输入书名" />
                    </el-form-item>
                    <el-form-item label="作者" required>
                        <el-input v-model="newBook.author" placeholder="请输入作者" />
                    </el-form-item>
                    <el-form-item label="出版社" required>
                        <el-input v-model="newBook.publisher" placeholder="请输入出版社" />
                    </el-form-item>
                    <el-form-item label="ISBN">
                        <el-input v-model="newBook.isbn" placeholder="请输入ISBN" />
                    </el-form-item>
                    <el-form-item label="标签">
                        <el-input v-model="newBook.tags" placeholder="多个标签用逗号分隔" />
                    </el-form-item>
                    <el-form-item label="来源">
                        <el-radio-group v-model="newBook.source">
                            <el-radio label="class">班级购买</el-radio>
                            <el-radio label="donated">个人捐赠</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-if="newBook.source === 'donated'" label="捐赠者" required>
                        <el-select v-model="newBook.donor_id" placeholder="请选择捐赠者" style="width: 100%">
                            <el-option
                                v-for="u in users"
                                :key="u.id"
                                :label="u.name + ' (' + u.student_id + ')'"
                                :value="u.id"
                            />
                        </el-select>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleAddBook">确定</el-button>
                </template>
            </el-dialog>

            <!-- 编辑图书弹窗 -->
            <el-dialog v-model="editDialogVisible" title="编辑图书" width="500px">
                <el-form v-if="editingBook" :model="editingBook" label-width="80px">
                    <el-form-item label="书名" required>
                        <el-input v-model="editingBook.title" placeholder="请输入书名" />
                    </el-form-item>
                    <el-form-item label="作者" required>
                        <el-input v-model="editingBook.author" placeholder="请输入作者" />
                    </el-form-item>
                    <el-form-item label="出版社" required>
                        <el-input v-model="editingBook.publisher" placeholder="请输入出版社" />
                    </el-form-item>
                    <el-form-item label="ISBN">
                        <el-input v-model="editingBook.isbn" placeholder="请输入ISBN" />
                    </el-form-item>
                    <el-form-item label="标签">
                        <el-input v-model="editingBook.tags" placeholder="多个标签用逗号分隔" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="editDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleEditBook">保存</el-button>
                </template>
            </el-dialog>
        </div>
    `
};
