import Dexie, { Table } from "dexie";
import { BookmarkItem, Category, SearchHistory, Settings } from "../types";

export class SmartBookmarksDB extends Dexie {
  bookmarks!: Table<BookmarkItem>;
  categories!: Table<Category>;
  searchHistory!: Table<SearchHistory>;
  settings!: Table<Settings>;

  constructor() {
    super("SmartBookmarksDB");

    this.version(1).stores({
      bookmarks:
        "++id, url, title, tags, category, createdAt, keywords, isImported",
      categories: "++id, name, parentId, order",
      searchHistory: "++id, query, timestamp",
      settings: "++id",
    });

    // 初始化默认数据
    this.on("populate", () => this.populateDefaults());
  }

  private async populateDefaults() {
    // 创建默认分类
    await this.categories.bulkAdd([
      {
        id: "default",
        name: "默认",
        icon: "folder",
        color: "#1890ff",
        order: 0,
      },
      {
        id: "work",
        name: "工作",
        icon: "briefcase",
        color: "#52c41a",
        order: 1,
      },
      {
        id: "study",
        name: "学习",
        icon: "book",
        color: "#faad14",
        order: 2,
      },
      {
        id: "entertainment",
        name: "娱乐",
        icon: "play-circle",
        color: "#eb2f96",
        order: 3,
      },
    ]);

    // 创建默认设置
    await this.settings.add({
      id: "main",
      keywordExtractionEnabled: true,
      autoSync: false,
      shortcuts: {
        search: "ctrl+k",
        newBookmark: "ctrl+n",
        import: "ctrl+i",
      },
      theme: "auto",
      maxKeywords: 10,
    });
  }
}

export const db = new SmartBookmarksDB();
