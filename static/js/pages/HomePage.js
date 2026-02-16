const { ref, onMounted } = Vue;
const { ElMessage } = ElementPlus;
import { bookApi, borrowApi } from '../api.js';

export default {
    name: 'HomePage',
    setup() {
        const books = ref([]);
        const loading = ref(false);
        const searchKeyword = ref('');
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

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

        onMounted(loadBooks);

        return {
            books,
            loading,
            searchKeyword,
            user,
            handleSearch,
            handleBorrow,
            getStatusText,
            getStatusType,
            logout
        };
    },
    template: `
        <div>
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>班级图书共享管理系统</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
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
        </div>
    `
};
