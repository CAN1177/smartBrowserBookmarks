import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import App from "./App";
import "./index.css";
import { useLanguage } from "../shared/i18n/useLanguage";

const AppRoot: React.FC = () => {
  const { language } = useLanguage();
  const antdLocale = language === "en" ? enUS : zhCN;
  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
