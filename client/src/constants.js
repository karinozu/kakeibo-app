// カテゴリ別の色定義（Chart.js用）
export const CATEGORY_COLORS = {
  '食費': '#FF6384',
  '日用品': '#36A2EB',
  '外食': '#FFCE56',
  '交通費': '#4BC0C0',
  '医療費': '#9966FF',
  '娯楽': '#FF9F40',
  'その他': '#C9CBCF',
};

// カテゴリ別のバッジスタイル（インラインスタイル用）
export const CATEGORY_STYLES = {
  '食費':   { background: '#FFE4E8', color: '#c0392b' },
  '日用品': { background: '#E4F0FF', color: '#2980b9' },
  '外食':   { background: '#FFF8E4', color: '#e67e22' },
  '交通費': { background: '#E4F8F8', color: '#16a085' },
  '医療費': { background: '#F0E4FF', color: '#8e44ad' },
  '娯楽':   { background: '#FFF0E4', color: '#d35400' },
  'その他': { background: '#F0F0F0', color: '#666'    },
};

export const CATEGORIES = ['食費', '日用品', '外食', '交通費', '医療費', '娯楽', 'その他'];

export const STORAGE_KEY = 'kakeibo-receipts';
