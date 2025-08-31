// 内容脚本
console.log("Smart Bookmarks 内容脚本已加载");

// 页面内容分析功能
class PageAnalyzer {
  // 获取页面基本信息
  getPageInfo() {
    const content = this.getPageContent();
    const metaKeywords = this.getMetaKeywords();
    const extractedKeywords = this.extractKeywords(content);

    console.log("页面内容长度:", content.length);
    console.log("Meta关键词:", metaKeywords);
    console.log("提取的关键词:", extractedKeywords);

    // 合并meta关键词和提取的关键词
    const allKeywords = [...metaKeywords, ...extractedKeywords]
      .filter((keyword, index, arr) => arr.indexOf(keyword) === index) // 去重
      .slice(0, 15); // 限制数量

    console.log("最终关键词:", allKeywords);

    return {
      url: window.location.href,
      title: document.title,
      description: this.getMetaDescription(),
      keywords: allKeywords,
      favicon: this.getFavicon(),
      content: content,
    };
  }

  // 获取页面描述
  private getMetaDescription(): string {
    const metaDesc = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement;
    return metaDesc?.content || "";
  }

  // 获取页面关键词
  private getMetaKeywords(): string[] {
    const metaKeywords = document.querySelector(
      'meta[name="keywords"]'
    ) as HTMLMetaElement;
    return (
      metaKeywords?.content
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k) || []
    );
  }

  // 获取网站图标
  private getFavicon(): string {
    const favicon = document.querySelector(
      'link[rel*="icon"]'
    ) as HTMLLinkElement;
    if (favicon) {
      return new URL(favicon.href, window.location.origin).href;
    }
    return `${window.location.origin}/favicon.ico`;
  }

  // 获取页面主要内容
  private getPageContent(): string {
    // 移除脚本和样式标签
    const content = document.body.cloneNode(true) as HTMLElement;
    content
      .querySelectorAll("script, style, nav, header, footer")
      .forEach((el) => el.remove());

    // 获取纯文本内容，限制长度
    const text = content.innerText || content.textContent || "";
    return text.slice(0, 1000).trim();
  }

  // 改进的关键词提取
  private extractKeywords(text: string): string[] {
    if (!text) return [];

    try {
      // 尝试使用 nodejieba 进行中文分词
      if (typeof window !== "undefined" && (window as any).nodejieba) {
        const nodejieba = (window as any).nodejieba;
        const words = nodejieba.extract(text, 10);
        return words.map((item: any) => item.word);
      }
    } catch (error) {
      console.log("nodejieba 不可用，使用备用方案");
    }

    // 备用方案：改进的简单分词
    const cleanText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, " ")
      .toLowerCase();

    // 更智能的分词
    const chineseWords = cleanText.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const englishWords = cleanText.match(/[a-zA-Z]{3,}/g) || [];

    const allWords = [...chineseWords, ...englishWords].filter(
      (word) => word.length > 1 && word.length < 15
    );

    // 统计词频并过滤常见停用词
    const stopWords = new Set([
      "的",
      "了",
      "是",
      "在",
      "有",
      "和",
      "就",
      "不",
      "人",
      "都",
      "一",
      "一个",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);
    const wordCount = new Map<string, number>();

    allWords.forEach((word) => {
      if (!stopWords.has(word)) {
        const count = wordCount.get(word) || 0;
        wordCount.set(word, count + 1);
      }
    });

    // 按频率排序，返回前10个
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}

const pageAnalyzer = new PageAnalyzer();

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.action) {
    case "getPageInfo":
      sendResponse({
        success: true,
        data: pageAnalyzer.getPageInfo(),
      });
      break;

    default:
      sendResponse({ success: false, error: "未知操作" });
  }
});
