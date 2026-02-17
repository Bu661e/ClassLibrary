const { ref, onMounted } = Vue;
const { ElMessage } = ElementPlus;
import { adminApi } from '../api.js';

export default {
    name: 'AdminSettingsPage',
    setup() {
        const loading = ref(false);
        const settings = ref({
            max_borrow_days: '30',
            max_books_per_user: '5'
        });
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const loadSettings = async () => {
            loading.value = true;
            try {
                const res = await adminApi.getSettings();
                settings.value = { ...settings.value, ...res.settings };
            } catch (error) {
                ElMessage.error('加载设置失败');
            } finally {
                loading.value = false;
            }
        };

        const saveSettings = async () => {
            loading.value = true;
            try {
                await adminApi.updateSettings(settings.value);
                ElMessage.success('设置保存成功');
            } catch (error) {
                ElMessage.error('保存失败');
            } finally {
                loading.value = false;
            }
        };

        const logout = () => {
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        };

        onMounted(loadSettings);

        return {
            loading,
            settings,
            user,
            saveSettings,
            logout
        };
    },
    template: `
        <div v-loading="loading">
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1D1D1F;">系统设置</h2>
            </div>

            <div style="background: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); max-width: 600px;">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #1D1D1F;">借阅规则设置</h3>

                <el-form label-width="150px">
                    <el-form-item label="最大借阅天数">
                        <el-input-number v-model="settings.max_borrow_days" :min="1" :max="365" />
                        <span style="margin-left: 10px; color: #999;">天</span>
                    </el-form-item>

                        <el-form-item label="单人最大持书量">
                            <el-input-number v-model="settings.max_books_per_user" :min="1" :max="20" />
                            <span style="margin-left: 10px; color: #999;">本</span>
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" @click="saveSettings">保存设置</el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </div>
    `
};
