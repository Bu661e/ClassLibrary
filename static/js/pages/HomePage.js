const { ref, onMounted, computed } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { bookApi, borrowApi } from '../api.js';
import StudentLayout from '../components/StudentLayout.js';

export default {
    name: 'HomePage',
    components: { StudentLayout },
    setup() {
        const books = ref([]);
        const loading = ref(false);
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
        const isAdmin = ref(user.value?.is_admin || false);

        // 搜索筛选
        const searchTitle = ref('');
        const searchAuthor = ref('');
        const searchTags = ref('');
        const searchStatus = ref('');
        const searchSource = ref('');

        // 筛选后的图书列表
        const filteredBooks = computed(() => {
            let result = books.value;

            // 按书名搜索
            if (searchTitle.value) {
                const keyword = searchTitle.value.toLowerCase();
                result = result.filter(book =>
                    book.title.toLowerCase().includes(keyword)
                );
            }

            // 按作者搜索
            if (searchAuthor.value) {
                const keyword = searchAuthor.value.toLowerCase();
                result = result.filter(book =>
                    (book.author || '').toLowerCase().includes(keyword)
                );
            }

            // 按标签搜索
            if (searchTags.value) {
                const keyword = searchTags.value.toLowerCase();
                result = result.filter(book => {
                    const tags = book.tags || [];
                    return tags.some(tag => tag.toLowerCase().includes(keyword));
                });
            }

            // 按状态筛选
            if (searchStatus.value) {
                result = result.filter(book => book.status === searchStatus.value);
            }

            // 按来源筛选
            if (searchSource.value) {
                result = result.filter(book => book.source === searchSource.value);
            }

            // 排序：ID 从小到大，状态优先在库
            result = [...result].sort((a, b) => {
                // 先按 ID 升序
                if (a.id !== b.id) {
                    return a.id - b.id;
                }
                // ID 相同按状态排序（available 排在前面）
                const statusOrder = { 'available': 0, 'pending_borrow': 1, 'borrowed': 2, 'pending_return': 3, 'unavailable': 4 };
                return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
            });

            return result;
        });

        // 分页
        const currentPage = ref(1);
        const pageSize = ref(10);

        const paginatedBooks = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            const end = start + pageSize.value;
            return filteredBooks.value.slice(start, end);
        });

        const handlePageChange = (page) => {
            currentPage.value = page;
        };

        const handleSizeChange = (size) => {
            pageSize.value = size;
            currentPage.value = 1;
        };

        const resetSearch = () => {
            searchTitle.value = '';
            searchAuthor.value = '';
            searchTags.value = '';
            searchStatus.value = '';
            searchSource.value = '';
            currentPage.value = 1;
        };

        const loadBooks = async () => {
            loading.value = true;
            try {
                const res = await bookApi.list();
                books.value = res.books || [];
            } catch (error) {
                ElMessage.error('加载图书失败');
            } finally {
                loading.value = false;
            }
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

        onMounted(loadBooks);

        return {
            books,
            loading,
            searchTitle,
            searchAuthor,
            searchTags,
            searchStatus,
            searchSource,
            filteredBooks,
            paginatedBooks,
            currentPage,
            pageSize,
            user,
            isAdmin,
            handlePageChange,
            handleSizeChange,
            resetSearch,
            loadBooks,
            handleBorrow,
            getStatusText,
            getStatusType,
            getSourceText,
            formatDate
        };
    },
    template: `
        <StudentLayout>
            <div v-loading="loading">
                <!-- 页面标题 -->
                <div style="margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">图书列表</h2>
                </div>

                <!-- 操作栏 -->
                <div style="background: #FFFFFF; border-radius: 12px; padding: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                            <el-input v-model="searchTitle" placeholder="搜索书名" clearable style="width: 140px;" />
                            <el-input v-model="searchAuthor" placeholder="搜索作者" clearable style="width: 120px;" />
                            <el-input v-model="searchTags" placeholder="搜索标签" clearable style="width: 120px;" />
                            <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 130px;">
                                <el-option label="在库" value="available" />
                                <el-option label="借阅审核中" value="pending_borrow" />
                                <el-option label="已借出" value="borrowed" />
                                <el-option label="归还审核中" value="pending_return" />
                                <el-option label="不可用" value="unavailable" />
                            </el-select>
                            <el-select v-model="searchSource" placeholder="来源" clearable style="width: 120px;">
                                <el-option label="班级购买" value="class" />
                                <el-option label="个人捐赠" value="donated" />
                            </el-select>
                            <el-button @click="resetSearch">重置</el-button>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <el-button @click="loadBooks">刷新</el-button>
                        </div>
                    </div>
                </div>

                <!-- 图书列表 -->
                <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <el-table :data="paginatedBooks" style="width: 100%" :header-cell-style="{padding: '8px'}" :cell-style="{padding: '8px 12px'}">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="title" label="书名" width="200" />
                        <el-table-column prop="author" label="作者" width="100" />
                        <el-table-column prop="publisher" label="出版社" width="120" />
                        <el-table-column prop="isbn" label="ISBN" width="150" />
                        <el-table-column label="标签" width="150">
                            <template #default="scope">
                                <el-tag v-for="tag in (scope.row.tags || []).slice(0, 2)" :key="tag" size="small" style="margin-right: 4px;">
                                    {{ tag }}
                                </el-tag>
                                <span v-if="(scope.row.tags || []).length > 2" style="font-size: 12px; color: #9CA3AF;">+{{ (scope.row.tags || []).length - 2 }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="source" label="来源" width="100">
                            <template #default="scope">
                                {{ getSourceText(scope.row.source) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态" width="130">
                            <template #default="scope">
                                <el-tag :type="getStatusType(scope.row.status)" size="small">
                                    {{ getStatusText(scope.row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="130" fixed="right">
                            <template #default="scope">
                                <el-button
                                    v-if="!isAdmin && scope.row.status === 'available'"
                                    type="primary"
                                    size="small"
                                    @click="handleBorrow(scope.row)"
                                >
                                    申请借阅
                                </el-button>
                                <span v-else-if="!isAdmin" style="color: #9CA3AF; font-size: 13px;">
                                    {{ scope.row.status === 'borrowed' ? '已借出' : '不可借' }}
                                </span>
                            </template>
                        </el-table-column>
                    </el-table>

                    <!-- 分页 -->
                    <div style="padding: 16px; display: flex; justify-content: flex-end;">
                        <el-pagination
                            v-model:current-page="currentPage"
                            v-model:page-size="pageSize"
                            :page-sizes="[10, 20, 50, 100]"
                            :total="filteredBooks.length"
                            layout="total, sizes, prev, pager, next, jumper"
                            @current-change="handlePageChange"
                            @size-change="handleSizeChange"
                        />
                    </div>
                </div>
            </div>
        </StudentLayout>
    `
};
