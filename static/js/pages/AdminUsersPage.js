const { ref, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
import { adminApi } from '../api.js';

export default {
    name: 'AdminUsersPage',
    setup() {
        const users = ref([]);
        const loading = ref(false);
        const dialogVisible = ref(false);
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
        const newUser = ref({
            student_id: '',
            name: '',
            password: '123456',
            is_admin: false
        });

        const loadUsers = async () => {
            loading.value = true;
            try {
                const res = await adminApi.getUsers();
                users.value = res.users || [];
            } catch (error) {
                ElMessage.error('加载用户列表失败');
            } finally {
                loading.value = false;
            }
        };

        const showAddDialog = () => {
            dialogVisible.value = true;
            newUser.value = {
                student_id: '',
                name: '',
                password: '123456',
                is_admin: false
            };
        };

        const handleAddUser = async () => {
            if (!newUser.value.student_id || !newUser.value.name || !newUser.value.password) {
                ElMessage.warning('请填写学号、姓名和密码');
                return;
            }

            try {
                await adminApi.createUser(newUser.value);
                ElMessage.success('用户创建成功');
                dialogVisible.value = false;
                loadUsers();
            } catch (error) {
                ElMessage.error(error.message || '创建失败');
            }
        };

        const handleDeleteUser = async (userToDelete) => {
            if (userToDelete.id === user.value.id) {
                ElMessage.warning('不能删除自己');
                return;
            }

            try {
                await ElMessageBox.confirm(
                    `确认删除用户 ${userToDelete.name} (${userToDelete.student_id})?`,
                    '删除确认',
                    {
                        confirmButtonText: '删除',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                );

                await adminApi.deleteUser(userToDelete.id);
                ElMessage.success('用户已删除');
                loadUsers();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error(error.message || '删除失败');
                }
            }
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

        onMounted(loadUsers);

        return {
            users,
            loading,
            dialogVisible,
            user,
            newUser,
            showAddDialog,
            handleAddUser,
            handleDeleteUser,
            formatDate,
            logout
        };
    },
    template: `
        <div v-loading="loading">
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">用户管理</h2>
            </div>

            <div style="background: #FFFFFF; border-radius: 12px; padding: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-button type="primary" @click="showAddDialog">新增用户</el-button>
            </div>

            <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <el-table :data="users" border style="width: 100%">
                    <el-table-column prop="id" label="ID" width="60" />
                        <el-table-column prop="student_id" label="学号" width="120" />
                        <el-table-column prop="name" label="姓名" width="120" />
                        <el-table-column prop="is_admin" label="角色" width="100">
                            <template #default="scope">
                                <el-tag v-if="scope.row.is_admin" type="danger">管理员</el-tag>
                                <el-tag v-else type="success">普通用户</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" fixed="right">
                            <template #default="scope">
                                <el-button
                                    type="danger"
                                    size="small"
                                    @click="handleDeleteUser(scope.row)"
                                    :disabled="scope.row.id === user?.id"
                                >
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>

            <!-- 新增用户弹窗 -->
            <el-dialog v-model="dialogVisible" title="新增用户" width="500px">
                <el-form :model="newUser" label-width="80px">
                    <el-form-item label="学号" required>
                        <el-input v-model="newUser.student_id" placeholder="请输入学号" />
                    </el-form-item>
                    <el-form-item label="姓名" required>
                        <el-input v-model="newUser.name" placeholder="请输入姓名" />
                    </el-form-item>
                    <el-form-item label="密码" required>
                        <el-input v-model="newUser.password" type="password" placeholder="请输入密码（默认123456）" />
                    </el-form-item>
                    <el-form-item label="角色">
                        <el-switch
                            v-model="newUser.is_admin"
                            active-text="管理员"
                            inactive-text="普通用户"
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleAddUser">确定</el-button>
                </template>
            </el-dialog>
        </div>
    `
};
