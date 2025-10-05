// pages/demand/submit.js
const { userApi, demandApi, subjectApi, priceApi } = require('../../utils/api');

Page({
  data: {
    // 表单数据
    formData: {
      phone: '',
      locationAddress: '',
      gradeId: null,
      subjectId: null
    },

    // 选项数据
    grades: [],
    subjects: [],
    gradeIndex: null,
    subjectIndex: null,

    // 价格显示
    currentPrice: 0,
    showPrice: false,

    // 加载状态
    loading: false,
    submitting: false
  },

  onLoad() {
    console.log('需求提交页面加载');
    this.initData();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.initData();
  },

  // 初始化数据
  async initData() {
    this.setData({ loading: true });

    try {
      // 并发获取基础数据和用户信息
      const [grades, subjects, userInfo] = await Promise.all([
        priceApi.getGrades(),
        subjectApi.getAll(),
        userApi.getProfile().catch(() => null) // 获取用户信息，如果失败返回null
      ]);

      // 如果用户已经填写过手机号，自动填充到表单
      const phone = userInfo?.phone || '';

      this.setData({
        grades,
        subjects,
        'formData.phone': phone,
        loading: false
      });

      console.log('基础数据加载完成:', { grades, subjects, phone });
    } catch (error) {
      console.error('加载基础数据失败:', error);
      this.setData({ loading: false });

      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value
    });
  },

  // 地址输入
  onLocationInput(e) {
    this.setData({
      'formData.locationAddress': e.detail.value
    });
  },

  // 选择年级
  onGradeChange(e) {
    const index = e.detail.value;
    const gradeId = this.data.grades[index]?.id;

    if (gradeId === undefined) return;

    this.setData({
      'formData.gradeId': gradeId,
      gradeIndex: index // <-- 同时更新 gradeIndex
    });

    // 如果科目已选择，更新价格
    if (this.data.formData.subjectId) {
      this.updatePrice(gradeId, this.data.formData.subjectId);
    }
  },

  // 选择科目
  onSubjectChange(e) {
    const index = e.detail.value;
    const subjectId = this.data.subjects[index]?.id;

    if (subjectId === undefined) return;

    this.setData({
      'formData.subjectId': subjectId,
      subjectIndex: index // <-- 同时更新 subjectIndex
    });

    // 如果年级已选择，更新价格
    if (this.data.formData.gradeId) {
      this.updatePrice(this.data.formData.gradeId, subjectId);
    }
  },

  // 更新价格显示
  async updatePrice(gradeId, subjectId) {
    try {
      const result = await priceApi.getConfig(gradeId, subjectId);

      this.setData({
        currentPrice: result.hourlyPrice,
        showPrice: true
      });

      console.log('价格更新:', result.hourlyPrice);
    } catch (error) {
      console.error('获取价格失败:', error);
      this.setData({
        currentPrice: 0,
        showPrice: false
      });
    }
  },

  // 表单验证
  validateForm() {
    const { phone, locationAddress, gradeId, subjectId } = this.data.formData;

    // 验证手机号
    if (!phone.trim()) {
      wx.showToast({
        title: '请填写联系电话',
        icon: 'none'
      });
      return false;
    }

    // 简单的手机号格式验证
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone.trim())) {
      wx.showToast({
        title: '请填写正确的手机号',
        icon: 'none'
      });
      return false;
    }

    if (!locationAddress.trim()) {
      wx.showToast({
        title: '请填写家庭地址',
        icon: 'none'
      });
      return false;
    }

    if (!gradeId) {
      wx.showToast({
        title: '请选择年级',
        icon: 'none'
      });
      return false;
    }

    if (!subjectId) {
      wx.showToast({
        title: '请选择补习科目',
        icon: 'none'
      });
      return false;
    }

    if (this.data.currentPrice <= 0) {
      wx.showToast({
        title: '暂无此价格配置',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 提交需求
  async submitDemand() {
    if (!this.validateForm()) {
      return;
    }

    // 检查登录状态
    if (!getApp().globalData.token) {
      try {
        await getApp().login();
      } catch (error) {
        console.error('登录失败:', error);
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
        return;
      }
    }

    this.setData({ submitting: true });

    try {
      const { formData, currentPrice } = this.data;

      // 先更新用户手机号（如果用户修改了手机号）
      try {
        await userApi.updatePhone(formData.phone.trim());
      } catch (error) {
        console.warn('更新手机号失败:', error);
        // 即使更新手机号失败，也继续提交需求
      }

      // 提交需求
      await demandApi.submit({
        gradeId: formData.gradeId,
        subjectId: formData.subjectId,
        locationAddress: formData.locationAddress,
        hourlyPrice: currentPrice
      });

      // 清空表单
      this.setData({
        formData: {
          phone: formData.phone, // 保留手机号，方便下次提交
          locationAddress: '',
          gradeId: null,
          subjectId: null
        },
        gradeIndex: null,
        subjectIndex: null,
        currentPrice: 0,
        showPrice: false,
        submitting: false
      });

      // 显示成功提示
      wx.showModal({
        title: '提交成功',
        content: '我们的顾问老师会尽快与您联系！',
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          // 跳转到我的需求页面
          wx.switchTab({
            url: '/pages/demand/list'
          });
        }
      });

    } catch (error) {
      console.error('提交需求失败:', error);
      this.setData({ submitting: false });

      wx.showToast({
        title: error.message || '提交失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 重置表单
  resetForm() {
    this.setData({
      formData: {
        phone: '', // 重置时清空手机号
        locationAddress: '',
        gradeId: null,
        subjectId: null
      },
      gradeIndex: null,
      subjectIndex: null,
      currentPrice: 0,
      showPrice: false
    });
  }
});