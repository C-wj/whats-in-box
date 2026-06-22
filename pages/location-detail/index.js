const api = require('../../utils/api');
const mock = require('../../utils/mock');
const { flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

Page({
  data: {
    id: '',
    name: '',
    path: '',
    nav: {},
    box: {},
    items: [],
    children: [],
  },

  onLoad(options) {
    this.setData({
      id: options.id,
      name: decodeURIComponent(options.name || '位置详情'),
      path: decodeURIComponent(options.path || ''),
      nav: getApp().globalData.nav || {},
    });
    this.loadDetail();
  },

  async loadDetail() {
    const id = Number(this.data.id);
    const [locationPayload, itemPayload] = await Promise.all([
      api.listLocations().catch(() => mock.locations),
      api.listItems({ locationId: id }).catch(() => mock.items.filter((item) => Number(item.locationId) === id)),
    ]);

    const flatLocations = flattenLocations(unwrapList(locationPayload, ['locations', 'data']));
    const current = flatLocations.find((location) => Number(location.id) === id) || {};
    const children = flatLocations.filter((location) => Number(location.parentId) === id);
    const items = unwrapList(itemPayload, ['items', 'data']).map(normalizeItem);

    this.setData({
      box: Object.assign(
        {
          name: this.data.name,
          path: this.data.path,
          tags: [],
          itemCount: items.length,
          heroUrl: '/assets/images/image-07.jpg',
          detailUpdatedLabel: '2天前',
        },
        current,
      ),
      children,
      items,
    });
  },

  goNewItem() {
    wx.navigateTo({
      url: `/pages/item-form/index?locationId=${this.data.id}&locationPath=${encodeURIComponent(this.data.path)}`,
    });
  },

  goWithdraw() {
    if (!this.data.items.length) {
      wx.showToast({ title: '暂无可取出的物品', icon: 'none' });
      return;
    }

    const box = this.data.box || {};
    const name = box.detailTitle || box.name || this.data.name || '收纳盒';
    const path = box.detailLocation || box.path || this.data.path || '';
    wx.navigateTo({
      url: `/pages/withdraw/index?locationId=${this.data.id}&name=${encodeURIComponent(name)}&path=${encodeURIComponent(path)}`,
    });
  },

  editBox() {
    wx.navigateTo({ url: `/pages/item-form/index?mode=box&id=${this.data.id}` });
  },

  goChild(event) {
    const { id, name, path } = event.currentTarget.dataset;
    wx.redirectTo({
      url: `/pages/location-detail/index?id=${id}&name=${encodeURIComponent(name)}&path=${encodeURIComponent(path)}`,
    });
  },

  goItemDetail(event) {
    wx.navigateTo({ url: `/pages/item-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  goBack() {
    wx.navigateBack();
  },
});
