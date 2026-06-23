const api = require('../../utils/api');

Page({
  data: {
    scanning: false,
    nav: {},
  },

  onLoad() {
    this.setData({ nav: getApp().globalData.nav || {} });
  },

  onReady() {
    this.startScan();
  },

  goHome() {
    wx.redirectTo({ url: '/pages/home/index' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/index' });
  },

  goLocations() {
    wx.navigateTo({ url: '/pages/locations/index' });
  },

  goManual() {
    wx.navigateTo({ url: '/pages/item-form/index' });
  },

  startScan() {
    this.openScanner(true);
  },

  openScanner(onlyFromCamera) {
    if (this.data.scanning) {
      return;
    }

    this.setData({ scanning: true });
    wx.scanCode({
      onlyFromCamera,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        this.handleScanResult(res.result);
      },
      fail: (error) => {
        const message = error && error.errMsg ? error.errMsg : '';
        if (message.indexOf('cancel') === -1) {
          wx.showToast({ title: '无法打开相机', icon: 'none' });
        }
      },
      complete: () => {
        this.setData({ scanning: false });
      },
    });
  },

  async handleScanResult(code) {
    const value = (code || '').trim();
    if (!value) {
      wx.showToast({ title: '未识别到内容', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '识别中' });
    try {
      const resolved = await api.resolveScanCode(value);
      wx.hideLoading();
      if (resolved && resolved.target) {
        wx.navigateTo({ url: resolved.target });
        return;
      }
      this.showUnsupportedCode(value);
    } catch (error) {
      wx.hideLoading();
      this.showUnsupportedCode(value);
    }
  },

  showUnsupportedCode(code) {
    wx.showModal({
      title: '未识别到盒子或物品',
      content: '当前只支持扫描本系统生成的盒子或物品二维码。',
      cancelText: '去搜索',
      confirmText: '手动新增',
      success: (res) => {
        if (res.confirm) {
          this.goManual();
          return;
        }
        if (res.cancel) {
          wx.navigateTo({ url: `/pages/search/index?q=${encodeURIComponent(code || '')}` });
        }
      },
    });
  },

  chooseFromAlbum() {
    this.openScanner(false);
  },
});
