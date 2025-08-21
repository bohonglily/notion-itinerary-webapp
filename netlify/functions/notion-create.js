/**
 * Netlify Function - Notion Create
 * 與 Vercel 版本保持一致的純 JavaScript 實作
 */

import { buildNotionProperties, getNotionHeaders, getCorsHeaders, createErrorResponse, createSuccessResponse } from '../../utils/notion-client.js';
export const handler = async (event) => {
  // 處理 CORS 預檢請求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: ''
    };
  }

  // 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { databaseId, item } = JSON.parse(event.body);

    if (!databaseId || !item) {
      return {
        statusCode: 400,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing databaseId or item data' })
      };
    }

    // 從環境變數取得 Notion API Key
    const notionApiKey = process.env.VITE_NOTION_API_KEY;
    if (!notionApiKey) {
      return {
        statusCode: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Notion API key not configured' })
      };
    }

    // 前端已經處理過格式轉換，直接使用傳來的 properties
    const properties = item;

    console.log('Creating new page in database:', databaseId, 'with properties:', properties);

    // 建立新頁面
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: getNotionHeaders(notionApiKey),
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Notion API error:', errorData);
      return {
        statusCode: response.status,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(createErrorResponse(new Error(`Notion API error: ${errorData}`), response.status))
      };
    }

    const pageData = await response.json();
    console.log('Successfully created page:', pageData.id);

    return {
      statusCode: 200,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(createSuccessResponse({ 
        id: pageData.id,
        message: 'Page created successfully'
      }))
    };

  } catch (error) {
    console.error('Netlify Function Error:', error);
    return {
      statusCode: 500,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(createErrorResponse(error))
    };
  }
};
