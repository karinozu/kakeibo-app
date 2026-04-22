import React, { useState, useRef } from 'react';
import axios from 'axios';
import { CATEGORY_STYLES, CATEGORIES } from '../constants';

function ReceiptUpload({ onReceiptAdded, receipts }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editableResult, setEditableResult] = useState(null);
  const fileInputRef = useRef(null);

  // ========== バリデーション ==========
  const computeWarnings = (data) => {
    if (!data) return [];
    const warns = [];

    const negItems = (data.items || []).filter((i) => Number(i.price) < 0);
    if (negItems.length > 0) {
      warns.push({
        type: 'error',
        message: `金額が負の値の明細があります：${negItems.map((i) => i.name || '(名称不明)').join('、')}`,
      });
    }

    const calcTotal = (data.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0);
    const dup = (receipts || []).find(
      (r) => r.date === data.date && r.date && Math.round(r.total) === Math.round(calcTotal)
    );
    if (dup) {
      warns.push({
        type: 'duplicate',
        message: `同じ日付・合計金額の書類が既に登録されています（${data.date}、¥${calcTotal.toLocaleString()}）`,
      });
    }

    return warns;
  };

  const warnings = computeWarnings(editableResult);

  // ========== ファイル選択 ==========
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setError('');
    setEditableResult(null);

    if (selected.type === 'application/pdf') {
      setIsPdf(true);
      setPreview(null);
    } else {
      setIsPdf(false);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(selected);
    }
  };

  // ========== API呼び出し ==========
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const apiBase = process.env.REACT_APP_API_URL || '';
      const response = await axios.post(`${apiBase}/api/analyze-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditableResult({ ...response.data, items: response.data.items?.map((i) => ({ ...i })) || [] });
    } catch (err) {
      setError(err.response?.data?.error || '読み取りに失敗しました。');
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
      items: prev.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));

  const removeItem = (idx) =>
    setEditableResult((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

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
    setIsPdf(false);
    setEditableResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const calcSubtotal = editableResult
    ? editableResult.items.reduce((s, i) => s + (Number(i.price) || 0), 0)
    : 0;
  const calcTotal = calcSubtotal + (editableResult ? (Number(editableResult.tax) || 0) : 0);

  const isInvoice = editableResult?.documentType === 'invoice';

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2>書類をアップロード</h2>

        {/* ファイル選択ゾーン */}
        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
          {preview ? (
            <img src={preview} alt="プレビュー" className="preview-image" />
          ) : isPdf ? (
            <div className="upload-placeholder">
              <span className="upload-icon">📄</span>
              <p className="pdf-filename">{file?.name}</p>
              <p className="upload-hint">PDFファイルが選択されています</p>
            </div>
          ) : (
            <div className="upload-placeholder">
              <span className="upload-icon">📷</span>
              <p>クリックしてファイルを選択</p>
              <p className="upload-hint">レシート画像（JPEG・PNG・WebP）または請求明細PDF（最大10MB）</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* 読み取りボタン */}
        {file && !editableResult && (
          <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
            {loading ? '⏳ 読み取り中...' : '🔍 内容を読み取る'}
          </button>
        )}

        {error && <p className="error-message">⚠️ {error}</p>}

        {/* ========== 読み取り結果（編集可能） ========== */}
        {editableResult && (
          <div className="result-card">
            <div className="result-header">
              <h3>✅ 読み取り完了 — 内容を確認・修正してください</h3>
              <span className={`doc-type-badge ${isInvoice ? 'doc-invoice' : 'doc-receipt'}`}>
                {isInvoice ? '📋 請求明細' : '🧾 レシート'}
              </span>
            </div>

            {warnings.map((w, i) => (
              <div key={i} className={`validation-warning validation-${w.type}`}>
                {w.type === 'error' ? '🚨' : '⚠️'} {w.message}
              </div>
            ))}

            {/* 基本フィールド */}
            <div className="edit-fields">
              <div className="edit-row">
                <label>📅 {isInvoice ? '発行日' : '日付'}</label>
                <input
                  type="date"
                  value={editableResult.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="edit-input"
                />
              </div>
              <div className="edit-row">
                <label>{isInvoice ? '🏢 請求元' : '🏪 店舗名'}</label>
                <input
                  type="text"
                  value={editableResult.store || ''}
                  placeholder={isInvoice ? '請求元を入力' : '店舗名を入力'}
                  onChange={(e) => updateField('store', e.target.value)}
                  className="edit-input"
                />
              </div>

              {/* 請求明細専用フィールド */}
              {isInvoice && (
                <>
                  <div className="edit-row">
                    <label>🔢 請求書番号</label>
                    <input
                      type="text"
                      value={editableResult.invoiceNumber || ''}
                      placeholder="請求書番号を入力"
                      onChange={(e) => updateField('invoiceNumber', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                  <div className="edit-row">
                    <label>⏰ 支払期限</label>
                    <input
                      type="date"
                      value={editableResult.dueDate || ''}
                      onChange={(e) => updateField('dueDate', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                </>
              )}
            </div>

            {/* 明細一覧 */}
            <div className="edit-table-header">
              <h4>{isInvoice ? '請求明細' : '商品一覧'}</h4>
              <button className="btn btn-secondary btn-sm" onClick={addItem}>
                ＋ 行を追加
              </button>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th>{isInvoice ? 'サービス・品目' : '商品名'}</th>
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
                        placeholder={isInvoice ? 'サービス名' : '商品名'}
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
                      <button className="btn-icon-remove" onClick={() => removeItem(idx)} title="削除">
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

            {/* 合計 */}
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
