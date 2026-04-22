import React, { useMemo } from 'react';
import { CATEGORY_STYLES } from '../constants';

function Summary({ receipts }) {
  const stats = useMemo(() => {
    const categoryTotals = {};
    let grandTotal = 0;

    receipts.forEach((receipt) => {
      receipt.items?.forEach((item) => {
        const price = item.price || 0;
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + price;
      });
      grandTotal += receipt.total || 0;
    });

    // 金額が多い順にソート
    const sorted = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);

    return { sorted, grandTotal };
  }, [receipts]);

  if (receipts.length === 0) {
    return (
      <div className="empty-state">
        <p>💰 集計を表示するにはレシートを追加してください</p>
      </div>
    );
  }

  const { sorted, grandTotal } = stats;
  const avgPerReceipt = receipts.length > 0 ? Math.round(grandTotal / receipts.length) : 0;

  return (
    <div className="summary-container">
      {/* 合計・カテゴリ内訳 */}
      <div className="summary-card">
        <h2>支出集計</h2>

        <div className="grand-total">
          <span>合計支出</span>
          <span className="total-amount">¥{grandTotal.toLocaleString()}</span>
        </div>

        <div className="category-breakdown">
          {sorted.map(([category, amount]) => {
            const pct = grandTotal > 0 ? ((amount / grandTotal) * 100).toFixed(1) : 0;
            return (
              <div key={category} className="category-row">
                <div className="category-info">
                  <span
                    className="category-badge"
                    style={CATEGORY_STYLES[category] || CATEGORY_STYLES['その他']}
                  >
                    {category}
                  </span>
                  <span className="category-percent">{pct}%</span>
                </div>
                <div className="category-bar-container">
                  <div className="category-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="category-amount">¥{amount.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 統計情報 */}
      <div className="summary-card">
        <h3>📋 登録レシート数：{receipts.length}件</h3>
        <h3>📊 1件あたり平均：¥{avgPerReceipt.toLocaleString()}</h3>
      </div>
    </div>
  );
}

export default Summary;
