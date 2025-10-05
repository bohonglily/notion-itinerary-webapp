/**
 * Netlify Function - Notion Query
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
    const { databaseId, startDate, endDate } = JSON.parse(event.body);

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

    // 建構查詢條件
    const queryBody = {
      sorts: [
        {
          property: '排序',
          direction: 'ascending'
        },
        {
          property: '日期',
          direction: 'ascending'
        }
      ]
    };

    // 如果有日期範圍，添加篩選條件
    if (startDate || endDate) {
      if (startDate && endDate) {
        // 當有開始和結束日期時，使用 and 條件
        queryBody.filter = {
          "and": [
            {
              "property": "日期",
              "date": {
                "on_or_after": startDate
              }
            },
            {
              "property": "日期",
              "date": {
                "on_or_before": endDate
              }
            }
          ]
        };
      } else if (startDate) {
        // 只有開始日期
        queryBody.filter = {
          "property": "日期",
          "date": {
            "on_or_after": startDate
          }
        };
      } else if (endDate) {
        // 只有結束日期
        queryBody.filter = {
          "property": "日期",
          "date": {
            "on_or_before": endDate
          }
        };
      }
    }

    console.log('Querying Notion database:', databaseId, 'with filters:', queryBody);

    // 分頁處理：持續抓取直到沒有更多資料
    let allResults = [];
    let hasMore = true;
    let nextCursor = null;
    let pageCount = 0;

    while (hasMore) {
      pageCount++;
      const currentQuery = {
        ...queryBody,
        ...(nextCursor ? { start_cursor: nextCursor } : {})
      };

      console.log(`Fetching page ${pageCount}${nextCursor ? ` with cursor: ${nextCursor}` : ''}`);

      const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentQuery)
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

      const notionData = await notionResponse.json();
      allResults = [...allResults, ...notionData.results];
      hasMore = notionData.has_more;
      nextCursor = notionData.next_cursor;

      console.log(`Page ${pageCount}: fetched ${notionData.results.length} items, total: ${allResults.length}, has_more: ${hasMore}`);
    }

    console.log(`Completed fetching all pages. Total items: ${allResults.length}`);

    // 同時取得資料庫資訊以獲得名稱
    const dbInfoResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    });

    let databaseName = 'Untitled Database';
    let databaseLastEditedTime = new Date().toISOString();
    
    if (dbInfoResponse.ok) {
      const dbInfo = await dbInfoResponse.json();
      databaseName = dbInfo.title?.[0]?.plain_text || 'Untitled Database';
      databaseLastEditedTime = dbInfo.last_edited_time;
    }

    // 轉換 Notion 資料格式
    const transformedData = allResults.map(page => {
      const properties = page.properties;

      // 調試：記錄參考資料的原始結構
      if (properties.參考資料?.rich_text?.length > 0) {
        console.log('參考資料 rich_text structure:', JSON.stringify(properties.參考資料.rich_text, null, 2));
      }

      return {
        id: page.id,
        項目: properties.項目?.title?.[0]?.plain_text || '',
        日期: properties.日期?.date?.start || null,
        時段: properties.時段?.multi_select?.map(item => item.name) || [],
        GoogleMaps: properties.GoogleMaps?.url || '',
        重要資訊: properties.重要資訊?.rich_text?.map(item => item.plain_text).join('') || '',
        參考資料: properties.參考資料?.rich_text?.map(item => item.plain_text).join('') || '',
        人均價: properties.人均價?.number || null,
        幣別: properties.幣別?.rich_text?.map(item => item.plain_text).join('') || '',
        前往方式: properties.前往方式?.rich_text?.map(item => item.plain_text).join('') || '',
        待辦: properties.待辦?.rich_text?.map(item => item.plain_text).join('') || '',
        縮圖網址: properties.縮圖網址?.url || '',
        景點介紹: properties.景點介紹?.rich_text?.map(item => item.plain_text).join('') || '',
        排序: properties.排序?.number || 0,
        lastEditedTime: page.last_edited_time
      };
    });

    // 調試：記錄轉換後的參考資料內容
    transformedData.forEach(item => {
      if (item.參考資料) {
        console.log(`項目 "${item.項目}" 的參考資料內容:`, item.參考資料);
      }
    });

    console.log(`Successfully queried ${transformedData.length} items from database ${databaseId}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        results: transformedData,
        has_more: false, // 已經抓取所有資料，設為 false
        next_cursor: null, // 已經抓取所有資料，設為 null
        databaseName: databaseName,
        databaseLastEditedTime: databaseLastEditedTime
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