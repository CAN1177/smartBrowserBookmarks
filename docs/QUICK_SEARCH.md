# 快捷键：快速搜索（Quick Search）

本扩展提供一个全局快捷键，用于一键唤起弹窗并直接进入搜索，光标自动聚焦到搜索框，开打就能搜。

- 命令名称：quick_search
- 默认快捷键：
  - Windows / Linux：Ctrl + Shift + K
  - macOS：Command + Shift + K
- 行为：
  1) 打开扩展弹窗（Popup）
  2) 默认停留在“搜索”页签
  3) 光标自动聚焦到“搜索收藏夹...”输入框

## 使用方法
1. 在任意页面按下快捷键（默认 Command/Ctrl + Shift + K）。
2. 弹窗出现后直接输入关键字即可筛选收藏夹/书签。
3. 回车或点击结果项即可打开对应书签。

## 如何修改快捷键
- 打开 Chrome：chrome://extensions/shortcuts
- 找到“Smart Browser Bookmarks”中的“快速搜索收藏夹（quick_search）”，即可自定义或禁用快捷键。

## 故障排查
- 快捷键无效：
  - 检查是否与系统/其他软件快捷键冲突；
  - 确认扩展处于启用状态；
  - 在“扩展程序快捷键”页面重新设置一下快捷键。

## 面向开发者的说明
- 命令与默认键位：见 manifest.json → commands.quick_search.suggested_key
- 后台处理：src/background/index.ts 监听 chrome.commands.onCommand，当接收到 quick_search 时调用 chrome.action.openPopup() 打开弹窗。
- 弹窗搜索框：src/popup/App.tsx 中的搜索输入框带有 autoFocus，确保弹窗打开后光标立即就绪。