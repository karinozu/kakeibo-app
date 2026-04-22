// カテゴリ別の色定義（Chart.js用）
export const CATEGORY_COLORS = {
  '食費': '#3498db',
  '日用品': '#2ecc71',
  '外食': '#f39c12',
  '交通費': '#1abc9c',
  '医療費': '#9b59b6',
  '娯楽': '#e67e22',
  'その他': '#95a5a6',
};

// カテゴリ別のバッジスタイル（インラインスタイル用）
export const CATEGORY_STYLES = {
  '食費':   { background: '#dbeeff', color: '#1a6fb5' },
  '日用品': { background: '#d6f5e3', color: '#1a8a47' },
  '外食':   { background: '#fef3d8', color: '#b07d0a' },
  '交通費': { background: '#d1f5ee', color: '#0e7a63' },
  '医療費': { background: '#ede4f7', color: '#6c3a9e' },
  '娯楽':   { background: '#fdebd0', color: '#a04000' },
  'その他': { background: '#eaecee', color: '#555'    },
};

export const CATEGORIES = ['食費', '日用品', '外食', '交通費', '医療費', '娯楽', 'その他'];

export const STORAGE_KEY = 'kakeibo-receipts';
