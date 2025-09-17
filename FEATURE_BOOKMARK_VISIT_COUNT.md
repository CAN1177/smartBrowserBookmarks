# 书签访问计数功能说明

## 背景与目标
为提升常用书签的可视化与可用性，本次新增“访问计数”能力：
- 在主页面：支持在文件夹卡片的书签预览行直接点击“+”进行快速访问，同时为该书签累加访问计数。
- 在扩展弹窗（popup）：点击书签（无论树视图还是搜索结果）都会先累加访问计数，再打开链接，并自动关闭弹窗。

## 功能概览
- 计数存储方式：将访问计数以“(n)”形式附加到书签标题末尾，并在其后保留原有的标签信息（例如：`示例标题 (3) #tag1, tag2`）。
- 标签保留：若标题中包含解析得到的关键词标签（#tag），更新计数时保留这些标签不变。
- 一致性：主页面与 popup 的计数解析/构建逻辑保持一致。

## 变更点（代码位置）
- 主页面（Main）：
  - 文件：`src/main/index.tsx`
  - 改动：
    - 在文件夹卡片的书签预览行新增“+”快捷访问按钮；点击后调用计数逻辑并打开链接。
    - 给 `SortableFolderCard` 新增 `onVisit` 属性，并在父级两处使用中传入 `onVisit={handleBookmarkVisit}`。
    - 重用已存在的计数工具函数与 `handleBookmarkVisit` 实现。

- 弹窗（Popup）：
  - 文件：`src/popup/App.tsx`
  - 改动：
    - 新增/内置计数相关辅助函数：`getVisitCountFromTitle`、`stripVisitCount`、`buildTitleWithCountAndTags`，与主页面逻辑一致。
    - 将 `handleBookmarkClick` 修改为 `(id: string, url: string)` 签名。点击时：
      1) 通过 `chrome.bookmarks.get(id)` 读取当前标题；
      2) 使用 `parseBookmarkTitle` 获取基础标题与关键词；
      3) 从标题末尾解析访问计数 `(n)`，累加 1；
      4) 用 `chrome.bookmarks.update` 写回新标题；
      5) 用 `chrome.tabs.create` 打开链接；
      6) `window.close()` 关闭弹窗。
    - 更新树选择与搜索卡片点击处，传入 `(id, url)` 到新的 `handleBookmarkClick`。

## 标题格式规范
- 标准格式：`<基础标题>[ 空格(计数) ][ 空格#标签（最多 5 个，逗号分隔）]`
  - 示例：`Google (12) #search, engine`
- 计数字段：
  - 当计数 `> 0` 时显示为 ` (n)`；
  - 当计数 `= 0` 时不附加计数字段（仅在部分场景，例如初始化/未访问时）。
- 标签字段：
  - 若存在标签，则以 ` #tag1, tag2` 形式追加；
  - 标签由 `parseBookmarkTitle` 解析/提取，更新计数不会改变标签集合。

## 事件流程
- 主页面“+”按钮：
  1) 触发 `onVisit(bookmark)`；
  2) 内部调用书签更新：解析标题→计数+1→写回标题；
  3) 打开新标签（或维持主页面行为，视实现而定）。

- 弹窗点击（树/搜索）：
  1) 获取 `id, url`；
  2) `chrome.bookmarks.get(id)` 读取当前标题；
  3) 解析标题与标签、计数+1；
  4) `chrome.bookmarks.update(id, { title })` 写回；
  5) `chrome.tabs.create({ url })` 打开页面；
  6) `window.close()` 关闭弹窗。

## 依赖与权限
- 依赖 Chrome 扩展 API：
  - `chrome.bookmarks.get`、`chrome.bookmarks.update`
  - `chrome.tabs.create`
- 请确保 `manifest.json` 中已声明相应权限（bookmarks、tabs，如有需要）。

## 测试与验收
- 主页面：
  1) 在文件夹卡片预览区域点击某条书签右侧的“+”；
  2) 观察：对应书签标题末尾出现或更新 `(n)`，并成功打开链接；
  3) 若存在按访问次数排序逻辑，刷新后顺序应反映更新结果。

- 弹窗：
  1) 打开扩展弹窗；
  2) 在树视图选择一个叶子书签，或在搜索结果点击某条书签；
  3) 观察：先计数写回，再打开链接，弹窗关闭；
  4) 再次打开时，该书签标题已显示更新后的 `(n)`。

## 兼容性与已知问题
- 旧标题兼容：若标题没有 `(n)` 结尾，首次访问会追加 `(1)`。
- 标签保留：更新计数不会丢失由 `parseBookmarkTitle` 解析得到的标签集合。
- 构建环境提示（与功能无关）：若本地构建遇到 `File is not defined`（undici/Node 相关），可考虑使用 Node 18+ 或为 `undici` 提供 polyfill/版本兼容配置。

## 回滚方案
- 主页面：移除 `SortableFolderCard` 的“+”按钮与 `onVisit` 属性传递；
- 弹窗：将 `handleBookmarkClick` 恢复为仅以 `url` 打开链接，不做计数更新；
- 不改动其他数据结构与状态，即可回退到无计数的旧行为。

## 相关文件
- 主页面：`src/main/index.tsx`
- 弹窗：`src/popup/App.tsx`