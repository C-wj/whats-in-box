const api = require('../../utils/api');
const config = require('../../utils/config');
const mock = require('../../utils/mock');
const { flattenLocations, normalizeItem, unwrapList } = require('../../utils/format');

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
    },
    boxContents: mock.items.filter((item) => Number(item.locationId) === 5).slice(0, 2),
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
    const payload = await api.listLocations().catch(() => mock.locations);
    const locations = flattenLocations(unwrapList(payload, ['locations', 'data']));
    const defaultId = defaultLocationId || (this.data.isBoxMode ? 5 : '');
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
  },

  loadBox(id) {
    const locations = flattenLocations(mock.locations);
    const box = locations.find((location) => Number(location.id) === Number(id));
    if (!box) {
      return;
    }

    this.setData({
      'boxForm.name': box.name || '',
      'boxForm.tagsText': (box.tags || []).join('，'),
      'boxForm.coverUrl': box.coverUrl || '',
    });
  },

  async loadItem(id) {
    const payload = await api.getItem(id).catch(() => {
      return mock.items.find((item) => Number(item.id) === Number(id)) || {};
    });
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
            nextImages.push({ tempFilePath: file.tempFilePath });
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
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (file && file.tempFilePath) {
          this.setData({ 'boxForm.coverUrl': file.tempFilePath });
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

    if (config.useMock) {
      wx.showToast({ title: '已创建示例盒子', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }

    try {
      await api.createLocation({
        name,
        type: 'box',
        parentId: this.data.selectedLocation.id || null,
        sortOrder: 0,
      });
      wx.showToast({ title: '已创建', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.showToast({ title: '创建接口未就绪', icon: 'none' });
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
      tags: form.tagsText
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      note: form.note.trim(),
      imageIds: form.imageIds,
    };

    if (config.useMock) {
      wx.showToast({ title: '已保存示例物品', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }

    try {
      if (this.data.id) {
        await api.updateItem(this.data.id, payload);
      } else {
        await api.createItem(payload);
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.showToast({ title: '接口未就绪，请稍后联调', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
