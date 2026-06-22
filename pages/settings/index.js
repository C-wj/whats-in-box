const api = require('../../utils/api');

Page({
  data: {
    serviceStatus: '未知',
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
    this.checkHealth(false);
    this.loadStats();
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
    wx.showToast({ title: '已清除', icon: 'success' });
  },

  goHome() {
    wx.redirectTo({ url: '/pages/home/index' });
  },

  goLocations() {
    wx.navigateTo({ url: '/pages/locations/index' });
  },

  goScan() {
    wx.navigateTo({ url: '/pages/scan/index' });
  },

  goNewItem() {
    wx.navigateTo({ url: '/pages/item-form/index' });
  },
});
