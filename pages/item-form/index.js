const api = require('../../utils/api');
const { buildAssetUrl, flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

function parseTags(value) {
  return (value || '')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function unwrapUpload(uploaded) {
  return (uploaded && (uploaded.image || uploaded.upload || uploaded.data)) || uploaded || {};
}

function normalizeFormImage(image, fallbackPath, index) {
  const upload = unwrapUpload(image);
  const rawUrl = upload.url || upload.filePath || upload.file_path || fallbackPath || '';
  const url = buildAssetUrl(rawUrl) || fallbackPath || '';
  const id = upload.id || upload.uploadId || upload.uploadID || '';

  return Object.assign({}, upload, {
    id,
    url,
    filePath: upload.filePath || upload.file_path || rawUrl,
    tempFilePath: upload.tempFilePath || fallbackPath || '',
    key: id ? `image-${id}` : `image-${index}-${url || fallbackPath || Date.now()}`,
  });
}

Page({
  data: {
    id: '',
    mode: 'item',
    isBoxMode: false,
    refreshBoxOnShow: false,
    locations: [],
    locationNames: [],
    locationIndex: 0,
    selectedLocation: {},
    boxForm: {
      name: '',
      tagsText: '户外，装备',
      coverUrl: '',
      coverImageId: '',
      parentId: '',
    },
    boxContents: [],
    form: {
      name: '',
      quantity: 1,
      locationId: '',
      tagsText: '',
      note: '',
      imageIds: [],
      images: [],
    },
  },

  async onLoad(options) {
    const mode = options.mode === 'box' ? 'box' : 'item';
    this.setData({
      mode,
      isBoxMode: mode === 'box',
    });

    await this.loadLocations(options.locationId);

    if (mode === 'box') {
      this.setData({ id: options.id || '' });
      await this.loadBox(options.id);
      return;
    }

    if (options.id) {
      this.setData({ id: options.id });
      await this.loadItem(options.id);
    }
  },

  onShow() {
    if (this.data.isBoxMode && this.data.id && this.data.refreshBoxOnShow) {
      this.setData({ refreshBoxOnShow: false });
      this.loadBox(this.data.id);
    }
  },

  async loadLocations(defaultLocationId) {
    try {
      const payload = await api.listLocations();
      const locations = flattenLocations(unwrapList(payload, ['locations', 'data']));
      const defaultId = defaultLocationId || '';
      const locationIndex = Math.max(
        0,
        locations.findIndex((location) => Number(location.id) === Number(defaultId)),
      );
      const selectedLocation = locations[locationIndex] || {};

      this.setData({
        locations,
        locationNames: locations.map((location) => location.path || location.name),
        locationIndex,
        selectedLocation,
        'form.locationId': selectedLocation.id || '',
      });
    } catch (error) {
      this.setData({ locations: [], locationNames: [], locationIndex: 0, selectedLocation: {} });
      wx.showToast({ title: '位置加载失败', icon: 'none' });
    }
  },

  async loadBox(id) {
    if (!id) {
      return;
    }

    try {
      const payload = await api.getLocation(id);
      const box = payload.location || payload.data || payload;
      const boxContents = unwrapList(payload, ['items']).map(normalizeItem);
      const parentIndex = this.data.locations.findIndex((location) => Number(location.id) === Number(box.parentId));
      const selectedLocation = parentIndex >= 0 ? this.data.locations[parentIndex] : {};
      this.setData({
        'boxForm.name': box.name || '',
        'boxForm.tagsText': (box.tags || []).join('，'),
        'boxForm.coverUrl': buildAssetUrl(box.coverUrl || ''),
        'boxForm.parentId': box.parentId || '',
        locationIndex: parentIndex >= 0 ? parentIndex : 0,
        selectedLocation,
        boxContents,
      });
    } catch (error) {
      wx.showToast({ title: '盒子加载失败', icon: 'none' });
    }
  },

  async loadItem(id) {
    try {
      const payload = await api.getItem(id);
      const item = normalizeItem(payload.item || payload.data || payload);
      const locationIndex = Math.max(
        0,
        this.data.locations.findIndex((location) => Number(location.id) === Number(item.locationId)),
      );

      this.setData({
        locationIndex,
        selectedLocation: this.data.locations[locationIndex] || {},
        form: {
          name: item.name || '',
          quantity: item.quantity || 1,
          locationId: item.locationId || '',
          tagsText: (item.tags || []).join('，'),
          note: item.note || '',
          imageIds: (item.images || []).map((image) => image.id).filter(Boolean),
          images: (item.images || []).map((image, index) => normalizeFormImage(image, '', index)),
        },
      });
    } catch (error) {
      wx.showToast({ title: '物品加载失败', icon: 'none' });
    }
  },

  onNameInput(event) {
    this.setData({ 'form.name': event.detail.value });
  },

  onQuantityInput(event) {
    this.setData({ 'form.quantity': Number(event.detail.value) || 1 });
  },

  onTagsInput(event) {
    this.setData({ 'form.tagsText': event.detail.value });
  },

  onBoxNameInput(event) {
    this.setData({ 'boxForm.name': event.detail.value });
  },

  onBoxTagsInput(event) {
    this.setData({ 'boxForm.tagsText': event.detail.value });
  },

  onNoteInput(event) {
    this.setData({ 'form.note': event.detail.value });
  },

  onLocationChange(event) {
    const locationIndex = Number(event.detail.value);
    const selectedLocation = this.data.locations[locationIndex] || {};
    this.setData({
      locationIndex,
      selectedLocation,
      'form.locationId': selectedLocation.id || '',
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.form.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: async (res) => {
        wx.showLoading({ title: '上传中' });
        const nextImages = this.data.form.images.slice();
        const nextImageIds = this.data.form.imageIds.slice();

        for (let i = 0; i < res.tempFiles.length; i += 1) {
          const file = res.tempFiles[i];
          try {
            const uploaded = await api.uploadImage(file.tempFilePath);
            const image = normalizeFormImage(uploaded, file.tempFilePath, nextImages.length);
            nextImages.push(image);
            if (image.id) {
              nextImageIds.push(image.id);
            }
          } catch (error) {
            wx.showToast({ title: '图片上传失败', icon: 'none' });
          }
        }

        wx.hideLoading();
        this.setData({
          'form.images': nextImages.slice(0, 3),
          'form.imageIds': nextImageIds.slice(0, 3),
        });
      },
    });
  },

  removeImage(event) {
    const index = Number(event.currentTarget.dataset.index);
    const images = this.data.form.images.slice();
    const imageIds = this.data.form.imageIds.slice();
    images.splice(index, 1);
    imageIds.splice(index, 1);
    this.setData({
      'form.images': images,
      'form.imageIds': imageIds,
    });
  },

  chooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: async (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (file && file.tempFilePath) {
          wx.showLoading({ title: '上传中' });
          try {
            const uploaded = await api.uploadImage(file.tempFilePath, 'location_cover');
            const image = normalizeFormImage(uploaded, file.tempFilePath, 0);
            this.setData({
              'boxForm.coverUrl': image.url || file.tempFilePath,
              'boxForm.coverImageId': image.id || '',
            });
          } catch (error) {
            wx.showToast({ title: '封面上传失败', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      },
    });
  },

  async saveBox() {
    const isNew = !this.data.id;
    try {
      await this.persistBox();
      wx.showToast({ title: isNew ? '已创建' : '已更新', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      if (!error || !error.silent) {
        wx.showToast({ title: '保存盒子失败', icon: 'none' });
      }
    }
  },

  async addBoxItem() {
    if (!this.data.boxForm.name.trim()) {
      wx.showToast({ title: '请填写盒子名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: this.data.id ? '保存中' : '创建盒子' });
    try {
      const location = await this.persistBox();
      const locationId = location.id || this.data.id;
      const locationPath = location.path || this.data.selectedLocation.path || location.name || this.data.boxForm.name;
      this.setData({ refreshBoxOnShow: true });
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/item-form/index?locationId=${locationId}&locationPath=${encodeURIComponent(locationPath || '')}`,
      });
    } catch (error) {
      wx.hideLoading();
      if (!error || !error.silent) {
        wx.showToast({ title: '请先保存盒子', icon: 'none' });
      }
    }
  },

  async persistBox() {
    const name = this.data.boxForm.name.trim();
    if (!name) {
      wx.showToast({ title: '请填写盒子名称', icon: 'none' });
      throw { silent: true };
    }

    const payload = {
      name,
      type: 'box',
      parentId: this.data.selectedLocation.id || null,
      sortOrder: 0,
      tags: parseTags(this.data.boxForm.tagsText),
      coverImageId: this.data.boxForm.coverImageId || null,
    };

    const response = this.data.id
      ? await api.updateLocation(this.data.id, payload)
      : await api.createLocation(payload);
    const location = response.location || response.data || response;

    this.setData({
      id: location.id || this.data.id,
      'boxForm.name': location.name || name,
      'boxForm.tagsText': (location.tags || payload.tags).join('，'),
      'boxForm.coverUrl': buildAssetUrl(location.coverUrl || this.data.boxForm.coverUrl || ''),
      'boxForm.parentId': location.parentId || payload.parentId || '',
    });

    return location;
  },

  async saveItem() {
    const form = this.data.form;
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写名称', icon: 'none' });
      return;
    }

    if (!form.locationId) {
      wx.showToast({ title: '请选择位置', icon: 'none' });
      return;
    }

    const payload = {
      name: form.name.trim(),
      quantity: Math.max(1, Number(form.quantity) || 1),
      locationId: Number(form.locationId),
      tags: parseTags(form.tagsText),
      note: form.note.trim(),
      imageIds: form.imageIds,
    };

    try {
      if (this.data.id) {
        await api.updateItem(this.data.id, payload);
      } else {
        await api.createItem(payload);
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.showToast({ title: '保存物品失败', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
