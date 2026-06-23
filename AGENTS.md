# AGENTS.md

## 项目范围

本仓库是 `箱里有什么` 微信小程序前端，仓库根目录就是微信开发者工具可打开的小程序项目根目录。

不要在本仓库放入后端源码、数据库迁移、Docker 配置或服务器环境文件。后端接口契约参考：

- `/Users/weichen/study/github/whats-in-box-server/docs/requirements.md`

## 技术栈

- 原生微信小程序。
- 页面由 `*.wxml`、`*.wxss`、`*.js`、`*.json` 组成。
- 全局入口为 `app.js`、`app.json`、`app.wxss`。
- 后端请求统一通过 `utils/api.js` 和 `utils/request.js`。
- 示例数据统一放在 `utils/mock.js`。

## 目录约定

- `pages/home`：首页，搜索、盒子列表、底部导航。
- `pages/scan`：扫描页。
- `pages/locations`：统计页，底部导航中的“统计”入口。
- `pages/location-detail`：盒子/位置详情，展示盒内物品并进入新增或取出物品。
- `pages/withdraw`：取出物品页。
- `pages/item-form`：新增/编辑盒子和物品。
- `pages/item-detail`：物品详情、移动、编辑、删除。
- `pages/search`：搜索结果页。
- `pages/settings`：我的页、服务状态、导出数据。
- `assets/`：小程序运行时图片和底栏图标。
- `desgin/`：Stitch 设计稿和静态预览资源，目录名保持现状，不要重命名。

## 开发规则

- 用户可见文案统一使用中文，项目显示名使用 `箱里有什么`。
- 不要把接口字段、API 路径、storage key、资源路径强行中文化。
- 保持现有自定义导航模式，注意状态栏和底部安全区。
- 底栏文案统一为 `首页 / 扫描 / 统计 / 我的`。
- 页面样式优先延续当前 Stitch 风格：浅灰背景、白色卡片、绿色主色、圆角、粗体标题。
- 新增接口调用必须封装在 `utils/api.js`，页面不要直接拼完整后端域名。
- 后端不可用时应保留 mock 降级，不要让页面空白或崩溃。
- `project.private.config.json` 不要提交。

## 验证命令

提交或交付前至少运行：

```bash
find /Users/weichen/study/github/whats-in-box -path '*/desgin/*' -prune -o -name '*.js' -print0 | xargs -0 -n1 node --check
find /Users/weichen/study/github/whats-in-box -path '*/desgin/*' -prune -o -name '*.json' -print0 | xargs -0 -n1 node -e 'const fs=require("fs"); for (const f of process.argv.slice(1)) JSON.parse(fs.readFileSync(f,"utf8"));'
```

如果微信开发者工具已打开，保存后检查是否重新编译成功；常见内部插件或 GPU 日志不等同于业务错误。

## Git

- 当前默认分支为 `main`。
- 提交信息使用中文 Gitmoji + Conventional Commits，例如：

```text
✨ feat(frontend): 初始化小程序前端
```
