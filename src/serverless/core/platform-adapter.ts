/**
 * 平台適配器
 * 將不同平台的請求/回應格式轉換為統一介面
 */

import { ServerlessRequest, ServerlessResponse, ServerlessContext } from './base-handler';

export class PlatformAdapter {
  /**
   * 檢測當前平台
   */
  static detectPlatform(): 'netlify' | 'vercel' | 'aws' | 'unknown' {
    // Netlify 環境變數檢測
    if (process.env.NETLIFY === 'true' || process.env.NETLIFY_DEV === 'true') {
      return 'netlify';
    }
    
    // Vercel 環境變數檢測
    if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
      return 'vercel';
    }
    
    // AWS Lambda 環境變數檢測
    if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
      return 'aws';
    }
    
    return 'unknown';
  }

  /**
   * 從 Netlify event 轉換為統一請求格式
   */
  static fromNetlifyEvent(event: any): ServerlessRequest {
    return {
      method: event.httpMethod,
      body: event.body,
      headers: event.headers || {},
      query: event.queryStringParameters || {},
      path: event.path || '',
    };
  }

  /**
   * 從 Vercel request 轉換為統一請求格式
   */
  static fromVercelRequest(req: any): ServerlessRequest {
    // 解析查詢參數
    const url = new URL(req.url || '', 'http://localhost');
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return {
      method: req.method,
      body: req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : null,
      headers: req.headers || {},
      query,
      path: url.pathname,
    };
  }

  /**
   * 轉換為 Netlify 回應格式
   */
  static toNetlifyResponse(response: ServerlessResponse) {
    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
      isBase64Encoded: response.isBase64Encoded || false,
    };
  }

  /**
   * 轉換為 Vercel 回應格式 (設定 response 物件)
   */
  static toVercelResponse(res: any, response: ServerlessResponse) {
    // 設定狀態碼
    res.status(response.statusCode);
    
    // 設定 headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // 處理 base64 編碼的回應
    if (response.isBase64Encoded) {
      const buffer = Buffer.from(response.body, 'base64');
      res.send(buffer);
    } else {
      // 判斷是否為 JSON
      if (response.headers['Content-Type']?.includes('application/json')) {
        res.json(JSON.parse(response.body));
      } else {
        res.send(response.body);
      }
    }
  }

  /**
   * 建立統一的 context 物件
   */
  static createContext(functionName: string, requestId?: string): ServerlessContext {
    return {
      platform: this.detectPlatform(),
      functionName,
      requestId,
    };
  }
}