// 后台服务脚本
console.log("Smart Bookmarks 后台服务已启动");

// 基本关键词生成函数
function generateBasicKeywords(title: string, url: string): string[] {
  const keywords: string[] = [];

  // 从标题提取关键词
  if (title) {
    const titleWords = title
      .split(/[\s\-_|,，。]+/)
      .filter((word) => word.length > 1 && word.length < 20)
      .slice(0, 5);
    keywords.push(...titleWords);
  }

  // 从URL提取关键词
  if (url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace("www.", "");
      const domainParts = domain.split(".");
      if (domainParts.length > 0) {
        keywords.push(domainParts[0]);
      }
    } catch (e) {
      // URL解析失败，忽略
    }
  }

  // 去重并限制数量
  return [...new Set(keywords)].slice(0, 8);
}

// 监听插件安装
chrome.runtime.onInstalled.addListener((details) => {
  console.log("插件已安装:", details);

  if (details.reason === "install") {
    // 首次安装时的初始化逻辑
    console.log("首次安装插件");
  }
});

// 监听快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  console.log("快捷键命令:", command);

  switch (command) {
    case "quick_search":
      // 打开搜索界面
      chrome.action.openPopup();
      break;
    case "quick_bookmark":
      // 快速收藏当前页面 - 打开弹窗并传递参数
      await chrome.storage.local.set({ autoOpenAddBookmark: true });
      chrome.action.openPopup();
      break;
  }
});

// 监听书签变化
chrome.bookmarks.onCreated.addListener((_id, bookmark) => {
  console.log("新增书签:", bookmark);
  // 这里可以添加自动同步逻辑
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  console.log("删除书签:", id, removeInfo);
  // 这里可以添加同步删除逻辑
});

// 监听来自内容脚本或弹窗的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("收到消息:", request);

  switch (request.action) {
    case "getBookmarks":
      // 获取原生书签
      chrome.bookmarks
        .getTree()
        .then((tree) => {
          sendResponse({ success: true, data: tree });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // 保持消息通道开放

    // 移除 getHistory：为降低权限，已不再请求 'history' 权限

    case "getCurrentPageInfo":
      // 获取当前活动标签页信息
      console.log("开始获取当前页面信息");
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
          const tab = tabs[0];
          console.log("当前标签页:", tab.url, tab.title);

          // 检查是否可以在此页面注入内容脚本
          if (
            tab.url?.startsWith("chrome://") ||
            tab.url?.startsWith("chrome-extension://") ||
            tab.url?.startsWith("edge://") ||
            tab.url?.startsWith("about:")
          ) {
            console.log("特殊页面，无法注入内容脚本:", tab.url);
            // 对于特殊页面，返回基本信息
            sendResponse({
              success: true,
              data: {
                url: tab.url,
                title: tab.title,
                favicon: tab.favIconUrl,
                description: "",
                keywords: ["浏览器", "系统页面"], // 为特殊页面提供默认关键词
                content: "",
              },
            });
            return;
          }

          // 先按需注入内容脚本（依赖 activeTab+scripting，避免全站注入）
          try {
            console.log("按需注入内容脚本, tab.id:", tab.id);
            await chrome.scripting.executeScript({
              target: { tabId: tab.id! },
              files: ["src/content/index.ts"],
            });

            console.log("向内容脚本发送消息, tab.id:", tab.id);

            // 使用Promise包装sendMessage以便处理超时
            const pageInfo = await new Promise((resolve, reject) => {
              chrome.tabs.sendMessage(
                tab.id!,
                { action: "getPageInfo" },
                (response) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(response);
                  }
                },
              );
            });

            console.log("收到内容脚本回复:", pageInfo);

            sendResponse({
              success: true,
              data: {
                url: tab.url,
                title: tab.title,
                favicon: tab.favIconUrl,
                ...(pageInfo as any).data,
              },
            });
          } catch (error) {
            console.error("内容脚本通信失败:", error);
            // 如果内容脚本不可用，使用基本关键词生成
            const basicKeywords = generateBasicKeywords(
              tab.title || "",
              tab.url || "",
            );

            console.log("使用基本关键词:", basicKeywords);

            sendResponse({
              success: true,
              data: {
                url: tab.url,
                title: tab.title,
                favicon: tab.favIconUrl,
                description: "",
                keywords: basicKeywords,
                content: "",
              },
            });
          }
        } else {
          console.error("无法获取当前标签页");
          sendResponse({ success: false, error: "无法获取当前页面信息" });
        }
      });
      return true;

    case "addBookmark":
      // 添加书签到Chrome
      let bookmarkTitle = request.title;

      // 如果有关键词，将其添加到标题后面
      if (request.keywords && request.keywords.length > 0) {
        const keywordString = request.keywords.slice(0, 5).join(", "); // 限制关键词数量
        bookmarkTitle = `${request.title} #${keywordString}`;
      }

      chrome.bookmarks
        .create({
          title: bookmarkTitle,
          url: request.url,
          parentId: request.parentId || "1", // 默认添加到书签栏
        })
        .then((bookmark) => {
          sendResponse({ success: true, data: bookmark });
        })
        .catch((error) => {
          console.error("添加书签失败:", error);
          sendResponse({ success: false, error: "添加书签失败" });
        });
      return true;

    case "createFolder":
      // 创建新文件夹
      chrome.bookmarks
        .create({
          title: request.title,
          parentId: request.parentId || "1", // 默认在书签栏下创建
        })
        .then((folder) => {
          sendResponse({ success: true, data: folder });
        })
        .catch((error) => {
          console.error("创建文件夹失败:", error);
          sendResponse({ success: false, error: "创建文件夹失败" });
        });
      return true;

    case "moveBookmark":
      // 移动书签或文件夹
      chrome.bookmarks
        .move(String(request.id), {
          parentId: String(request.parentId),
          index:
            typeof request.index === "number"
              ? Number(request.index)
              : undefined,
        })
        .then((result) => {
          sendResponse({ success: true, data: result });
        })
        .catch((error) => {
          console.error("移动书签失败:", error);
          sendResponse({ success: false, error: "移动书签失败" });
        });
      return true;

    default:
      sendResponse({ success: false, error: "未知操作" });
  }
});
