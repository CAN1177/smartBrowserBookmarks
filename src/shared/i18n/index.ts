// 支持的语言类型
export type SupportedLanguage = "zh_CN" | "en";

// 语言选项配置
export const LANGUAGE_OPTIONS = [
  { value: "zh_CN" as const, label: "中文" },
  { value: "en" as const, label: "English" },
];

// 默认语言
export const DEFAULT_LANGUAGE: SupportedLanguage = "zh_CN";

// 存储键名
export const LANGUAGE_STORAGE_KEY = "selectedLanguage";

// 本地消息数据库
const MESSAGES = {
  zh_CN: {
    extensionName: "RecallPin",
    extensionDescription: "支持快速检索（Recall）与钉住（Pin）的智能书签扩展",
    optionsTitle: "RecallPin 设置",
    optionsDescription: "配置 Dify 工作流以在弹窗收藏书签时自动生成关键词。",
    languageSettings: "语言设置",
    selectLanguage: "选择语言",
    chinese: "中文",
    english: "English",
    defaultBookmarksCollapsed: "默认折叠书签列表",
    defaultBookmarksCollapsedTooltip:
      "影响主界面所有文件夹的'书签'区块初始展开/折叠状态",
    useDifyKeyword: "使用 Dify 生成关键词",
    difyApiKey: "Dify API Key",
    difyApiKeyTooltip: "从 Dify 控制台获取的 API Key，用于调用工作流接口",
    difyBaseUrl: "Dify API Base URL",
    difyBaseUrlTooltip:
      "通常为 https://api.dify.ai；如使用自托管或私有部署，请填写对应地址",
    difyUserId: "Dify User ID",
    difyUserIdTooltip: "用于区分调用用户的 ID，可保持默认",
    saveSettings: "保存设置",
    visitDifyWorkflow: "访问我的 Dify 工作流",
    settingsSaved: "已保存设置",
    saveFailed: "保存失败，请重试",
    previewEnvironment: "当前为预览环境，设置未写入浏览器",
    quickSearchBookmarks: "快速搜索收藏夹",
    quickBookmarkPage: "快速收藏当前页面",
    // 主界面相关
    searchPlaceholder: "在书签中搜索",
    newBookmark: "新建收藏",
    settings: "设置",
    bookmarks: "书签",
    history: "历史",
    folders: "文件夹",
    noBookmarks: "暂无书签",
    noHistory: "暂无历史记录",
    addFolder: "添加文件夹",
    editFolder: "编辑文件夹",
    deleteFolder: "删除文件夹",
    folderName: "文件夹名称",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    edit: "编辑",
    // 关键词生成
    keywordsGenerated: "已生成关键词",
    keywordGenerationFailed: "生成关键词失败",
    loadBookmarksFailed: "加载书签失败",
    openLinkFailed: "打开链接失败",
    getPageInfoFailed: "获取页面信息失败",
    addBookmarkFailed: "添加收藏失败",
    createFolderFailed: "创建文件夹失败",
    moveFailed: "移动失败",
    moveSuccess: "移动成功",
    cannotMoveToChild: "不能移动到自己的子节点下",
    // 文件夹名称
    bookmarksBar: "书签栏",
    otherBookmarks: "其他书签",
    mobileBookmarks: "移动设备书签",
    unnamedFolder: "未命名文件夹",
    rootDirectory: "根目录",
    // 搜索和显示
    noMatchingBookmarks: "没有找到匹配的书签",
    noBookmarksYet: "暂无书签",
    // 表单相关
    title: "标题",
    url: "网址",
    description: "描述",
    saveToFolder: "保存到文件夹",
    selectFolder: "选择文件夹",
    newFolderName: "新文件夹名称",
    keywords: "关键词",
    add: "添加",
    create: "创建",
    newFolder: "新建文件夹",
    // 验证消息
    pleaseEnterTitle: "请输入标题",
    pleaseEnterUrl: "请输入网址",
    pleaseEnterFolderName: "请输入文件夹名称",
    // 工具提示
    openMainInterface: "打开主界面",
    addBookmark: "添加收藏",
    pageTitle: "页面标题",
    // 其他
    defaultCategory: "默认",
    // 主界面补充
    expandBookmarks: "展开书签",
    collapseBookmarks: "折叠书签",
    expand: "展开",
    collapse: "折叠",
    subfolders: "子文件夹",
    foldersAll: "所有文件夹",
    noMatchingContent: "没有找到匹配的内容",
    emptyFolder: "此文件夹为空",
    tryDifferentKeywords: "尝试使用不同的关键词搜索，或检查拼写是否正确",
    folderEmptyHint: "这个文件夹还没有任何内容，您可以从浏览器添加书签",
    save: "保存",
    searchBookmarks: "搜索书签...",
    visitAndCount: "访问并计数",
    loading: "加载中...",
    includingSubfolders: "包含子文件夹",
    includingAllFolders: "包含所有文件夹",
    goToSettings: "去设置页",
    backToTop: "回到顶部",
    tips: "小贴士",
    createFolderGuide:
      "在浏览器中创建书签文件夹，然后刷新此页面即可开始管理您的智能书签",
    directory: "目录",
    expandMore: "展开更多",
    search: "搜索",
    browse: "浏览",
    browseHint: "点击文件夹展开，点击书签打开链接",
    addCurrentPage: "添加当前页面",
    apiKeyNotConfigured: "未配置 API Key",
    autoExtractedKeywords: "自动提取的关键词",
    clickTagToAdd: "点击标签可添加到关键词字段",
    confirmDeleteFolder: "确定删除这个文件夹吗？",
    confirmDeleteBookmark: "确定删除这个书签吗？",
    tagsOptional: "标签（逗号分隔，可选）",
    createFolder: "新建文件夹",
    renameFolder: "重命名文件夹",
    editBookmark: "编辑书签",
  },
  en: {
    extensionName: "RecallPin",
    extensionDescription:
      "Smart bookmarks for fast recall and pinning (Pin) of pages",
    optionsTitle: "RecallPin Settings",
    optionsDescription:
      "Configure Dify workflow to automatically generate keywords when bookmarking pages in popup.",
    languageSettings: "Language Settings",
    selectLanguage: "Select Language",
    chinese: "中文",
    english: "English",
    defaultBookmarksCollapsed: "Default Bookmarks Collapsed",
    defaultBookmarksCollapsedTooltip:
      "Affects the initial expand/collapse state of 'Bookmarks' sections in all folders in the main interface",
    useDifyKeyword: "Use Dify to Generate Keywords",
    difyApiKey: "Dify API Key",
    difyApiKeyTooltip:
      "API Key obtained from Dify console, used to call workflow interface",
    difyBaseUrl: "Dify API Base URL",
    difyBaseUrlTooltip:
      "Usually https://api.dify.ai; if using self-hosted or private deployment, please fill in the corresponding address",
    difyUserId: "Dify User ID",
    difyUserIdTooltip: "ID used to distinguish calling users, can keep default",
    saveSettings: "Save Settings",
    visitDifyWorkflow: "Visit My Dify Workflow",
    settingsSaved: "Settings saved successfully",
    saveFailed: "Save failed, please try again",
    previewEnvironment:
      "Current preview environment, settings not written to browser",
    quickSearchBookmarks: "Quick search bookmarks",
    quickBookmarkPage: "Quick bookmark current page",
    // 主界面相关
    searchPlaceholder: "Search in bookmarks",
    newBookmark: "New Bookmark",
    settings: "Settings",
    bookmarks: "Bookmarks",
    history: "History",
    folders: "Folders",
    noBookmarks: "No bookmarks",
    noHistory: "No history records",
    addFolder: "Add Folder",
    editFolder: "Edit Folder",
    deleteFolder: "Delete Folder",
    folderName: "Folder Name",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    // 关键词生成
    keywordsGenerated: "Keywords generated successfully",
    keywordGenerationFailed: "Failed to generate keywords",
    loadBookmarksFailed: "Failed to load bookmarks",
    openLinkFailed: "Failed to open link",
    getPageInfoFailed: "Failed to get page information",
    addBookmarkFailed: "Failed to add bookmark",
    createFolderFailed: "Failed to create folder",
    moveFailed: "Move failed",
    moveSuccess: "Moved successfully",
    cannotMoveToChild: "Cannot move to its own child node",
    // 文件夹名称
    bookmarksBar: "Bookmarks Bar",
    otherBookmarks: "Other Bookmarks",
    mobileBookmarks: "Mobile Bookmarks",
    unnamedFolder: "Unnamed Folder",
    rootDirectory: "Root Directory",
    // 搜索和显示
    noMatchingBookmarks: "No matching bookmarks found",
    noBookmarksYet: "No bookmarks yet",
    // 表单相关
    title: "Title",
    url: "URL",
    description: "Description",
    saveToFolder: "Save to Folder",
    selectFolder: "Select Folder",
    newFolderName: "New Folder Name",
    keywords: "Keywords",
    add: "Add",
    create: "Create",
    newFolder: "New Folder",
    // 验证消息
    pleaseEnterTitle: "Please enter title",
    pleaseEnterUrl: "Please enter URL",
    pleaseEnterFolderName: "Please enter folder name",
    // 工具提示
    openMainInterface: "Open Main Interface",
    addBookmark: "Add Bookmark",
    pageTitle: "Page Title",
    // 其他
    defaultCategory: "Default",
    // 主界面补充
    expandBookmarks: "Expand bookmarks",
    collapseBookmarks: "Collapse bookmarks",
    expand: "Expand",
    collapse: "Collapse",
    subfolders: "Subfolders",
    foldersAll: "All Folders",
    noMatchingContent: "No matching content",
    emptyFolder: "This folder is empty",
    tryDifferentKeywords: "Try different keywords or check your spelling",
    folderEmptyHint:
      "This folder has no content yet. Add bookmarks from your browser.",
    save: "Save",
    searchBookmarks: "Search bookmarks...",
    visitAndCount: "Visit and count",
    loading: "Loading...",
    includingSubfolders: "Including subfolders",
    includingAllFolders: "Including all folders",
    goToSettings: "Go to Settings",
    backToTop: "Back to Top",
    tips: "Tips",
    createFolderGuide:
      "Create bookmark folders in your browser, then refresh this page to start managing your smart bookmarks.",
    directory: "Directory",
    expandMore: "Expand more",
    search: "Search",
    browse: "Browse",
    browseHint: "Click folders to expand; click bookmarks to open links",
    addCurrentPage: "Add Current Page",
    apiKeyNotConfigured: "API Key not configured",
    autoExtractedKeywords: "Auto-extracted keywords",
    clickTagToAdd: "Click a tag to add to keywords field",
    confirmDeleteFolder: "Delete this folder?",
    confirmDeleteBookmark: "Delete this bookmark?",
    tagsOptional: "Tags (comma separated, optional)",
    createFolder: "Create Folder",
    renameFolder: "Rename Folder",
    editBookmark: "Edit Bookmark",
  },
} as const;

// 当前语言状态（用于开发环境）
let currentLanguageState: SupportedLanguage = DEFAULT_LANGUAGE;

/**
 * 获取当前选择的语言
 */
export async function getCurrentLanguage(): Promise<SupportedLanguage> {
  // 先尝试从本地存储读取，确保刷新后立即生效
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const localLang = window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY,
      ) as SupportedLanguage | null;
      if (localLang) {
        currentLanguageState = localLang;
        return localLang;
      }
    }
  } catch (e) {
    console.warn("Failed to get language from localStorage:", e);
  }

  // 再尝试从 chrome.storage 读取（扩展环境）
  if (typeof chrome !== "undefined" && chrome.storage) {
    try {
      const result = await chrome.storage.sync.get(LANGUAGE_STORAGE_KEY);
      const savedLanguage =
        (result[LANGUAGE_STORAGE_KEY] as SupportedLanguage) || DEFAULT_LANGUAGE;
      currentLanguageState = savedLanguage;
      return savedLanguage;
    } catch (error) {
      console.warn("Failed to get language from chrome.storage:", error);
      return currentLanguageState;
    }
  }

  // 回退到当前内存状态
  return currentLanguageState;
}

/**
 * 设置当前语言
 */
export async function setCurrentLanguage(
  language: SupportedLanguage,
): Promise<void> {
  currentLanguageState = language;
  // 写入本地存储，保证刷新后立即使用所选语言
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  } catch (e) {
    console.warn("Failed to save language to localStorage:", e);
  }
  if (typeof chrome !== "undefined" && chrome.storage) {
    try {
      await chrome.storage.sync.set({ [LANGUAGE_STORAGE_KEY]: language });
    } catch (error) {
      console.warn("Failed to save language to storage:", error);
    }
  }
}

/**
 * 获取本地化消息
 * 优先使用 chrome.i18n，如果不可用则使用本地消息数据库
 */
export function getMessage(
  messageName: string,
  substitutions?: string | string[],
): string {
  // 1) 优先使用本地消息数据库（支持用户运行时切换语言）
  const messages = MESSAGES[currentLanguageState];
  if (messages && messageName in messages) {
    return (messages as any)[messageName];
  }

  // 2) 使用默认语言作为回退
  const defaultMessages = MESSAGES[DEFAULT_LANGUAGE];
  if (defaultMessages && messageName in defaultMessages) {
    return (defaultMessages as any)[messageName];
  }

  // 3) 最后再尝试 chrome.i18n（仅作为兜底，避免被浏览器 UI 语言强制覆盖）
  if (typeof chrome !== "undefined" && chrome.i18n) {
    try {
      const message = chrome.i18n.getMessage(messageName, substitutions);
      if (message) {
        return message;
      }
    } catch (error) {
      console.warn("Failed to get i18n message:", error);
    }
  }

  // 4) 兜底返回键名
  return messageName;
}

/**
 * 获取当前浏览器的 UI 语言
 */
export function getUILanguage(): string {
  if (typeof chrome !== "undefined" && chrome.i18n) {
    return chrome.i18n.getUILanguage();
  }
  return "zh-CN";
}

/**
 * 检测并设置初始语言
 * 优先级：用户设置 > 浏览器语言 > 默认语言
 */
export async function detectAndSetInitialLanguage(): Promise<SupportedLanguage> {
  // 1) 先读本地存储
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const localLang = window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY,
      ) as SupportedLanguage | null;
      if (localLang) {
        currentLanguageState = localLang;
        return localLang;
      }
    }
  } catch (e) {
    console.warn("Failed to get saved language from localStorage:", e);
  }

  // 2) 再读 chrome.storage（扩展环境）
  if (typeof chrome !== "undefined" && chrome.storage) {
    try {
      const result = await chrome.storage.sync.get(LANGUAGE_STORAGE_KEY);
      if (result[LANGUAGE_STORAGE_KEY]) {
        const language = result[LANGUAGE_STORAGE_KEY];
        currentLanguageState = language;
        return language;
      }
    } catch (error) {
      console.warn("Failed to get saved language:", error);
    }
  }

  // 如果没有保存的设置，根据浏览器语言自动选择
  const uiLanguage = getUILanguage().toLowerCase();
  let detectedLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

  if (uiLanguage.includes("en")) {
    detectedLanguage = "en";
  } else if (uiLanguage.includes("zh")) {
    detectedLanguage = "zh_CN";
  }

  // 保存检测到的语言
  await setCurrentLanguage(detectedLanguage);
  return detectedLanguage;
}

/**
 * 同步获取当前语言（用于开发环境）
 */
export function getCurrentLanguageSync(): SupportedLanguage {
  return currentLanguageState;
}
