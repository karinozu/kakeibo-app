import React, { useState } from 'react';
import { CATEGORY_STYLES } from '../constants';

function ExpenseList({ receipts, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);

  if (receipts.length === 0) {
    return (
      <div className="empty-state">
        <p>📋 まだレシートが登録されていません</p>
        <p>「アップロード」タブからレシートを追加してください</p>
      </div>
    );
  }

  const toggle = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="list-container">
      <h2>登録済みレシート（{receipts.length}件）</h2>
      <div className="receipt-list">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="receipt-card">
            {/* ヘッダー行（クリックで展開） */}
            <div className="receipt-header" onClick={() => toggle(receipt.id)}>
              <div className="receipt-meta">
                <span className="receipt-date">📅 {receipt.date || '日付不明'}</span>
                <span className="receipt-store">🏪 {receipt.store || '店舗不明'}</span>
              </div>
              <div className="receipt-total">
                <span>¥{receipt.total?.toLocaleString()}</span>
                <span className="expand-icon">{expandedId === receipt.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* 展開時：商品一覧 */}
            {expandedId === receipt.id && (
              <div className="receipt-detail">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>商品名</th>
                      <th>金額</th>
                      <th>カテゴリ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>¥{item.price?.toLocaleString()}</td>
                        <td>
                          <span
                            className="category-badge"
                            style={CATEGORY_STYLES[item.category] || CATEGORY_STYLES['その他']}
                          >
                            {item.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {receipt.tax > 0 && (
                  <div className="receipt-tax">
                    消費税：¥{receipt.tax?.toLocaleString()}
                  </div>
                )}

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (window.confirm('このレシートを削除しますか？')) {
                      onDelete(receipt.id);
                    }
                  }}
                >
                  🗑️ 削除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpenseList;
