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
        const loginType = ref('student');

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

        return { form, loading, loginType, handleLogin };
    },
    template: `
        <div class="login-container">
            <div class="login-card">
                <div style="text-align: center; padding: 24px 0 16px;">
                    <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <h1 style="font-size: 22px; font-weight: 700; color: #1D1D1F; margin-bottom: 8px;">班级图书共享</h1>
                    <p style="font-size: 14px; color: #6B7280;">欢迎回来，请登录您的账号</p>
                </div>

                <!-- 登录类型切换 -->
                <div style="display: flex; background: #F3F4F6; border-radius: 12px; padding: 4px; margin-bottom: 24px;">
                    <div
                        @click="loginType = 'student'"
                        :style="{
                            flex: 1,
                            padding: '10px 16px',
                            textAlign: 'center',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: loginType === 'student' ? '600' : '400',
                            color: loginType === 'student' ? '#4F46E5' : '#6B7280',
                            background: loginType === 'student' ? '#FFFFFF' : 'transparent',
                            boxShadow: loginType === 'student' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s ease'
                        }"
                    >
                        学生登录
                    </div>
                    <div
                        @click="loginType = 'admin'"
                        :style="{
                            flex: 1,
                            padding: '10px 16px',
                            textAlign: 'center',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: loginType === 'admin' ? '600' : '400',
                            color: loginType === 'admin' ? '#4F46E5' : '#6B7280',
                            background: loginType === 'admin' ? '#FFFFFF' : 'transparent',
                            boxShadow: loginType === 'admin' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s ease'
                        }"
                    >
                        管理员登录
                    </div>
                </div>

                <el-form :model="form" label-position="top">
                    <el-form-item :label="loginType === 'admin' ? '管理员账号' : '学号'" style="margin-bottom: 20px;">
                        <el-input
                            v-model="form.student_id"
                            :placeholder="loginType === 'admin' ? '请输入管理员账号' : '请输入学号'"
                            size="large"
                            style="--el-input-border-radius: 12px;"
                        >
                            <template #prefix>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" style="margin-left: 4px;">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="密码" style="margin-bottom: 24px;">
                        <el-input
                            v-model="form.password"
                            type="password"
                            placeholder="请输入密码"
                            size="large"
                            @keyup.enter="handleLogin"
                            style="--el-input-border-radius: 12px;"
                        >
                            <template #prefix>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" style="margin-left: 4px;">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item style="margin-bottom: 0;">
                        <el-button
                            type="primary"
                            :loading="loading"
                            @click="handleLogin"
                            size="large"
                            style="width: 100%; height: 48px; border-radius: 12px; font-size: 16px; font-weight: 600; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border: none; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);"
                        >
                            登 录
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    `
};
