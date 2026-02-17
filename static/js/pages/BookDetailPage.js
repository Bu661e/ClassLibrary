const { ref, onMounted } = Vue;
const { ElMessage } = ElementPlus;
import { bookApi, borrowApi, reviewApi } from '../api.js';

export default {
    name: 'BookDetailPage',
    setup() {
        const book = ref(null);
        const loading = ref(false);
        const borrowLoading = ref(false);
        const reviews = ref([]);
        const reviewLoading = ref(false);
        const showReviewDialog = ref(false);
        const newReview = ref({
            rating: 5,
            content: '',
            review_type: 'neutral'
        });
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
        const isAdmin = ref(user.value?.is_admin || false);

        const loadBookDetail = async () => {
            const bookId = VueRouter.useRoute().params.id;
            if (!bookId) {
                ElMessage.error('图书ID不存在');
                return;
            }

            loading.value = true;
            try {
                const res = await bookApi.get(bookId);
                book.value = res.book;
                loadReviews(bookId);
            } catch (error) {
                ElMessage.error('加载图书详情失败');
            } finally {
                loading.value = false;
            }
        };

        const loadReviews = async (bookId) => {
            reviewLoading.value = true;
            try {
                const res = await reviewApi.getBookReviews(bookId);
                reviews.value = res.reviews || [];
            } catch (error) {
                console.error('加载评价失败', error);
            } finally {
                reviewLoading.value = false;
            }
        };

        const handleBorrow = async () => {
            if (!book.value) return;

            borrowLoading.value = true;
            try {
                await borrowApi.create(book.value.id);
                ElMessage.success('借阅申请已提交');
                loadBookDetail();
            } catch (error) {
                ElMessage.error(error.message);
            } finally {
                borrowLoading.value = false;
            }
        };

        const submitReview = async () => {
            if (!book.value || !user.value) return;

            try {
                await reviewApi.createReview(book.value.id, newReview.value);
                ElMessage.success('评价已提交');
                showReviewDialog.value = false;
                newReview.value = { rating: 5, content: '', review_type: 'neutral' };
                loadReviews(book.value.id);
            } catch (error) {
                ElMessage.error(error.message || '提交失败');
            }
        };

        const getRatingText = (type) => {
            const map = {
                'recommend': '推荐',
                'warn': '防雷',
                'neutral': '中立'
            };
            return map[type] || type;
        };

        const getRatingType = (type) => {
            const map = {
                'recommend': 'success',
                'warn': 'danger',
                'neutral': 'info'
            };
            return map[type] || 'info';
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

        const goBack = () => {
            window.history.back();
        };

        onMounted(loadBookDetail);

        return {
            book,
            loading,
            borrowLoading,
            reviews,
            reviewLoading,
            showReviewDialog,
            newReview,
            user,
            isAdmin,
            handleBorrow,
            submitReview,
            getStatusText,
            getStatusType,
            getSourceText,
            getRatingText,
            getRatingType,
            formatDate,
            logout,
            goBack
        };
    },
    template: `
        <div>
            <!-- 顶部导航栏 -->
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
                <h1>班级图书共享管理系统</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="info" size="small" @click="$router.push('/my-borrows')">我的借阅</el-button>
                    <el-button v-if="isAdmin" type="warning" size="small" @click="$router.push('/admin/borrows')">借阅审核</el-button>
                    <el-button type="primary" size="small" @click="$router.push('/')">返回首页</el-button>
                    <el-button type="danger" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main v-loading="loading">
                <!-- 返回按钮 -->
                <el-button @click="goBack" style="margin-bottom: 20px;">
                    <el-icon><arrow-left /></el-icon> 返回
                </el-button>

                <template v-if="book">
                    <!-- 图书信息卡片 -->
                    <el-card style="margin-bottom: 20px;">
                        <template #header>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h2 style="margin: 0;">{{ book.title }}</h2>
                                <el-tag :type="getStatusType(book.status)" size="large">
                                    {{ getStatusText(book.status) }}
                                </el-tag>
                            </div>
                        </template>

                        <el-row :gutter="20">
                            <el-col :span="12">
                                <p><strong>作者：</strong>{{ book.author }}</p>
                                <p><strong>出版社：</strong>{{ book.publisher }}</p>
                                <p><strong>ISBN：</strong>{{ book.isbn || '-' }}</p>
                            </el-col>
                            <el-col :span="12">
                                <p><strong>标签：</strong>
                                    <el-tag v-if="book.tags" size="small" style="margin-right: 5px;">
                                        {{ book.tags }}
                                    </el-tag>
                                    <span v-else>-</span>
                                </p>
                                <p><strong>来源：</strong>{{ getSourceText(book.source) }}</p>
                                <p><strong>录入时间：</strong>{{ formatDate(book.created_at) }}</p>
                            </el-col>
                        </el-row>

                        <!-- 操作按钮 -->
                        <div style="margin-top: 20px; text-align: center;">
                            <!-- 学生可以看到借阅按钮，管理员不能借阅 -->
                            <el-button
                                v-if="!isAdmin && book.status === 'available'"
                                type="primary"
                                size="large"
                                :loading="borrowLoading"
                                @click="handleBorrow"
                            >
                                申请借阅
                            </el-button>
                            <el-button
                                v-else-if="isAdmin"
                                type="info"
                                size="large"
                                disabled
                            >
                                管理员不可借阅
                            </el-button>
                            <el-button
                                v-else
                                type="info"
                                size="large"
                                disabled
                            >
                                图书不可借阅
                            </el-button>
                        </div>
                    </el-card>

                    <!-- 借阅历史表格 -->
                    <el-card v-if="(isAdmin || book.current_borrow) && book.borrow_history && book.borrow_history.length > 0">
                        <template #header>
                            <h3 style="margin: 0;">借阅历史</h3>
                        </template>

                        <el-table :data="book.borrow_history" border style="width: 100%">
                            <el-table-column prop="id" label="记录ID" width="80" />
                            <el-table-column prop="borrower_name" label="借阅人" width="120" />
                            <el-table-column prop="status" label="状态" width="120">
                                <template #default="scope">
                                    <el-tag :type="getStatusType(scope.row.status)" size="small">
                                        {{ getStatusText(scope.row.status) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="borrow_date" label="借阅日期" width="120">
                                <template #default="scope">
                                    {{ formatDate(scope.row.borrow_date) }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="return_date" label="归还日期" width="120">
                                <template #default="scope">
                                    {{ formatDate(scope.row.return_date) || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="created_at" label="申请时间">
                                <template #default="scope">
                                    {{ formatDate(scope.row.created_at) }}
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-card>

                    <!-- 当前借阅信息（普通用户查看自己的借阅） -->
                    <el-card v-if="!isAdmin && book.current_borrow && book.current_borrow.borrower_id === user?.id">
                        <template #header>
                            <h3 style="margin: 0;">我的借阅信息</h3>
                        </template>
                        <p><strong>借阅状态：</strong>
                            <el-tag :type="getStatusType(book.current_borrow.status)" size="small">
                                {{ getStatusText(book.current_borrow.status) }}
                            </el-tag>
                        </p>
                        <p><strong>借阅日期：</strong>{{ formatDate(book.current_borrow.borrow_date) }}</p>
                        <p v-if="book.current_borrow.return_date"><strong>归还日期：</strong>{{ formatDate(book.current_borrow.return_date) }}</p>
                    </el-card>

                    <!-- 图书评价 -->
                    <el-card style="margin-top: 20px;">
                        <template #header>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="margin: 0;">图书评价</h3>
                                <el-button v-if="user && !isAdmin" type="primary" size="small" @click="showReviewDialog = true">
                                    写评价
                                </el-button>
                            </div>
                        </template>

                        <div v-loading="reviewLoading">
                            <div v-if="reviews.length === 0" style="text-align: center; color: #999; padding: 20px;">
                                暂无评价，快来抢先评价吧！
                            </div>
                            <div v-else>
                                <div v-for="review in reviews" :key="review.id" style="padding: 15px; border-bottom: 1px solid #eee;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <strong>{{ review.user_name }}</strong>
                                            <el-rate v-model="review.rating" disabled style="margin-left: 10px;" />
                                        </div>
                                        <el-tag :type="getRatingType(review.review_type)" size="small">
                                            {{ getRatingText(review.review_type) }}
                                        </el-tag>
                                    </div>
                                    <p style="margin-top: 10px; color: #666;">{{ review.content || '无评价内容' }}</p>
                                    <p style="font-size: 12px; color: #999;">{{ formatDate(review.created_at) }}</p>
                                </div>
                            </div>
                        </div>
                    </el-card>

                    <!-- 写评价弹窗 -->
                    <el-dialog v-model="showReviewDialog" title="写评价" width="500px">
                        <el-form label-width="80px">
                            <el-form-item label="评分">
                                <el-rate v-model="newReview.rating" />
                            </el-form-item>
                            <el-form-item label="类型">
                                <el-radio-group v-model="newReview.review_type">
                                    <el-radio label="recommend">推荐（安利）</el-radio>
                                    <el-radio label="warn">防雷</el-radio>
                                    <el-radio label="neutral">中立</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="评价">
                                <el-input v-model="newReview.content" type="textarea" rows="4" placeholder="写下你的评价..." />
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <el-button @click="showReviewDialog = false">取消</el-button>
                            <el-button type="primary" @click="submitReview">提交</el-button>
                        </template>
                    </el-dialog>
                </template>

                <!-- 图书不存在提示 -->
                <el-empty v-else-if="!loading" description="图书不存在或已删除" />
            </el-main>
        </div>
    `
};
