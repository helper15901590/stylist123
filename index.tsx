
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 获取 DOM 挂载节点
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("找不到挂载点 root 元素");
}

// 创建 React 根实例并渲染应用
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
