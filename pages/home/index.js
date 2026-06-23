const api = require('../../utils/api');
const { buildAssetUrl, flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

const typeLabels = {
  home: '家',
  room: '房间',
  cabinet: '柜子',
  box: '箱子',
  drawer: '抽屉',
};

const defaultFilters = [{ type: 'all', label: '全部', locationId: null, key: 'all' }];

function normalizeHomeFilters(payload) {
  const filters = unwrapList(payload, ['filters', 'data'])
    .map((filter) => {
      const type = filter.type === 'room' ? 'room' : 'all';
      const locationId = filter.locationId === undefined ? filter.location_id : filter.locationId;
      return {
        type,
        label: filter.label || filter.name || (type === 'all' ? '全部' : '房间'),
        locationId: type === 'room' ? Number(locationId) || null : null,
        key: type === 'room' ? `room-${Number(locationId) || ''}` : 'all',
      };
    })
    .filter((filter) => filter.type === 'all' || filter.locationId);

  if (!filters.length || filters[0].type !== 'all') {
    return defaultFilters.concat(filters.filter((filter) => filter.type !== 'all'));
  }
  return filters;
}

function buildLocationMap(locations) {
  return (locations || []).reduce((acc, location) => {
    acc[Number(location.id)] = location;
    return acc;
  }, {});
}

function isInsideLocation(location, ancestorId, byId) {
  let current = location;
  while (current && current.parentId) {
    if (Number(current.parentId) === Number(ancestorId)) {
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
    filters: defaultFilters,
    allBoxCards: [],
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
        locations: flatLocations,
        recentItems: items.slice(0, 6),
        stats: {
          itemCount: items.length,
          locationCount: flatLocations.length,
        },
      });
      this.applyFilter(activeFilterKey);
    } catch (error) {
      this.setData({ allBoxCards: [], boxCards: [], locations: [], recentItems: [], stats: { itemCount: 0, locationCount: 0 } });
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
    const boxCards = !filter || filter.type === 'all'
      ? this.data.allBoxCards
      : this.data.allBoxCards.filter((location) => isInsideLocation(location, filter.locationId, byId));
    this.setData({
      activeFilterKey: filter ? filter.key : 'all',
      boxCards: boxCards.slice(0, 8),
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
