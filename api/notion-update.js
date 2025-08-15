/**
 * Vercel API Route - Notion Update
 * 使用統一的 Handler 和平台適配器
 */

import { NotionUpdateHandler } from '../src/serverless/handlers/notion-update-handler.js';
import { PlatformAdapter } from '../src/serverless/core/platform-adapter.js';

// 創建 Handler 實例
const handler = new NotionUpdateHandler();

export default async function notionUpdate(req, res) {
  try {
    // 轉換 Vercel 請求為統一格式
    const request = PlatformAdapter.fromVercelRequest(req);
    const context = PlatformAdapter.createContext('notion-update');
    
    // 執行 Handler
    const response = await handler.handle(request, context);
    
    // 轉換為 Vercel 回應格式
    PlatformAdapter.toVercelResponse(res, response);
    
  } catch (error) {
    console.error('Vercel API Route Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}