const api = require('../../utils/api');
const { buildAssetUrl, flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

const typeLabels = {
  home: '家',
  room: '房间',
  cabinet: '柜子',
  box: '箱子',
  drawer: '抽屉',
};

Page({
  data: {
    query: '',
    filters: [
      { name: '全部' },
      { name: '客厅' },
      { name: '卧室' },
      { name: '搬家' },
      { name: '厨房' },
    ],
    boxCards: [],
    locations: [],
    recentItems: [],
    stats: {
      itemCount: 0,
      locationCount: 0,
    },
    nav: {},
  },

  onLoad() {
    this.setData({ nav: getApp().globalData.nav || {} });
  },

  onShow() {
    this.loadDashboard();
  },

  async loadDashboard() {
    const app = getApp();
    try {
      await app.ensureLogin();
      const [locationPayload, itemPayload] = await Promise.all([
        api.listLocations(),
        api.listItems(),
      ]);

      const tree = unwrapList(locationPayload, ['locations', 'data']);
      const flatLocations = flattenLocations(tree).map((location) =>
        Object.assign({}, location, {
          typeLabel: typeLabels[location.type] || '位置',
          initial: (location.name || '盒').slice(0, 1),
          coverUrl: buildAssetUrl(location.coverUrl || location.imageUrl || ''),
          updatedLabel: location.updatedLabel || '刚刚',
        }),
      );
      const boxCards = flatLocations.filter((location) => location.type === 'box');

      const items = unwrapList(itemPayload, ['items', 'data']).map(normalizeItem);

      this.setData({
        boxCards: (boxCards.length ? boxCards : flatLocations).slice(0, 8),
        locations: flatLocations.slice(0, 6),
        recentItems: items.slice(0, 6),
        stats: {
          itemCount: items.length,
          locationCount: flatLocations.length,
        },
      });
    } catch (error) {
      this.setData({ boxCards: [], locations: [], recentItems: [], stats: { itemCount: 0, locationCount: 0 } });
      wx.showToast({ title: '后端接口不可用', icon: 'none' });
    }
  },

  onQueryInput(event) {
    this.setData({ query: event.detail.value });
  },

  onSearchConfirm(event) {
    const q = event.detail.value || this.data.query;
    wx.navigateTo({ url: `/pages/search/index?q=${encodeURIComponent(q)}` });
  },

  goSearch() {
    wx.navigateTo({ url: `/pages/search/index?q=${encodeURIComponent(this.data.query)}` });
  },

  goNewItem() {
    wx.navigateTo({ url: '/pages/item-form/index?mode=box' });
  },

  goLocations() {
    wx.navigateTo({ url: '/pages/locations/index' });
  },

  goScan() {
    wx.navigateTo({ url: '/pages/scan/index' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/index' });
  },

  goLocationDetail(event) {
    const { id, name, path } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/location-detail/index?id=${id}&name=${encodeURIComponent(name)}&path=${encodeURIComponent(path)}`,
    });
  },

  goItemDetail(event) {
    wx.navigateTo({ url: `/pages/item-detail/index?id=${event.currentTarget.dataset.id}` });
  },
});
