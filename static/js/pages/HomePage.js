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
        <div style="display: flex; min-height: 100vh; background: #F5F5F7;">
            <!-- 左侧导航 -->
            <aside style="width: 220px; background: #FFFFFF; box-shadow: 2px 0 8px rgba(0,0,0,0.04); display: flex; flex-direction: column;">
                <!-- Logo -->
                <div style="padding: 20px; border-bottom: 1px solid #F0F0F0;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                        </div>
                        <span style="font-weight: 600; color: #1D1D1F; font-size: 15px;">班级图书</span>
                    </div>
                </div>

                <!-- 菜单 -->
                <div style="flex: 1; padding: 12px 0;">
                    <div
                        v-for="item in menuItems"
                        :key="item.path"
                        @click="$router.push(item.path)"
                        :style="{
                            margin: '4px 12px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: $route.path === item.path ? '#7C3AED' : 'transparent',
                            color: $route.path === item.path ? 'white' : '#6B7280',
                            fontSize: '14px',
                            fontWeight: $route.path === item.path ? '500' : '400',
                            transition: 'all 0.2s'
                        }"
                    >
                        <svg v-if="item.icon === 'book'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <svg v-else-if="item.icon === 'list'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        <svg v-else-if="item.icon === 'gift'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 12 20 22 4 22 4 12"></polyline>
                            <rect x="2" y="7" width="20" height="5"></rect>
                            <line x1="12" y1="22" x2="12" y2="7"></line>
                            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                        </svg>
                        <svg v-else-if="item.icon === 'star'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 18.45 18.18 22.27 12 17.47 5.82 22.27 7 18.45 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <svg v-else-if="item.icon === 'heart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {{ item.label }}
                    </div>
                </div>

                <!-- 底部用户信息 -->
                <div style="padding: 16px; border-top: 1px solid #F0F0F0;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                            {{ user?.name?.charAt(0) || '学' }}
                        </div>
                        <div>
                            <div style="font-weight: 500; color: #1D1D1F; font-size: 14px;">{{ user?.name }}</div>
                            <div style="font-size: 12px; color: #9CA3AF;">学生</div>
                        </div>
                    </div>
                    <div
                        v-if="isAdmin"
                        @click="$router.push('/admin')"
                        style="cursor: pointer; padding: 10px; border-radius: 8px; background: #FEF3C7; color: #D97706; font-size: 13px; text-align: center; margin-bottom: 8px; transition: all 0.2s;"
                    >
                        管理后台
                    </div>
                    <div
                        @click="logout"
                        style="cursor: pointer; padding: 10px; border-radius: 8px; background: #FEE2E2; color: #EF4444; font-size: 13px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        退出登录
                    </div>
                </div>
            </aside>

            <!-- 主内容区 -->
            <main style="flex: 1; padding: 24px;">
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
        </div>
    `
};
