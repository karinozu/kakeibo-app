import React, { useState, useEffect } from 'react';
import ReceiptUpload from './components/ReceiptUpload';
import ExpenseList from './components/ExpenseList';
import Charts from './components/Charts';
import Summary from './components/Summary';
import { STORAGE_KEY } from './constants';
import './App.css';

function App() {
  const [receipts, setReceipts] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setReceipts(JSON.parse(saved));
      } catch {
        console.error('データの読み込みに失敗しました');
      }
    }
  }, []);

  // レシートが変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts]);

  const addReceipt = (receipt) => {
    const newReceipt = {
      ...receipt,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [newReceipt, ...prev]);
  };

  const deleteReceipt = (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const tabs = [
    { id: 'upload',  label: '📷 アップロード' },
    { id: 'list',    label: '📋 一覧' },
    { id: 'charts',  label: '📊 グラフ' },
    { id: 'summary', label: '💰 集計' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>📒 レシート家計簿</h1>
        <p>レシートを読み込んで家計を管理しましょう</p>
      </header>

      <nav className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'list' && receipts.length > 0 && (
              <span className="tab-badge">{receipts.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'upload'  && <ReceiptUpload onReceiptAdded={addReceipt} receipts={receipts} />}
        {activeTab === 'list'    && <ExpenseList receipts={receipts} onDelete={deleteReceipt} />}
        {activeTab === 'charts'  && <Charts receipts={receipts} />}
        {activeTab === 'summary' && <Summary receipts={receipts} />}
      </main>
    </div>
  );
}

export default App;
