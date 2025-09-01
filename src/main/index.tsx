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
            {/* 显示所有子文件夹 */}
            {folder.childFolders.map((subFolder) => (
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
                    {subFolder.childFolders.length > 0 && (
                      <span className="ml-1">+ {subFolder.childFolders.length} 个子文件夹</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-blue-500">文件夹</span>
              </div>
            ))}

            {/* 显示所有书签 */}
            {folder.children.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded group"
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
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {bookmark.tags.map((tag) => (
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
          </div>
        </Card>
      </div>
    );
  } else {
    // 简洁视图
    return (
      <div ref={setNodeRef} style={style} className="mb-4">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => onFolderClick(folder)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FolderOutlined className="text-white text-xl" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
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

            {/* 显示所有子文件夹 */}
            {folder.childFolders.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="text-sm font-medium text-gray-600 mb-2">子文件夹</div>
                {folder.childFolders.map((subFolder) => (
                  <div
                    key={subFolder.id}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    onClick={() => onFolderClick(subFolder)}
                  >
                    <FolderOutlined className="text-blue-600 text-lg" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-blue-800 font-medium hover:text-blue-600">
                        {subFolder.title}
                      </div>
                      <div className="text-xs text-blue-600">
                        {subFolder.children.length} 个书签
                        {subFolder.childFolders.length > 0 && (
                          <span className="ml-1">+ {subFolder.childFolders.length} 个子文件夹</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-blue-500 bg-blue-200 px-2 py-1 rounded">文件夹</span>
                  </div>
                ))}
              </div>
            )}

            {/* 显示所有书签预览 */}
            {folder.children.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600 mb-2">书签</div>
                {folder.children.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <img
                      src={bookmark.favicon}
                      alt="favicon"
                      className="w-5 h-5 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/default-favicon.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm text-gray-700 truncate cursor-pointer hover:text-blue-600 font-medium"
                        onClick={() => window.open(bookmark.url, "_blank")}
                      >
                        {bookmark.title}
                      </div>
                      {bookmark.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {bookmark.tags.map((tag) => (
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
              const subFolderBookmarks: BookmarkItem[] = [];
              const subFolderChildren: FolderItem[] = [];
              
              grandChild.children.forEach((greatGrandChild) => {
                if (greatGrandChild.url) {
                  // 这是一个书签
                  const { title, keywords } = parseBookmarkTitle(greatGrandChild.title);
                  subFolderBookmarks.push({
                    id: greatGrandChild.id,
                    url: greatGrandChild.url,
                    title: title,
                    favicon: `https://www.google.com/s2/favicons?domain=${
                      new URL(greatGrandChild.url).hostname
                    }`,
                    tags: keywords,
                    category: grandChild.title,
                    parentId: grandChild.id,
                    dateAdded: greatGrandChild.dateAdded,
                  });
                } else if (greatGrandChild.children) {
                  // 递归处理更深层的文件夹
                  const deeperSubFolderBookmarks: BookmarkItem[] = [];
                  const deeperSubFolderChildren: FolderItem[] = [];
                  
                  greatGrandChild.children.forEach((deepChild) => {
                    if (deepChild.url) {
                      const { title, keywords } = parseBookmarkTitle(deepChild.title);
                      deeperSubFolderBookmarks.push({
                        id: deepChild.id,
                        url: deepChild.url,
                        title: title,
                        favicon: `https://www.google.com/s2/favicons?domain=${
                          new URL(deepChild.url).hostname
                        }`,
                        tags: keywords,
                        category: greatGrandChild.title,
                        parentId: greatGrandChild.id,
                        dateAdded: deepChild.dateAdded,
                      });
                    } else if (deepChild.children) {
                      // 对于更深层的嵌套，使用递归
                      const evenDeeperFolders = buildFolderStructure({
                        children: [deepChild],
                      } as any);
                      deeperSubFolderChildren.push(...evenDeeperFolders);
                    }
                  });
                  
                  subFolderChildren.push({
                    id: greatGrandChild.id,
                    title: greatGrandChild.title,
                    parentId: grandChild.id,
                    children: deeperSubFolderBookmarks,
                    childFolders: deeperSubFolderChildren,
                    dateAdded: greatGrandChild.dateAdded,
                    order: greatGrandChild.index || 0,
                  });
                }
              });
              
              subFolders.push({
                id: grandChild.id,
                title: grandChild.title,
                parentId: child.id,
                children: subFolderBookmarks,
                childFolders: subFolderChildren,
                dateAdded: grandChild.dateAdded,
                order: grandChild.index || 0,
              });
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
      <Header className="bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-between">
        <div className="flex items-center justify-between w-full">
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
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "grid grid-cols-1 lg:grid-cols-2 gap-4"
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
