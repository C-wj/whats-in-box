function unwrapList(payload, keys) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (let i = 0; i < keys.length; i += 1) {
    const value = payload && payload[keys[i]];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function flattenLocations(locations, parentPath) {
  return (locations || []).reduce((acc, location) => {
    const path = location.path || [parentPath, location.name].filter(Boolean).join(' / ');
    const normalized = Object.assign({}, location, {
      parentId: location.parentId === undefined ? location.parent_id : location.parentId,
      path,
    });
    acc.push(normalized);
    return acc.concat(flattenLocations(location.children || [], path));
  }, []);
}

function formatDate(value) {
  if (!value) {
    return '刚刚';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}-${day}`;
}

function normalizeItem(item) {
  item = item || {};
  const name = item.name || '';
  const images = item.images || item.imageUrls || [];
  const firstImage = item.imageUrl || item.coverUrl || (images[0] && (images[0].url || images[0].filePath));

  return Object.assign({}, item, {
    id: item.id,
    name,
    initial: name ? name.slice(0, 1) : '物',
    locationId: item.locationId === undefined ? item.location_id : item.locationId,
    locationPath: item.locationPath || item.location_path || item.path || item.locationName || '未选择位置',
    imageUrl: firstImage || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    updatedLabel: item.updatedLabel || formatDate(item.updatedAt || item.updated_at || item.createdAt || item.created_at),
  });
}

module.exports = {
  unwrapList,
  flattenLocations,
  formatDate,
  normalizeItem,
};
