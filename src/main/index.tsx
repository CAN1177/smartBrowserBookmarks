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
} from "antd";
import {
  DeleteOutlined,
  SearchOutlined,
  SettingOutlined,
  GlobalOutlined,
  DragOutlined,
  FolderOutlined,
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
  onDelete: (id: string) => void;
  onBookmarkDelete: (id: string) => void;
  onFolderClick: (folder: FolderItem) => void;
  searchQuery?: string;
  highlightText?: (text: string, query: string) => React.ReactNode;
}> = ({
  folder,
  onDelete,
  onBookmarkDelete,
  onFolderClick,
  searchQuery,
  highlightText,
}) => {
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

  // 只使用列表视图
  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/60 overflow-hidden group hover:border-blue-200/50">
        <div className="p-6 bg-gradient-to-br from-blue-50/30 to-indigo-50/20">
          <div className="flex items-center justify-between mb-6">
            <div
              className="flex items-center gap-5 cursor-pointer group"
              onClick={() => onFolderClick(folder)}
            >
              <div className="w-18 h-18 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                <FolderOutlined className="text-white text-3xl drop-shadow-sm" />
              </div>
              <div>
                <div className="font-bold text-2xl text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                  {folder.title}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-200/50 shadow-sm">
                    📄 {folder.children.length} 个书签
                  </span>
                  {folder.childFolders.length > 0 && (
                    <span className="text-sm text-blue-600 bg-blue-100/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-blue-200/50 shadow-sm">
                      📁 + {folder.childFolders.length} 个子文件夹
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-move p-3 hover:bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-gray-200/50"
              >
                <DragOutlined className="text-gray-500 text-lg" />
              </div>
              <Popconfirm
                title="确定删除这个文件夹吗？"
                onConfirm={() => onDelete(folder.id)}
                okText="删除"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="large"
                  icon={<DeleteOutlined />}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-red-200/50"
                />
              </Popconfirm>
            </div>
          </div>

          {/* 显示所有子文件夹 */}
          {folder.childFolders.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium text-gray-600 mb-2">
                子文件夹
              </div>
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
                        <span className="ml-1">
                          + {subFolder.childFolders.length} 个子文件夹
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-blue-500 bg-blue-200 px-2 py-1 rounded">
                    文件夹
                  </span>
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
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                    searchQuery &&
                    highlightText &&
                    (bookmark.title
                      .toLowerCase()
                      .includes(searchQuery!.toLowerCase()) ||
                      bookmark.url
                        .toLowerCase()
                        .includes(searchQuery!.toLowerCase()) ||
                      bookmark.tags.some((tag) =>
                        tag.toLowerCase().includes(searchQuery!.toLowerCase())
                      ))
                      ? "bg-green-50 border border-green-200 hover:bg-green-100"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
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
                      {searchQuery && highlightText
                        ? highlightText!(bookmark.title, searchQuery!)
                        : bookmark.title}
                    </div>
                    {bookmark.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {bookmark.tags.map((tag) => (
                          <Tag key={tag} color="blue">
                            {searchQuery && highlightText
                              ? highlightText!(tag, searchQuery!)
                              : tag}
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
};

// 可拖拽的书签卡片组件
const SortableBookmarkCard: React.FC<{
  bookmark: BookmarkItem;
  onDelete: (id: string) => void;
  searchQuery?: string;
  highlightText?: (text: string, query: string) => React.ReactNode;
}> = ({ bookmark, onDelete, searchQuery, highlightText }) => {
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

  // 只使用列表视图
  if (false) {
    return (
      <div ref={setNodeRef} style={style}>
        <Card
          size="small"
          className={`bookmark-card hover:shadow-lg transition-all duration-200 mb-3 ${
            searchQuery &&
            highlightText &&
            (bookmark.title
              .toLowerCase()
              .includes(searchQuery!.toLowerCase()) ||
              bookmark.url.toLowerCase().includes(searchQuery!.toLowerCase()) ||
              bookmark.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery!.toLowerCase())
              ))
              ? "bg-green-50 border-green-200"
              : ""
          }`}
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
                {searchQuery && highlightText
                  ? highlightText!(bookmark.title, searchQuery!)
                  : bookmark.title}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-1">
                {bookmark.url}
              </p>
              {bookmark.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {bookmark.tags.slice(0, 4).map((tag) => (
                    <Tag key={tag} color="blue" className="text-xs">
                      {searchQuery && highlightText
                        ? highlightText!(tag, searchQuery!)
                        : tag}
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
                  {searchQuery && highlightText
                    ? highlightText(bookmark.title, searchQuery)
                    : bookmark.title}
                </div>
                <div className="text-sm text-gray-500 truncate mt-1">
                  {searchQuery && highlightText
                    ? highlightText(bookmark.url, searchQuery)
                    : bookmark.url}
                </div>
                {bookmark.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {bookmark.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        #
                        {searchQuery && highlightText
                          ? highlightText(tag, searchQuery)
                          : tag}
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
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [folderPath, setFolderPath] = useState<FolderItem[]>([]);

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
                  const { title, keywords } = parseBookmarkTitle(
                    greatGrandChild.title
                  );
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
                      const { title, keywords } = parseBookmarkTitle(
                        deepChild.title
                      );
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

    // 检查当前文件夹是否已经在路径中
    const currentIndex = folderPath.findIndex((f) => f.id === folder.id);
    if (currentIndex !== -1) {
      // 如果文件夹已经在路径中，截断到该位置
      setFolderPath((prev) => prev.slice(0, currentIndex + 1));
    } else {
      // 如果文件夹不在路径中，添加到路径末尾
      setFolderPath((prev) => [...prev, folder]);
    }
  };

  const handleNavigateToFolder = (index: number) => {
    if (index === -1) {
      // 回到根目录
      setSelectedFolder(null);
      setFolderPath([]);
    } else {
      // 回到指定层级的文件夹
      const targetFolder = folderPath[index];
      setSelectedFolder(targetFolder);
      setFolderPath(folderPath.slice(0, index + 1));
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      if (selectedFolder) {
        // 在文件夹内拖拽 - 需要区分是拖拽子文件夹还是书签
        const isActiveBookmark = selectedFolder.children.some(
          (item) => item.id === active.id
        );
        const isOverBookmark = selectedFolder.children.some(
          (item) => item.id === over.id
        );
        const isActiveSubFolder = selectedFolder.childFolders.some(
          (item) => item.id === active.id
        );
        const isOverSubFolder = selectedFolder.childFolders.some(
          (item) => item.id === over.id
        );

        if (isActiveBookmark && isOverBookmark) {
          // 拖拽书签
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
        } else if (isActiveSubFolder && isOverSubFolder) {
          // 拖拽子文件夹
          const oldIndex = selectedFolder.childFolders.findIndex(
            (item) => item.id === active.id
          );
          const newIndex = selectedFolder.childFolders.findIndex(
            (item) => item.id === over.id
          );

          if (oldIndex !== -1 && newIndex !== -1) {
            const newSubFolders = arrayMove(
              selectedFolder.childFolders,
              oldIndex,
              newIndex
            );
            const updatedFolder = {
              ...selectedFolder,
              childFolders: newSubFolders,
            };
            setSelectedFolder(updatedFolder);

            // 更新folders状态
            const updatedFolders = folders.map((f) =>
              f.id === selectedFolder.id ? updatedFolder : f
            );
            setFolders(updatedFolders);

            // 同步更新Chrome浏览器中的文件夹顺序
            try {
              await chrome.bookmarks.move(active.id, {
                parentId: selectedFolder.id,
                index: newIndex,
              });
              message.success("文件夹顺序已更新");
            } catch (error) {
              console.error("更新文件夹顺序失败:", error);
              message.error("更新文件夹顺序失败");
            }
          }
        }
      } else {
        // 拖拽顶级文件夹
        const oldIndex = folders.findIndex((item) => item.id === active.id);
        const newIndex = folders.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newFolders = arrayMove(folders, oldIndex, newIndex);
          setFolders(newFolders);

          // 同步更新Chrome浏览器中的文件夹顺序
          try {
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

  // 高亮搜索结果的函数
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    // 使用正则表达式进行全局匹配和高亮
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // 检查这个部分是否匹配查询（不区分大小写）
      const isMatch = part.toLowerCase() === query.toLowerCase();
      return isMatch ? (
        <mark
          key={index}
          className="bg-yellow-200 text-yellow-900 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      );
    });
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

  const getFilteredSubFolders = () => {
    if (!selectedFolder || !searchQuery)
      return selectedFolder?.childFolders || [];

    return selectedFolder.childFolders.filter(
      (subFolder) =>
        subFolder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subFolder.children.some(
          (bookmark) =>
            bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bookmark.tags.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
    );
  };

  // 获取所有匹配的书签（包括子文件夹中的）
  const getAllFilteredBookmarks = () => {
    if (!searchQuery) return [];

    const allBookmarks: BookmarkItem[] = [];

    if (selectedFolder) {
      // 在特定文件夹中搜索
      // 添加当前文件夹的书签
      allBookmarks.push(...selectedFolder.children);

      // 添加子文件夹中的书签
      selectedFolder.childFolders.forEach((subFolder) => {
        allBookmarks.push(...subFolder.children);
      });
    } else {
      // 在根目录中搜索所有文件夹的书签
      folders.forEach((folder) => {
        // 添加文件夹中的书签
        allBookmarks.push(...folder.children);

        // 添加子文件夹中的书签
        folder.childFolders.forEach((subFolder) => {
          allBookmarks.push(...subFolder.children);
        });
      });
    }

    return allBookmarks.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  };

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animated-gradient">
      <Header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <GlobalOutlined className="text-xl text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent m-0">
              Smart Bookmarks
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                placeholder={
                  selectedFolder
                    ? `在 ${selectedFolder.title} 中搜索...`
                    : "搜索书签..."
                }
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-96 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:shadow-lg transition-all duration-200 text-lg"
                allowClear
              />
            </div>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => chrome.runtime.openOptionsPage()}
              className="hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              设置
            </Button>
          </div>
        </div>
      </Header>

      <Content className="max-w-7xl mx-auto p-8 relative">
        {/* 背景装饰元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 p-8 glass-effect">
          {selectedFolder && (
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* 面包屑导航 */}
                <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/40 shadow-sm">
                  <Button
                    type="link"
                    icon={<GlobalOutlined />}
                    onClick={() => handleNavigateToFolder(-1)}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    所有文件夹
                  </Button>

                  {folderPath.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      <span className="text-gray-400 mx-2">/</span>
                      <Button
                        type="link"
                        onClick={() => handleNavigateToFolder(index)}
                        className={`p-0 h-auto transition-all duration-200 ${
                          index === folderPath.length - 1
                            ? "text-gray-800 font-semibold cursor-default"
                            : "text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 rounded-lg px-2 py-1"
                        }`}
                      >
                        {folder.title}
                      </Button>
                    </React.Fragment>
                  ))}
                </div>

                <div className="ml-4 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-sm px-3 py-1 rounded-xl border border-blue-200/50 shadow-sm">
                  <span className="text-sm text-blue-700 font-medium">
                    📄 {selectedFolder.children.length} 个书签
                  </span>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/40 shadow-lg">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-lg text-gray-700 font-medium">
                  加载中...
                </div>
              </div>
            </div>
          ) : selectedFolder ? (
            // 显示文件夹内容（子文件夹和书签）
            <div className="space-y-6">
              {/* 显示子文件夹 */}
              {getFilteredSubFolders().length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-sm"></div>
                    <span className="bg-blue-100/60 px-4 py-2 rounded-2xl text-blue-700 border border-blue-200/50">
                      📁 子文件夹 ({getFilteredSubFolders().length})
                    </span>
                    {searchQuery &&
                      selectedFolder.childFolders.length >
                        getFilteredSubFolders().length && (
                        <span className="text-sm text-gray-500 bg-gray-100/60 px-3 py-1 rounded-xl border border-gray-200/50">
                          (共 {selectedFolder.childFolders.length} 个)
                        </span>
                      )}
                  </h3>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={getFilteredSubFolders().map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {getFilteredSubFolders().map((subFolder) => (
                          <SortableFolderCard
                            key={subFolder.id}
                            folder={subFolder}
                            onDelete={handleFolderDelete}
                            onBookmarkDelete={handleDeleteBookmark}
                            onFolderClick={handleFolderClick}
                            searchQuery={searchQuery}
                            highlightText={highlightText}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* 显示书签 */}
              {(searchQuery
                ? getAllFilteredBookmarks().length > 0
                : getFilteredBookmarks().length > 0) && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-green-500 via-emerald-500 to-teal-500 rounded-full shadow-sm"></div>
                    <span className="bg-green-100/60 px-4 py-2 rounded-2xl text-green-700 border border-green-200/50">
                      📄 书签 (
                      {searchQuery
                        ? getAllFilteredBookmarks().length
                        : getFilteredBookmarks().length}
                      )
                    </span>
                    {searchQuery && (
                      <span className="text-sm text-gray-500 bg-gray-100/60 px-3 py-1 rounded-xl border border-gray-200/50">
                        (包含子文件夹)
                      </span>
                    )}
                  </h3>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={(searchQuery
                        ? getAllFilteredBookmarks()
                        : getFilteredBookmarks()
                      ).map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {(searchQuery
                          ? getAllFilteredBookmarks()
                          : getFilteredBookmarks()
                        ).map((bookmark) => (
                          <SortableBookmarkCard
                            key={bookmark.id}
                            bookmark={bookmark}
                            onDelete={handleDeleteBookmark}
                            searchQuery={searchQuery}
                            highlightText={highlightText}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* 如果文件夹为空或搜索无结果 */}
              {getFilteredSubFolders().length === 0 &&
                (searchQuery
                  ? getAllFilteredBookmarks().length === 0
                  : getFilteredBookmarks().length === 0) && (
                  <div className="text-center py-16">
                    <div className="inline-flex flex-col items-center space-y-4 bg-white/80 backdrop-blur-sm px-8 py-6 rounded-2xl border border-white/40 shadow-lg">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                        <FolderOutlined className="text-2xl text-gray-400" />
                      </div>
                      <div className="text-lg text-gray-600 font-medium">
                        {searchQuery
                          ? "没有找到匹配的内容"
                          : selectedFolder.childFolders.length === 0 &&
                            selectedFolder.children.length === 0
                          ? "此文件夹为空"
                          : "没有找到匹配的内容"}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            // 显示文件夹列表和搜索结果
            <div className="space-y-6">
              {/* 显示匹配的书签（仅在搜索时） */}
              {searchQuery && getAllFilteredBookmarks().length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-green-500 via-emerald-500 to-teal-500 rounded-full shadow-sm"></div>
                    <span className="bg-green-100/60 px-4 py-2 rounded-2xl text-green-700 border border-green-200/50">
                      📄 书签 ({getAllFilteredBookmarks().length})
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-100/60 px-3 py-1 rounded-xl border border-gray-200/50">
                      (包含所有文件夹)
                    </span>
                  </h3>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={getAllFilteredBookmarks().map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {getAllFilteredBookmarks().map((bookmark) => (
                          <SortableBookmarkCard
                            key={bookmark.id}
                            bookmark={bookmark}
                            onDelete={handleDeleteBookmark}
                            searchQuery={searchQuery}
                            highlightText={highlightText}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* 显示文件夹列表 */}
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {getFilteredFolders().map((folder) => (
                        <SortableFolderCard
                          key={folder.id}
                          folder={folder}
                          onDelete={handleFolderDelete}
                          onBookmarkDelete={handleDeleteBookmark}
                          onFolderClick={handleFolderClick}
                          searchQuery={searchQuery}
                          highlightText={highlightText}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex flex-col items-center space-y-4 bg-white/80 backdrop-blur-sm px-8 py-6 rounded-2xl border border-white/40 shadow-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                          <GlobalOutlined className="text-2xl text-blue-500" />
                        </div>
                        <div className="text-lg text-gray-600 font-medium">
                          {searchQuery ? "没有找到匹配的内容" : "暂无文件夹"}
                        </div>
                      </div>
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            </div>
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
