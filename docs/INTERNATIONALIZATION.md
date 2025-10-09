# 多语言国际化功能说明

## 概述

Smart Browser Bookmarks 扩展程序现已支持多语言国际化功能，用户可以在中文和英文之间自由切换。本功能基于 Chrome 扩展的 `chrome.i18n` API 实现，符合 Manifest V3 规范。

## 功能特性

- ✅ 支持中文（zh_CN）和英文（en）两种语言
- ✅ 自动检测浏览器语言并设置默认语言
- ✅ 用户可在设置页面手动切换语言
- ✅ 语言设置持久化存储
- ✅ 实时切换，无需重启扩展
- ✅ 符合 Chrome 扩展 Manifest V3 规范

## 技术实现

### 1. 文件结构

```
smartBrowserBookmarks/
├── _locales/                    # 语言包目录
│   ├── zh_CN/                  # 中文语言包
│   │   └── messages.json       # 中文消息文件
│   └── en/                     # 英文语言包
│       └── messages.json       # 英文消息文件
├── src/
│   ├── shared/
│   │   └── i18n/
│   │       └── index.ts        # 多语言管理模块
│   └── options/
│       └── index.tsx           # 设置页面（含语言切换）
└── manifest.json               # 扩展清单文件
```

### 2. 核心组件

#### 2.1 语言包文件 (`_locales/*/messages.json`)

每个语言包包含所有界面文本的翻译：

```json
{
  "extensionName": {
    "message": "智能收藏夹",
    "description": "扩展程序名称"
  },
  "optionsTitle": {
    "message": "Smart Bookmarks 设置",
    "description": "设置页面标题"
  }
  // ... 更多消息
}
```

#### 2.2 多语言管理模块 (`src/shared/i18n/index.ts`)

提供以下核心功能：

- `getCurrentLanguage()`: 获取当前选择的语言
- `setCurrentLanguage()`: 设置当前语言
- `getMessage()`: 获取本地化消息
- `detectAndSetInitialLanguage()`: 自动检测并设置初始语言

#### 2.3 Manifest 配置

```json
{
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__",
  "default_locale": "zh_CN"
}
```

## 使用方法

### 用户操作

1. 打开扩展程序的设置页面
2. 在"语言设置"部分选择所需语言
3. 页面将自动刷新并应用新语言

### 开发者集成

#### 1. 添加新的文本消息

在 `_locales/zh_CN/messages.json` 和 `_locales/en/messages.json` 中添加对应的消息：

```json
{
  "newMessage": {
    "message": "新消息文本",
    "description": "消息描述"
  }
}
```

#### 2. 在代码中使用消息

```typescript
import { getMessage } from '../shared/i18n';

// 获取本地化消息
const text = getMessage('newMessage');
```

#### 3. 在 Manifest 中使用消息

```json
{
  "name": "__MSG_newMessage__"
}
```

## 支持的语言

| 语言代码 | 语言名称 | 状态 |
|---------|---------|------|
| zh_CN   | 中文    | ✅ 已支持 |
| en      | English | ✅ 已支持 |

## 扩展新语言

要添加新语言支持，请按以下步骤操作：

### 1. 创建语言包

在 `_locales/` 目录下创建新的语言文件夹，例如 `ja`（日语）：

```
_locales/
└── ja/
    └── messages.json
```

### 2. 翻译消息文件

复制现有的 `messages.json` 文件并翻译所有消息。

### 3. 更新语言选项

在 `src/shared/i18n/index.ts` 中更新 `LANGUAGE_OPTIONS`：

```typescript
export const LANGUAGE_OPTIONS = [
  { value: 'zh_CN' as const, label: '中文' },
  { value: 'en' as const, label: 'English' },
  { value: 'ja' as const, label: '日本語' }  // 新增
];
```

### 4. 更新类型定义

更新 `SupportedLanguage` 类型：

```typescript
export type SupportedLanguage = 'zh_CN' | 'en' | 'ja';
```

## 最佳实践

### 1. 消息命名规范

- 使用驼峰命名法：`optionsTitle`
- 提示文本添加 `Tooltip` 后缀：`difyApiKeyTooltip`
- 按钮文本使用动词：`saveSettings`
- 状态消息使用过去时：`settingsSaved`

### 2. 描述字段

每个消息都应包含 `description` 字段，帮助翻译人员理解上下文：

```json
{
  "saveSettings": {
    "message": "保存设置",
    "description": "保存设置按钮的文本"
  }
}
```

### 3. 占位符使用

对于包含动态内容的消息，使用占位符：

```json
{
  "welcomeMessage": {
    "message": "欢迎，$USER$！",
    "description": "欢迎消息，$USER$ 将被替换为用户名",
    "placeholders": {
      "user": {
        "content": "$1",
        "example": "张三"
      }
    }
  }
}
```

## 技术参考

- [Chrome Extensions i18n API](https://developer.chrome.com/docs/extensions/reference/api/i18n)
- [Manifest V3 国际化](https://developer.chrome.com/docs/extensions/mv3/i18n/)
- [支持的语言代码列表](https://developer.chrome.com/docs/extensions/reference/api/i18n#supported-locales)

## 故障排除

### 常见问题

1. **消息显示为键名而非翻译文本**
   - 检查 `messages.json` 文件格式是否正确
   - 确认消息键名拼写无误
   - 验证 `default_locale` 设置是否正确

2. **语言切换后页面未更新**
   - 确认调用了 `window.location.reload()`
   - 检查浏览器控制台是否有错误信息

3. **新添加的语言未显示**
   - 确认语言包文件路径正确
   - 检查 `LANGUAGE_OPTIONS` 是否已更新
   - 验证类型定义是否包含新语言

### 调试方法

1. 使用浏览器开发者工具检查控制台错误
2. 验证 `chrome.i18n.getMessage()` 返回值
3. 检查 `chrome.storage.sync` 中的语言设置

## 更新日志

- **v1.0.0** (2024-01-XX)
  - 初始实现多语言功能
  - 支持中文和英文
  - 添加设置页面语言切换器
  - 实现自动语言检测