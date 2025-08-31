import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "../popup/index.css";

const Options: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Smart Bookmarks 设置</h1>
      <p className="text-gray-600">设置页面开发中...</p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <Options />
    </ConfigProvider>
  </React.StrictMode>
);
