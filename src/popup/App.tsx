import React, { useState, useEffect } from "react";
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

const App: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkTree, setBookmarkTree] = useState<TreeNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPageInfo, setCurrentPageInfo] =
    useState<CurrentPageInfo | null>(null);
  const [bookmarkFolders, setBookmarkFolders] = useState<
    { id: string; title: string }[]
  >([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    loadBookmarks();
  }, []);

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
        const folders = extractFolders(bookmarkTree);

        setBookmarks(flatBookmarks);
        setBookmarkTree(treeNodes.children || []);
        setBookmarkFolders(folders);
      }
    } catch (error) {
      console.error("加载书签失败:", error);
      message.error("加载书签失败");
    } finally {
      setLoading(false);
    }
  };

  const parseBookmarkTitle = (title: string) => {
    // 解析标题中的关键词（格式：标题 #关键词1, 关键词2）
    const keywordMatch = title.match(/^(.+?)\s*#(.+)$/);
    if (keywordMatch) {
      const cleanTitle = keywordMatch[1].trim();
      const keywords = keywordMatch[2]
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);
      return { title: cleanTitle, keywords };
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
        category: "默认",
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
      return {
        key: node.id,
        title: node.title || "书签栏",
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
            ? "根目录"
            : node.id === "1"
            ? "书签栏"
            : node.id === "2"
            ? "其他书签"
            : "未命名文件夹"),
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

  const handleBookmarkClick = async (url: string) => {
    try {
      await chrome.tabs.create({ url });
      window.close(); // 关闭弹窗
    } catch (error) {
      console.error("打开链接失败:", error);
      message.error("打开链接失败");
    }
  };

  // const handleImportBookmarks = () => {
  //   message.info("导入功能开发中...");
  // };

  const handleTreeSelect = (_selectedKeys: React.Key[], info: any) => {
    const node = info.node;
    if (node.isLeaf && node.url) {
      handleBookmarkClick(node.url);
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
        message.error("获取页面信息失败");
      }
    } catch (error) {
      console.error("获取页面信息失败:", error);
      message.error("获取页面信息失败");
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
        message.error("添加收藏失败");
      }
    } catch (error) {
      console.error("添加收藏失败:", error);
      message.error("添加收藏失败");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.error("请输入文件夹名称");
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: "createFolder",
        title: newFolderName.trim(),
        parentId: "1", // 在书签栏下创建
      });

      if (response.success) {
        message.success("文件夹创建成功！");
        setNewFolderName("");
        // 重新加载书签以更新文件夹列表
        loadBookmarks();
        // 设置新创建的文件夹为选中项
        form.setFieldValue("folder", response.data.id);
      } else {
        message.error("创建文件夹失败");
      }
    } catch (error) {
      console.error("创建文件夹失败:", error);
      message.error("创建文件夹失败");
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

  const tabItems = [
    {
      key: "search",
      label: (
        <span>
          <SearchOutlined />
          搜索
        </span>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              placeholder="搜索收藏夹..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <div className="flex-1 overflow-auto space-y-2 max-h-96">
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : filteredBookmarks.length > 0 ? (
              filteredBookmarks.slice(0, 10).map((bookmark) => (
                <Card
                  key={bookmark.id}
                  size="small"
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleBookmarkClick(bookmark.url)}
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
                        {bookmark.tags.length > 0 && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">
                            #{bookmark.tags.slice(0, 3).join(", ")}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {bookmark.url}
                      </p>
                      {bookmark.tags.length > 3 && (
                        <div className="flex gap-1 mt-2">
                          {bookmark.tags.slice(3).map((tag) => (
                            <Tag key={tag} color="blue">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "没有找到匹配的收藏" : "暂无收藏"}
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
          浏览
        </span>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <div className="text-sm text-gray-600 mb-2">
            点击文件夹展开，点击书签打开链接
          </div>
          <div className="flex-1 overflow-auto max-h-96">
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : bookmarkTree.length > 0 ? (
              <Tree
                treeData={bookmarkTree}
                onSelect={handleTreeSelect}
                showIcon
                defaultExpandAll={false}
                className="bg-white rounded-lg p-2"
              />
            ) : (
              <div className="text-center py-8 text-gray-500">暂无书签</div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Layout className="h-full bg-gray-50">
      <Header className="bg-white shadow-sm px-4 h-14 flex items-center">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-lg font-semibold text-gray-800 m-0">
            Smart Bookmarks
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
              title="打开主界面"
            >
              主界面
            </Button>
            {/* <Button
              type="text"
              icon={<ImportOutlined />}
              onClick={handleImportBookmarks}
              size="small"
            >
              导入
            </Button> */}
            <Button type="text" icon={<SettingOutlined />} size="small">
              设置
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="p-4 flex flex-col">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
          className="flex-1"
        />

        <div className="border-t pt-3 mt-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="w-full"
            onClick={getCurrentPageInfo}
          >
            添加当前页面
          </Button>
        </div>

        <Modal
          title="添加收藏"
          open={showAddModal}
          onCancel={() => {
            setShowAddModal(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText="添加"
          cancelText="取消"
          width={500}
        >
          <Form form={form} layout="vertical" onFinish={handleAddBookmark}>
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: "请输入标题" }]}
            >
              <Input placeholder="页面标题" />
            </Form.Item>

            <Form.Item
              name="url"
              label="网址"
              rules={[{ required: true, message: "请输入网址" }]}
            >
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <Input.TextArea placeholder="页面描述（可选）" rows={2} />
            </Form.Item>

            <Form.Item name="folder" label="保存到文件夹">
              <Select
                placeholder="选择文件夹"
                defaultValue="1"
                showSearch
                filterOption={(input, option) =>
                  String(option?.children || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space style={{ padding: "0 8px 4px" }}>
                      <Input
                        placeholder="新文件夹名称"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onPressEnter={handleCreateFolder}
                        style={{ width: "200px" }}
                      />
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={handleCreateFolder}
                      >
                        创建
                      </Button>
                    </Space>
                  </>
                )}
              >
                {bookmarkFolders
                  .filter((folder) => folder.id !== "0") // 过滤掉根目录
                  .map((folder) => (
                    <Select.Option key={folder.id} value={folder.id}>
                      {folder.title}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item name="keywords" label="关键词">
              <Select
                mode="tags"
                placeholder="自动提取的关键词（可编辑）"
                style={{ width: "100%" }}
                tokenSeparators={[","]}
                value={form.getFieldValue("keywords")}
                onChange={(value) => form.setFieldValue("keywords", value)}
              />
            </Form.Item>

            {currentPageInfo &&
              currentPageInfo.keywords &&
              currentPageInfo.keywords.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    自动提取的关键词（共 {currentPageInfo.keywords.length}{" "}
                    个）：
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
                    点击标签可添加到关键词字段
                  </div>
                </div>
              )}
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default App;
