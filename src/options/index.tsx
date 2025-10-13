import React from "react";
import ReactDOM from "react-dom/client";
import {
  ConfigProvider,
  Form,
  /* Input, */ Switch,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Select,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import "../popup/index.css";
import {
  getMessage,
  LANGUAGE_OPTIONS,
  type SupportedLanguage,
} from "../shared/i18n";
import { useLanguage } from "../shared/i18n/useLanguage";

const { Title } = Typography as any;

const DEFAULT_DIFY_BASE = "https://api.dify.ai";

const Options: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const { language: currentLanguage, changeLanguage } = useLanguage();
  const isChromeExt = Boolean((globalThis as any)?.chrome?.storage?.sync);

  React.useEffect(() => {
    (async () => {
      try {
        if (!isChromeExt) return; // 预览环境不读取设置

        const {
          useDifyKeyword,
          difyApiKey,
          difyBaseUrl,
          difyUserId,
          defaultBookmarksCollapsed,
        } = await chrome.storage.sync.get({
          useDifyKeyword: false,
          difyApiKey: "",
          difyBaseUrl: DEFAULT_DIFY_BASE,
          difyUserId: "sb-extension",
          defaultBookmarksCollapsed: true,
        });
        form.setFieldsValue({
          useDifyKeyword,
          difyApiKey,
          difyBaseUrl: difyBaseUrl || DEFAULT_DIFY_BASE,
          difyUserId,
          defaultBookmarksCollapsed,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [form, isChromeExt]);

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
      message.success(getMessage("settingsSaved"));
      // 刷新页面以应用新语言
      window.location.reload();
    } catch (e) {
      console.error(e);
      message.error(getMessage("saveFailed"));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      if (!isChromeExt) {
        message.warning(getMessage("previewEnvironment"));
        return;
      }
      await chrome.storage.sync.set({
        useDifyKeyword: !!values.useDifyKeyword,
        difyApiKey: values.difyApiKey || "",
        difyBaseUrl: values.difyBaseUrl || DEFAULT_DIFY_BASE,
        difyUserId: values.difyUserId || "sb-extension",
        defaultBookmarksCollapsed: !!values.defaultBookmarksCollapsed,
      });
      message.success(getMessage("settingsSaved"));
    } catch (e) {
      console.error(e);
      message.error(getMessage("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Title level={3} style={{ marginBottom: 8 }}>
        {getMessage("optionsTitle")}
      </Title>
      {/* <Paragraph type="secondary" style={{ marginTop: 0 }}>
        {getMessage('optionsDescription')}
      </Paragraph> */}
      <Divider />

      <Form form={form} layout="vertical">
        <Title level={4} style={{ marginBottom: 16 }}>
          {getMessage("languageSettings")}
        </Title>

        <Form.Item
          label={getMessage("selectLanguage")}
          style={{ marginBottom: 24 }}
        >
          <Select
            value={currentLanguage}
            onChange={handleLanguageChange}
            style={{ width: 200 }}
            options={LANGUAGE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </Form.Item>

        <Divider />
        <Form.Item
          name="defaultBookmarksCollapsed"
          label={getMessage("defaultBookmarksCollapsed")}
          tooltip={getMessage("defaultBookmarksCollapsedTooltip")}
          valuePropName="checked"
        >
          <Switch
            onChange={(checked) => {
              form.setFieldValue("defaultBookmarksCollapsed", checked);
              handleSave();
            }}
          />
        </Form.Item>

        {/* 暂时隐藏 Dify 相关设置（仅注释，不删除）
        <Form.Item
          name="useDifyKeyword"
          label={getMessage('useDifyKeyword')}
          valuePropName="checked"
        >
          <Switch onChange={(checked) => { form.setFieldValue("useDifyKeyword", checked); handleSave(); }} />
        </Form.Item>

        <Form.Item
          name="difyApiKey"
          label={getMessage('difyApiKey')}
          tooltip={getMessage('difyApiKeyTooltip')}
          rules={[{ required: false }]}
        >
          <Input.Password placeholder="sk-..." visibilityToggle allowClear />
        </Form.Item>

        <Form.Item
          name="difyBaseUrl"
          label={getMessage('difyBaseUrl')}
          tooltip={getMessage('difyBaseUrlTooltip')}
        >
          <Input placeholder={DEFAULT_DIFY_BASE} />
        </Form.Item>

        <Form.Item
          name="difyUserId"
          label={getMessage('difyUserId')}
          tooltip={getMessage('difyUserIdTooltip')}
        >
          <Input placeholder="sb-extension" />
        </Form.Item>
        */}

        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {getMessage("saveSettings")}
          </Button>
          {/* 暂时隐藏 Dify 入口链接（仅注释，不删除）
          <Button
            type="link"
            onClick={() => window.open("https://cloud.dify.ai/app/dccbbc41-c4c1-4d27-b0a2-16812eba5781/develop", "_blank")}
          >
            {getMessage('visitDifyWorkflow')}
          </Button>
          */}
        </Space>
      </Form>
    </div>
  );
};

const App: React.FC = () => {
  const { language } = useLanguage();
  const antdLocale = language === "en" ? enUS : zhCN;

  return (
    <ConfigProvider locale={antdLocale}>
      <Options />
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
