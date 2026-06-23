const api = require('../../utils/api');
const { buildAssetUrl, flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

const typeLabels = {
  home: '家',
  room: '房间',
  cabinet: '柜子',
  box: '箱子',
  drawer: '抽屉',
};

const fixedFilters = [
  { type: 'all', label: '全部', locationId: null, key: 'all' },
  { type: 'recent', label: '最近添加', locationId: null, key: 'recent' },
];

function normalizeHomeFilters(payload) {
  const roomFilters = unwrapList(payload, ['filters', 'data'])
    .map((filter) => {
      const type = filter.type === 'room' ? 'room' : '';
      const locationId = filter.locationId === undefined ? filter.location_id : filter.locationId;
      return {
        type,
        label: filter.label || filter.name || '房间',
        locationId: type === 'room' ? Number(locationId) || null : null,
        key: `room-${Number(locationId) || ''}`,
      };
    })
    .filter((filter) => filter.type === 'room' && filter.locationId);

  return fixedFilters.concat(roomFilters);
}

function buildLocationMap(locations) {
  return (locations || []).reduce((acc, location) => {
    acc[Number(location.id)] = location;
    return acc;
  }, {});
}

function isInsideLocation(location, ancestorId, byId) {
  let current = location;
  while (current) {
    if (Number(current.id) === Number(ancestorId)) {
      return true;
    }
    current = byId[Number(current.parentId)];
  }
  return false;
}

Page({
  data: {
    query: '',
    activeFilterKey: 'all',
    filters: fixedFilters,
    allBoxCards: [],
    boxCards: [],
    allRecentItems: [],
    isRecentMode: false,
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
      const [locationPayload, itemPayload, filterPayload] = await Promise.all([
        api.listLocations(),
        api.listItems(),
        api.homeFilters(),
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
      const allBoxCards = boxCards;

      const items = unwrapList(itemPayload, ['items', 'data']).map(normalizeItem);
      const filters = normalizeHomeFilters(filterPayload);
      const activeFilterKey = filters.some((filter) => filter.key === this.data.activeFilterKey) ? this.data.activeFilterKey : 'all';

      this.setData({
        filters,
        activeFilterKey,
        allBoxCards,
        allRecentItems: items,
        locations: flatLocations,
        stats: {
          itemCount: items.length,
          locationCount: flatLocations.length,
        },
      });
      this.applyFilter(activeFilterKey);
    } catch (error) {
      this.setData({ allBoxCards: [], boxCards: [], allRecentItems: [], locations: [], recentItems: [], stats: { itemCount: 0, locationCount: 0 } });
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

  onFilterTap(event) {
    this.applyFilter(event.currentTarget.dataset.key);
  },

  applyFilter(filterKey) {
    const activeFilterKey = filterKey || 'all';
    const filter = this.data.filters.find((item) => item.key === activeFilterKey) || this.data.filters[0];
    const byId = buildLocationMap(this.data.locations);
    const isRecentMode = filter && filter.type === 'recent';
    const isAll = !filter || filter.type === 'all';
    let boxCards = [];
    let recentItems = [];

    if (isRecentMode) {
      recentItems = this.data.allRecentItems;
    } else if (isAll) {
      boxCards = this.data.allBoxCards;
    } else {
      boxCards = this.data.allBoxCards.filter((location) => isInsideLocation(location, filter.locationId, byId));
    }

    this.setData({
      activeFilterKey: filter ? filter.key : 'all',
      boxCards: boxCards.slice(0, 8),
      isRecentMode,
      recentItems: recentItems.slice(0, 6),
    });
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
