const api = require('../../utils/api');
const config = require('../../utils/config');
const mock = require('../../utils/mock');
const { flattenLocations, unwrapList } = require('../../utils/format');

const filters = [
  { key: 'all', name: '全部' },
  { key: 'month', name: '本月新增' },
  { key: 'photo', name: '待补照片' },
];

function collectLabels(items, locations) {
  const labels = new Set();
  items.forEach((item) => (item.tags || []).forEach((tag) => labels.add(tag)));
  locations.forEach((location) => (location.tags || []).forEach((tag) => labels.add(tag)));
  return labels.size;
}

function buildDistribution(locations, useMockDistribution) {
  const mocked = mock.summary && mock.summary.locationDistribution;
  if ((useMockDistribution || !locations.length) && mocked) {
    return mocked;
  }

  const boxLocations = locations.filter((location) => location.type === 'box');
  const bucket = {};

  boxLocations.forEach((location) => {
    const source = location.path || location.name || '未分类';
    const name = source.split(/[ /·-]/).filter(Boolean)[0] || '未分类';
    bucket[name] = (bucket[name] || 0) + 1;
  });

  const entries = Object.keys(bucket)
    .map((name) => ({ name, count: bucket[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const maxCount = Math.max.apply(null, entries.map((entry) => entry.count).concat(1));

  return entries.map((entry, index) => ({
    name: entry.name,
    count: entry.count,
    percent: Math.max(10, Math.round((entry.count / maxCount) * 78)),
    isBlue: index === 2,
  }));
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
  },

  onShow() {
    this.setData({ navPaddingStyle: this.buildNavPaddingStyle() });
    this.loadStats();
  },

  buildNavPaddingStyle() {
    const nav = getApp().globalData.nav || {};
    const match = /padding-top:(\d+)px;/.exec(nav.topbarStyle || '');
    return match ? `padding-top:${Number(match[1]) + 12}px;` : '';
  },

  async loadStats() {
    const [locationPayload, itemPayload] = await Promise.all([
      api.listLocations().catch(() => mock.locations),
      api.listItems().catch(() => mock.items),
    ]);

    const locations = flattenLocations(unwrapList(locationPayload, ['locations', 'data']));
    const items = unwrapList(itemPayload, ['items', 'data']);
    const boxCount = locations.filter((location) => location.type === 'box').length;
    const missingPhotoCount = items.filter((item) => {
      const images = item.images || item.imageUrls || [];
      return !item.imageUrl && !item.coverUrl && !images.length;
    }).length;
    const summary = config.useMock && mock.summary ? mock.summary : {};

    this.setData({
      cards: [
        { label: '盒子', value: summary.boxCount || boxCount },
        { label: '物品', value: summary.itemCount || items.length },
        { label: '标签', value: summary.labelCount || collectLabels(items, locations) },
        { label: '待确认', value: summary.pendingCount || missingPhotoCount },
      ],
      distribution: buildDistribution(locations, config.useMock),
    });
  },

  onFilterTap(event) {
    this.setData({ activeFilter: event.currentTarget.dataset.key });
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
