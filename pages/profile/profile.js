// pages/profile/profile.js
const { userApi, demandApi } = require('../../utils/api');

Page({
    data: {
        userInfo: {
            nickname: '用户',
            avatarUrl: '/images/default-avatar.png'
        },
        phone: '',
        originalPhone: '', // 用于比对是否修改
        phoneChanged: false, // 是否修改了手机号
        saving: false, // 是否正在保存
        demandCount: 0,
        pendingCount: 0,
        matchedCount: 0,
        loading: false
    }, onLoad() {
        this.loadUserData();
    },

    onShow() {
        this.loadUserData();
    },

    // 加载用户数据
    async loadUserData() {
        this.setData({ loading: true });

        try {
            // 获取用户信息
            const userInfo = await userApi.getProfile();

            // 获取需求列表统计
            const demandData = await demandApi.getMyList();

            // 提取需求数组
            const demands = demandData.demands || [];

            const demandCount = demands.length;
            const pendingCount = demands.filter(d => d.status === 'PENDING').length;
            const matchedCount = demands.filter(d => d.status === 'MATCHED').length;

            this.setData({
                userInfo: {
                    nickname: userInfo.nickname || '用户',
                    avatarUrl: userInfo.avatarUrl || '/images/default-avatar.png'
                },
                phone: userInfo.phone || '',
                originalPhone: userInfo.phone || '',
                demandCount,
                pendingCount,
                matchedCount,
                loading: false
            });

        } catch (error) {
            console.error('加载用户数据失败:', error);
            this.setData({ loading: false });
        }
    },

    // 手机号输入
    onPhoneInput(e) {
        const newPhone = e.detail.value;
        const phoneChanged = newPhone !== this.data.originalPhone;

        this.setData({
            phone: newPhone,
            phoneChanged: phoneChanged
        });
    },

    // 保存手机号
    async savePhone() {
        const { phone, originalPhone } = this.data;

        // 如果没有修改，不做处理
        if (phone === originalPhone) {
            return;
        }

        // 如果清空了，提示错误
        if (!phone.trim()) {
            wx.showToast({
                title: '请填写手机号',
                icon: 'none'
            });
            return;
        }

        // 验证手机号格式
        const phoneReg = /^1[3-9]\d{9}$/;
        if (!phoneReg.test(phone.trim())) {
            wx.showToast({
                title: '请填写正确的手机号',
                icon: 'none'
            });
            return;
        }

        // 保存手机号
        this.setData({ saving: true });

        try {
            await userApi.updatePhone(phone.trim());

            this.setData({
                originalPhone: phone.trim(),
                phoneChanged: false,
                saving: false
            });

            wx.showToast({
                title: '保存成功',
                icon: 'success'
            });

        } catch (error) {
            console.error('保存手机号失败:', error);

            this.setData({ saving: false });

            wx.showToast({
                title: error.message || '保存失败，请重试',
                icon: 'none'
            });
        }
    },    // 跳转到发布需求
    goToSubmit() {
        wx.switchTab({
            url: '/pages/index/index'
        });
    },

    // 跳转到需求列表
    goToDemandList() {
        wx.switchTab({
            url: '/pages/demand/list'
        });
    }
});
