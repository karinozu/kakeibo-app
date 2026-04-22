const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
const path = require('path');

// プロジェクトルートの.envを読み込む
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// メモリストレージでマルチパートを受け取る
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MBまで
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

// レシート画像解析エンドポイント
app.post('/api/analyze-receipt', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '画像ファイルが必要です' });
  }

  // サポート形式の確認
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!supportedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'JPEG・PNG・GIF・WebP・PDF形式のファイルをアップロードしてください' });
  }

  const fileData = req.file.buffer.toString('base64');
  const mediaType = req.file.mimetype;
  const isPdf = mediaType === 'application/pdf';

  // PDF は document ブロック、画像は image ブロックで送信
  const fileContentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } }
    : { type: 'image',    source: { type: 'base64', media_type: mediaType,          data: fileData } };

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            fileContentBlock,
            {
              type: 'text',
              text: `このファイル（レシートまたは請求明細書）を読み取り、以下のJSON形式のみで返してください。余分な説明は不要です。

{
  "documentType": "receipt または invoice（レシートなら receipt、請求明細・請求書なら invoice）",
  "date": "YYYY-MM-DD形式の発行日・購入日（読み取れない場合はnull）",
  "dueDate": "YYYY-MM-DD形式の支払期限（請求書の場合。ない場合はnull）",
  "invoiceNumber": "請求書番号・伝票番号（ある場合。ない場合はnull）",
  "store": "店舗名・請求元会社名（読み取れない場合はnull）",
  "items": [
    {"name": "商品名・サービス名", "price": 税抜き金額（数値）, "category": "カテゴリ"}
  ],
  "tax": 消費税合計（数値。記載がない場合は0）,
  "total": 税込み合計金額（数値）
}

- itemsのpriceは税抜き金額を記載してください。税抜き金額が読み取れない場合は税込み金額を記載してください。
- taxは消費税の合計金額（8%分と10%分がある場合は合算）を記載してください。
- totalは税込みの合計金額を記載してください。
- カテゴリは必ず以下から1つ選択してください：
  食費（食料品・飲料）、日用品（洗剤・衛生用品・生活雑貨）、外食（レストラン・カフェ・テイクアウト）、交通費（電車・バス・タクシー）、医療費（薬・病院）、娯楽（映画・書籍・ゲーム）、その他

JSONのみを返してください。`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].text;

    // コードブロック付きでも対応できるようJSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({ error: 'レシートの読み取りに失敗しました。別の画像をお試しください。' });
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json(data);
  } catch (error) {
    console.error('Claude APIエラー:', error);
    if (error.status === 401) {
      return res.status(401).json({ error: 'APIキーが無効です。.envファイルを確認してください。' });
    }
    res.status(500).json({ error: 'サーバーエラーが発生しました。しばらくしてからお試しください。' });
  }
});

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
