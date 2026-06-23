const config = require('./config');

const defaultProfile = {
  profileName: '我的收纳',
  profileMeta: '标准方案 · 自 2023 年起',
  avatarText: '箱',
  avatarUrl: '',
};

function normalizeAvatarText(value, fallbackName) {
  const text = (value || '').trim();
  if (text) {
    return text.slice(0, 2);
  }
  const name = (fallbackName || '').trim();
  return name ? name.slice(0, 1) : defaultProfile.avatarText;
}

function normalizeProfile(rawUser) {
  const user = rawUser || {};
  const profile = user.profile || user.data || user;
  const profileName = (profile.profileName || profile.nickname || profile.name || defaultProfile.profileName).trim();
  const profileMeta = (profile.profileMeta || defaultProfile.profileMeta).trim();

  return {
    profileName,
    profileMeta,
    avatarText: normalizeAvatarText(profile.avatarText, profileName),
    avatarUrl: profile.avatarUrl || '',
  };
}

function getStoredUser() {
  return wx.getStorageSync(config.userStorageKey) || {};
}

function getProfile() {
  return normalizeProfile(getStoredUser());
}

function isDefaultProfile(profile) {
  const normalized = normalizeProfile(profile);
  return normalized.profileName === defaultProfile.profileName
    && normalized.profileMeta === defaultProfile.profileMeta
    && normalized.avatarText === defaultProfile.avatarText
    && !normalized.avatarUrl;
}

function saveProfile(profile) {
  const user = getStoredUser();
  const nextProfile = normalizeProfile(profile);
  const nextUser = Object.assign({}, user, nextProfile);
  wx.setStorageSync(config.userStorageKey, nextUser);
  return nextProfile;
}

module.exports = {
  defaultProfile,
  getProfile,
  isDefaultProfile,
  normalizeAvatarText,
  normalizeProfile,
  saveProfile,
};
