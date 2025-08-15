/**
 * Netlify Function - Notion Database Info
 * 與 Vercel 版本保持一致的純 JavaScript 實作
 */

export const handler = async (event) => {
  // 處理 CORS 預檢請求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    };
  }

  // 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { databaseId } = JSON.parse(event.body);

    if (!databaseId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Missing databaseId' })
      };
    }

    // 從環境變數取得 Notion API Key
    const notionApiKey = process.env.VITE_NOTION_API_KEY;
    if (!notionApiKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Notion API key not configured' })
      };
    }

    console.log('Fetching database info for:', databaseId);

    // 直接呼叫 Notion API
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('Notion API error:', errorText);
      return {
        statusCode: notionResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Notion API error',
          details: errorText
        })
      };
    }

    const databaseData = await notionResponse.json();

    // 回傳資料庫資訊（與 Vercel 版本一致）
    const result = {
      id: databaseData.id,
      title: databaseData.title?.[0]?.plain_text || 'Untitled',
      lastEditedTime: databaseData.last_edited_time,
      properties: Object.keys(databaseData.properties || {}),
      url: databaseData.url
    };

    console.log(`Successfully fetched database info for ${databaseId}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: result
      })
    };

  } catch (error) {
    console.error('Netlify Function Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Internal Server Error', 
        message: error.message 
      })
    };
  }
};