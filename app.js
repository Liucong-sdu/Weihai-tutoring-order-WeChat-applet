// app.js
App({
  onLaunch() {
    console.log('家教平台小程序启动');

    // 检查更新
    this.checkUpdate();

    // 初始化用户登录状态
    this.checkLoginStatus();

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },

  globalData: {
    userInfo: null,
    token: null,
    baseURL: 'http://localhost:3000/api', // 开发环境
    grades: [],
    subjects: []
  },

  // 检查小程序更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success(res) {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      // 验证token有效性
      this.validateToken(token);
    }
  },

  // 验证token
  validateToken(token) {
    wx.request({
      url: this.globalData.baseURL + '/users/profile',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        if (res.data.error) {
          // token失效，清除本地存储
          wx.removeStorageSync('token');
          this.globalData.token = null;
          this.globalData.userInfo = null;
        } else {
          this.globalData.userInfo = res.data;
        }
      },
      fail: () => {
        console.log('网络错误，token验证失败');
      }
    });
  },

  // 用户登录
  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: this.globalData.baseURL + '/auth/wechat-login',
              method: 'POST',
              data: { code: res.code },
              success: (loginRes) => {
                if (loginRes.data.success) {
                  const { token, user } = loginRes.data;

                  // 保存到全局和本地存储
                  this.globalData.token = token;
                  this.globalData.userInfo = user;
                  wx.setStorageSync('token', token);
                  wx.setStorageSync('userInfo', user);

                  resolve({ token, user });
                } else {
                  reject(new Error('登录失败'));
                }
              },
              fail: reject
            });
          } else {
            reject(new Error('获取微信登录码失败'));
          }
        },
        fail: reject
      });
    });
  }
})
