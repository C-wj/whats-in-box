const api = require('../../utils/api');
const {
  getProfile,
  isDefaultProfile,
  normalizeAvatarText,
  normalizeProfile,
  saveProfile: saveStoredProfile,
} = require('../../utils/profile');

Page({
  data: {
    form: {
      profileName: '',
      profileMeta: '',
      avatarText: '',
    },
  },

  async onLoad() {
    const localProfile = getProfile();
    this.setData({ form: localProfile });
    try {
      const payload = await api.getProfile();
      const remoteProfile = normalizeProfile(payload.profile || payload.data || payload);
      const nextPayload = isDefaultProfile(remoteProfile) && !isDefaultProfile(localProfile)
        ? await api.updateProfile(localProfile)
        : { profile: remoteProfile };
      const profile = saveStoredProfile(nextPayload.profile || nextPayload.data || nextPayload);
      this.setData({ form: profile });
    } catch (error) {
      // 资料接口失败时继续展示本地缓存。
    }
  },

  onNameInput(event) {
    const profileName = event.detail.value;
    const avatarText = this.data.form.avatarText || normalizeAvatarText('', profileName);
    this.setData({
      'form.profileName': profileName,
      'form.avatarText': normalizeAvatarText(avatarText, profileName),
    });
  },

  onMetaInput(event) {
    this.setData({ 'form.profileMeta': event.detail.value });
  },

  onAvatarInput(event) {
    this.setData({ 'form.avatarText': normalizeAvatarText(event.detail.value, this.data.form.profileName) });
  },

  async saveProfile() {
    const profileName = this.data.form.profileName.trim();
    const profileMeta = this.data.form.profileMeta.trim();

    if (!profileName) {
      wx.showToast({ title: '请填写展示名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中' });
    try {
      const payload = await api.updateProfile({
        profileName,
        profileMeta,
        avatarText: this.data.form.avatarText,
        avatarUrl: this.data.form.avatarUrl || '',
      });
      const profile = saveStoredProfile(payload.profile || payload.data || payload);
      this.setData({ form: profile });
      wx.hideLoading();
      wx.showToast({ title: '已同步', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '资料同步失败', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
