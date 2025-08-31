# Smart Browser Bookmarks

智能浏览器收藏夹插件，提供智能分类、关键词提取、快速搜索等功能。

## 功能特性

- 🎯 **智能分类**: 可视化标签系统，支持颜色编码和图标
- 🔍 **智能搜索**: 支持关键词、标签、内容全文搜索
- 🏷️ **关键词提取**: 自动提取网页关键词，便于快速检索
- 📚 **历史记录**: 智能历史记录搜索和管理
- ⚡ **快捷键**: 丰富的快捷键支持，提升操作效率
- 📱 **响应式 UI**: 清新直观的界面设计
- 🔄 **数据导入**: 支持从原生书签导入数据

## 技术架构

- **前端框架**: React 18 + TypeScript
- **UI 组件**: Ant Design + Tailwind CSS
- **状态管理**: Zustand
- **数据存储**: IndexedDB + Dexie.js
- **构建工具**: Vite + CRXJS
- **关键词提取**: nodejieba + keyword-extractor

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建插件

```bash
npm run build
```

### 加载到浏览器

1. 打开 Chrome 扩展管理页面 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目的 `dist` 文件夹

## 快捷键

| 快捷键         | 功能              |
| -------------- | ----------------- |
| `Ctrl+Shift+B` | 打开/关闭插件弹窗 |
| `Ctrl+K`       | 聚焦搜索框        |
| `Ctrl+N`       | 新增收藏          |
| `Ctrl+I`       | 导入原生书签      |
| `Ctrl+1-5`     | 快速切换分类      |
| `Esc`          | 关闭弹窗          |

## 项目结构

```
src/
├── background/       # 后台服务
├── content/         # 内容脚本
├── popup/           # 弹窗界面
├── options/         # 设置页面
└── shared/          # 共享模块
    ├── storage/     # 数据存储
    ├── types/       # 类型定义
    ├── utils/       # 工具函数
    └── constants/   # 常量定义
```

## 开发指南

### 数据模型

插件使用 IndexedDB 存储数据，主要包含以下表：

- `bookmarks`: 收藏夹数据
- `categories`: 分类信息
- `searchHistory`: 搜索历史
- `settings`: 用户设置

### 性能优化

- 虚拟滚动处理大量数据
- Web Worker 处理关键词提取
- 批处理优化数据操作
- 智能缓存策略

## 许可证

MIT License
