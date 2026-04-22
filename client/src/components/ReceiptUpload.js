import React, { useState, useRef } from 'react';
import axios from 'axios';
import { CATEGORY_STYLES, CATEGORIES } from '../constants';

function ReceiptUpload({ onReceiptAdded, receipts }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 編集可能な読み取り結果（手修正用）
  const [editableResult, setEditableResult] = useState(null);
  const fileInputRef = useRef(null);

  // ========== バリデーション ==========
  const computeWarnings = (data) => {
    if (!data) return [];
    const warns = [];

    // 負の金額チェック
    const negItems = (data.items || []).filter((i) => Number(i.price) < 0);
    if (negItems.length > 0) {
      warns.push({
        type: 'error',
        message: `金額が負の値の商品があります：${negItems.map((i) => i.name || '(名称不明)').join('、')}`,
      });
    }

    // 重複レシートチェック（同一日付 & 同一合計金額）
    const calcTotal = (data.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0);
    const dup = (receipts || []).find(
      (r) => r.date === data.date && r.date && Math.round(r.total) === Math.round(calcTotal)
    );
    if (dup) {
      warns.push({
        type: 'duplicate',
        message: `同じ日付・合計金額のレシートが既に登録されています（${data.date}、¥${calcTotal.toLocaleString()}）`,
      });
    }

    return warns;
  };

  // 現在の警告（レンダリング時に毎回計算）
  const warnings = computeWarnings(editableResult);

  // ========== ファイル選択 ==========
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setError('');
    setEditableResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(selected);
  };

  // ========== API呼び出し ==========
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
      // 読み取り結果を編集可能な状態にコピー
      setEditableResult({ ...response.data, items: response.data.items?.map((i) => ({ ...i })) || [] });
    } catch (err) {
      setError(err.response?.data?.error || 'レシートの読み取りに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // ========== フィールド更新ハンドラ ==========
  const updateField = (field, value) =>
    setEditableResult((prev) => ({ ...prev, [field]: value }));

  const updateItem = (idx, field, value) =>
    setEditableResult((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: field === 'price' ? value : value } : item
      ),
    }));

  const removeItem = (idx) =>
    setEditableResult((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));

  const addItem = () =>
    setEditableResult((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', price: 0, category: 'その他' }],
    }));

  // ========== 家計簿に追加 ==========
  const handleAdd = () => {
    if (!editableResult) return;
    const subtotal = editableResult.items.reduce((s, i) => s + (Number(i.price) || 0), 0);
    const tax = Number(editableResult.tax) || 0;
    onReceiptAdded({ ...editableResult, tax, total: subtotal + tax });
    reset();
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setEditableResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 小計（アイテムの合計）と税込み合計
  const calcSubtotal = editableResult
    ? editableResult.items.reduce((s, i) => s + (Number(i.price) || 0), 0)
    : 0;
  const calcTotal = calcSubtotal + (editableResult ? (Number(editableResult.tax) || 0) : 0);

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
        {file && !editableResult && (
          <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
            {loading ? '⏳ 読み取り中...' : '🔍 レシートを読み取る'}
          </button>
        )}

        {/* 読み取りエラー */}
        {error && <p className="error-message">⚠️ {error}</p>}

        {/* ========== 読み取り結果（編集可能） ========== */}
        {editableResult && (
          <div className="result-card">
            <h3>✅ 読み取り完了 — 内容を確認・修正してください</h3>

            {/* バリデーション警告 */}
            {warnings.map((w, i) => (
              <div key={i} className={`validation-warning validation-${w.type}`}>
                {w.type === 'error' ? '🚨' : '⚠️'} {w.message}
              </div>
            ))}

            {/* 日付・店舗の編集 */}
            <div className="edit-fields">
              <div className="edit-row">
                <label>📅 日付</label>
                <input
                  type="date"
                  value={editableResult.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="edit-input"
                />
              </div>
              <div className="edit-row">
                <label>🏪 店舗名</label>
                <input
                  type="text"
                  value={editableResult.store || ''}
                  placeholder="店舗名を入力"
                  onChange={(e) => updateField('store', e.target.value)}
                  className="edit-input"
                />
              </div>
            </div>

            {/* 商品一覧（編集可能） */}
            <div className="edit-table-header">
              <h4>商品一覧</h4>
              <button className="btn btn-secondary btn-sm" onClick={addItem}>
                ＋ 行を追加
              </button>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th>商品名</th>
                  <th>金額</th>
                  <th>カテゴリ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {editableResult.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        value={item.name || ''}
                        placeholder="商品名"
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        className="edit-input edit-input-name"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.price ?? ''}
                        onChange={(e) => updateItem(idx, 'price', e.target.value)}
                        className={`edit-input edit-input-price${Number(item.price) < 0 ? ' input-negative' : ''}`}
                      />
                    </td>
                    <td>
                      <select
                        value={item.category || 'その他'}
                        onChange={(e) => updateItem(idx, 'category', e.target.value)}
                        className="edit-select"
                        style={CATEGORY_STYLES[item.category] || CATEGORY_STYLES['その他']}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn-icon-remove"
                        onClick={() => removeItem(idx)}
                        title="削除"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 消費税 */}
            <div className="edit-row" style={{ marginTop: 12 }}>
              <label>🧾 消費税</label>
              <input
                type="number"
                value={editableResult.tax ?? 0}
                onChange={(e) => updateField('tax', e.target.value)}
                className="edit-input edit-input-price"
                min="0"
              />
            </div>

            {/* 合計（小計＋消費税） */}
            <div className="calc-total">
              <span>小計 ¥{calcSubtotal.toLocaleString()} ＋ 消費税 ¥{(Number(editableResult.tax) || 0).toLocaleString()}</span>
              <span className="calc-total-amount">¥{calcTotal.toLocaleString()}</span>
            </div>

            {/* アクションボタン */}
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
