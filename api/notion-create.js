/**
 * Vercel API Route - Notion Create
 * 純 JavaScript 實作，建立新的 Notion 頁面
 */

import { 
  getNotionHeaders, 
  getCorsHeaders, 
  createErrorResponse, 
  createSuccessResponse,
  buildNotionProperties 
} from '../utils/notion-client.js';

export default async function handler(req, res) {
  // 設定 CORS 標頭
  const corsHeaders = getCorsHeaders();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json(createErrorResponse(new Error('Method not allowed'), 405));
  }

  try {
    const { databaseId, properties: rawProperties } = req.body;

    if (!databaseId) {
      return res.status(400).json(createErrorResponse(new Error('Missing databaseId'), 400));
    }

    if (!rawProperties) {
      return res.status(400).json(createErrorResponse(new Error('Missing properties'), 400));
    }

    // 從環境變數取得 Notion API Key（優先使用伺服器端變數）
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY;
    if (!notionApiKey) {
      return res.status(500).json(createErrorResponse(new Error('Notion API key not configured'), 500));
    }

    console.log('Creating new page in database:', databaseId);

    // 建立新頁面
    const createResponse = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: getNotionHeaders(notionApiKey),
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: rawProperties
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Notion API error:', errorText);
      return res.status(createResponse.status).json(createErrorResponse(
        new Error(`Notion API error: ${errorText}`), 
        createResponse.status
      ));
    }

    const createdPage = await createResponse.json();
    console.log(`Successfully created page: ${createdPage.id}`);

    return res.status(200).json(createSuccessResponse({
      id: createdPage.id,
      created_time: createdPage.created_time,
      last_edited_time: createdPage.last_edited_time
    }));

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json(createErrorResponse(error));
  }
}