// pages/demand/list.js
const { demandApi } = require('../../utils/api');

Page({
  data: {
    // 需求列表
    demands: [],

    // 分页信息
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },

    // 加载状态
    loading: true,
    refreshing: false,
    loadingMore: false,
    hasMore: true
  },

  onLoad() {
    console.log('需求列表页面加载');
    this.loadDemands();
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (!this.data.loading) {
      this.refreshData();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMoreDemands();
    }
  },

  // 加载需求列表
  async loadDemands() {
    this.setData({ loading: true });

    try {
      const result = await demandApi.getMyList({
        page: 1,
        limit: 10
      });

      this.setData({
        demands: result.demands || [],
        pagination: result.pagination || {},
        loading: false,
        hasMore: result.pagination ? result.pagination.page < result.pagination.totalPages : false
      });

      console.log('需求列表加载完成:', result);
    } catch (error) {
      console.error('加载需求列表失败:', error);
      this.setData({ loading: false });

      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 刷新数据
  async refreshData() {
    this.setData({ refreshing: true });

    try {
      const result = await demandApi.getMyList({
        page: 1,
        limit: 10
      });

      this.setData({
        demands: result.demands || [],
        pagination: result.pagination || {},
        refreshing: false,
        hasMore: result.pagination ? result.pagination.page < result.pagination.totalPages : false
      });

      // 停止下拉刷新
      wx.stopPullDownRefresh();

      console.log('刷新完成:', result);
    } catch (error) {
      console.error('刷新失败:', error);
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();

      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    }
  },

  // 加载更多
  async loadMoreDemands() {
    const nextPage = this.data.pagination.page + 1;
    this.setData({ loadingMore: true });

    try {
      const result = await demandApi.getMyList({
        page: nextPage,
        limit: 10
      });

      const newDemands = result.demands || [];
      const allDemands = [...this.data.demands, ...newDemands];

      this.setData({
        demands: allDemands,
        pagination: result.pagination || {},
        loadingMore: false,
        hasMore: result.pagination ? result.pagination.page < result.pagination.totalPages : false
      });

      console.log('加载更多完成:', result);
    } catch (error) {
      console.error('加载更多失败:', error);
      this.setData({ loadingMore: false });

      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 获取状态显示文本
  getStatusText(status) {
    const statusMap = {
      'PENDING': '待处理',
      'FOLLOWING_UP': '跟进中',
      'MATCHED': '已匹配',
      'CLOSED': '已关闭'
    };
    return statusMap[status] || status;
  },

  // 获取状态样式类
  getStatusClass(status) {
    const classMap = {
      'PENDING': 'status-pending',
      'FOLLOWING_UP': 'status-following',
      'MATCHED': 'status-matched',
      'CLOSED': 'status-closed'
    };
    return classMap[status] || 'status-default';
  },

  // 格式化时间
  formatTime(time) {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 跳转到需求详情
  viewDemandDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/demand/detail?id=${id}`
    });
  },

  // 跳转到发布需求页面
  goToSubmit() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});