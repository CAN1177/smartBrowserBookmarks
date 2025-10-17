# 书签访问计数功能说明

## 背景与目标
为提升常用书签的可视化与可用性，本次新增"访问计数"能力：
- 在主页面：
  - 支持在文件夹卡片的书签预览行直接点击书签标题或"+"按钮进行快速访问，同时为该书签累加访问计数
  - 点击纯书签列表中的书签也会累加访问计数
- 在扩展弹窗（popup）：点击书签（无论树视图还是搜索结果）都会先累加访问计数，再打开链接，并自动关闭弹窗

## 功能概览
- 计数存储方式：将访问计数以"(n)"形式附加到书签标题末尾，并在其后保留原有的标签信息（例如：`示例标题 (3) #tag1, tag2`）
- 标签保留：若标题中包含解析得到的关键词标签（#tag），更新计数时保留这些标签不变
- 显示分离：BookmarkItem 对象中 title 字段存储不含计数的基础标题，visitCount 字段单独存储计数，显示时动态组合
- 一致性：主页面与 popup 的计数解析/构建逻辑保持一致

## 变更点（代码位置）
- 主页面（Main）：
  - 文件：`src/main/index.tsx`
  - 改动：
    - **`parseBookmarkTitle` 函数**：先去掉计数部分 `(n)` 再解析标签，返回不含计数的基础标题
    - **计数解析函数**：
      - `getVisitCountFromTitle`：使用正则 `/\((\d+)\)(?:\s+#|$)/` 匹配计数，支持后跟标签或行尾
      - `stripVisitCount`：使用正则 `/\s*\(\d+\)(?=\s+#|$)/` 去掉计数但保留标签
    - **`buildFolderStructure` 函数**：从原始书签标题（`grandChild.title`）提取 visitCount，而不是从解析后的标题
    - **`SortableFolderCard` 组件**：
      - 新增 `onVisit` 属性，点击书签标题或"+"按钮时调用 `handleLocalVisit`
      - 显示时动态组合：标题 + 计数（如果 > 0）
      - `localGetVisitCount` 使用与主函数一致的正则表达式
    - **`SortableBookmarkCard` 组件**：
      - `handleClick` 改为 async 函数，await `onVisit` 完成后再打开新窗口
      - 显示时动态组合标题和计数：`${bookmark.title}${countStr}`
    - **`handleBookmarkVisit` 函数**：更新计数后重新加载并自动重排所在文件夹

- 弹窗（Popup）：
  - 文件：`src/popup/App.tsx`
  - 改动：
    - **计数相关辅助函数**：`getVisitCountFromTitle`、`stripVisitCount`、`buildTitleWithCountAndTags`，与主页面逻辑完全一致
    - **`parseBookmarkTitle` 函数**：先去掉计数部分 `(n)` 再解析标签，在所有解析分支中都使用 `titleWithoutCount`
    - **`handleBookmarkClick` 函数**：签名为 `(id: string, url: string)`，点击时：
      1) 通过 `chrome.bookmarks.get(id)` 读取当前标题
      2) 使用 `parseBookmarkTitle` 获取基础标题与关键词
      3) 使用 `getVisitCountFromTitle` 从原始标题解析访问计数，累加 1
      4) 用 `buildTitleWithCountAndTags` 构建新标题
      5) 用 `chrome.bookmarks.update` 写回新标题
      6) 用 `chrome.tabs.create` 打开链接
      7) `window.close()` 关闭弹窗
    - **树选择与搜索卡片**：点击时传入 `(id, url)` 到 `handleBookmarkClick`

## 标题格式规范

### Chrome 书签存储格式
- 标准格式：`<基础标题>[ 空格(计数) ][ 空格#标签（最多 5 个，逗号分隔）]`
  - 示例：`JSON在线解析 (5) #json, json在线解析`
- 计数字段：
  - 当计数 `> 0` 时显示为 ` (n)`
  - 当计数 `= 0` 时不附加计数字段（仅在部分场景，例如初始化/未访问时）
- 标签字段：
  - 若存在标签，则以 ` #tag1, tag2` 形式追加
  - 标签由 `parseBookmarkTitle` 解析/提取，更新计数不会改变标签集合

### BookmarkItem 数据结构
```typescript
interface BookmarkItem {
  id: string;
  url: string;
  title: string;           // 不含计数的基础标题，例如 "JSON在线解析"
  tags: string[];          // 解析出的标签，例如 ["json", "json在线解析"]
  visitCount?: number;     // 访问计数，例如 5
  // ... 其他字段
}
```

### 显示逻辑
- **文件夹卡片预览**：显示 `标题 (计数)`，计数用 span 标签单独渲染
- **独立书签卡片**：显示 `标题 (计数)`，动态组合字符串
- **标签**：使用 Ant Design Tag 组件单独显示，不包含在标题中

## 事件流程

### 主页面 - 文件夹卡片预览区域
1. **点击书签标题或"+"按钮**
   - 立即打开新窗口（`window.open(bookmark.url, "_blank")`）
   - 异步调用 `handleLocalVisit(bookmark)`
2. **`handleLocalVisit` 函数**
   - 调用父组件的 `onVisit(bookmark)`
   - 更新本地状态，计数 +1
   - 按计数重新排序预览列表
3. **`onVisit` (即 `handleBookmarkVisit`)** 
   - 使用 `stripVisitCount` 去掉标题中的旧计数
   - 计数 +1
   - 使用 `buildTitleWithCountAndTags` 构建新标题：`基础标题 (新计数) #标签`
   - 调用 `chrome.bookmarks.update` 写回新标题
   - 调用 `loadBookmarks()` 重新加载
   - 调用 `resortFolderByVisitCount` 按计数重排所在文件夹

### 主页面 - 纯书签列表
1. **点击书签卡片**
   - 调用 async `handleClick` 函数
2. **`handleClick` 函数**
   - `await onVisit(bookmark)` 等待计数更新完成
   - 如果成功，打开新窗口
   - 如果失败，仍然打开新窗口（降级处理）

### 弹窗 - 树视图或搜索结果
1. **点击书签**
   - 调用 `handleBookmarkClick(id, url)`
2. **`handleBookmarkClick` 函数**
   - `chrome.bookmarks.get(id)` 读取当前完整标题（含计数和标签）
   - `parseBookmarkTitle(currentTitle)` 解析，得到基础标题和关键词
   - `getVisitCountFromTitle(currentTitle)` 从原始标题提取当前计数
   - 计数 +1
   - `buildTitleWithCountAndTags` 构建新标题
   - `chrome.bookmarks.update(id, { title })` 写回
   - `chrome.tabs.create({ url })` 打开页面
   - `window.close()` 关闭弹窗

## 依赖与权限
- 依赖 Chrome 扩展 API：
  - `chrome.bookmarks.get`、`chrome.bookmarks.update`
  - `chrome.tabs.create`
- 请确保 `manifest.json` 中已声明相应权限（bookmarks、tabs，如有需要）。

## 关键技术细节

### 正则表达式
1. **匹配计数**：`/\((\d+)\)(?:\s+#|$)/`
   - 匹配 `(数字)` 格式
   - 后面必须跟着 ` #`（标签）或行尾 `$`
   - 这样可以正确处理带标签的标题，例如 `"标题 (5) #tag"`

2. **去除计数**：`/\s*\(\d+\)(?=\s+#|$)/`
   - 使用前瞻断言 `(?=\s+#|$)`
   - 去掉计数但保留后面的标签
   - 例如 `"标题 (5) #tag"` → `"标题 #tag"`

### 数据流转
```
Chrome 书签标题: "JSON在线解析 (5) #json, json在线解析"
        ↓ parseBookmarkTitle
BookmarkItem: {
  title: "JSON在线解析",
  visitCount: 5,
  tags: ["json", "json在线解析"]
}
        ↓ 显示时动态组合
界面显示: "JSON在线解析 (5)" + Tag组件显示标签
```

## 测试与验收
### 主页面测试
1. **文件夹卡片预览区域**
   - 点击书签标题或右侧的"+"按钮
   - 观察：标题旁边显示或更新计数 `(n)`
   - 刷新页面，验证顺序按访问次数降序排列
   - 多次点击，验证计数正确累加（1 → 2 → 3 ...）

2. **纯书签列表（点击进入文件夹后展开的书签）**
   - 点击书签卡片
   - 等待短暂延迟（异步更新）
   - 观察：计数增加，页面打开
   - 验证顺序自动更新

### 弹窗测试
1. 打开扩展弹窗
2. 在树视图选择一个叶子书签，或在搜索结果点击某条书签
3. 观察：链接立即打开，弹窗关闭
4. 打开主页面，验证对应书签的计数已更新

### 带标签书签测试
1. 创建或编辑一个书签，标题格式为：`标题 #标签1, 标签2`
2. 点击该书签多次
3. 验证：
   - 计数正确增加
   - 标签保持不变
   - Chrome 书签管理器中的标题格式为：`标题 (n) #标签1, 标签2`

## 兼容性与已知问题
### 兼容性
- **旧标题兼容**：若标题没有 `(n)` 格式的计数，首次访问会追加 `(1)`
- **标签保留**：更新计数不会丢失由 `parseBookmarkTitle` 解析得到的标签集合
- **多层嵌套文件夹**：支持任意深度的文件夹嵌套，所有层级的书签都能正确计数

### 已知问题与限制
1. **文件夹卡片预览**：点击后立即打开新窗口，计数更新是异步的，可能有短暂延迟
2. **浏览器弹窗拦截**：某些浏览器设置可能拦截 `window.open`，需要用户允许弹窗
3. **并发点击**：快速连续点击同一书签可能导致计数竞争，建议添加防抖
4. **正则表达式假设**：假设标题中的 `(数字)` 格式只用于访问计数，如果用户标题本身包含这种格式可能会冲突

## 回滚方案
如需回退到无计数功能的版本：
1. **主页面**：
   - 移除 `SortableFolderCard` 的"+"按钮与 `onVisit` 属性传递
   - `SortableBookmarkCard` 的 `handleClick` 改回同步函数
   - 移除计数显示逻辑
2. **弹窗**：
   - 将 `handleBookmarkClick` 恢复为仅以 `url` 打开链接，不做计数更新
   - 移除计数相关辅助函数
3. **不改动其他数据结构与状态，即可回退到无计数的旧行为**

## 相关文件
- 主页面：`src/main/index.tsx`（约1920行，主要修改：parseBookmarkTitle、计数函数、显示组件）
- 弹窗：`src/popup/App.tsx`（约1116行，主要修改：parseBookmarkTitle、handleBookmarkClick、计数函数）
- 类型定义：`src/shared/types/index.ts`（BookmarkItem 接口）
- 文档：`FEATURE_BOOKMARK_VISIT_COUNT.md`（本文档）

## 更新历史
- **v1.0** (初始实现)：基本的访问计数功能
- **v1.1** (修复)：
  - 修复正则表达式以支持带标签的标题格式
  - 修复 `parseBookmarkTitle` 先去掉计数再解析标签
  - 修复 `buildFolderStructure` 从原始标题提取 visitCount
  - 修复纯书签列表点击为 async/await 模式
  - 优化显示逻辑，分离标题、计数和标签的存储与显示