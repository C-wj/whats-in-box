const api = require('../../utils/api');
const { normalizeItem, unwrapList } = require('../../utils/format');

Page({
  data: {
    q: '',
    results: [],
    searched: false,
  },

  onLoad(options) {
    const q = decodeURIComponent(options.q || '');
    this.setData({ q });
  },

  onShow() {
    const q = this.data.q;
    if (q) {
      this.search(q);
    }
  },

  onInput(event) {
    this.setData({ q: event.detail.value });
  },

  onConfirm(event) {
    this.search(event.detail.value || this.data.q);
  },

  async search(q) {
    const keyword = (q || '').trim();
    if (!keyword) {
      this.setData({ results: [], searched: false });
      return;
    }

    try {
      const payload = await api.searchItems(keyword);
      this.setData({
        q: keyword,
        results: unwrapList(payload, ['items', 'results', 'data']).map(normalizeItem),
        searched: true,
      });
    } catch (error) {
      this.setData({ q: keyword, results: [], searched: true });
      wx.showToast({ title: '搜索接口不可用', icon: 'none' });
    }
  },

  goItemDetail(event) {
    wx.navigateTo({ url: `/pages/item-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  goBack() {
    wx.navigateBack();
  },
});
