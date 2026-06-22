const api = require('../../utils/api');
const mock = require('../../utils/mock');
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

    const payload = await api.searchItems(keyword).catch(() => {
      return mock.items.filter((item) => {
        const haystack = [item.name, item.locationPath, item.note].concat(item.tags || []).join(' ');
        return haystack.indexOf(keyword) >= 0;
      });
    });

    this.setData({
      q: keyword,
      results: unwrapList(payload, ['items', 'results', 'data']).map(normalizeItem),
      searched: true,
    });
  },

  goItemDetail(event) {
    wx.navigateTo({ url: `/pages/item-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  goBack() {
    wx.navigateBack();
  },
});

