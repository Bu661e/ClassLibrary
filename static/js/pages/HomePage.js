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

        const navItems = [
            { path: '/my-borrows', label: '我的借阅', icon: 'book', type: 'info' },
            { path: '/donor-confirms', label: '捐赠确认', icon: 'gift', type: 'success' },
            { path: '/wishlist', label: '心愿单', icon: 'star', type: 'warning' },
            { path: '/donations', label: '我的捐赠', icon: 'heart', type: 'primary' }
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
            navItems
        };
    },
    template: `
        <div style="min-height: 100vh; background: #F8FAFC;">
            <!-- 顶部导航 -->
            <header style="background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <h1 style="color: white; font-size: 18px; font-weight: 600; margin: 0;">班级图书共享</h1>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <!-- 学生功能按钮 -->
                    <template v-if="!isAdmin">
                        <div
                            v-for="item in navItems"
                            :key="item.path"
                            @click="$router.push(item.path)"
                            style="cursor: pointer; padding: 8px 16px; border-radius: 8px; background: rgba(255,255,255,0.15); color: white; font-size: 14px; transition: all 0.2s;"
                            onmouseover="this.style.background='rgba(255,255,255,0.25)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.15)'"
                        >
                            {{ item.label }}
                        </div>
                    </template>
                    <!-- 管理员入口 -->
                    <div
                        v-if="isAdmin"
                        @click="$router.push('/admin')"
                        style="cursor: pointer; padding: 8px 16px; border-radius: 8px; background: #EF4444; color: white; font-size: 14px; transition: all 0.2s;"
                    >
                        管理后台
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; padding-left: 16px; border-left: 1px solid rgba(255,255,255,0.3);">
                        <div style="width: 36px; height: 36px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #7C3AED; font-weight: 600; font-size: 14px;">
                            {{ user?.name?.charAt(0) || '学' }}
                        </div>
                        <span style="color: white; font-weight: 500;">{{ user?.name }}</span>
                        <div
                            @click="logout"
                            style="cursor: pointer; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px; color: white; font-size: 13px; transition: all 0.2s;"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            退出
                        </div>
                    </div>
                </div>
            </header>

            <!-- 搜索区域 -->
            <div style="background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); padding: 40px 24px 60px;">
                <div style="max-width: 800px; margin: 0 auto;">
                    <h2 style="color: white; font-size: 24px; font-weight: 600; text-align: center; margin-bottom: 24px;">探索图书世界</h2>
                    <div style="display: flex; gap: 12px;">
                        <el-input
                            v-model="searchKeyword"
                            placeholder="搜索书名、作者、标签..."
                            size="large"
                            @keyup.enter="handleSearch"
                            style="flex: 1; --el-input-border-radius: 12px;"
                        >
                            <template #prefix>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </template>
                        </el-input>
                        <el-button
                            type="primary"
                            size="large"
                            @click="handleSearch"
                            style="height: 44px; padding: 0 24px; border-radius: 12px; background: #F97316; border: none; font-weight: 500;"
                        >
                            搜索
                        </el-button>
                        <el-button
                            v-if="isAdmin"
                            type="success"
                            size="large"
                            @click="showAddDialog"
                            style="height: 44px; padding: 0 24px; border-radius: 12px;"
                        >
                            录入图书
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 图书列表 -->
            <div style="max-width: 1200px; margin: -40px auto 40px; padding: 0 24px; position: relative; z-index: 1;">
                <div v-if="books.length === 0 && !loading" style="text-align: center; padding: 60px 20px; background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5" style="margin: 0 auto 16px;">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <p style="color: #6B7280; font-size: 16px;">暂无图书，快去录入吧</p>
                </div>

                <div v-loading="loading" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    <div
                        v-for="book in books"
                        :key="book.id"
                        style="background: white; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: all 0.2s; cursor: pointer;"
                        onmouseover="this.style.boxShadow='0 8px 25px rgba(0,0,0,0.12)'; this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.08)'; this.style.transform='translateY(0)'"
                        @click="$router.push('/books/' + book.id)"
                    >
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <h3 style="font-size: 16px; font-weight: 600; color: #1F2937; margin: 0; flex: 1; line-height: 1.4;">{{ book.title }}</h3>
                            <el-tag :type="getStatusType(book.status)" size="small" style="margin-left: 8px; flex-shrink: 0;">
                                {{ getStatusText(book.status) }}
                            </el-tag>
                        </div>
                        <p style="color: #6B7280; font-size: 14px; margin-bottom: 8px;">作者: {{ book.author }}</p>
                        <p style="color: #9CA3AF; font-size: 13px; margin-bottom: 16px;">出版社: {{ book.publisher }}</p>
                        <el-button
                            v-if="!isAdmin && book.status === 'available'"
                            type="primary"
                            @click.stop="handleBorrow(book)"
                            style="width: 100%; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); border: none; font-weight: 500;"
                        >
                            申请借阅
                        </el-button>
                        <div
                            v-else-if="!isAdmin && book.status !== 'available'"
                            style="width: 100%; height: 40px; border-radius: 10px; background: #F3F4F6; color: #9CA3AF; display: flex; align-items: center; justify-content: center; font-size: 14px;"
                        >
                            {{ book.status === 'borrowed' ? '已被借出' : '暂不可借' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 录入图书弹窗 -->
            <el-dialog v-model="dialogVisible" title="录入图书" width="500px" style="--el-dialog-border-radius: 16px;">
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
