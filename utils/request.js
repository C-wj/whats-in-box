const config = require('./config');

function buildUrl(path) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${config.apiBaseUrl}${path}`;
}

function getAuthHeader() {
  const token = wx.getStorageSync(config.tokenStorageKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function shouldSkipAuth(path) {
  return path === '/health' || path === '/auth/wechat-login';
}

function ensureAuth(path) {
  if (shouldSkipAuth(path) || wx.getStorageSync(config.tokenStorageKey)) {
    return Promise.resolve();
  }

  const app = getApp();
  if (app && typeof app.ensureLogin === 'function') {
    return app.ensureLogin();
  }
  return Promise.resolve();
}

function request(options) {
  if (config.useMock) {
    return Promise.reject({ mock: true, message: '示例数据模式已启用' });
  }

  return ensureAuth(options.url).then(() => {
    const method = options.method || 'GET';
    const header = Object.assign(
      { 'content-type': 'application/json' },
      getAuthHeader(),
      options.header || {},
    );

    return new Promise((resolve, reject) => {
      wx.request({
        url: buildUrl(options.url),
        method,
        data: options.data || {},
        header,
        timeout: config.requestTimeout,
        success(res) {
          if (res.statusCode === 401) {
            wx.removeStorageSync(config.tokenStorageKey);
            reject({ statusCode: 401, message: '登录已过期，请重新进入小程序' });
            return;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
            return;
          }

          reject({
            statusCode: res.statusCode,
            data: res.data,
            message: res.data && res.data.message ? res.data.message : '请求失败',
          });
        },
        fail(error) {
          reject(error);
        },
      });
    });
  });
}

function uploadImage(filePath, purpose) {
  if (config.useMock) {
    return Promise.reject({ mock: true, filePath, message: '示例数据模式已启用' });
  }

  return ensureAuth('/uploads/images').then(() => new Promise((resolve, reject) => {
    wx.uploadFile({
      url: buildUrl('/uploads/images'),
      filePath,
      name: 'file',
      formData: purpose ? { purpose } : {},
      header: getAuthHeader(),
      timeout: config.requestTimeout,
      success(res) {
        if (res.statusCode === 401) {
          wx.removeStorageSync(config.tokenStorageKey);
          reject({ statusCode: 401, message: '登录已过期，请重新进入小程序' });
          return;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject({ statusCode: res.statusCode, message: '图片上传失败' });
          return;
        }

        try {
          resolve(JSON.parse(res.data));
        } catch (error) {
          reject(error);
        }
      },
      fail(error) {
        reject(error);
      },
    });
  }));
}

module.exports = {
  request,
  uploadImage,
};
