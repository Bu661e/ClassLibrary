const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { bookApi, borrowApi } from '../api.js';

export default {
    name: 'HomePage',
    setup() {
        const books = ref([]);
        const loading = ref(false);
        const searchKeyword = ref('');
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
        const isAdmin = ref(user.value?.is_admin || false);
        const dialogVisible = ref(false);
        const newBook = ref({
            title: '',
            author: '',
            publisher: '',
            isbn: '',
            tags: '',
            source: 'class'
        });

        const loadBooks = async () => {
            loading.value = true;
            try {
                const res = await bookApi.list({ keyword: searchKeyword.value });
                books.value = res.books;
            } catch (error) {
                ElMessage.error('加载图书失败');
            } finally {
                loading.value = false;
            }
        };

        const handleSearch = () => {
            loadBooks();
        };

        const handleBorrow = async (book) => {
            try {
                await borrowApi.create(book.id);
                ElMessage.success('借阅申请已提交');
                loadBooks();
            } catch (error) {
                ElMessage.error(error.message);
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

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        const showAddDialog = () => {
            dialogVisible.value = true;
            newBook.value = {
                title: '',
                author: '',
                publisher: '',
                isbn: '',
                tags: '',
                source: 'class'
            };
        };

        const handleAddBook = async () => {
            if (!newBook.value.title || !newBook.value.author || !newBook.value.publisher) {
                ElMessage.warning('请填写书名、作者和出版社');
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

        onMounted(loadBooks);

        return {
            books,
            loading,
            searchKeyword,
            user,
            isAdmin,
            dialogVisible,
            newBook,
            handleSearch,
            handleBorrow,
            getStatusText,
            getStatusType,
            logout,
            showAddDialog,
            handleAddBook
        };
    },
    template: `
        <div>
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>班级图书共享管理系统</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="info" size="small" @click="$router.push('/my-borrows')">我的借阅</el-button>
                    <el-button type="success" size="small" @click="$router.push('/donor-confirms')">捐赠确认</el-button>
                    <el-button v-if="isAdmin" type="primary" size="small" @click="$router.push('/admin')">管理后台</el-button>
                    <el-button type="danger" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main>
                <el-row :gutter="20" style="margin-bottom: 20px;">
                    <el-col :span="16">
                        <el-input v-model="searchKeyword" placeholder="搜索书名、作者、标签" @keyup.enter="handleSearch">
                            <template #append>
                                <el-button @click="handleSearch">搜索</el-button>
                            </template>
                        </el-input>
                    </el-col>
                </el-row>

                <el-row :gutter="20" v-loading="loading">
                    <el-col :span="6" v-for="book in books" :key="book.id" style="margin-bottom: 20px;">
                        <el-card :body-style="{ padding: '15px' }">
                            <h3 style="cursor: pointer; color: #409EFF; margin-bottom: 10px;">
                                {{ book.title }}
                            </h3>
                            <p>作者: {{ book.author }}</p>
                            <p>出版社: {{ book.publisher }}</p>
                            <p>
                                状态:
                                <el-tag :type="getStatusType(book.status)" size="small">
                                    {{ getStatusText(book.status) }}
                                </el-tag>
                            </p>
                            <el-button
                                v-if="book.status === 'available'"
                                type="primary"
                                size="small"
                                @click="handleBorrow(book)"
                                style="width: 100%; margin-top: 10px;"
                            >
                                申请借阅
                            </el-button>
                        </el-card>
                    </el-col>
                </el-row>
            </el-main>

            <!-- 录入图书弹窗 -->
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
                        <el-input v-model="newBook.tags" placeholder="多个标签用逗号分隔，如：编程,Python" />
                    </el-form-item>
                    <el-form-item label="来源">
                        <el-radio-group v-model="newBook.source">
                            <el-radio label="class">班级购买</el-radio>
                            <el-radio label="donated">个人捐赠</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleAddBook">确定</el-button>
                </template>
            </el-dialog>
        </div>
    `
};
