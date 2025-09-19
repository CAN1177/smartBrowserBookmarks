# Dify 关键词生成功能说明

本文档介绍如何在 Smart Bookmarks 中启用并使用「用 Dify 生成关键词」能力、其工作原理、配置项、常见问题与排查方法等。

## 功能概述
- 在弹窗的「添加收藏」对话框中，点击「用 Dify 生成关键词」按钮后，会把当前页面或表单中的关键信息（标题、URL、描述、内容）发送给你配置的 Dify 工作流。
- 接收返回结果后，从响应中尽力提取关键词并自动填充到表单的「关键词」字段中（会与已有关键词去重合并）。

## 快速上手
1. 构建或加载扩展
   - `npm run build` 后在 Chrome 扩展管理中「加载已解压的扩展」，选择项目下的 `dist` 目录。
2. 打开设置页并完成配置
   - 在扩展图标的菜单中打开设置，或地址栏访问 `chrome-extension://<EXT_ID>/src/options/index.html`。
   - 打开「使用 Dify 生成关键词」开关。
   - 填写：
     - Dify API Key：从你的 Dify 控制台获取。
     - Dify API Base URL：默认 `https://api.dify.ai`，如自托管请填对应地址（无需以 `/` 结尾）。
     - Dify User ID：用于区分调用用户，可保持默认 `sb-extension`。
   - 点击「保存设置」。
3. 在弹窗中使用
   - 打开弹窗，点击「添加当前页面」。
   - 在对话框中点击「用 Dify 生成关键词」，等待生成完成，关键词将自动填入。

## 工作原理
- 配置持久化
  - 通过 `chrome.storage.sync` 保存如下键值：
    - `useDifyKeyword`：是否启用 Dify 关键词生成功能。
    - `difyApiKey`：Dify API Key。
    - `difyBaseUrl`：Dify API 基础地址，默认 `https://api.dify.ai`。
    - `difyUserId`：调用用户标识，默认 `sb-extension`。
- 触发点与实现位置
  - 弹窗页面的实现位于：
    - <mcfile name="App.tsx" path="/Users/ke/Desktop/smartBrowserBookmarks/src/popup/App.tsx"></mcfile>
    - 关键词生成核心方法：<mcsymbol name="generateKeywordsWithDify" filename="App.tsx" path="/Users/ke/Desktop/smartBrowserBookmarks/src/popup/App.tsx" startline="117" type="function"></mcsymbol>
- 请求与解析流程（基于代码实现）
  - 当点击按钮时，会读取表单中的 `title`、`url`、`description`，以及当前页面抓取到的 `content`，组装为 `inputs` 发送到你配置的 Dify 工作流运行接口（以 `difyBaseUrl` 为前缀，末尾自动去除多余的 `/`）。
  - 使用阻塞模式等待结果并解析可能的字段：
    - 优先从 `data.data.outputs.keywords` 解析；
    - 其次尝试 `data.data.text`、`data.outputs.keywords`、`data.text`；
    - 支持 `string[]` 或字符串（会按分隔符切分）。
  - 解析出的关键词与「关键词」表单已填内容合并去重后回填。

## 配置项说明
- useDifyKeyword（布尔）
  - 关闭时，按钮会保持可见但点击将提示你去设置中开启。
- difyApiKey（字符串）
  - 未配置时，按钮会提示先去设置中填写。
- difyBaseUrl（字符串）
  - 默认 `https://api.dify.ai`；
  - 末尾是否带 `/` 都可以，代码会自动移除尾部 `/` 再拼接接口路径。
- difyUserId（字符串）
  - 用于区分调用者，可保持默认。

## 安全与隐私
- API Key 存储位置：保存在 `chrome.storage.sync` 中（明文存储，浏览器会在多设备间同步）。
- 调用时发送的数据：仅会把当前「添加收藏」表单中的 `title`、`url`、`description` 以及抓取到的 `content` 发送至你配置的 Dify 工作流。
- 建议：
  - 仅在可信环境中使用；
  - 使用最小权限的专用 API Key；
  - 如需企业合规，请将 `difyBaseUrl` 指向你的自托管/私有部署。

## 故障排查
- 按钮不可点击或点击无反应
  - 检查设置页是否打开了「使用 Dify 生成关键词」，以及是否填写了 API Key。
- 提示 401/403 未授权
  - 检查 API Key 是否正确、是否有调用工作流的权限。
- 提示 404 或 5xx
  - 检查 `difyBaseUrl` 是否正确，网络是否可达；
  - 自托管场景检查反向代理或网关配置。
- 生成成功但未出关键词
  - 请调整工作流输出，确保至少一个字段能被解析为关键词（见下节「自定义工作流输出约定」）。
- 如何查看错误细节
  - 打开弹窗页面，右键 -> 检查 -> Console 查看错误栈与响应文本。

## 自定义工作流输出约定（与代码的兼容解析）
为确保关键词能被正确解析，请尽量让工作流的同步响应中包含以下之一：
- `data.data.outputs.keywords`: `string[]` 或 `string`
- `data.data.text`: `string`（包含以分隔符分开的多个关键词）
- `data.outputs.keywords`: `string[]` 或 `string`
- `data.text`: `string`

当为 `string` 时，扩展会按以下分隔符拆分：`#,，、\n\r\t` 和空格，并自动去重、去空白。

## 兼容性与限制
- 仅使用阻塞响应模式（非流式），避免在弹窗中处理流式事件。
- 需要在 Chrome MV3 扩展环境中运行。预览/开发环境下（非扩展页面）设置页会跳过 `chrome.storage` 读写，仅用于样式与交互预览。
- 跨域访问说明：扩展已在清单中声明了 `host_permissions: ["<all_urls>"]`，允许从扩展页面发起跨域请求。

## 相关文件
- 弹窗页面：<mcfile name="App.tsx" path="/Users/ke/Desktop/smartBrowserBookmarks/src/popup/App.tsx"></mcfile>
- 设置页面：<mcfile name="index.tsx" path="/Users/ke/Desktop/smartBrowserBookmarks/src/options/index.tsx"></mcfile>
- 扩展清单：<mcfile name="manifest.json" path="/Users/ke/Desktop/smartBrowserBookmarks/manifest.json"></mcfile>

## 版本与构建
- 开发：`npm run dev`
- 类型检查：`npm run type-check`
- 构建：`npm run build`（产物位于 `dist/`）

如果你希望把文档同步到 README 或英文化，请告诉我，我可以继续完善。