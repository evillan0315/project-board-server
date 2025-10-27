import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element with ID "root" not found in the document.');
}
ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }));
