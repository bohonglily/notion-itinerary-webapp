/**
 * Vercel API Route - Notion Bulk Update
 * 純 JavaScript 實作，批量更新 Notion 頁面
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
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json(createErrorResponse(new Error('Missing or invalid updates array'), 400));
    }

    // 從環境變數取得 Notion API Key（優先使用伺服器端變數）
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY;
    if (!notionApiKey) {
      return res.status(500).json(createErrorResponse(new Error('Notion API key not configured'), 500));
    }

    console.log(`Bulk updating ${updates.length} pages`);

    const results = [];
    const errors = [];

    // 批量處理更新
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      const { pageId, properties } = update;

      if (!pageId || !properties) {
        errors.push({
          index: i,
          error: 'Missing pageId or properties',
          pageId
        });
        continue;
      }

      try {
        const updateResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: 'PATCH',
          headers: getNotionHeaders(notionApiKey),
          body: JSON.stringify({ properties })
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          errors.push({
            index: i,
            pageId,
            error: errorText,
            status: updateResponse.status
          });
          continue;
        }

        const updatedPage = await updateResponse.json();
        results.push({
          index: i,
          pageId: updatedPage.id,
          last_edited_time: updatedPage.last_edited_time
        });

        console.log(`Updated page ${i + 1}/${updates.length}: ${pageId}`);

      } catch (error) {
        errors.push({
          index: i,
          pageId,
          error: error.message
        });
      }
    }

    console.log(`Bulk update completed: ${results.length} successful, ${errors.length} errors`);

    return res.status(200).json(createSuccessResponse({
      totalRequested: updates.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    }));

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json(createErrorResponse(error));
  }
}