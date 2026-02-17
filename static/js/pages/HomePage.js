const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { bookApi, borrowApi } from '../api.js';
import StudentLayout from '../components/StudentLayout.js';

export default {
    name: 'HomePage',
    components: { StudentLayout },
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

        const menuItems = [
            { path: '/', label: '图书列表', icon: 'book' },
            { path: '/my-borrows', label: '我的借阅', icon: 'list' },
            { path: '/donor-confirms', label: '捐赠确认', icon: 'gift' },
            { path: '/wishlist', label: '心愿单', icon: 'star' },
            { path: '/donations', label: '我的捐赠', icon: 'heart' }
        ];

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
            handleAddBook,
            menuItems
        };
    },
    template: `
        <StudentLayout>
            <!-- 内容区域 -->
            <div v-loading="loading">
                <!-- 搜索栏 -->
                <div style="background: #FFFFFF; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; gap: 12px;">
                        <el-input
                            v-model="searchKeyword"
                            placeholder="搜索书名、作者、标签..."
                            @keyup.enter="handleSearch"
                            style="flex: 1;"
                        >
                            <template #prefix>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </template>
                        </el-input>
                        <el-button type="primary" @click="handleSearch">搜索</el-button>
                        <el-button v-if="isAdmin" type="success" @click="showAddDialog">录入图书</el-button>
                    </div>
                </div>

                <!-- 图书列表 -->
                <div v-if="books.length === 0 && !loading" style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5" style="margin: 0 auto 12px;">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <p style="color: #6B7280;">暂无图书</p>
                </div>

                <div v-loading="loading" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
                    <div
                        v-for="book in books"
                        :key="book.id"
                        style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s; cursor: pointer;"
                        onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'"
                        onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'"
                        @click="$router.push('/books/' + book.id)"
                    >
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <h3 style="font-size: 15px; font-weight: 600; color: #1D1D1F; margin: 0; flex: 1; line-height: 1.4;">{{ book.title }}</h3>
                            <el-tag :type="getStatusType(book.status)" size="small">{{ getStatusText(book.status) }}</el-tag>
                        </div>
                        <p style="color: #6B7280; font-size: 13px; margin-bottom: 6px;">作者: {{ book.author }}</p>
                        <p style="color: #9CA3AF; font-size: 12px; margin-bottom: 12px;">出版社: {{ book.publisher }}</p>
                        <el-button
                            v-if="!isAdmin && book.status === 'available'"
                            type="primary"
                            size="small"
                            @click.stop="handleBorrow(book)"
                            style="width: 100%;"
                        >
                            申请借阅
                        </el-button>
                        <div
                            v-else-if="!isAdmin && book.status !== 'available'"
                            style="width: 100%; padding: 6px; text-align: center; background: #F3F4F6; border-radius: 6px; color: #9CA3AF; font-size: 13px;"
                        >
                            {{ book.status === 'borrowed' ? '已被借出' : '暂不可借' }}
                        </div>
                    </div>
                </div>
            </main>

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
        </StudentLayout>
    `
};
