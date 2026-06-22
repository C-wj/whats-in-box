# whats-in-box 设计稿

本目录按用户原请求保留为 `desgin`。

## 内容

- `stitch_box_content_organizer.zip`：Stitch 原始导出压缩包。
- `stitch_box_content_organizer/`：解压后的原型页面、截图和设计说明。
- `stitch_box_content_organizer/assets/stitch.css`：从 Tailwind 配置生成的本地静态 CSS。
- `stitch_box_content_organizer/assets/fonts/`：本地化后的字体和图标字体。
- `stitch_box_content_organizer/assets/images/`：本地化后的原型图片素材。

## 预览

```bash
cd /Users/weichen/study/github/whats-in-box/desgin/stitch_box_content_organizer
python3 -m http.server 8765 --bind 127.0.0.1
```

然后打开：

```text
http://127.0.0.1:8765/_1/code.html
```

6 个页面分别位于 `_1` 到 `_6` 目录。每个目录内的 `screen.png` 是 Stitch 导出的截图，可作为完全离线的视觉参考。

## 样式加载修复

原导出页面依赖 `https://cdn.tailwindcss.com` 运行时生成样式，并依赖 Google Fonts 加载字体和 Material Symbols 图标。现在已改为仓库内本地资源：

- `../assets/stitch.css`
- `../assets/fonts/google-fonts.css`
- `../assets/fonts/material-symbols.css`
- `../assets/images/image-*.jpg`

如需重新生成 CSS：

```bash
cd /Users/weichen/study/github/whats-in-box/desgin/stitch_box_content_organizer
npx --yes tailwindcss@3.4.17 -c tailwind.config.cjs -i assets/tailwind.input.css -o assets/stitch.css --minify
```
