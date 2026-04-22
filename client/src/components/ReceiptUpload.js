import React, { useState, useRef } from 'react';
import axios from 'axios';
import { CATEGORY_STYLES } from '../constants';

function ReceiptUpload({ onReceiptAdded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setError('');
    setResult(null);

    // プレビュー用にBase64変換
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await axios.post('/api/analyze-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'レシートの読み取りに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!result) return;
    onReceiptAdded(result);
    reset();
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2>レシートをアップロード</h2>

        {/* 画像選択ゾーン */}
        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
          {preview ? (
            <img src={preview} alt="レシートプレビュー" className="preview-image" />
          ) : (
            <div className="upload-placeholder">
              <span className="upload-icon">📷</span>
              <p>クリックして画像を選択</p>
              <p className="upload-hint">JPEG・PNG・GIF・WebP対応（最大10MB）</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* 読み取りボタン */}
        {file && !result && (
          <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
            {loading ? '⏳ 読み取り中...' : '🔍 レシートを読み取る'}
          </button>
        )}

        {/* エラー表示 */}
        {error && <p className="error-message">⚠️ {error}</p>}

        {/* 読み取り結果 */}
        {result && (
          <div className="result-card">
            <h3>✅ 読み取り完了</h3>
            <div className="result-info">
              <p><strong>日付：</strong>{result.date || '不明'}</p>
              <p><strong>店舗：</strong>{result.store || '不明'}</p>
              <p><strong>合計：</strong>¥{result.total?.toLocaleString() ?? 0}</p>
            </div>

            <h4>商品一覧</h4>
            <table className="items-table">
              <thead>
                <tr>
                  <th>商品名</th>
                  <th>金額</th>
                  <th>カテゴリ</th>
                </tr>
              </thead>
              <tbody>
                {result.items?.map((item, idx) => (
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

            <div className="result-actions">
              <button className="btn btn-success" onClick={handleAdd}>
                ✅ 家計簿に追加
              </button>
              <button className="btn btn-secondary" onClick={reset}>
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceiptUpload;
