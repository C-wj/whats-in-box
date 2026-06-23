# 箱里有什么小程序

`箱里有什么` 微信小程序前端仓库。仓库根目录就是微信开发者工具可打开的小程序项目根目录。

## 目录

- `app.json` / `app.js` / `app.wxss`：小程序入口、全局逻辑和全局样式。
- `pages/home`：首页，突出搜索、最近添加、常用位置和快捷新增。
- `pages/locations`：位置树，支持创建根位置和子位置。
- `pages/location-detail`：位置详情，展示子位置和该位置下物品。
- `pages/item-form`：新增/编辑物品，支持图片上传。
- `pages/item-detail`：物品详情，支持编辑、移动位置、删除。
- `pages/search`：物品搜索。
- `pages/settings`：服务状态、数据导出、清除登录态。
- `utils/api.js`：后端 API 封装。
- `utils/config.js`：开发 API 地址和本地 storage key。
- `desgin/`：Stitch 设计稿和本地化后的静态预览资源。

## API 配置

开发 API 地址在 `utils/config.js`：

```js
apiBaseUrl: 'https://test.nfsqydt.ggff.net/api/v1'
```

上线前需要替换为 HTTPS 生产域名，并配置到微信小程序合法请求域名。

## 已封装接口

接口路径按 `/Users/weichen/study/github/whats-in-box-server/docs/requirements.md` 对齐：

- `POST /api/v1/auth/wechat-login`
- `GET /api/v1/health`
- `GET /api/v1/locations`
- `POST /api/v1/locations`
- `PATCH /api/v1/locations/:id`
- `DELETE /api/v1/locations/:id`
- `GET /api/v1/items?locationId=1`
- `POST /api/v1/items`
- `GET /api/v1/items/:id`
- `PATCH /api/v1/items/:id`
- `POST /api/v1/items/:id/move`
- `DELETE /api/v1/items/:id`
- `GET /api/v1/search/items?q=关键词`
- `POST /api/v1/uploads/images`
- `GET /api/v1/export`

## 本地预览

1. 用微信开发者工具打开 `/Users/weichen/study/github/whats-in-box`。
2. 后端未完成时，页面会自动降级展示 `utils/mock.js` 中的示例数据。
3. 后端启动后，页面会优先请求真实接口。
