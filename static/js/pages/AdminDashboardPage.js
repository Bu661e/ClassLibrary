const { ref, onMounted } = Vue;
const { ElMessage } = ElementPlus;
import { adminApi } from '../api.js';

export default {
    name: 'AdminDashboardPage',
    setup() {
        const stats = ref({
            total_books: 0,
            available_books: 0,
            pending_reviews: 0,
            pending_borrows: 0,
            pending_returns: 0,
            pending_donations: 0,
            total_users: 0
        });
        const popularBooks = ref([]);
        const topReaders = ref([]);
        const overdueRecords = ref([]);
        const loading = ref(false);

        const loadDashboard = async () => {
            loading.value = true;
            try {
                const res = await adminApi.getDashboard();
                stats.value = res.stats;
                popularBooks.value = res.popular_books || [];
                topReaders.value = res.top_readers || [];
                overdueRecords.value = res.overdue || [];
            } catch (error) {
                ElMessage.error('加载数据失败');
            } finally {
                loading.value = false;
            }
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        };

        const getRankStyle = (index) => {
            const styles = [
                'background: #FEF3C7; color: #F59E0B;',
                'background: #F3F4F6; color: #6B7280;',
                'background: #FEF3C7; color: #CD7F32; border: 1px solid #CD7F32;'
            ];
            return index < 3 ? styles[index] : 'background: #F3F4F6; color: #6B7280;';
        };

        const getReaderStyle = (index) => {
            const styles = [
                'background: linear-gradient(135deg, #FFD700, #FFA500);',
                'background: linear-gradient(135deg, #C0C0C0, #A0A0A0);',
                'background: linear-gradient(135deg, #CD7F32, #B8860B);'
            ];
            return index < 3 ? styles[index] : 'background: #F3F4F6; color: #6B7280;';
        };

        const sendReminder = async () => {
            if (overdueRecords.value.length === 0) {
                ElMessage.warning('没有逾期记录');
                return;
            }

            try {
                const recordIds = overdueRecords.value.map(r => r.id);
                const res = await adminApi.sendReminder(recordIds);
                ElMessage.success(res.message);
            } catch (error) {
                ElMessage.error(error.message || '发送提醒失败');
            }
        };

        onMounted(loadDashboard);

        return {
            stats,
            popularBooks,
            topReaders,
            overdueRecords,
            loading,
            formatDate,
            getRankStyle,
            getReaderStyle,
            sendReminder
        };
    },
    template: `
        <div v-loading="loading">
            <!-- 统计卡片 - Bento Grid -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px;">
                <!-- 待审核 -->
                <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.8); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div style="font-size: 28px; font-weight: 700; color: #F59E0B; margin-bottom: 4px;">{{ stats.pending_reviews }}</div>
                    <div style="font-size: 14px; color: #92400E;">
                        <span v-if="stats.pending_reviews > 0">
                            待审核 ({{ stats.pending_borrows }}借 / {{ stats.pending_returns }}还 / {{ stats.pending_donations }}赠)
                        </span>
                        <span v-else>待审核</span>
                    </div>
                </div>

                <!-- 图书总数 -->
                <div style="background: #FFFFFF; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: #EDE9FE; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div style="font-size: 28px; font-weight: 700; color: #1D1D1F; margin-bottom: 4px;">{{ stats.total_books }}</div>
                    <div style="font-size: 14px; color: #8E8E93;">图书总数</div>
                </div>

                <!-- 在库图书 -->
                <div style="background: #FFFFFF; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: #DCFCE7; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div style="font-size: 28px; font-weight: 700; color: #22C55E; margin-bottom: 4px;">{{ stats.available_books }}</div>
                    <div style="font-size: 14px; color: #8E8E93;">在库图书</div>
                </div>

                <!-- 用户总数 -->
                <div style="background: #FFFFFF; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: #DBEAFE; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                    </div>
                    <div style="font-size: 28px; font-weight: 700; color: #3B82F6; margin-bottom: 4px;">{{ stats.total_users }}</div>
                    <div style="font-size: 14px; color: #8E8E93;">注册用户</div>
                </div>
            </div>

            <!-- 内容和列表 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- 热门图书 -->
                <div style="background: #FFFFFF; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <h3 style="font-size: 16px; font-weight: 600; color: #1D1D1F; margin: 0 0 20px 0;">热门图书排行榜</h3>
                    <div v-if="popularBooks.length === 0" style="text-align: center; color: #8E8E93; padding: 40px 0;">
                        暂无数据
                    </div>
                    <div v-else>
                        <div v-for="(book, index) in popularBooks" :key="index" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #F0F0F0;">
                            <div :style="getRankStyle(index)" style="width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">
                                {{ index + 1 }}
                            </div>
                            <div style="flex: 1; margin-left: 12px; font-size: 14px; color: #1D1D1F;">{{ book.title }}</div>
                            <div style="font-size: 14px; color: #8E8E93;">{{ book.count }}次</div>
                        </div>
                    </div>
                </div>

                <!-- 阅读达人 -->
                <div style="background: #FFFFFF; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <h3 style="font-size: 16px; font-weight: 600; color: #1D1D1F; margin: 0 0 20px 0;">阅读达人排行榜</h3>
                    <div v-if="topReaders.length === 0" style="text-align: center; color: #8E8E93; padding: 40px 0;">
                        暂无数据
                    </div>
                    <div v-else>
                        <div v-for="(reader, index) in topReaders" :key="index" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #F0F0F0;">
                            <div :style="getReaderStyle(index)" style="width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; color: white;">
                                {{ index + 1 }}
                            </div>
                            <div style="flex: 1; margin-left: 12px; font-size: 14px; color: #1D1D1F;">{{ reader.name }}</div>
                            <div style="font-size: 14px; color: #8E8E93;">{{ reader.count }}次</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 逾期列表 -->
            <div style="background: #FFFFFF; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; color: #EF4444; margin: 0;">逾期未还图书</h3>
                    <div style="display: flex; gap: 12px;">
                        <el-button type="warning" size="small" @click="sendReminder" :disabled="overdueRecords.length === 0">
                            一键提醒
                        </el-button>
                        <el-button type="primary" size="small" @click="loadDashboard">
                            刷新
                        </el-button>
                    </div>
                </div>

                <div v-if="overdueRecords.length === 0" style="text-align: center; color: #8E8E93; padding: 40px 0;">
                    暂无逾期图书
                </div>
                <div v-else style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                    <div v-for="record in overdueRecords" :key="record.id" style="background: #FEF2F2; border-radius: 12px; padding: 16px; border: 1px solid #FECACA;">
                        <div style="font-size: 14px; font-weight: 600; color: #1D1D1F; margin-bottom: 8px;">{{ record.book_title }}</div>
                        <div style="font-size: 13px; color: #6B7280;">借阅人：{{ record.borrower_name }}</div>
                        <div style="font-size: 13px; color: #EF4444;">借阅日期：{{ formatDate(record.approve_at) }}</div>
                    </div>
                </div>
            </div>
        </div>
    `
};
