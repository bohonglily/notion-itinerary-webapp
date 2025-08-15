/**
 * 基礎 Handler 抽象類別
 * 提供統一的請求/回應介面，支援多平台部署
 */

export interface ServerlessRequest {
  method: string;
  body: string | null;
  headers: Record<string, string>;
  query: Record<string, string>;
  path: string;
}

export interface ServerlessResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

export interface ServerlessContext {
  platform: 'netlify' | 'vercel' | 'aws' | 'unknown';
  functionName: string;
  requestId?: string;
}

export abstract class BaseHandler {
  protected corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  /**
   * 處理 CORS 預檢請求
   */
  protected handleCorsPrelight(): ServerlessResponse {
    return {
      statusCode: 200,
      headers: this.corsHeaders,
      body: '',
    };
  }

  /**
   * 建立成功回應
   */
  protected createSuccessResponse(data: any): ServerlessResponse {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...this.corsHeaders,
      },
      body: JSON.stringify(data),
    };
  }

  /**
   * 建立錯誤回應
   */
  protected createErrorResponse(
    statusCode: number, 
    error: string, 
    details?: any
  ): ServerlessResponse {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...this.corsHeaders,
      },
      body: JSON.stringify({ 
        error, 
        details,
        timestamp: new Date().toISOString()
      }),
    };
  }

  /**
   * 驗證請求方法
   */
  protected validateMethod(request: ServerlessRequest, allowedMethods: string[]): boolean {
    return allowedMethods.includes(request.method);
  }

  /**
   * 解析 JSON body
   */
  protected parseJsonBody<T = any>(request: ServerlessRequest): T | null {
    try {
      return request.body ? JSON.parse(request.body) : null;
    } catch (error) {
      console.error('Failed to parse JSON body:', error);
      return null;
    }
  }

  /**
   * 主要處理方法，需要由子類別實作
   */
  abstract handle(request: ServerlessRequest, context: ServerlessContext): Promise<ServerlessResponse>;
}