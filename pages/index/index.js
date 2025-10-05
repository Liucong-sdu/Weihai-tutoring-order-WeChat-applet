// pages/index/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,

    // 统计数据
    stats: {
      totalDemands: 0,
      pendingDemands: 0,
      matchedDemands: 0
    },

    // 系统配置
    systemConfig: {
      customerHotline: '400-123-4567',
      workHours: '9:00-18:00',
      platformName: '家教平台'
    },

    // 快捷操作
    quickActions: [
      {
        icon: '📝',
        title: '发布需求',
        desc: '快速提交家教需求',
        action: 'submit'
      },
      {
        icon: '📋',
        title: '我的需求',
        desc: '查看需求处理状态',
        action: 'list'
      },
      {
        icon: '💰',
        title: '价格查询',
        desc: '了解课时费标准',
        action: 'price'
      },
      {
        icon: '📞',
        title: '联系客服',
        desc: '有问题随时咨询',
        action: 'contact'
      }
    ],

    loading: false
  },

  onLoad() {
    console.log('首页加载');
    this.loadSystemConfig();
    this.checkUserInfo();
    this.loadStats();
  },

  onShow() {
    // 每次显示页面时更新数据
    this.loadSystemConfig(); // 每次都重新加载配置，确保获取最新数据
    this.loadStats();
    this.checkUserInfo();
  },

  // 加载系统配置
  loadSystemConfig() {
    console.log('🔄 开始加载系统配置...');

    wx.request({
      url: app.globalData.baseURL + '/config/public',
      method: 'GET',
      success: (res) => {
        console.log('📡 配置接口响应:', res.data);

        if (res.data && res.data.success) {
          const config = {
            customerHotline: res.data.data.customer_hotline || '400-123-4567',
            workHours: res.data.data.work_hours || '9:00-18:00',
            platformName: res.data.data.platform_name || '家教平台'
          };

          console.log('✅ 配置已更新:', config);

          this.setData({
            systemConfig: config
          });
        }
      },
      fail: (error) => {
        console.error('❌ 加载系统配置失败:', error);
      }
    });
  },

  // 检查用户信息
  checkUserInfo() {
    const userInfo = app.globalData.userInfo;
    this.setData({
      userInfo,
      hasUserInfo: !!userInfo
    });
  },

  // 加载统计数据
  async loadStats() {
    if (!app.globalData.token) {
      return;
    }

    try {
      const { demandApi } = require('../../utils/api');
      const result = await demandApi.getMyList({ limit: 100 }); // 获取所有需求

      const demands = result.demands || [];
      const stats = {
        totalDemands: demands.length,
        pendingDemands: demands.filter(d => d.status === 'PENDING').length,
        matchedDemands: demands.filter(d => d.status === 'MATCHED').length
      };

      this.setData({ stats });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 登录
  async handleLogin() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      await app.login();
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
        loading: false
      });

      // 加载统计数据
      this.loadStats();

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('登录失败:', error);
      this.setData({ loading: false });

      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
    }
  },

  // 快捷操作点击
  handleQuickAction(e) {
    const action = e.currentTarget.dataset.action;

    switch (action) {
      case 'submit':
        wx.navigateTo({
          url: '/pages/demand/submit'
        });
        break;

      case 'list':
        wx.switchTab({
          url: '/pages/demand/list'
        });
        break;

      case 'price':
        this.showPriceInfo();
        break;

      case 'contact':
        this.showContactInfo();
        break;
    }
  },

  // 显示价格信息
  showPriceInfo() {
    wx.showModal({
      title: '课时费说明',
      content: '课时费根据年级和科目不同而有差异。具体标准请在发布需求页面选择年级和科目后查看。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示联系信息
  showContactInfo() {
    const { customerHotline, workHours } = this.data.systemConfig;

    wx.showModal({
      title: '联系方式',
      content: `客服热线：${customerHotline}\n工作时间：${workHours}\n\n您也可以通过小程序内提交需求，我们会尽快与您联系。`,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '拨打电话',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: customerHotline
          });
        }
      }
    });
  },

  // 跳转到需求提交页面
  goToSubmit() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/demand/submit'
    });
  },

  // 跳转到需求列表页面
  goToList() {
    wx.switchTab({
      url: '/pages/demand/list'
    });
  }
});