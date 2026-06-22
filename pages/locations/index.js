const api = require('../../utils/api');

const filters = [
  { key: 'all', name: '全部' },
  { key: 'month', name: '本月新增' },
  { key: 'photo', name: '待补照片' },
];

Page({
  data: {
    activeFilter: 'all',
    filters,
    navPaddingStyle: '',
    cards: [
      { label: '盒子', value: 0 },
      { label: '物品', value: 0 },
      { label: '标签', value: 0 },
      { label: '待确认', value: 0 },
    ],
    distribution: [],
  },

  onShow() {
    this.setData({ navPaddingStyle: this.buildNavPaddingStyle() });
    this.loadStats();
  },

  buildNavPaddingStyle() {
    const nav = getApp().globalData.nav || {};
    const match = /padding-top:(\d+)px;/.exec(nav.topbarStyle || '');
    return match ? `padding-top:${Number(match[1]) + 12}px;` : '';
  },

  async loadStats() {
    try {
      const summary = await api.statsSummary();
      this.setData({
        cards: [
          { label: '盒子', value: summary.boxCount || 0 },
          { label: '物品', value: summary.itemCount || 0 },
          { label: '标签', value: summary.labelCount || 0 },
          { label: '待确认', value: summary.pendingCount || 0 },
        ],
        distribution: summary.locationDistribution || [],
      });
    } catch (error) {
      this.setData({
        cards: [
          { label: '盒子', value: 0 },
          { label: '物品', value: 0 },
          { label: '标签', value: 0 },
          { label: '待确认', value: 0 },
        ],
        distribution: [],
      });
      wx.showToast({ title: '统计接口不可用', icon: 'none' });
    }
  },

  onFilterTap(event) {
    this.setData({ activeFilter: event.currentTarget.dataset.key });
  },

  goHome() {
    wx.redirectTo({ url: '/pages/home/index' });
  },

  goScan() {
    wx.navigateTo({ url: '/pages/scan/index' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/index' });
  },
});
