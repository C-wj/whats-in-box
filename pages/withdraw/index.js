const api = require('../../utils/api');
const { flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

function normalizeWithdrawItem(item) {
  const normalized = normalizeItem(item);
  return Object.assign({}, normalized, {
    quantity: Math.max(0, Number(normalized.quantity) || 0),
    selectedQuantity: 0,
  });
}

Page({
  data: {
    locationId: '',
    locationPath: '',
    nav: {},
    box: {},
    items: [],
    totalCount: 0,
    selectedTotal: 0,
    selectedKinds: 0,
  },

  onLoad(options) {
    this.setData({
      locationId: options.locationId || options.id || '',
      locationPath: decodeURIComponent(options.path || ''),
      nav: getApp().globalData.nav || {},
      box: {
        name: decodeURIComponent(options.name || '收纳盒'),
        path: decodeURIComponent(options.path || ''),
      },
    });
    this.loadWithdrawData();
  },

  async loadWithdrawData() {
    const locationId = Number(this.data.locationId);
    try {
      const [locationPayload, itemPayload] = await Promise.all([
        api.listLocations(),
        api.listItems({ locationId }),
      ]);

      const locations = flattenLocations(unwrapList(locationPayload, ['locations', 'data']));
      const current = locations.find((location) => Number(location.id) === locationId) || {};
      const items = unwrapList(itemPayload, ['items', 'data']).map(normalizeWithdrawItem);
      const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
      const box = Object.assign(
        {
          name: this.data.box.name,
          path: this.data.locationPath,
          itemCount: totalStock,
        },
        current,
      );

      this.setData({
        box,
        items,
        totalCount: box.detailItemCount || box.itemCount || totalStock,
      });
      this.updateSelectedSummary(items);
    } catch (error) {
      this.setData({ items: [], totalCount: 0, selectedTotal: 0, selectedKinds: 0 });
      wx.showToast({ title: '取出数据加载失败', icon: 'none' });
    }
  },

  toggleItem(event) {
    const index = Number(event.currentTarget.dataset.index);
    const items = this.data.items.slice();
    const item = items[index];
    if (!item) {
      return;
    }

    item.selectedQuantity = item.selectedQuantity > 0 ? 0 : Math.min(1, item.quantity);
    this.setData({ items });
    this.updateSelectedSummary(items);
  },

  increase(event) {
    const index = Number(event.currentTarget.dataset.index);
    const items = this.data.items.slice();
    const item = items[index];
    if (!item || item.quantity <= 0) {
      return;
    }

    item.selectedQuantity = Math.min(item.quantity, item.selectedQuantity + 1);
    this.setData({ items });
    this.updateSelectedSummary(items);
  },

  decrease(event) {
    const index = Number(event.currentTarget.dataset.index);
    const items = this.data.items.slice();
    const item = items[index];
    if (!item) {
      return;
    }

    item.selectedQuantity = Math.max(0, item.selectedQuantity - 1);
    this.setData({ items });
    this.updateSelectedSummary(items);
  },

  clearAll() {
    const items = this.data.items.map((item) => Object.assign({}, item, { selectedQuantity: 0 }));
    this.setData({ items });
    this.updateSelectedSummary(items);
  },

  updateSelectedSummary(items) {
    const selectedItems = (items || []).filter((item) => item.selectedQuantity > 0);
    this.setData({
      selectedKinds: selectedItems.length,
      selectedTotal: selectedItems.reduce((sum, item) => sum + item.selectedQuantity, 0),
    });
  },

  async confirmWithdraw() {
    const selectedItems = this.data.items.filter((item) => item.selectedQuantity > 0);
    if (!selectedItems.length) {
      wx.showToast({ title: '请选择要取出的物品', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '取出中' });
    try {
      await api.withdrawItems(
        Number(this.data.locationId),
        selectedItems.map((item) => ({ itemId: Number(item.id), quantity: Number(item.selectedQuantity) })),
      );
      wx.hideLoading();
      wx.showToast({ title: '已取出', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '取出失败', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  noop() {},
});
