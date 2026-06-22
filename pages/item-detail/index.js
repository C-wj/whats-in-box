const api = require('../../utils/api');
const { flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

Page({
  data: {
    id: '',
    item: {
      name: '',
      quantity: 1,
      locationPath: '',
      tags: [],
    },
    locations: [],
    locationNames: [],
    locationIndex: 0,
    selectedLocation: {},
  },

  onLoad(options) {
    this.setData({ id: options.id });
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
      const locationIndex = Math.max(
        0,
        locations.findIndex((location) => Number(location.id) === Number(item.locationId)),
      );

      this.setData({
        item: Object.assign({}, item, {
          tagsText: (item.tags || []).join('，'),
        }),
        locations,
        locationNames: locations.map((location) => location.path || location.name),
        locationIndex,
        selectedLocation: locations[locationIndex] || {},
      });
    } catch (error) {
      wx.showToast({ title: '物品详情加载失败', icon: 'none' });
    }
  },

  onLocationChange(event) {
    const locationIndex = Number(event.detail.value);
    this.setData({
      locationIndex,
      selectedLocation: this.data.locations[locationIndex] || {},
    });
  },

  async moveItem() {
    if (!this.data.selectedLocation.id) {
      wx.showToast({ title: '请选择位置', icon: 'none' });
      return;
    }

    try {
      await api.moveItem(this.data.id, Number(this.data.selectedLocation.id));
      wx.showToast({ title: '已移动', icon: 'success' });
      this.loadDetail();
    } catch (error) {
      wx.showToast({ title: '移动失败', icon: 'none' });
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
