const { request, uploadImage } = require('./request');

function withQuery(path, query) {
  const params = Object.keys(query || {})
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&');

  return params ? `${path}?${params}` : path;
}

module.exports = {
  health() {
    return request({ url: '/health' });
  },

  wechatLogin(code) {
    return request({
      url: '/auth/wechat-login',
      method: 'POST',
      data: { code },
    });
  },

  listLocations() {
    return request({ url: '/locations' });
  },

  createLocation(data) {
    return request({ url: '/locations', method: 'POST', data });
  },

  updateLocation(id, data) {
    return request({ url: `/locations/${id}`, method: 'PATCH', data });
  },

  deleteLocation(id) {
    return request({ url: `/locations/${id}`, method: 'DELETE' });
  },

  listItems(query) {
    return request({ url: withQuery('/items', query || {}) });
  },

  createItem(data) {
    return request({ url: '/items', method: 'POST', data });
  },

  getItem(id) {
    return request({ url: `/items/${id}` });
  },

  updateItem(id, data) {
    return request({ url: `/items/${id}`, method: 'PATCH', data });
  },

  moveItem(id, toLocationId) {
    return request({
      url: `/items/${id}/move`,
      method: 'POST',
      data: { toLocationId },
    });
  },

  deleteItem(id) {
    return request({ url: `/items/${id}`, method: 'DELETE' });
  },

  searchItems(q) {
    return request({ url: withQuery('/search/items', { q }) });
  },

  uploadImage,

  exportData() {
    return request({ url: '/export' });
  },
};

