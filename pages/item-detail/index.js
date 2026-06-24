const api = require('../../utils/api');
const { flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

function isDifferentLocation(item, location) {
  return Boolean(location && location.id) && Number(location.id) !== Number(item.locationId);
}

Page({
  data: {
    id: '',
    item: {
      name: '',
      quantity: 1,
      locationPath: '',
      tags: [],
    },
    nav: {},
    heroOffsetStyle: '',
    locations: [],
    locationNames: [],
    locationIndex: 0,
    selectedLocation: {},
    canMove: false,
    isMoving: false,
  },

  onLoad(options) {
    const nav = getApp().globalData.nav || {};
    this.setData({
      id: options.id,
      nav,
      heroOffsetStyle: `margin-top:${nav.height || 88}px;`,
    });
  },

  onShow() {
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const [itemPayload, locationPayload] = await Promise.all([
        api.getItem(this.data.id),
        api.listLocations(),
      ]);

      const item = normalizeItem(itemPayload.item || itemPayload.data || itemPayload);
      const locations = flattenLocations(unwrapList(locationPayload, ['locations', 'data']));
      const currentLocationIndex = locations.findIndex((location) => Number(location.id) === Number(item.locationId));
      const locationIndex = currentLocationIndex >= 0 ? currentLocationIndex : 0;
      const selectedLocation = currentLocationIndex >= 0 ? locations[locationIndex] : {};

      this.setData({
        item: Object.assign({}, item, {
          tagsText: (item.tags || []).join('，'),
        }),
        locations,
        locationNames: locations.map((location) => location.path || location.name),
        locationIndex,
        selectedLocation,
        canMove: isDifferentLocation(item, selectedLocation),
      });
    } catch (error) {
      wx.showToast({ title: '物品详情加载失败', icon: 'none' });
    }
  },

  onLocationChange(event) {
    const locationIndex = Number(event.detail.value);
    const selectedLocation = this.data.locations[locationIndex] || {};
    this.setData({
      locationIndex,
      selectedLocation,
      canMove: isDifferentLocation(this.data.item, selectedLocation),
    });
  },

  async moveItem() {
    if (this.data.isMoving) {
      return;
    }

    if (!this.data.selectedLocation.id) {
      wx.showToast({ title: '请选择位置', icon: 'none' });
      return;
    }

    if (!this.data.canMove) {
      wx.showToast({ title: '请选择新的位置', icon: 'none' });
      return;
    }

    this.setData({ isMoving: true });
    wx.showLoading({ title: '移动中' });

    try {
      await api.moveItem(this.data.id, Number(this.data.selectedLocation.id));
      await this.loadDetail();
      wx.hideLoading();
      wx.showToast({ title: '已移动', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '移动失败', icon: 'none' });
    } finally {
      this.setData({ isMoving: false });
    }
  },

  editItem() {
    wx.navigateTo({ url: `/pages/item-form/index?id=${this.data.id}` });
  },

  deleteItem() {
    wx.showModal({
      title: '删除物品',
      content: '删除后默认列表和搜索不再展示，后端会执行软删除。',
      confirmText: '删除',
      confirmColor: '#ba1a1a',
      success: async (res) => {
        if (!res.confirm) {
          return;
        }
        try {
          await api.deleteItem(this.data.id);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 500);
        } catch (error) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      },
    });
  },

  goBack() {
    wx.navigateBack();
  },
});
