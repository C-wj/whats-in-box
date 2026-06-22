const api = require('../../utils/api');
const config = require('../../utils/config');
const mock = require('../../utils/mock');
const { flattenLocations, unwrapList } = require('../../utils/format');

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
    if (config.useMock && mock.summary) {
      this.setData({ stats: mock.summary });
      return;
    }

    const [locationPayload, itemPayload] = await Promise.all([
      api.listLocations().catch(() => mock.locations),
      api.listItems().catch(() => mock.items),
    ]);
    const locations = flattenLocations(unwrapList(locationPayload, ['locations', 'data']));
    const items = unwrapList(itemPayload, ['items', 'data']);
    const labels = new Set();
    items.forEach((item) => (item.tags || []).forEach((tag) => labels.add(tag)));
    this.setData({
      stats: {
        itemCount: items.length,
        locationCount: locations.length,
        labelCount: labels.size,
      },
    });
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
      wx.showToast({ title: '导出接口未就绪', icon: 'none' });
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
