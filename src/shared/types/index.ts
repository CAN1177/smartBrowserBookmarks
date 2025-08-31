// 核心数据类型定义
export interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  tags: string[];
  keywords: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
  visitCount: number;
  lastVisited?: Date;
  content?: string;
  isImported: boolean;
  originalFolderId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId?: string;
  order: number;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
}

export interface Settings {
  id: string;
  keywordExtractionEnabled: boolean;
  autoSync: boolean;
  shortcuts: Record<string, string>;
  theme: "light" | "dark" | "auto";
  maxKeywords: number;
}

export interface SearchOptions {
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  type: "bookmark" | "history" | "keyword";
  score: number;
}
