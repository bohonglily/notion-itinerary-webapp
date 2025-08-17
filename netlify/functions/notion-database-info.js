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

    // 從環境變數取得 Notion API Key（優先使用伺服器端變數）
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY;
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

    // 查詢資料庫中最新的頁面來獲取真正的 last_edited_time
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
            timestamp: 'last_edited_time',
            direction: 'descending'
          }
        ],
        page_size: 1
      })
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.error('Query API error:', errorText);
      
      // 如果查詢失敗，退回到查詢資料庫本身
      console.log('Falling back to database last_edited_time');
      const databaseResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });

      if (!databaseResponse.ok) {
        const dbErrorText = await databaseResponse.text();
        console.error('Database API error:', dbErrorText);
        return {
          statusCode: databaseResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Notion API error',
            details: dbErrorText
          })
        };
      }

      const databaseData = await databaseResponse.json();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          databaseLastEditedTime: databaseData.last_edited_time
        })
      };
    }

    const queryData = await queryResponse.json();
    
    // 取得最新頁面的 last_edited_time
    let latestLastEditedTime;
    if (queryData.results && queryData.results.length > 0) {
      latestLastEditedTime = queryData.results[0].last_edited_time;
      console.log('Latest page last_edited_time:', latestLastEditedTime);
    } else {
      // 如果沒有頁面，查詢資料庫本身
      console.log('No pages found, using database last_edited_time');
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
      } else {
        throw new Error('Failed to get database info');
      }
    }

    console.log(`Returning last_edited_time: ${latestLastEditedTime}`);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        databaseLastEditedTime: latestLastEditedTime
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