/**
 * Vercel API Route - Image Proxy
 * 使用統一的 Handler 和平台適配器
 */

import { ImageProxyHandler } from '../src/serverless/handlers/image-proxy-handler.js';
import { PlatformAdapter } from '../src/serverless/core/platform-adapter.js';

// 創建 Handler 實例
const handler = new ImageProxyHandler();

export default async function imageProxy(req, res) {
  try {
    // 轉換 Vercel 請求為統一格式
    const request = PlatformAdapter.fromVercelRequest(req);
    const context = PlatformAdapter.createContext('image-proxy');
    
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