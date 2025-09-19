import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, Form, Input, Switch, Button, Space, Typography, Divider, message } from "antd";
import zhCN from "antd/locale/zh_CN";
import "../popup/index.css";

const { Title, Paragraph } = Typography as any;

const DEFAULT_DIFY_BASE = "https://api.dify.ai";

const Options: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const isChromeExt = Boolean((globalThis as any)?.chrome?.storage?.sync);

  React.useEffect(() => {
    if (!isChromeExt) return; // 预览环境不读取
    (async () => {
      try {
        const { useDifyKeyword, difyApiKey, difyBaseUrl, difyUserId } = await chrome.storage.sync.get({
          useDifyKeyword: false,
          difyApiKey: "",
          difyBaseUrl: DEFAULT_DIFY_BASE,
          difyUserId: "sb-extension",
        });
        form.setFieldsValue({
          useDifyKeyword,
          difyApiKey,
          difyBaseUrl: difyBaseUrl || DEFAULT_DIFY_BASE,
          difyUserId,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [form, isChromeExt]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      if (!isChromeExt) {
        message.warning("当前为预览环境，设置未写入浏览器");
        return;
      }
      await chrome.storage.sync.set({
        useDifyKeyword: !!values.useDifyKeyword,
        difyApiKey: values.difyApiKey || "",
        difyBaseUrl: values.difyBaseUrl || DEFAULT_DIFY_BASE,
        difyUserId: values.difyUserId || "sb-extension",
      });
      message.success("已保存设置");
    } catch (e) {
      console.error(e);
      message.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Title level={3} style={{ marginBottom: 8 }}>
        Smart Bookmarks 设置
      </Title>
      <Paragraph type="secondary" style={{ marginTop: 0 }}>
        配置 Dify 工作流以在弹窗收藏书签时自动生成关键词。
      </Paragraph>

      <Divider />

      <Form form={form} layout="vertical">
        <Form.Item
          name="useDifyKeyword"
          label="使用 Dify 生成关键词"
          valuePropName="checked"
        >
          <Switch onChange={(checked) => { form.setFieldValue("useDifyKeyword", checked); handleSave(); }} />
        </Form.Item>

        <Form.Item
          name="difyApiKey"
          label="Dify API Key"
          tooltip="从 Dify 控制台获取的 API Key，用于调用工作流接口"
          rules={[{ required: false }]}
        >
          <Input.Password placeholder="sk-..." visibilityToggle allowClear />
        </Form.Item>

        <Form.Item
          name="difyBaseUrl"
          label="Dify API Base URL"
          tooltip="通常为 https://api.dify.ai；如使用自托管或私有部署，请填写对应地址"
        >
          <Input placeholder={DEFAULT_DIFY_BASE} />
        </Form.Item>

        <Form.Item
          name="difyUserId"
          label="Dify User ID"
          tooltip="用于区分调用用户的 ID，可保持默认"
        >
          <Input placeholder="sb-extension" />
        </Form.Item>

        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存设置
          </Button>
          <Button
            type="link"
            onClick={() => window.open("https://cloud.dify.ai/app/dccbbc41-c4c1-4d27-b0a2-16812eba5781/develop", "_blank")}
          >
            访问我的 Dify 工作流
          </Button>
        </Space>
      </Form>
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
