Page({
  data: {
    flashOn: false,
    nav: {},
  },

  onLoad() {
    this.setData({ nav: getApp().globalData.nav || {} });
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

  toggleFlash() {
    this.setData({ flashOn: !this.data.flashOn });
  },

  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: () => {
        wx.showToast({ title: '已选择图片', icon: 'success' });
      },
    });
  },
});
