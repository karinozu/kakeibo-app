import React, { useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { CATEGORY_COLORS } from '../constants';

// Chart.jsのコンポーネントを登録
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Charts({ receipts }) {
  // カテゴリ別の合計金額を集計
  const categoryTotals = useMemo(() => {
    const totals = {};
    receipts.forEach((receipt) => {
      receipt.items?.forEach((item) => {
        totals[item.category] = (totals[item.category] || 0) + (item.price || 0);
      });
    });
    return totals;
  }, [receipts]);

  // 月別の合計金額を集計（YYYY-MM形式でグループ化）
  const monthlyTotals = useMemo(() => {
    const totals = {};
    receipts.forEach((receipt) => {
      if (!receipt.date) return;
      const month = receipt.date.substring(0, 7);
      totals[month] = (totals[month] || 0) + (receipt.total || 0);
    });
    // 月順にソート
    return Object.fromEntries(
      Object.entries(totals).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [receipts]);

  if (receipts.length === 0) {
    return (
      <div className="empty-state">
        <p>📊 グラフを表示するにはレシートを追加してください</p>
      </div>
    );
  }

  // 円グラフのデータ
  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: Object.keys(categoryTotals).map(
          (c) => CATEGORY_COLORS[c] || '#C9CBCF'
        ),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // 棒グラフのデータ
  const barData = {
    labels: Object.keys(monthlyTotals),
    datasets: [
      {
        label: '月別支出 (円)',
        data: Object.values(monthlyTotals),
        backgroundColor: '#3498db',
        borderRadius: 6,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      title: {
        display: true,
        text: 'カテゴリ別支出',
        font: { size: 16 },
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` ¥${value.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '月別支出推移',
        font: { size: 16 },
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ¥${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `¥${v.toLocaleString()}` },
      },
    },
  };

  return (
    <div className="charts-container">
      {Object.keys(categoryTotals).length > 0 && (
        <div className="chart-card">
          <Pie data={pieData} options={pieOptions} />
        </div>
      )}
      {Object.keys(monthlyTotals).length > 0 && (
        <div className="chart-card">
          <Bar data={barData} options={barOptions} />
        </div>
      )}
    </div>
  );
}

export default Charts;
