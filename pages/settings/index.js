const api = require('../../utils/api');
const config = require('../../utils/config');
const {
  getProfile,
  isDefaultProfile,
  normalizeProfile,
  saveProfile,
} = require('../../utils/profile');

Page({
  data: {
    serviceStatus: '未知',
    isLoggedIn: false,
    profile: getProfile(),
    stats: {
      itemCount: 0,
      locationCount: 0,
      labelCount: 0,
    },
    nav: {},
  },

  onLoad() {
    this.setData({ nav: getApp().globalData.nav || {} });
  },

  onShow() {
    this.refreshLoginState();
    this.loadProfile();
    this.checkHealth(false);
    this.loadStats();
  },

  async loadProfile() {
    const localProfile = getProfile();
    this.setData({ profile: localProfile });
    try {
      const payload = await api.getProfile();
      const remoteProfile = normalizeProfile(payload.profile || payload.data || payload);
      const nextPayload = isDefaultProfile(remoteProfile) && !isDefaultProfile(localProfile)
        ? await api.updateProfile(localProfile)
        : { profile: remoteProfile };
      const profile = saveProfile(nextPayload.profile || nextPayload.data || nextPayload);
      this.setData({ profile });
    } catch (error) {
      // 保留本地缓存展示，避免资料接口短暂不可用时页面闪空。
    }
  },

  refreshLoginState() {
    this.setData({ isLoggedIn: !!wx.getStorageSync(config.tokenStorageKey) });
  },

  async loadStats() {
    try {
      const summary = await api.statsSummary();
      this.setData({
        stats: {
          itemCount: summary.itemCount || 0,
          locationCount: summary.boxCount || 0,
          labelCount: summary.labelCount || 0,
        },
      });
    } catch (error) {
      this.setData({ stats: { itemCount: 0, locationCount: 0, labelCount: 0 } });
    }
  },

  async checkHealth(showToast = true) {
    try {
      await api.health();
      this.setData({ serviceStatus: '正常' });
      if (showToast) {
        wx.showToast({ title: '服务正常', icon: 'success' });
      }
    } catch (error) {
      this.setData({ serviceStatus: '离线' });
      if (showToast) {
        wx.showToast({ title: '服务不可用', icon: 'none' });
      }
    }
  },

  async exportData() {
    try {
      const data = await api.exportData();
      wx.setClipboardData({
        data: JSON.stringify(data, null, 2),
        success: () => wx.showToast({ title: '已复制导出数据', icon: 'success' }),
      });
    } catch (error) {
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  logout() {
    getApp().logout();
    this.refreshLoginState();
    this.setData({ stats: { itemCount: 0, locationCount: 0, labelCount: 0 } });
    wx.showToast({ title: '已退出登录', icon: 'success' });
  },

  async login() {
    wx.showLoading({ title: '登录中' });
    try {
      await getApp().ensureLogin();
      wx.hideLoading();
      this.refreshLoginState();
      wx.showToast({ title: '登录成功', icon: 'success' });
      this.loadStats();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  goHome() {
    wx.redirectTo({ url: '/pages/home/index' });
  },

  goLocations() {
    wx.navigateTo({ url: '/pages/locations/index' });
  },

  goLabels() {
    wx.showToast({ title: '标签管理即将上线', icon: 'none' });
  },

  goProfileEdit() {
    wx.navigateTo({ url: '/pages/profile/index' });
  },

  goAbout() {
    wx.showModal({
      title: '关于我们',
      content: '箱里有什么 · 我的收纳方案\n助你高效管理每一个盒子',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#006d33',
    });
  },

  goScan() {
    wx.navigateTo({ url: '/pages/scan/index' });
  },

  goNewItem() {
    wx.navigateTo({ url: '/pages/item-form/index' });
  },
});
