import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  Layout,
  Card,
  Tag,
  Button,
  Input,
  Space,
  Popconfirm,
  message,
  Empty,
  Tooltip,
} from "antd";
import {
  DeleteOutlined,
  SearchOutlined,
  SettingOutlined,
  GlobalOutlined,
  DragOutlined,
  FolderOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../popup/index.css";

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

interface FolderItem {
  id: string;
  title: string;
  parentId?: string;
  children: BookmarkItem[];
  childFolders: FolderItem[];
  dateAdded?: number;
  order?: number;
}

// 可拖拽的文件夹卡片组件
const SortableFolderCard: React.FC<{
  folder: FolderItem;
  isCardView: boolean;
  onDelete: (id: string) => void;
  onBookmarkDelete: (id: string) => void;
  onFolderClick: (folder: FolderItem) => void;
}> = ({ folder, isCardView, onDelete, onBookmarkDelete, onFolderClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isCardView) {
    return (
      <div ref={setNodeRef} style={style} className="mb-4">
        <Card
          className="folder-card hover:shadow-lg transition-all duration-200"
          title={
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2"
                onClick={() => onFolderClick(folder)}
              >
                <FolderOutlined className="text-blue-600" />
                <span className="font-medium cursor-pointer hover:text-blue-600">
                  {folder.title}
                </span>
                <span className="text-xs text-gray-500">
                  ({folder.children.length})
                </span>
              </div>
              <Space>
                <div {...attributes} {...listeners} className="cursor-move p-1">
                  <DragOutlined className="text-gray-400" />
                </div>
                <Popconfirm
                  title="确定删除这个文件夹吗？"
                  onConfirm={() => onDelete(folder.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="text-red-500 hover:text-red-700"
                  />
                </Popconfirm>
              </Space>
            </div>
          }
          bodyStyle={{ padding: "8px 16px" }}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* 显示子文件夹 */}
            {folder.childFolders.slice(0, 3).map((subFolder) => (
              <div
                key={subFolder.id}
                className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200"
                onClick={() => onFolderClick(subFolder)}
              >
                <FolderOutlined className="text-blue-600 text-sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-blue-800 font-medium cursor-pointer hover:text-blue-600">
                    {subFolder.title}
                  </div>
                  <div className="text-xs text-blue-600">
                    {subFolder.children.length} 个书签
                  </div>
                </div>
                <span className="text-xs text-blue-500">文件夹</span>
              </div>
            ))}

            {/* 显示书签 */}
            {folder.children
              .slice(0, 6 - folder.childFolders.length)
              .map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                >
                  <img
                    src={bookmark.favicon}
                    alt="favicon"
                    className="w-4 h-4 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/default-favicon.png";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600"
                      onClick={() => window.open(bookmark.url, "_blank")}
                    >
                      {bookmark.title}
                    </div>
                    {bookmark.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {bookmark.tags.slice(0, 2).map((tag) => (
                          <Tag key={tag} color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <Popconfirm
                    title="确定删除这个书签吗？"
                    onConfirm={() => onBookmarkDelete(bookmark.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                    />
                  </Popconfirm>
                </div>
              ))}

            {folder.children.length + folder.childFolders.length > 6 && (
              <div className="text-center text-gray-500 text-sm py-2">
                还有 {folder.children.length + folder.childFolders.length - 6}{" "}
                个项目...
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  } else {
    // 简洁视图
    return (
      <div ref={setNodeRef} style={style} className="mb-3">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onFolderClick(folder)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FolderOutlined className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {folder.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {folder.children.length} 个书签
                    {folder.childFolders.length > 0 && (
                      <span className="ml-2 text-blue-600">
                        + {folder.childFolders.length} 个子文件夹
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Space>
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-move p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <DragOutlined className="text-gray-400" />
                </div>
                <Popconfirm
                  title="确定删除这个文件夹吗？"
                  onConfirm={() => onDelete(folder.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  />
                </Popconfirm>
              </Space>
            </div>

            {/* 显示前几个书签预览 */}
            {folder.children.length > 0 && (
              <div className="space-y-2">
                {folder.children.slice(0, 3).map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={bookmark.favicon}
                      alt="favicon"
                      className="w-4 h-4 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/default-favicon.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm text-gray-700 truncate cursor-pointer hover:text-blue-600"
                        onClick={() => window.open(bookmark.url, "_blank")}
                      >
                        {bookmark.title}
                      </div>
                    </div>
                  </div>
                ))}
                {folder.children.length > 3 && (
                  <div className="text-center text-xs text-gray-400 py-1">
                    还有 {folder.children.length - 3} 个书签...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

// 可拖拽的书签卡片组件
const SortableBookmarkCard: React.FC<{
  bookmark: BookmarkItem;
  onDelete: (id: string) => void;
  isCardView: boolean;
}> = ({ bookmark, onDelete, isCardView }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    window.open(bookmark.url, "_blank");
  };

  if (isCardView) {
    return (
      <div ref={setNodeRef} style={style}>
        <Card
          size="small"
          className="bookmark-card hover:shadow-lg transition-all duration-200 mb-3"
          bodyStyle={{ padding: "12px" }}
          extra={
            <Space>
              <div {...attributes} {...listeners} className="cursor-move p-1">
                <DragOutlined className="text-gray-400" />
              </div>
              <Popconfirm
                title="确定删除这个书签吗？"
                onConfirm={() => onDelete(bookmark.id)}
                okText="删除"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  className="text-red-500 hover:text-red-700"
                />
              </Popconfirm>
            </Space>
          }
        >
          <div className="flex items-start gap-3" onClick={handleClick}>
            <img
              src={bookmark.favicon}
              alt="favicon"
              className="w-5 h-5 mt-1 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/default-favicon.png";
              }}
            />
            <div className="flex-1 min-w-0 cursor-pointer">
              <h4 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                {bookmark.title}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-1">
                {bookmark.url}
              </p>
              {bookmark.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {bookmark.tags.slice(0, 4).map((tag) => (
                    <Tag key={tag} color="blue" className="text-xs">
                      {tag}
                    </Tag>
                  ))}
                  {bookmark.tags.length > 4 && (
                    <Tag color="default" className="text-xs">
                      +{bookmark.tags.length - 4}
                    </Tag>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  } else {
    // 简洁视图
    return (
      <div ref={setNodeRef} style={style} className="mb-2">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
          <div className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <img
                  src={bookmark.favicon}
                  alt="favicon"
                  className="w-8 h-8 rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/default-favicon.png";
                  }}
                />
              </div>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={handleClick}
              >
                <div className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                  {bookmark.title}
                </div>
                <div className="text-sm text-gray-500 truncate mt-1">
                  {bookmark.url}
                </div>
                {bookmark.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
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
              <div className="flex items-center gap-1">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-move p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <DragOutlined className="text-gray-400" />
                </div>
                <Popconfirm
                  title="确定删除这个书签吗？"
                  onConfirm={() => onDelete(bookmark.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  />
                </Popconfirm>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

const MainPage: React.FC = () => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCardView, setIsCardView] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadBookmarks();
  }, []);

  const parseBookmarkTitle = (title: string) => {
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

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getBookmarks",
      });

      if (response.success) {
        const bookmarkTree = response.data[0];
        const folderStructure = buildFolderStructure(bookmarkTree);
        setFolders(folderStructure);
      }
    } catch (error) {
      console.error("加载书签失败:", error);
      message.error("加载书签失败");
    } finally {
      setLoading(false);
    }
  };

  const buildFolderStructure = (
    node: chrome.bookmarks.BookmarkTreeNode
  ): FolderItem[] => {
    const folders: FolderItem[] = [];

    if (node.children) {
      node.children.forEach((child) => {
        if (child.children) {
          // 这是一个文件夹
          const bookmarks: BookmarkItem[] = [];
          const subFolders: FolderItem[] = [];

          child.children.forEach((grandChild) => {
            if (grandChild.url) {
              // 这是一个书签
              const { title, keywords } = parseBookmarkTitle(grandChild.title);
              bookmarks.push({
                id: grandChild.id,
                url: grandChild.url,
                title: title,
                favicon: `https://www.google.com/s2/favicons?domain=${
                  new URL(grandChild.url).hostname
                }`,
                tags: keywords,
                category: child.title,
                parentId: child.id,
                dateAdded: grandChild.dateAdded,
              });
            } else if (grandChild.children) {
              // 这是一个子文件夹，递归处理
              const subFolder = buildFolderStructure({
                children: [grandChild],
              } as any)[0];
              if (subFolder) {
                subFolders.push(subFolder);
              }
            }
          });

          folders.push({
            id: child.id,
            title: child.title,
            parentId: node.id,
            children: bookmarks,
            childFolders: subFolders,
            dateAdded: child.dateAdded,
            order: child.index || 0,
          });
        }
      });
    }

    return folders;
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await chrome.bookmarks.remove(bookmarkId);
      message.success("书签删除成功！");
      loadBookmarks(); // 重新加载书签
    } catch (error) {
      console.error("删除书签失败:", error);
      message.error("删除书签失败");
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    try {
      await chrome.bookmarks.removeTree(folderId);
      message.success("文件夹删除成功！");
      loadBookmarks();
    } catch (error) {
      console.error("删除文件夹失败:", error);
      message.error("删除文件夹失败");
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    setSelectedFolder(folder);
  };

  const handleBackToFolders = () => {
    setSelectedFolder(null);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      if (selectedFolder) {
        // 在文件夹内拖拽书签
        const oldIndex = selectedFolder.children.findIndex(
          (item) => item.id === active.id
        );
        const newIndex = selectedFolder.children.findIndex(
          (item) => item.id === over.id
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const newBookmarks = arrayMove(
            selectedFolder.children,
            oldIndex,
            newIndex
          );
          const updatedFolder = { ...selectedFolder, children: newBookmarks };
          setSelectedFolder(updatedFolder);

          // 更新folders状态
          const updatedFolders = folders.map((f) =>
            f.id === selectedFolder.id ? updatedFolder : f
          );
          setFolders(updatedFolders);

          // 同步更新Chrome浏览器中的书签顺序
          try {
            // 移动书签到新位置
            await chrome.bookmarks.move(active.id, {
              parentId: selectedFolder.id,
              index: newIndex,
            });
            message.success("书签顺序已更新");
          } catch (error) {
            console.error("更新书签顺序失败:", error);
            message.error("更新书签顺序失败");
          }
        }
      } else {
        // 拖拽文件夹
        const oldIndex = folders.findIndex((item) => item.id === active.id);
        const newIndex = folders.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newFolders = arrayMove(folders, oldIndex, newIndex);
          setFolders(newFolders);

          // 同步更新Chrome浏览器中的文件夹顺序
          try {
            // 移动文件夹到新位置
            await chrome.bookmarks.move(active.id, { index: newIndex });
            message.success("文件夹顺序已更新");
          } catch (error) {
            console.error("更新文件夹顺序失败:", error);
            message.error("更新文件夹顺序失败");
          }
        }
      }
    }
  };

  const getFilteredFolders = () => {
    if (!searchQuery) return folders;

    return folders.filter(
      (folder) =>
        folder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        folder.children.some(
          (bookmark) =>
            bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bookmark.tags.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
    );
  };

  const getFilteredBookmarks = () => {
    if (!selectedFolder || !searchQuery) return selectedFolder?.children || [];

    return selectedFolder.children.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  };

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header className="bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <GlobalOutlined className="text-2xl text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800 m-0">
              Smart Bookmarks
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Input
              placeholder={
                selectedFolder
                  ? `在 ${selectedFolder.title} 中搜索...`
                  : "搜索书签..."
              }
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
              allowClear
            />
            <div className="flex items-center space-x-2">
              <Tooltip title="卡片视图">
                <Button
                  type={isCardView ? "primary" : "default"}
                  icon={<AppstoreOutlined />}
                  onClick={() => setIsCardView(true)}
                />
              </Tooltip>
              <Tooltip title="列表视图">
                <Button
                  type={!isCardView ? "primary" : "default"}
                  icon={<BarsOutlined />}
                  onClick={() => setIsCardView(false)}
                />
              </Tooltip>
            </div>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              设置
            </Button>
          </div>
        </div>
      </Header>

      <Content className="max-w-7xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-6">
          {selectedFolder && (
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  type="link"
                  icon={<GlobalOutlined />}
                  onClick={handleBackToFolders}
                  className="p-0 h-auto"
                >
                  所有文件夹
                </Button>
                <span className="text-gray-400">/</span>
                <span className="text-lg font-medium">
                  {selectedFolder.title}
                </span>
                <span className="text-sm text-gray-500">
                  ({selectedFolder.children.length} 个书签)
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">加载中...</div>
            </div>
          ) : selectedFolder ? (
            // 显示文件夹内的书签
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={getFilteredBookmarks().map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {getFilteredBookmarks().length > 0 ? (
                  <div
                    className={
                      isCardView
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "space-y-2"
                    }
                  >
                    {getFilteredBookmarks().map((bookmark) => (
                      <SortableBookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onDelete={handleDeleteBookmark}
                        isCardView={isCardView}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty
                    description={
                      searchQuery ? "没有找到匹配的书签" : "此文件夹为空"
                    }
                    className="py-12"
                  />
                )}
              </SortableContext>
            </DndContext>
          ) : (
            // 显示文件夹列表
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={getFilteredFolders().map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {getFilteredFolders().length > 0 ? (
                  <div
                    className={
                      isCardView
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "space-y-2"
                    }
                  >
                    {getFilteredFolders().map((folder) => (
                      <SortableFolderCard
                        key={folder.id}
                        folder={folder}
                        isCardView={isCardView}
                        onDelete={handleFolderDelete}
                        onBookmarkDelete={handleDeleteBookmark}
                        onFolderClick={handleFolderClick}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty
                    description={
                      searchQuery ? "没有找到匹配的文件夹" : "暂无文件夹"
                    }
                    className="py-12"
                  />
                )}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Content>
    </Layout>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MainPage />
  </React.StrictMode>
);
