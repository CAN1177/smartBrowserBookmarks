# RecallPin 项目结构说明

## 项目概述

RecallPin 是一个智能书签扩展，融合 Recall（快速检索）与 Pin（钉住）理念，提供智能分类、关键词提取、快速搜索等功能。项目采用现代前端技术栈，支持 Chrome 扩展 API。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI 组件库**: Ant Design + Tailwind CSS
- **状态管理**: Zustand
- **数据存储**: IndexedDB + Dexie.js
- **构建工具**: Vite + CRXJS
- **关键词提取**: nodejieba + 自定义分词算法
- **拖拽功能**: @dnd-kit
- **搜索功能**: Fuse.js

## 项目结构树

```
smartBrowserBookmarks/
├── 📁 assets/                          # 静态资源目录
├── 📁 dist/                            # 构建输出目录
│   ├── 📁 assets/                      # 构建后的静态资源
│   ├── 📄 manifest.json               # 构建后的插件清单
│   └── 📁 src/                         # 构建后的页面文件
│       ├── 📁 main/                   # 主界面页面
│       ├── 📁 options/                # 设置页面
│       └── 📁 popup/                  # 弹窗页面
├── 📁 node_modules/                    # 依赖包目录
├── 📁 src/                            # 源代码目录
│   ├── 📁 background/                 # 后台服务脚本
│   │   └── 📄 index.ts               # 后台服务主文件
│   ├── 📁 content/                    # 内容脚本
│   │   └── 📄 index.ts               # 内容脚本主文件
│   ├── 📁 main/                       # 主界面
│   │   ├── 📄 index.html             # 主界面HTML模板
│   │   └── 📄 index.tsx              # 主界面React组件
│   ├── 📁 options/                    # 设置页面
│   │   ├── 📄 index.html             # 设置页面HTML模板
│   │   └── 📄 index.tsx              # 设置页面React组件
│   ├── 📁 popup/                      # 弹窗界面
│   │   ├── 📄 App.tsx                # 弹窗主组件
│   │   ├── 📄 index.css              # 弹窗样式文件
│   │   ├── 📄 index.html             # 弹窗HTML模板
│   │   └── 📄 index.tsx              # 弹窗入口文件
│   └── 📁 shared/                     # 共享模块
│       ├── 📁 storage/                # 数据存储相关
│       │   └── 📄 database.ts        # IndexedDB数据库配置
│       └── 📁 types/                  # 类型定义
│           └── 📄 index.ts           # TypeScript类型定义
├── 📄 manifest.json                   # Chrome扩展清单文件
├── 📄 package.json                    # 项目依赖和脚本配置
├── 📄 package-lock.json              # 依赖锁定文件
├── 📄 postcss.config.js              # PostCSS配置
├── 📄 README.md                       # 项目说明文档
├── 📄 tailwind.config.js             # Tailwind CSS配置
├── 📄 tsconfig.json                   # TypeScript配置
├── 📄 tsconfig.node.json              # Node.js TypeScript配置
└── 📄 vite.config.ts                  # Vite构建配置
```

## 核心文件详解

### 🔧 配置文件

#### `manifest.json` - Chrome 扩展清单（精简权限）

```json
{
  "manifest_version": 3,
  "name": "RecallPin",
  "permissions": ["storage", "bookmarks", "activeTab", "scripting"],
  "background": {
    "service_worker": "src/background/index.ts"
  },
  "action": {
    "default_popup": "src/popup/index.html"
  },
  "options_page": "src/options/index.html"
}
```

#### `vite.config.ts` - 构建配置

- 使用 `@crxjs/vite-plugin` 插件支持 Chrome 扩展开发
- 配置多入口构建（popup、options、main）
- 设置路径别名 `@` 指向 `src` 目录

#### `tsconfig.json` - TypeScript 配置

- 目标版本：ES2020
- 启用严格模式
- 支持 Chrome 扩展类型定义
- 配置路径映射

### 🎯 核心功能模块

#### `src/background/index.ts` - 后台服务脚本

**作用**: Chrome 扩展的后台服务，处理跨组件通信和浏览器 API 调用

**主要功能**:

- 📡 消息路由：处理来自 popup 的消息
- 🔍 书签管理：获取、添加、移动 Chrome 书签
- 🌐 页面信息获取：按需注入内容脚本获取当前页面信息（activeTab + scripting）
- ⚡ 基础关键词生成：当内容脚本不可用时的备用方案

**关键方法**:

```typescript
// 获取当前页面信息
case "getCurrentPageInfo":
  // 与content script通信获取页面关键词和内容

// 添加书签
case "addBookmark":
  // 将关键词添加到书签标题中

// 获取书签树
case "getBookmarks":
  // 返回Chrome书签的完整树结构
```

#### `src/content/index.ts` - 内容脚本

**作用**: 在网页中注入的脚本，负责页面内容分析和关键词提取

**核心类**: `PageAnalyzer`

**主要功能**:

- 🔍 **页面内容提取**: 获取页面正文（去除脚本、样式等）
- 🏷️ **关键词提取**: 使用 nodejieba 分词 + 备用算法
- 📝 **Meta 信息获取**: 提取 description、keywords 等 meta 标签
- 🎯 **智能分词**: 支持中英文混合分词
- 🚫 **停用词过滤**: 过滤常见无意义词汇

**关键词提取策略**:

```typescript
// 1. 优先使用nodejieba搜索引擎模式分词 + 关键词提取
if (nodejieba可用) {
  const searchWords = nodejieba.cutForSearch(text); // 搜索引擎模式分词
  const extractedWords = nodejieba.extract(text, 8); // 关键词提取算法
  const allWords = [...searchWords, ...extractedWords]; // 合并结果
  // 统计词频，过滤停用词，返回前6个高频核心词
}

// 2. 备用方案：正则表达式分词
const chineseWords = text.match(/[\u4e00-\u9fa5]{2,}/g);
const englishWords = text.match(/[a-zA-Z]{3,}/g);

// 3. 词频统计和停用词过滤
// 4. 按频率排序返回前6个高频核心词
```

#### `src/shared/types/index.ts` - 类型定义

**作用**: 定义整个项目的数据结构和接口

**核心接口**:

```typescript
interface BookmarkItem {
  id: string; // 书签ID
  url: string; // 书签URL
  title: string; // 书签标题
  description?: string; // 页面描述
  favicon?: string; // 网站图标
  tags: string[]; // 标签数组
  keywords: string[]; // 关键词数组
  category: string; // 分类
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  visitCount: number; // 访问次数
  lastVisited?: Date; // 最后访问时间
  content?: string; // 页面内容
  isImported: boolean; // 是否导入的书签
}

interface Category {
  id: string; // 分类ID
  name: string; // 分类名称
  icon: string; // 图标
  color: string; // 颜色
  parentId?: string; // 父分类ID
  order: number; // 排序
}
```

#### `src/shared/storage/database.ts` - 数据存储

**作用**: 使用 Dexie.js 配置 IndexedDB 数据库

**数据库表结构**:

```typescript
class SmartBookmarksDB extends Dexie {
  bookmarks!: Table<BookmarkItem>; // 书签表
  categories!: Table<Category>; // 分类表
  searchHistory!: Table<SearchHistory>; // 搜索历史表
  settings!: Table<Settings>; // 设置表
}
```

**默认数据初始化**:

- 创建默认分类：默认、工作、学习、娱乐
- 设置默认配置：关键词提取开关、主题设置等

### 🖥️ 用户界面模块

#### `src/popup/App.tsx` - 弹窗界面

**作用**: 浏览器工具栏点击后显示的弹窗界面

**主要功能**:

- 🔍 **快速搜索**: 支持标题、URL、关键词搜索
- 📁 **书签浏览**: 树形结构展示书签
- ➕ **添加书签**: 获取当前页面信息并添加书签
- 🏷️ **关键词管理**: 显示和编辑自动提取的关键词

**界面特点**:

- 使用 Ant Design 组件库
- 响应式设计，适配不同屏幕尺寸
- 支持键盘快捷键操作

#### `src/main/index.tsx` - 主界面

**作用**: 全屏主界面，提供完整的书签管理功能

**核心功能**:

- 📂 **文件夹管理**: 支持多级文件夹结构
- 🎯 **拖拽排序**: 使用@dnd-kit 实现拖拽功能
- 🔍 **高级搜索**: 支持跨文件夹搜索
- 🎨 **美观界面**: 使用渐变背景和毛玻璃效果

**组件结构**:

```typescript
// 可拖拽文件夹卡片
const SortableFolderCard = ({ folder, onDelete, onFolderClick }) => {
  // 文件夹展示和操作
};

// 可拖拽书签卡片
const SortableBookmarkCard = ({ bookmark, onDelete }) => {
  // 书签展示和操作
};

// 主页面组件
const MainPage = () => {
  // 状态管理和业务逻辑
};
```

#### `src/options/index.tsx` - 设置页面

**作用**: 插件设置页面（当前为占位页面）

**计划功能**:

- ⚙️ 关键词提取设置
- 🎨 主题配置
- ⌨️ 快捷键设置
- 🔄 数据同步设置

### 🎨 样式和资源

#### `src/popup/index.css` - 弹窗样式

- 自定义样式补充
- 与 Tailwind CSS 配合使用

#### `tailwind.config.js` - Tailwind 配置

- 自定义主题配置
- 响应式断点设置

## 工作流程

### 1. 关键词提取流程

```
用户访问网页 → Content Script注入 → 页面内容分析 →
nodejieba搜索引擎模式分词 + 关键词提取 → 词频统计 →
停用词过滤 → 返回6个高频核心词
```

### 2. 添加书签流程

```
用户点击添加 → 获取当前页面信息 → 提取关键词 →
显示表单 → 用户确认 → 调用Chrome API → 更新界面
```

### 3. 搜索流程

```
用户输入搜索词 → 过滤书签列表 → 高亮匹配内容 → 显示结果
```

## 开发指南

### 本地开发

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
```

### 加载到浏览器

1. 打开 Chrome 扩展管理页面
2. 启用开发者模式
3. 加载`dist`文件夹

## 特色功能

### 🧠 智能关键词提取

- 使用 nodejieba 搜索引擎模式分词，更适合关键词提取
- 结合关键词提取算法和词频统计，确保高频核心词
- 精确提取 6 个高质量关键词，避免冗余
- 支持中英文混合分词
- 多级降级策略确保可用性
- 智能停用词过滤

### 🎯 多维度搜索

- 标题搜索
- URL 搜索
- 关键词搜索
- 跨文件夹搜索

### 🎨 现代化 UI

- 毛玻璃效果
- 渐变背景
- 响应式设计
- 流畅动画

### ⚡ 高性能

- IndexedDB 本地存储
- 虚拟滚动优化
- 懒加载机制

## 扩展性

项目采用模块化设计，易于扩展：

- 新增关键词提取算法
- 添加新的搜索维度
- 集成更多数据源
- 支持更多浏览器

---

_最后更新: 2024 年_
