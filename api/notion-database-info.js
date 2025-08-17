/**
 * Vercel API Route - Notion Database Info
 * 純 JavaScript 實作，避免 TypeScript 模組導入問題
 */

export default async function handler(req, res) {
  // 設定 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { databaseId } = req.body;

    if (!databaseId) {
      return res.status(400).json({ error: 'Missing databaseId' });
    }

    // 從環境變數取得 Notion API Key（優先使用伺服器端變數）
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY;
    if (!notionApiKey) {
      return res.status(500).json({ error: 'Notion API key not configured' });
    }

    // 暫時回到原本的資料庫查詢方式，等確認基本功能正常後再優化
    const databaseResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    });

    if (!databaseResponse.ok) {
      const errorText = await databaseResponse.text();
      console.error('Notion API error:', errorText);
      return res.status(databaseResponse.status).json({ 
        error: 'Notion API error',
        details: errorText
      });
    }

    const databaseData = await databaseResponse.json();

    // 回傳前端期望的格式
    return res.status(200).json({
      databaseLastEditedTime: databaseData.last_edited_time
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}