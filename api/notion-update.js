/**
 * Vercel API Route - Notion Update
 * 純 JavaScript 實作，更新 Notion 頁面
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
    const { pageId, properties } = req.body;

    if (!pageId) {
      return res.status(400).json(createErrorResponse(new Error('Missing pageId'), 400));
    }

    if (!properties) {
      return res.status(400).json(createErrorResponse(new Error('Missing properties'), 400));
    }

    // 從環境變數取得 Notion API Key（優先使用伺服器端變數）
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY;
    if (!notionApiKey) {
      return res.status(500).json(createErrorResponse(new Error('Notion API key not configured'), 500));
    }

    console.log('Updating page:', pageId);

    // 更新頁面
    const updateResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: getNotionHeaders(notionApiKey),
      body: JSON.stringify({ properties })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Notion API error:', errorText);
      return res.status(updateResponse.status).json(createErrorResponse(
        new Error(`Notion API error: ${errorText}`), 
        updateResponse.status
      ));
    }

    const updatedPage = await updateResponse.json();
    console.log(`Successfully updated page: ${pageId}`);

    return res.status(200).json(createSuccessResponse({
      id: updatedPage.id,
      last_edited_time: updatedPage.last_edited_time
    }));

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json(createErrorResponse(error));
  }
}