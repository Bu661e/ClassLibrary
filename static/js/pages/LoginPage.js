const { ref } = Vue;
const { ElMessage } = ElementPlus;
import { authApi } from '../api.js';

export default {
    name: 'LoginPage',
    setup() {
        const form = ref({
            student_id: '',
            password: ''
        });
        const loading = ref(false);

        const handleLogin = async () => {
            if (!form.value.student_id || !form.value.password) {
                ElMessage.warning('请填写学号和密码');
                return;
            }

            loading.value = true;
            try {
                const res = await authApi.login(form.value.student_id, form.value.password);
                localStorage.setItem('user', JSON.stringify(res.user));
                ElMessage.success('登录成功');
                // 管理员跳转到管理后台，学生跳转到首页
                if (res.user.is_admin) {
                    window.location.href = '/#/admin';
                } else {
                    window.location.href = '/';
                }
            } catch (error) {
                ElMessage.error(error.message || '登录失败');
            } finally {
                loading.value = false;
            }
        };

        return { form, loading, handleLogin };
    },
    template: `
        <div class="login-container">
            <el-card class="login-card">
                <template #header>
                    <h2 style="text-align: center;">班级图书共享管理系统</h2>
                </template>
                <el-form :model="form" label-position="top">
                    <el-form-item label="学号">
                        <el-input v-model="form.student_id" placeholder="请输入学号" />
                    </el-form-item>
                    <el-form-item label="密码">
                        <el-input v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
                            登录
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </div>
    `
};
