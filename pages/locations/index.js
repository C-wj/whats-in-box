const api = require('../../utils/api');
const { flattenLocations, unwrapList } = require('../../utils/format');

const filters = [
  { key: 'all', name: '全部' },
  { key: 'month', name: '本月新增' },
  { key: 'photo', name: '待补照片' },
];

const typeLabels = {
  home: '家',
  room: '房间',
  cabinet: '柜子',
  drawer: '抽屉',
  box: '盒子',
};

function normalizeLocations(payload) {
  return flattenLocations(unwrapList(payload, ['locations', 'data'])).map((location) =>
    Object.assign({}, location, {
      parentId: location.parentId === undefined ? location.parent_id : location.parentId,
      typeLabel: typeLabels[location.type] || '位置',
      itemCount: location.itemCount || 0,
      tags: Array.isArray(location.tags) ? location.tags : [],
    }),
  );
}

function buildLocationTree(locations) {
  const byParent = {};
  locations.forEach((location) => {
    const key = location.parentId || 0;
    byParent[key] = byParent[key] || [];
    byParent[key].push(location);
  });

  Object.keys(byParent).forEach((key) => {
    byParent[key].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || Number(a.id) - Number(b.id));
  });

  const rows = [];
  const visit = (location, depth) => {
    const children = byParent[location.id] || [];
    rows.push(
      Object.assign({}, location, {
        depth,
        indent: Math.min(depth - 1, 3) * 32,
        childCount: children.length,
        canAddChild: depth < 4,
      }),
    );
    children.forEach((child) => visit(child, depth + 1));
  };

  (byParent[0] || []).forEach((location) => visit(location, 1));
  return rows;
}

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
    locations: [],
    locationRows: [],
    locationLoading: false,
  },

  onShow() {
    this.setData({ navPaddingStyle: this.buildNavPaddingStyle() });
    this.loadStats();
    this.loadLocations();
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

  async loadLocations() {
    this.setData({ locationLoading: true });
    try {
      let payload = await api.listLocations();
      let locations = normalizeLocations(payload);

      if (!locations.length) {
        await api.createLocation({
          name: '我的家',
          type: 'home',
          parentId: null,
          sortOrder: 0,
          tags: [],
        });
        payload = await api.listLocations();
        locations = normalizeLocations(payload);
      }

      this.setData({
        locations,
        locationRows: buildLocationTree(locations),
        locationLoading: false,
      });
    } catch (error) {
      this.setData({ locations: [], locationRows: [], locationLoading: false });
      wx.showToast({ title: '位置加载失败', icon: 'none' });
    }
  },

  onFilterTap(event) {
    this.setData({ activeFilter: event.currentTarget.dataset.key });
  },

  goAddRootLocation() {
    wx.navigateTo({ url: '/pages/location-form/index' });
  },

  goAddChildLocation(event) {
    const { id, depth } = event.currentTarget.dataset;
    if (Number(depth) >= 4) {
      wx.showToast({ title: '最多支持 4 层位置', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/location-form/index?parentId=${id}` });
  },

  goEditLocation(event) {
    wx.navigateTo({ url: `/pages/location-form/index?id=${event.currentTarget.dataset.id}` });
  },

  goLocationDetail(event) {
    const { id, name, path } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/location-detail/index?id=${id}&name=${encodeURIComponent(name || '')}&path=${encodeURIComponent(path || '')}`,
    });
  },

  deleteLocation(event) {
    const id = Number(event.currentTarget.dataset.id);
    const target = this.data.locationRows.find((location) => Number(location.id) === id);
    if (!target) {
      return;
    }
    if (target.childCount > 0 || target.itemCount > 0) {
      wx.showToast({ title: '请先移动物品或删除子位置', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '删除位置',
      content: `确认删除“${target.name}”？`,
      confirmText: '删除',
      confirmColor: '#ba1a1a',
      success: async (res) => {
        if (!res.confirm) {
          return;
        }
        try {
          await api.deleteLocation(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadLocations();
          this.loadStats();
        } catch (error) {
          wx.showToast({ title: '请先移动物品或删除子位置', icon: 'none' });
        }
      },
    });
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
