import { Client } from '@notionhq/client';

export const handler = async (event) => {
  // 處理 CORS 預檢請求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  // 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { databaseId } = JSON.parse(event.body);

    if (!databaseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing databaseId' })
      };
    }

    const notion = new Client({ auth: process.env.VITE_NOTION_API_KEY });

    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
      page_size: 1,
    });

    let databaseLastEditedTime;
    if (response.results.length > 0) {
      databaseLastEditedTime = response.results[0].last_edited_time;
    } else {
      // 如果資料庫是空的，就回傳資料庫本身的最後編輯時間
      const dbInfo = await notion.databases.retrieve({ database_id: databaseId });
      databaseLastEditedTime = dbInfo.last_edited_time;
    }

    console.log(`Successfully fetched most recent page last_edited_time for database ${databaseId}: ${databaseLastEditedTime}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ databaseLastEditedTime })
    };
  } catch (error) {
    console.error('Error fetching database info:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch database info from Notion' })
    };
  }
};