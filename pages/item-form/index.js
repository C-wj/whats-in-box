const api = require('../../utils/api');
const { buildAssetUrl, flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

function parseTags(value) {
  return (value || '')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

Page({
  data: {
    id: '',
    mode: 'item',
    isBoxMode: false,
    locations: [],
    locationNames: [],
    locationIndex: 0,
    selectedLocation: {},
    boxForm: {
      name: '',
      tagsText: '户外，装备',
      coverUrl: '',
      coverImageId: '',
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
      this.setData({ id: options.id });
      this.loadBox(options.id);
      return;
    }

    if (options.id) {
      this.setData({ id: options.id });
      await this.loadItem(options.id);
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
      this.setData({
        'boxForm.name': box.name || '',
        'boxForm.tagsText': (box.tags || []).join('，'),
        'boxForm.coverUrl': buildAssetUrl(box.coverUrl || ''),
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
          images: item.images || [],
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
            nextImages.push({
              id: uploaded.id,
              url: uploaded.url,
              tempFilePath: file.tempFilePath,
            });
            if (uploaded.id) {
              nextImageIds.push(uploaded.id);
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
            this.setData({
              'boxForm.coverUrl': buildAssetUrl(uploaded.url) || file.tempFilePath,
              'boxForm.coverImageId': uploaded.id || '',
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
    const name = this.data.boxForm.name.trim();
    if (!name) {
      wx.showToast({ title: '请填写盒子名称', icon: 'none' });
      return;
    }

    try {
      const payload = {
        name,
        type: 'box',
        parentId: this.data.selectedLocation.id || null,
        sortOrder: 0,
        tags: parseTags(this.data.boxForm.tagsText),
        coverImageId: this.data.boxForm.coverImageId || null,
      };
      if (this.data.id) {
        await api.updateLocation(this.data.id, payload);
      } else {
        await api.createLocation(payload);
      }
      wx.showToast({ title: this.data.id ? '已更新' : '已创建', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.showToast({ title: '保存盒子失败', icon: 'none' });
    }
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
