/**
 * Vercel API Route - Notion Delete
 * 純 JavaScript 實作，刪除 Notion 頁面
 */

import { 
  getNotionHeaders, 
  getCorsHeaders, 
  createErrorResponse, 
  createSuccessResponse 
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
    const { pageId } = req.body;

    if (!pageId) {
      return res.status(400).json(createErrorResponse(new Error('Missing pageId'), 400));
    }

    // 從環境變數取得 Notion API Key（優先使用伺服器端變數）
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY;
    if (!notionApiKey) {
      return res.status(500).json(createErrorResponse(new Error('Notion API key not configured'), 500));
    }

    console.log('Deleting page:', pageId);

    // 刪除頁面 (Notion 使用 archive 方式)
    const deleteResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: getNotionHeaders(notionApiKey),
      body: JSON.stringify({ 
        archived: true 
      })
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('Notion API error:', errorText);
      return res.status(deleteResponse.status).json(createErrorResponse(
        new Error(`Notion API error: ${errorText}`), 
        deleteResponse.status
      ));
    }

    const deletedPage = await deleteResponse.json();
    console.log(`Successfully deleted page: ${pageId}`);

    return res.status(200).json(createSuccessResponse({
      id: deletedPage.id,
      archived: deletedPage.archived,
      last_edited_time: deletedPage.last_edited_time
    }));

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json(createErrorResponse(error));
  }
}