/**
 * Netlify Function - Notion Query
 * 使用統一的 Handler 和平台適配器
 */

import { NotionQueryHandler } from '../../src/serverless/handlers/notion-query-handler.js';
import { PlatformAdapter } from '../../src/serverless/core/platform-adapter.js';

// 創建 Handler 實例
const notionHandler = new NotionQueryHandler();

export const handler = async (event) => {
  try {
    // 轉換 Netlify 請求為統一格式
    const request = PlatformAdapter.fromNetlifyEvent(event);
    const context = PlatformAdapter.createContext('notion-query');
    
    // 執行 Handler
    const response = await notionHandler.handle(request, context);
    
    // 轉換為 Netlify 回應格式
    return PlatformAdapter.toNetlifyResponse(response);
    
  } catch (error) {
    console.error('Netlify Function Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error.message 
      })
    };
  }
};
