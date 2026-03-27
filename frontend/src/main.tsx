import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import App from './App.tsx';
import './index.css';
import 'antd/dist/reset.css';

// 配置 dayjs 语言
dayjs.locale('zh-cn');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#52c41a', // 更深一点的绿色 (Green-6)
          colorSuccess: '#389e0d', // 深绿色 (Green-7)
          colorWarning: '#ffc53d',
          colorError: '#ff4d4f',
          colorInfo: '#13c2c2',
          borderRadius: 16,
          wireframe: false,
          fontFamily: "'Nunito', 'Comic Sans MS', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          boxShadowSecondary: '0 8px 24px rgba(82, 196, 26, 0.15)', // 带有主题色的柔和阴影
        },
        components: {
          Card: {
            borderRadiusLG: 20,
            boxShadowTertiary: '0 4px 16px rgba(0, 0, 0, 0.04)',
          },
          Button: {
            borderRadius: 12,
            controlHeight: 36,
            fontWeight: 600,
          },
          Input: {
            borderRadius: 12,
          },
          Select: {
            borderRadius: 12,
          },
          Tag: {
            borderRadiusSM: 8,
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
