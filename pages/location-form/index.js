const api = require('../../utils/api');
const { buildAssetUrl, flattenLocations, unwrapList } = require('../../utils/format');

const MAX_DEPTH = 4;

const typeOptions = [
  { value: 'home', label: '家' },
  { value: 'room', label: '房间' },
  { value: 'cabinet', label: '柜子' },
  { value: 'drawer', label: '抽屉' },
  { value: 'box', label: '盒子' },
];

function parseTags(value) {
  return (value || '')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function unwrapUpload(uploaded) {
  return (uploaded && (uploaded.image || uploaded.upload || uploaded.data)) || uploaded || {};
}

function normalizeUpload(uploaded, fallbackPath) {
  const upload = unwrapUpload(uploaded);
  const rawUrl = upload.url || upload.filePath || upload.file_path || fallbackPath || '';
  return {
    id: upload.id || upload.uploadId || upload.uploadID || '',
    url: buildAssetUrl(rawUrl) || fallbackPath || '',
  };
}

function normalizeLocations(payload) {
  return flattenLocations(unwrapList(payload, ['locations', 'data'])).map((location) =>
    Object.assign({}, location, {
      parentId: location.parentId === undefined ? location.parent_id : location.parentId,
      tags: Array.isArray(location.tags) ? location.tags : [],
    }),
  );
}

function buildChildrenMap(locations) {
  return locations.reduce((acc, location) => {
    const key = location.parentId || 0;
    acc[key] = acc[key] || [];
    acc[key].push(location);
    return acc;
  }, {});
}

function getDepth(location, byId, seen) {
  if (!location) {
    return 0;
  }
  if (!location.parentId) {
    return 1;
  }
  if (seen[location.id]) {
    return 1;
  }
  seen[location.id] = true;
  return getDepth(byId[location.parentId], byId, seen) + 1;
}

function collectDescendantIds(childrenMap, id, result) {
  (childrenMap[id] || []).forEach((child) => {
    result[child.id] = true;
    collectDescendantIds(childrenMap, child.id, result);
  });
  return result;
}

function getSubtreeHeight(childrenMap, id) {
  const children = childrenMap[id] || [];
  if (!children.length) {
    return 1;
  }
  return 1 + Math.max.apply(null, children.map((child) => getSubtreeHeight(childrenMap, child.id)));
}

function inferChildType(parent) {
  if (!parent || parent.type === 'home') {
    return 'room';
  }
  if (parent.type === 'room') {
    return 'cabinet';
  }
  return 'box';
}

Page({
  data: {
    id: '',
    isEdit: false,
    locations: [],
    typeOptions,
    typeNames: typeOptions.map((option) => option.label),
    typeIndex: 1,
    parentOptions: [{ id: '', label: '不设置父级位置', depth: 0 }],
    parentNames: ['不设置父级位置'],
    parentIndex: 0,
    form: {
      name: '',
      type: 'room',
      parentId: '',
      tagsText: '',
      coverUrl: '',
      coverImageId: '',
    },
  },

  async onLoad(options) {
    const id = options.id || '';
    this.setData({ id, isEdit: !!id });
    await this.loadLocations();

    if (id) {
      await this.loadLocation(id);
      return;
    }

    const parentId = options.parentId || '';
    const parent = this.data.locations.find((location) => Number(location.id) === Number(parentId));
    const type = inferChildType(parent);
    this.setData({
      'form.parentId': parentId,
      'form.type': type,
      typeIndex: this.findTypeIndex(type),
    });
    this.refreshParentOptions(parentId);
  },

  async loadLocations() {
    try {
      const payload = await api.listLocations();
      const locations = normalizeLocations(payload);
      this.setData({ locations });
      this.refreshParentOptions(this.data.form.parentId);
    } catch (error) {
      this.setData({ locations: [] });
      wx.showToast({ title: '位置加载失败', icon: 'none' });
    }
  },

  async loadLocation(id) {
    try {
      const payload = await api.getLocation(id);
      const location = payload.location || payload.data || payload;
      const type = location.type || 'room';
      this.setData({
        'form.name': location.name || '',
        'form.type': type,
        'form.parentId': location.parentId || '',
        'form.tagsText': (location.tags || []).join('，'),
        'form.coverUrl': buildAssetUrl(location.coverUrl || ''),
        'form.coverImageId': '',
        typeIndex: this.findTypeIndex(type),
      });
      this.refreshParentOptions(location.parentId || '');
    } catch (error) {
      wx.showToast({ title: '位置加载失败', icon: 'none' });
    }
  },

  findTypeIndex(type) {
    return Math.max(
      0,
      typeOptions.findIndex((option) => option.value === type),
    );
  },

  refreshParentOptions(selectedParentId) {
    const locations = this.data.locations || [];
    const byId = locations.reduce((acc, location) => {
      acc[location.id] = location;
      return acc;
    }, {});
    const childrenMap = buildChildrenMap(locations);
    const descendants = this.data.id ? collectDescendantIds(childrenMap, Number(this.data.id), {}) : {};
    const subtreeHeight = this.data.id ? getSubtreeHeight(childrenMap, Number(this.data.id)) : 1;
    const parentOptions = [{ id: '', label: '不设置父级位置', depth: 0 }].concat(
      locations
        .filter((location) => {
          if (Number(location.id) === Number(this.data.id) || descendants[location.id]) {
            return false;
          }
          const depth = getDepth(location, byId, {});
          return depth + subtreeHeight <= MAX_DEPTH;
        })
        .map((location) => {
          const depth = getDepth(location, byId, {});
          return {
            id: location.id,
            label: location.path || location.name,
            depth,
          };
        }),
    );
    const parentIndex = Math.max(
      0,
      parentOptions.findIndex((option) => Number(option.id) === Number(selectedParentId)),
    );
    this.setData({
      parentOptions,
      parentNames: parentOptions.map((option) => option.label),
      parentIndex,
      'form.parentId': parentOptions[parentIndex] && parentOptions[parentIndex].id ? parentOptions[parentIndex].id : '',
    });
  },

  onNameInput(event) {
    this.setData({ 'form.name': event.detail.value });
  },

  onTagsInput(event) {
    this.setData({ 'form.tagsText': event.detail.value });
  },

  onTypeChange(event) {
    const typeIndex = Number(event.detail.value);
    const type = typeOptions[typeIndex].value;
    this.setData({
      typeIndex,
      'form.type': type,
    });
    if (type === 'home') {
      this.refreshParentOptions('');
    }
  },

  onParentChange(event) {
    if (this.data.form.type === 'home') {
      wx.showToast({ title: '家必须是根位置', icon: 'none' });
      this.refreshParentOptions('');
      return;
    }
    const parentIndex = Number(event.detail.value);
    const parent = this.data.parentOptions[parentIndex] || this.data.parentOptions[0];
    this.setData({
      parentIndex,
      'form.parentId': parent.id || '',
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
        if (!file || !file.tempFilePath) {
          return;
        }
        wx.showLoading({ title: '上传中' });
        try {
          const uploaded = await api.uploadImage(file.tempFilePath, 'location_cover');
          const image = normalizeUpload(uploaded, file.tempFilePath);
          this.setData({
            'form.coverUrl': image.url,
            'form.coverImageId': image.id,
          });
        } catch (error) {
          wx.showToast({ title: '封面上传失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      },
    });
  },

  async saveLocation() {
    const form = this.data.form;
    const name = form.name.trim();
    if (!name) {
      wx.showToast({ title: '请填写位置名称', icon: 'none' });
      return;
    }

    const parent = form.type === 'home' ? this.data.parentOptions[0] : this.data.parentOptions[this.data.parentIndex] || this.data.parentOptions[0];
    if (parent.depth + 1 > MAX_DEPTH) {
      wx.showToast({ title: '最多支持 4 层位置', icon: 'none' });
      return;
    }

    const payload = {
      name,
      type: form.type,
      parentId: parent.id ? Number(parent.id) : null,
      sortOrder: 0,
      tags: form.type === 'box' ? parseTags(form.tagsText) : [],
      coverImageId: form.type === 'box' && form.coverImageId ? Number(form.coverImageId) : null,
    };

    try {
      if (this.data.id) {
        await api.updateLocation(this.data.id, payload);
      } else {
        await api.createLocation(payload);
      }
      wx.showToast({ title: this.data.id ? '已保存' : '已创建', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.showToast({ title: '保存位置失败', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
