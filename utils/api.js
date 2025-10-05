// API请求工具
const app = getApp();

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const { method = 'GET', data = {}, header = {} } = options;

    // 显示加载提示
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    wx.request({
      url: app.globalData.baseURL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...app.globalData.token ? { 'Authorization': `Bearer ${app.globalData.token}` } : {},
        ...header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.error) {
            // token失效或权限问题
            if (res.statusCode === 401 || res.data.error.includes('认证')) {
              // 清除登录状态，跳转到登录页
              wx.removeStorageSync('token');
              app.globalData.token = null;
              app.globalData.userInfo = null;

              wx.showModal({
                title: '提示',
                content: '登录状态已过期，请重新授权',
                showCancel: false,
                success: () => {
                  // 触发重新登录
                  app.login().then(() => {
                    // 重新发起请求
                    request(url, options).then(resolve).catch(reject);
                  }).catch(reject);
                }
              });
            } else {
              reject(new Error(res.data.error));
            }
          } else {
            resolve(res.data);
          }
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);

        // 网络错误提示
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });

        reject(err);
      },
      complete: () => {
        // 隐藏加载提示
        wx.hideLoading();
      }
    });
  });
};

// 不显示加载的请求
const requestSilent = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const { method = 'GET', data = {}, header = {} } = options;

    wx.request({
      url: app.globalData.baseURL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...app.globalData.token ? { 'Authorization': `Bearer ${app.globalData.token}` } : {},
        ...header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: reject
    });
  });
};

// 模块化API方法
export const userApi = {
  // 微信登录
  wechatLogin: (code) => request('/auth/wechat-login', {
    method: 'POST',
    data: { code }
  }),

  // 获取用户信息
  getProfile: () => request('/users/profile'),

  // 更新用户信息
  updateProfile: (data) => request('/users/profile', {
    method: 'PUT',
    data
  }),

  // 绑定手机号
  updatePhone: (phone) => request('/users/phone', {
    method: 'PUT',
    data: { phone }
  })
};

export const demandApi = {
  // 提交需求
  submit: (data) => request('/demands', {
    method: 'POST',
    data
  }),

  // 获取我的需求列表
  getMyList: (params = {}) => {
    const query = Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
    const url = query ? `/demands/my?${query}` : '/demands/my';
    return request(url);
  },

  // 获取需求详情
  getDetail: (id) => request(`/demands/${id}`)
};

export const subjectApi = {
  // 获取科目列表
  getAll: () => requestSilent('/subjects')
};

export const priceApi = {
  // 获取年级列表
  getGrades: () => requestSilent('/price/grades'),

  // 获取价格配置
  getConfig: (gradeId, subjectId) => requestSilent(`/price/config/${gradeId}/${subjectId}`)
};

export default {
  request,
  requestSilent,
  userApi,
  demandApi,
  subjectApi,
  priceApi
};