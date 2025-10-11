import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Input,
  Button,
  Card,
  Tag,
  Space,
  message,
  Tree,
  Tabs,
  Modal,
  Form,
  Select,
  Divider,
  TreeSelect,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  SettingOutlined,
  FolderOutlined,
  LinkOutlined,
  AppstoreOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { getMessage } from "../shared/i18n";
import { useLanguage } from "../shared/i18n/useLanguage";

const LAST_SELECTED_FOLDER_ID_KEY = "lastSelectedFolderId";
const { Header, Content } = Layout;

interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  tags: string[];
  category: string;
  parentId?: string;
  dateAdded?: number;
  visitCount?: number;
}

interface TreeNode {
  key: string;
  title: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
  url?: string;
}

interface CurrentPageInfo {
  url: string;
  title: string;
  favicon?: string;
  description: string;
  keywords: string[];
  content: string;
}

const t = (key: string) => getMessage(key);

const App: React.FC = () => {
  useLanguage(); // 初始化语言设置
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkTree, setBookmarkTree] = useState<TreeNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPageInfo, setCurrentPageInfo] =
    useState<CurrentPageInfo | null>(null);
  // 由 folderTreeData 替代原先的扁平文件夹列表
  const [folderTreeData, setFolderTreeData] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [form] = Form.useForm();
  // 仅在 TreeSelect 中展开顶层节点，提高性能
  const topLevelFolderKeys = useMemo(
    () => (folderTreeData || []).map((n: any) => n.value ?? n.key),
    [folderTreeData]
  );
  // 浏览页签右键新建文件夹所需状态
  const [showNewFolderModalBrowse, setShowNewFolderModalBrowse] =
    useState(false);
  const [contextFolderId, setContextFolderId] = useState<string | null>(null);
  const [contextFolderTitle, setContextFolderTitle] = useState<string>("");
  const [newFolderNameBrowse, setNewFolderNameBrowse] = useState<string>("");

  // Dify 设置与状态
  const [useDifyKeyword, setUseDifyKeyword] = useState<boolean>(false);
  const [difyApiKey, setDifyApiKey] = useState<string>("");
  const [difyBaseUrl, setDifyBaseUrl] = useState<string>("https://api.dify.ai");
  const [difyUserId, setDifyUserId] = useState<string>("sb-extension");
  const [difyLoading, setDifyLoading] = useState<boolean>(false);

  useEffect(() => {
    // 读取设置（在非扩展环境下忽略，便于预览）
    const anyWindow = globalThis as any;
    if (!anyWindow?.chrome?.storage?.sync) return;
    chrome.storage.sync
      .get({
        useDifyKeyword: false,
        difyApiKey: "",
        difyBaseUrl: "https://api.dify.ai",
        difyUserId: "sb-extension",
      })
      .then(({ useDifyKeyword, difyApiKey, difyBaseUrl, difyUserId }) => {
        setUseDifyKeyword(!!useDifyKeyword);
        setDifyApiKey(difyApiKey || "");
        setDifyBaseUrl(difyBaseUrl || "https://api.dify.ai");
        setDifyUserId(difyUserId || "sb-extension");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, []);

  // 使用 Dify 生成关键词
  const generateKeywordsWithDify = async () => {
    try {
      if (!useDifyKeyword) {
        message.info("已关闭 Dify 生成关键词，可在设置中开启");
        return;
      }
      if (!difyApiKey) {
        message.warning("请先在设置中配置 Dify API Key");
        return;
      }

      const formTitle = form.getFieldValue("title");
      const formUrl = form.getFieldValue("url");
      const formDesc = form.getFieldValue("description");

      const payloadInputs: any = {
        url: formUrl || currentPageInfo?.url,
        title: formTitle || currentPageInfo?.title,
        description: formDesc || currentPageInfo?.description,
        content: currentPageInfo?.content,
      };

      setDifyLoading(true);
      const base = (difyBaseUrl || "https://api.dify.ai").replace(/\/$/, "");
      const resp = await fetch(`${base}/v1/workflows/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${difyApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: payloadInputs,
          response_mode: "blocking",
          user: difyUserId || "sb-extension",
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`调用失败(${resp.status}): ${text}`);
      }
      const data: any = await resp.json();

      // 兼容多种返回结构，尽力抽取关键词
      let kws: string[] = [];
      const tryExtract = (v: any) => {
        if (!v) return [] as string[];
        if (Array.isArray(v)) return v.map(String);
        if (typeof v === "string") {
          return v
            .split(/[#,，、\n\r\t ]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (typeof v === "object") {
          // 遍历对象字段寻找 keywords 或 text
          if (v.keywords) return tryExtract(v.keywords);
          if (v.text) return tryExtract(v.text);
        }
        return [] as string[];
      };

      kws = [
        ...tryExtract(data?.data?.outputs?.keywords),
        ...tryExtract(data?.data?.text),
        ...tryExtract(data?.outputs?.keywords),
        ...tryExtract(data?.text),
      ];

      // 去重合并到表单
      const existing: string[] = form.getFieldValue("keywords") || [];
      const merged = Array.from(new Set([...existing, ...kws])).filter(Boolean);
      if (merged.length === 0) {
        message.info("未从 Dify 获取到有效关键词");
      }
      form.setFieldValue("keywords", merged);
      message.success(getMessage('keywordsGenerated'));
      } catch (e: any) {
        console.error(e);
        message.error(e?.message || getMessage('keywordGenerationFailed'));
    } finally {
      setDifyLoading(false);
    }
  };

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      // 从 chrome.bookmarks API 获取数据
      const response = await chrome.runtime.sendMessage({
        action: "getBookmarks",
      });

      if (response.success) {
        const bookmarkTree = response.data[0];
        const flatBookmarks = flattenBookmarkTree(bookmarkTree);
        const treeNodes = convertToTreeNodes(bookmarkTree);
        const folderTree = buildFolderTreeSelectData(bookmarkTree);

        setBookmarks(flatBookmarks);
        setBookmarkTree(treeNodes.children || []);
        // 移除旧的扁平文件夹状态更新
        setFolderTreeData(folderTree);

        // 记住上次选择的文件夹，若不存在则回退到书签栏
        const existsInTree = (nodes: any[], value: string): boolean => {
          for (const n of nodes) {
            if ((n.value ?? n.key) === value) return true;
            if (n.children && existsInTree(n.children, value)) return true;
          }
          return false;
        };
        const lastSaved =
          localStorage.getItem(LAST_SELECTED_FOLDER_ID_KEY) || "1";
        const initialFolder = existsInTree(folderTree, lastSaved)
          ? lastSaved
          : "1";
        form.setFieldValue("folder", initialFolder);
      }
    } catch (error) {
      console.error("加载书签失败:", error);
      message.error(getMessage('loadBookmarksFailed'));
    } finally {
      setLoading(false);
    }
  };

  const parseBookmarkTitle = (title: string) => {
    // 解析标题中的关键词（支持多种格式）
    // 格式1: 标题 #关键词1, 关键词2
    // 格式2: 标题 #关键词1 #关键词2
    // 格式3: 标题 #关键词1,关键词2
    // 格式4: 标题中包含冒号分隔的描述性内容

    // 先尝试匹配 # 开头的关键词
    const keywordMatch = title.match(/^(.+?)\s*#(.+)$/);
    if (keywordMatch) {
      const cleanTitle = keywordMatch[1].trim();
      const keywordString = keywordMatch[2];

      // 支持多种分隔符：逗号、空格
      const keywords = keywordString
        .split(/[,，\s]+/)
        .map((k) => k.trim())
        .filter((k) => k && k.length > 0);

      return { title: cleanTitle, keywords };
    }

    // 检查是否有冒号分隔的描述性内容（如：yanyiwu/nodejieba: "结巴"中文分词的Node.js版本）
    const colonMatch = title.match(/^(.+?):\s*(.+)$/);
    if (colonMatch) {
      const mainTitle = colonMatch[1].trim();
      const description = colonMatch[2].trim();

      // 从描述中提取关键词
      const descriptionWords = description
        .replace(/["""]/g, "") // 移除引号
        .split(/[\s,，。、]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 1 && word.length < 20);

      // 从主标题中提取关键词
      const titleWords = mainTitle
        .split(/[/\s\-_]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 1 && word.length < 20);

      const allKeywords = [...titleWords, ...descriptionWords].slice(0, 6);

      return {
        title: mainTitle,
        keywords: allKeywords,
      };
    }

    // 如果没有特殊格式，尝试从标题中提取有意义的词汇
    const words = title.split(/[\s\-_\/]+/);
    const potentialKeywords = words.filter(
      (word) =>
        word.length > 2 &&
        word.length < 20 &&
        !word.match(/^(https?|www\.|\.com|\.org|\.net|chrome|newtab)/) && // 排除URL和特殊页面
        !word.match(/^[0-9]+$/) // 排除纯数字
    );

    if (potentialKeywords.length > 0) {
      return {
        title,
        keywords: potentialKeywords.slice(0, 4), // 最多取4个潜在关键词
      };
    }

    return { title, keywords: [] };
  };

  const flattenBookmarkTree = (
    node: chrome.bookmarks.BookmarkTreeNode
  ): BookmarkItem[] => {
    const result: BookmarkItem[] = [];

    if (node.url) {
      const { title, keywords } = parseBookmarkTitle(node.title);

      result.push({
        id: node.id,
        url: node.url,
        title: title,
        favicon: `https://www.google.com/s2/favicons?domain=${
          new URL(node.url).hostname
        }`,
        tags: keywords, // 使用解析出的关键词作为标签
        category: getMessage('defaultCategory'),
        dateAdded: node.dateAdded,
        visitCount: getVisitCountFromTitle(node.title),
      });
    }

    if (node.children) {
      node.children.forEach((child) => {
        result.push(...flattenBookmarkTree(child));
      });
    }

    return result;
  };

  const convertToTreeNodes = (
    node: chrome.bookmarks.BookmarkTreeNode
  ): TreeNode => {
    if (node.url) {
      // 这是一个书签
      const { title, keywords } = parseBookmarkTitle(node.title);
      const displayTitle =
        keywords.length > 0
          ? `${title} #${keywords.slice(0, 2).join(", ")}`
          : title;

      return {
        key: node.id,
        title: displayTitle,
        icon: <LinkOutlined />,
        isLeaf: true,
        url: node.url,
      };
    } else {
      // 这是一个文件夹
      const children =
        node.children?.map((child) => convertToTreeNodes(child)) || [];
      const folderTitle =
        node.title ||
        (node.id === "1"
          ? getMessage('bookmarksBar')
        : node.id === "2"
        ? getMessage('otherBookmarks')
        : node.id === "3"
        ? getMessage('mobileBookmarks')
        : getMessage('unnamedFolder'));
      return {
        key: node.id,
        title: folderTitle,
        icon: <FolderOutlined />,
        children: children,
        isLeaf: false,
      };
    }
  };

  const extractFolders = (
    node: chrome.bookmarks.BookmarkTreeNode
  ): { id: string; title: string }[] => {
    const folders: { id: string; title: string }[] = [];

    // 添加当前节点（如果是文件夹）
    if (!node.url) {
      folders.push({
        id: node.id,
        title:
          node.title ||
          (node.id === "0"
            ? getMessage('rootDirectory')
        : node.id === "1"
        ? getMessage('bookmarksBar')
        : node.id === "2"
        ? getMessage('otherBookmarks')
        : getMessage('unnamedFolder')),
      });
    }

    // 递归处理子节点
    if (node.children) {
      node.children.forEach((child) => {
        folders.push(...extractFolders(child));
      });
    }

    return folders;
  };

  const handleBookmarkClick = async (id: string, url: string) => {
    try {
      // 从书签标题中解析当前计数与标签，计数+1并写回
      const nodes = await chrome.bookmarks.get(id);
      if (nodes && nodes[0]) {
        const currentTitle = nodes[0].title || "";
        const parsed = parseBookmarkTitle(currentTitle);
        const base = stripVisitCount(parsed.title);
        const currentCount = getVisitCountFromTitle(currentTitle) || 0;
        const newCount = currentCount + 1;
        const newTitle = buildTitleWithCountAndTags(
          base,
          newCount,
          parsed.keywords || []
        );
        await chrome.bookmarks.update(id, { title: newTitle });
      }
      await chrome.tabs.create({ url });
      window.close(); // 关闭弹窗
    } catch (error) {
      console.error("打开链接失败:", error);
      message.error(getMessage('openLinkFailed'));
    }
  };

  // const handleImportBookmarks = () => {
  //   message.info("导入功能开发中...");
  // };

  const handleTreeSelect = (_selectedKeys: React.Key[], info: any) => {
    const node = info.node;
    if (node.isLeaf && node.url) {
      handleBookmarkClick(node.key, node.url);
    }
  };

  const getCurrentPageInfo = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getCurrentPageInfo",
      });

      if (response.success) {
        const pageData = response.data;
        setCurrentPageInfo(pageData);

        // 设置表单值，确保关键词正确显示
        const formValues = {
          title: pageData.title,
          url: pageData.url,
          description: pageData.description,
          keywords: pageData.keywords || [],
          folder: "1", // 默认选择书签栏
        };

        console.log("设置表单值:", formValues);
        form.setFieldsValue(formValues);

        setShowAddModal(true);
      } else {
          message.error(getMessage('getPageInfoFailed'));
        }
      } catch (error) {
        console.error("获取页面信息失败:", error);
        message.error(getMessage('getPageInfoFailed'));
    }
  };

  const handleAddBookmark = async (values: any) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "addBookmark",
        title: values.title,
        url: values.url,
        parentId: values.folder,
        keywords: values.keywords || [], // 传递关键词
      });

      if (response.success) {
        message.success("收藏添加成功！");
        setShowAddModal(false);
        form.resetFields();
        setCurrentPageInfo(null);
        // 重新加载书签列表
        loadBookmarks();
      } else {
          message.error(getMessage('addBookmarkFailed'));
        }
      } catch (error) {
        console.error("添加收藏失败:", error);
        message.error(getMessage('addBookmarkFailed'));
    }
  };

  // 仅生成“文件夹”树，供 TreeSelect 使用
  const convertNodeToTreeSelect = (
    node: chrome.bookmarks.BookmarkTreeNode
  ): any | null => {
    if (node.url) return null; // 仅保留文件夹

    const title =
      node.title ||
      (node.id === "0"
        ? getMessage('rootDirectory')
        : node.id === "1"
        ? getMessage('bookmarksBar')
        : node.id === "2"
        ? getMessage('otherBookmarks')
        : node.id === "3"
        ? getMessage('mobileBookmarks')
        : getMessage('unnamedFolder'));

    const children = (node.children || [])
      .map((child) => convertNodeToTreeSelect(child))
      .filter(Boolean);

    return {
      title,
      value: node.id,
      key: node.id,
      children: children as any[],
    };
  };

  const buildFolderTreeSelectData = (
    root: chrome.bookmarks.BookmarkTreeNode
  ): any[] => {
    // 跳过根节点（id=0），使用其子节点作为顶层
    const topLevel = (root.children || [])
      .filter((n) => !n.url)
      .map((n) => convertNodeToTreeSelect(n))
      .filter(Boolean) as any[];
    return topLevel;
  };

  const handleCreateFolder = async (parentId?: string) => {
    if (!newFolderName.trim()) {
      message.error("请输入文件夹名称");
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: "createFolder",
        title: newFolderName.trim(),
        parentId: parentId || form.getFieldValue("folder") || "1", // 在当前选中节点下创建
      });

      if (response.success) {
        message.success("文件夹创建成功！");
        const createdId = response.data.id;
        setNewFolderName("");
        // 重新加载书签以更新文件夹列表
        loadBookmarks();
        // 设置新创建的文件夹为选中项，并记住
        form.setFieldValue("folder", createdId);
        localStorage.setItem(LAST_SELECTED_FOLDER_ID_KEY, String(createdId));
      } else {
        message.error(getMessage('createFolderFailed'));
      }
    } catch (error) {
      console.error("创建文件夹失败:", error);
      message.error(getMessage('createFolderFailed'));
    }
  };

  // 浏览页签：右键在某个文件夹下新建
  const handleTreeRightClick = (info: any) => {
    const node = info.node as TreeNode & { title: string };
    if (!node.isLeaf) {
      setContextFolderId(String(node.key));
      setContextFolderTitle(String(node.title));
      setShowNewFolderModalBrowse(true);
    }
  };

  const handleConfirmCreateFolderInBrowse = async () => {
    if (!newFolderNameBrowse.trim() || !contextFolderId) {
      message.error(getMessage('pleaseEnterFolderName'));
      return;
    }
    try {
      const response = await chrome.runtime.sendMessage({
        action: "createFolder",
        title: newFolderNameBrowse.trim(),
        parentId: contextFolderId,
      });
      if (response.success) {
        message.success(getMessage('createFolderSuccess'));
        setShowNewFolderModalBrowse(false);
        setNewFolderNameBrowse("");
        // 刷新树
        loadBookmarks();
      } else {
        message.error(getMessage('createFolderFailed'));
      }
    } catch (e) {
      console.error(e);
      message.error(getMessage('createFolderFailed'));
    }
  };

  // 浏览页签：拖拽移动书签/文件夹
  const findTreeNode = (nodes: TreeNode[], key: string): TreeNode | null => {
    for (const n of nodes) {
      if (n.key === key) return n;
      if (n.children) {
        const found = findTreeNode(n.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const collectDescendantKeys = (node: TreeNode | null, acc: Set<string>) => {
    if (!node) return;
    for (const c of node.children || []) {
      acc.add(c.key);
      collectDescendantKeys(c, acc);
    }
  };

  const isDescendantKey = (ancestorKey: string, targetKey: string): boolean => {
    const ancestor = findTreeNode(bookmarkTree, ancestorKey);
    const acc = new Set<string>();
    collectDescendantKeys(ancestor, acc);
    return acc.has(targetKey);
  };

  const allowTreeDrop = ({ dropNode, dropPosition }: any) => {
    // 仅允许"放到节点内部"且目标是文件夹
    return dropPosition === 0 && dropNode && dropNode.isLeaf === false;
  };

  const handleTreeDrop = async (info: any) => {
    if (info.dropToGap) return; // 不处理间隙放置
    const dragKey = String(info.dragNode.key);
    const targetKey = String(info.node.key);
    if (dragKey === targetKey) return;
    if (isDescendantKey(dragKey, targetKey)) {
      message.error("不能移动到自己的子节点下");
      return;
    }
    try {
      const response = await chrome.runtime.sendMessage({
        action: "moveBookmark",
        id: dragKey,
        parentId: targetKey,
      });
      if (response.success) {
        message.success("移动成功");
        loadBookmarks();
      } else {
        message.error("移动失败");
      }
    } catch (e) {
      console.error(e);
      message.error("移动失败");
    }
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const query = searchQuery.toLowerCase();
    return (
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url.toLowerCase().includes(query) ||
      bookmark.tags.some((tag) => tag.toLowerCase().includes(query)) // 支持关键词搜索
    );
  });

  const displayList = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length > 0) {
      return filteredBookmarks.slice(0, 10);
    }
    const hasAnyCount = bookmarks.some((b) => (b.visitCount || 0) > 0);
    const base = [...bookmarks];
    if (hasAnyCount) {
      return base
        .sort(
          (a, b) =>
            (b.visitCount || 0) - (a.visitCount || 0) ||
            (b.dateAdded || 0) - (a.dateAdded || 0)
        )
        .slice(0, 10);
    }
    // 都没有计数时，按最新时间排序
    return base
      .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
      .slice(0, 10);
  }, [bookmarks, filteredBookmarks, searchQuery]);

  const tabItems = [
    {
      key: "search",
      label: (
        <span>
          <SearchOutlined />
          {t('search')}
        </span>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              placeholder={t('searchBookmarks')}
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-auto space-y-2 max-h-86 no-scrollbar">
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : displayList.length > 0 ? (
              displayList.map((bookmark) => (
                <Card
                  key={bookmark.id}
                  size="small"
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleBookmarkClick(bookmark.id, bookmark.url)}
                  bodyStyle={{ padding: "12px" }}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={bookmark.favicon}
                      alt="favicon"
                      className="w-4 h-4 mt-1 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/default-favicon.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {bookmark.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {bookmark.url}
                      </p>
                      {bookmark.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {bookmark.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          {bookmark.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{bookmark.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? t('noMatchingBookmarks') : t('noBookmarksYet')}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "browse",
      label: (
        <span>
          <AppstoreOutlined />
          {t('browse')}
        </span>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <div className="text-sm text-gray-600 mb-2">
            {t('browseHint')}
          </div>
          <div className="flex-1 overflow-auto max-h-96 no-scrollbar">
            {loading ? (
              <div className="text-center py-8 text-gray-500">{t('loading')}</div>
            ) : bookmarkTree.length > 0 ? (
              <Tree
                treeData={bookmarkTree}
                onSelect={handleTreeSelect}
                showIcon
                defaultExpandAll={false}
                className="bg-white rounded-lg p-2"
                draggable
                allowDrop={allowTreeDrop}
                onDrop={handleTreeDrop}
                onRightClick={handleTreeRightClick}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">{t('noBookmarksYet')}</div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Layout className="h-full bg-gray-50 overflow-hidden">
      <Header className="bg-white shadow-sm px-4 h-14 flex items-center">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-lg font-semibold text-gray-800 m-0">
            {t('extensionName')}
          </h1>
          <Space>
            <Button
              type="text"
              icon={<GlobalOutlined />}
              onClick={() =>
                chrome.tabs.create({
                  url: chrome.runtime.getURL("src/main/index.html"),
                })
              }
              size="small"
              title={t('openMainInterface')}
              aria-label={t('openMainInterface')}
            />
            <Button
              type="text"
              icon={<SettingOutlined />}
              size="small"
              onClick={() => chrome.runtime.openOptionsPage?.()}
              title={t('settings')}
              aria-label={t('settings')}
            />
          </Space>
        </div>
      </Header>

      <Content className="p-4 flex flex-col pb-20 overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
          className="flex-1"
        />

        <div className="fixed left-0 right-0 bottom-0 p-3 bg-white border-t shadow-md z-10">
          <div className="px-4">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="w-full"
              onClick={getCurrentPageInfo}
            >
              {t('addCurrentPage')}
            </Button>
          </div>
        </div>

        <Modal
          title={getMessage('addBookmark')}
          open={showAddModal}
          onCancel={() => {
            setShowAddModal(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText={getMessage('add')}
          cancelText={getMessage('cancel')}
          width={500}
        >
          <Form form={form} layout="vertical" onFinish={handleAddBookmark}>
            <Form.Item
              name="title"
              label={getMessage('title')}
              rules={[{ required: true, message: getMessage('pleaseEnterTitle') }]}
            >
              <Input placeholder={getMessage('pageTitle')} />
            </Form.Item>

            <Form.Item
              name="url"
              label={getMessage('url')}
              rules={[{ required: true, message: getMessage('pleaseEnterUrl') }]}
            >
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item name="description" label={getMessage('description')}>
              <Input.TextArea placeholder={getMessage('pageDescriptionOptional')} rows={2} />
            </Form.Item>

            <Form.Item name="folder" label={getMessage('saveToFolder')}>
              <TreeSelect
                placeholder={getMessage('selectFolder')}
                value={form.getFieldValue("folder") || "1"}
                treeData={folderTreeData}
                onChange={(value) => {
                  form.setFieldValue("folder", value);
                  localStorage.setItem(
                    LAST_SELECTED_FOLDER_ID_KEY,
                    String(value)
                  );
                }}
                showSearch
                treeNodeFilterProp="title"
                filterTreeNode={(input, node) =>
                  String(node?.title || "")
                    .toLowerCase()
                    .includes(String(input).toLowerCase())
                }
                treeDefaultExpandedKeys={topLevelFolderKeys}
                style={{ width: "100%" }}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space style={{ padding: "0 8px 4px" }}>
                      <Input
                        placeholder={getMessage('newFolderName')}
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onPressEnter={() =>
                          handleCreateFolder(
                            form.getFieldValue("folder") || "1"
                          )
                        }
                        style={{ width: "200px" }}
                      />
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          handleCreateFolder(
                            form.getFieldValue("folder") || "1"
                          )
                        }
                      >
                        {getMessage('create')}
                      </Button>
                    </Space>
                  </>
                )}
              />
            </Form.Item>

            <Form.Item name="keywords" label={getMessage('keywords')}>
              <Select
                mode="tags"
                placeholder={getMessage('autoExtractedKeywordsEditable')}
                style={{ width: "100%" }}
                tokenSeparators={[","]}
                value={form.getFieldValue("keywords")}
                onChange={(value) => form.setFieldValue("keywords", value)}
              />
            </Form.Item>
            <div className="-mt-2 mb-3">
              <Space size="small">
                <Button
                  size="small"
                  onClick={generateKeywordsWithDify}
                  loading={difyLoading}
                  disabled={!useDifyKeyword || !difyApiKey}
                >
                  用 Dify 生成关键词
                </Button>
                {!useDifyKeyword && (
                  <span className="text-xs text-gray-400">已在设置中关闭</span>
                )}
                {useDifyKeyword && !difyApiKey && (
                  <span className="text-xs text-red-400">{t('apiKeyNotConfigured')}</span>
                )}
              </Space>
            </div>

            {currentPageInfo &&
              currentPageInfo.keywords &&
              currentPageInfo.keywords.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {t('autoExtractedKeywords')} ({currentPageInfo.keywords.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentPageInfo.keywords.map((keyword, index) => (
                      <Tag
                        key={index}
                        color="blue"
                        className="mb-1 cursor-pointer"
                        onClick={() => {
                          const currentKeywords =
                            form.getFieldValue("keywords") || [];
                          if (!currentKeywords.includes(keyword)) {
                            const newKeywords = [...currentKeywords, keyword];
                            form.setFieldValue("keywords", newKeywords);
                          }
                        }}
                      >
                        {keyword}
                      </Tag>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('clickTagToAdd')}
                  </div>
                </div>
              )}
          </Form>
        </Modal>

        {/* 浏览页签：右键新建文件夹弹窗 */}
        <Modal
          title={
            contextFolderTitle
              ? `在「${contextFolderTitle}」中创建文件夹`
              : "新建文件夹"
          }
          open={showNewFolderModalBrowse}
          onCancel={() => {
            setShowNewFolderModalBrowse(false);
            setNewFolderNameBrowse("");
          }}
          onOk={handleConfirmCreateFolderInBrowse}
          okText="创建"
          cancelText="取消"
        >
          <Input
            placeholder="新文件夹名称"
            value={newFolderNameBrowse}
            onChange={(e) => setNewFolderNameBrowse(e.target.value)}
            onPressEnter={handleConfirmCreateFolderInBrowse}
          />
        </Modal>
      </Content>
    </Layout>
  );
};

export default App;

// 访问计数解析/构建辅助，与主界面逻辑保持一致
const getVisitCountFromTitle = (title: string): number => {
  const m = title.match(/\((\d+)\)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
};
const stripVisitCount = (title: string): string => {
  return title.replace(/\s*\(\d+\)\s*$/, "");
};
const buildTitleWithCountAndTags = (
  baseTitle: string,
  count: number,
  tags: string[]
): string => {
  const countStr = count > 0 ? ` (${count})` : "";
  const tagsStr = tags && tags.length ? ` #${tags.slice(0, 5).join(", ")}` : "";
  return `${baseTitle.trim()}${countStr}${tagsStr}`;
};
