# 🌐 划词翻译助手

一个简单易用的 Chrome 浏览器划词翻译插件。

## 功能特点

- ✨ 划词即翻译 - 选中文字自动显示翻译结果
- 🎨 精美 UI - 渐变色设计，动画流畅
- 🆓 免费使用 - 使用免费翻译 API
- 🔒 隐私安全 - 不收集用户数据

## 安装方法

1. 下载本项目代码
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目文件夹

## 使用方法

1. 在任意网页上选中英文文字
2. 自动弹出翻译结果
3. 按 ESC 键关闭弹窗
4. 也可以右键点击「翻译选中文字」

## 文件结构

```
chrome-translate-extension/
├── manifest.json      # 插件配置
├── background.js      # 后台脚本
├── content.js         # 内容脚本（核心翻译逻辑）
├── styles.css         # 弹窗样式
├── popup.html         # 插件图标点击弹窗
├── README.md          # 说明文档
└── icons/             # 图标文件夹
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 技术说明

- 使用 MyMemory 免费翻译 API
- 支持英译中
- 选中文本长度限制 500 字符

## 许可证

MIT License
