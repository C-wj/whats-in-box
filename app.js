const api = require('./utils/api');
const config = require('./utils/config');

App({
  globalData: {
    apiBaseUrl: config.apiBaseUrl,
    loginPromise: null,
    nav: null,
  },

  onLaunch() {
    this.initNavigation();
    this.ensureLogin().catch(() => {
      wx.showToast({ title: '登录服务不可用', icon: 'none' });
    });
  },

  initNavigation() {
    let windowInfo = {};
    try {
      windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : {};
    } catch (error) {
      windowInfo = {};
    }

    const statusBarHeight = windowInfo.statusBarHeight || 44;
    const navBarHeight = 44;
    const rightSpace = 108;

    this.globalData.nav = {
      topbarStyle: `height:${statusBarHeight + navBarHeight}px;padding-top:${statusBarHeight}px;padding-right:${rightSpace}px;`,
      centerTopbarStyle: `height:${statusBarHeight + navBarHeight}px;padding-top:${statusBarHeight}px;padding-left:${rightSpace}px;padding-right:${rightSpace}px;`,
    };
  },

  ensureLogin() {
    if (config.useMock) {
      return Promise.resolve('mock-token');
    }

    const token = wx.getStorageSync(config.tokenStorageKey);
    if (token) {
      return Promise.resolve(token);
    }

    if (this.globalData.loginPromise) {
      return this.globalData.loginPromise;
    }

    this.globalData.loginPromise = new Promise((resolve, reject) => {
      wx.login({
        success: async ({ code }) => {
          try {
            const result = await api.wechatLogin(code);
            if (!result || !result.token) {
              throw new Error('登录接口未返回登录凭证');
            }
            const storedUser = wx.getStorageSync(config.userStorageKey) || {};
            wx.setStorageSync(config.tokenStorageKey, result.token);
            wx.setStorageSync(config.userStorageKey, Object.assign({}, storedUser, result.user || {}));
            resolve(result.token);
          } catch (error) {
            reject(error);
          } finally {
            this.globalData.loginPromise = null;
          }
        },
        fail: (error) => {
          this.globalData.loginPromise = null;
          reject(error);
        },
      });
    });

    return this.globalData.loginPromise;
  },

  logout() {
    wx.removeStorageSync(config.tokenStorageKey);
    wx.removeStorageSync(config.userStorageKey);
    this.globalData.loginPromise = null;
  },
});
