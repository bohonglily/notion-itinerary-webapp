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

    // 查詢資料庫中的頁面來獲取最新的 last_edited_time
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            property: 'last_edited_time',
            direction: 'descending'
          }
        ],
        page_size: 1  // 只需要最新的一個頁面
      })
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.error('Notion API error:', errorText);
      return res.status(queryResponse.status).json({ 
        error: 'Notion API error',
        details: errorText
      });
    }

    const queryData = await queryResponse.json();
    
    // 取得最新頁面的 last_edited_time，如果沒有頁面則使用資料庫的時間
    let latestLastEditedTime;
    if (queryData.results && queryData.results.length > 0) {
      latestLastEditedTime = queryData.results[0].last_edited_time;
      console.log('Latest page last_edited_time:', latestLastEditedTime);
    } else {
      // 如果沒有頁面，則取得資料庫本身的時間作為備案
      const databaseResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });
      
      if (databaseResponse.ok) {
        const databaseData = await databaseResponse.json();
        latestLastEditedTime = databaseData.last_edited_time;
        console.log('Using database last_edited_time:', latestLastEditedTime);
      } else {
        throw new Error('Failed to get database info');
      }
    }

    // 回傳前端期望的格式
    return res.status(200).json({
      databaseLastEditedTime: latestLastEditedTime
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