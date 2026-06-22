const api = require('../../utils/api');
const { buildAssetUrl, normalizeItem, unwrapList } = require('../../utils/format');

Page({
  data: {
    id: '',
    name: '',
    path: '',
    nav: {},
    box: {},
    items: [],
    children: [],
    logs: [],
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
    try {
      const payload = await api.getLocation(id);
      const current = payload.location || payload.data || payload;
      const items = unwrapList(payload, ['items']).map(normalizeItem);
      const children = unwrapList(payload, ['children']);
      const logs = unwrapList(payload, ['logs']).map((log) => ({
        id: log.id,
        date: log.createdAt ? log.createdAt.slice(0, 16).replace('T', ' ') : '刚刚',
        copy: formatLogCopy(log),
      }));

      this.setData({
        box: Object.assign(
          {
            name: this.data.name,
            path: this.data.path,
            tags: [],
            itemCount: items.length,
            heroUrl: '/assets/images/image-07.jpg',
            detailUpdatedLabel: '刚刚',
          },
          current,
          {
            coverUrl: buildAssetUrl(current.coverUrl || ''),
            heroUrl: buildAssetUrl(current.coverUrl || current.heroUrl || '/assets/images/image-07.jpg'),
          },
        ),
        children,
        items,
        logs,
      });
    } catch (error) {
      this.setData({ box: { name: this.data.name, path: this.data.path, tags: [] }, children: [], items: [], logs: [] });
      wx.showToast({ title: '盒子详情加载失败', icon: 'none' });
    }
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

function formatLogCopy(log) {
  const name = log.itemName ? `“${log.itemName}”` : '物品';
  switch (log.action) {
    case 'create':
      return `已添加${name}。`;
    case 'update':
      return `已更新${name}。`;
    case 'move':
      return `已移动${name}。`;
    case 'withdraw':
      return `已取出${name}${Math.abs(Number(log.quantityDelta) || 0)}件。`;
    case 'delete':
      return `已删除${name}。`;
    default:
      return `已操作${name}。`;
  }
}
