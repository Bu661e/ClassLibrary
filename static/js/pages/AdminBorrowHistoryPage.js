const { ref, onMounted, computed } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { adminApi } from '../api.js';

export default {
    name: 'AdminBorrowHistoryPage',
    setup() {
        const records = ref([]);
        const loading = ref(false);

        // 搜索筛选
        const searchBookTitle = ref('');
        const searchBorrowerName = ref('');
        const searchStatus = ref('');
        const searchDateRange = ref([]);

        const loadRecords = async () => {
            loading.value = true;
            try {
                const res = await adminApi.getBorrows();
                // 默认按时间从近到远排序
                records.value = (res.records || []).sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA;
                });
            } catch (error) {
                ElMessage.error('加载借阅历史失败');
            } finally {
                loading.value = false;
            }
        };

        // 筛选后的记录
        const filteredRecords = computed(() => {
            let result = records.value;

            // 按书名搜索
            if (searchBookTitle.value) {
                const keyword = searchBookTitle.value.toLowerCase();
                result = result.filter(record =>
                    (record.book_title || '').toLowerCase().includes(keyword)
                );
            }

            // 按借阅人搜索
            if (searchBorrowerName.value) {
                const keyword = searchBorrowerName.value.toLowerCase();
                result = result.filter(record =>
                    (record.borrower_name || '').toLowerCase().includes(keyword)
                );
            }

            // 按状态筛选
            if (searchStatus.value) {
                result = result.filter(record => record.status === searchStatus.value);
            }

            // 按借阅时间筛选
            if (searchDateRange.value && searchDateRange.value.length === 2) {
                const [startDate, endDate] = searchDateRange.value;
                if (startDate && endDate) {
                    result = result.filter(record => {
                        if (!record.created_at) return false;
                        const recordDate = new Date(record.created_at);
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        return recordDate >= start && recordDate <= end;
                    });
                }
            }

            return result;
        });

        // 分页
        const currentPage = ref(1);
        const pageSize = ref(10);

        const paginatedRecords = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            const end = start + pageSize.value;
            return filteredRecords.value.slice(start, end);
        });

        const handlePageChange = (page) => {
            currentPage.value = page;
        };

        const handleSizeChange = (size) => {
            pageSize.value = size;
            currentPage.value = 1;
        };

        const resetSearch = () => {
            searchBookTitle.value = '';
            searchBorrowerName.value = '';
            searchStatus.value = '';
            searchDateRange.value = [];
            currentPage.value = 1;
        };

        const getStatusText = (status) => {
            const map = {
                'pending': '待审核',
                'donor_pending': '待捐赠者确认',
                'approved': '已通过',
                'return_pending': '待归还确认',
                'completed': '已完成',
                'rejected': '已拒绝'
            };
            return map[status] || status;
        };

        const getStatusType = (status) => {
            const map = {
                'pending': 'warning',
                'donor_pending': 'info',
                'approved': 'success',
                'return_pending': 'primary',
                'completed': 'info',
                'rejected': 'danger'
            };
            return map[status] || 'info';
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN');
        };

        onMounted(() => {
            loadRecords();
        });

        return {
            records,
            filteredRecords,
            paginatedRecords,
            loading,
            searchBookTitle,
            searchBorrowerName,
            searchStatus,
            searchDateRange,
            currentPage,
            pageSize,
            getStatusText,
            getStatusType,
            formatDate,
            resetSearch,
            handlePageChange,
            handleSizeChange,
            loadRecords
        };
    },
    template: `
        <div v-loading="loading">
            <!-- 页面标题 -->
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">借阅历史</h2>
            </div>

            <!-- 操作栏 -->
            <div style="background: #FFFFFF; border-radius: 12px; padding: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                        <el-input v-model="searchBookTitle" placeholder="搜索书名" clearable style="width: 140px;" />
                        <el-input v-model="searchBorrowerName" placeholder="搜索借阅人" clearable style="width: 120px;" />
                        <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 140px;">
                            <el-option label="待审核" value="pending" />
                            <el-option label="待捐赠者确认" value="donor_pending" />
                            <el-option label="已通过" value="approved" />
                            <el-option label="待归还确认" value="return_pending" />
                            <el-option label="已完成" value="completed" />
                            <el-option label="已拒绝" value="rejected" />
                        </el-select>
                        <el-date-picker
                            v-model="searchDateRange"
                            type="daterange"
                            range-separator="至"
                            start-placeholder="开始日期"
                            end-placeholder="结束日期"
                            value-format="YYYY-MM-DD"
                            clearable
                            style="width: 240px;"
                        />
                        <el-button @click="resetSearch">重置</el-button>
                    </div>
                    <el-button @click="loadRecords">刷新</el-button>
                </div>
            </div>

            <!-- 借阅历史列表 -->
            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-table :data="paginatedRecords" style="width: 100%">
                    <el-table-column prop="id" label="ID" width="60" />
                    <el-table-column prop="book_id" label="图书ID" width="80" />
                    <el-table-column prop="book_title" label="书名" min-width="150" />
                    <el-table-column prop="borrower_name" label="借阅人" width="100">
                        <template #default="scope">
                            <div>{{ scope.row.borrower_name }}</div>
                            <div style="font-size: 12px; color: #9CA3AF;">{{ scope.row.borrower_student_id }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="120">
                        <template #default="scope">
                            <el-tag :type="getStatusType(scope.row.status)" size="small">
                                {{ getStatusText(scope.row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="request_at" label="申请时间" width="180">
                        <template #default="scope">
                            {{ formatDate(scope.row.request_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="approve_at" label="审批时间" width="180">
                        <template #default="scope">
                            {{ formatDate(scope.row.approve_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="return_at" label="归还时间" width="180">
                        <template #default="scope">
                            {{ formatDate(scope.row.return_at) }}
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页 -->
                <div style="padding: 16px; display: flex; justify-content: flex-end;">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        :total="filteredRecords.length"
                        layout="total, sizes, prev, pager, next, jumper"
                        @current-change="handlePageChange"
                        @size-change="handleSizeChange"
                    />
                </div>
            </div>
        </div>
    `
};
