/**
 * API 服務工廠
 * 根據部署平台動態選擇正確的 API 端點
 */

// 移除 serverless 依賴，使用簡化的平台檢測

export interface ApiEndpoints {
  notionQuery: string;
  notionCreate: string;
  notionUpdate: string;
  notionDelete: string;
  notionBulkUpdate: string;
  notionDatabaseInfo: string;
  imageProxy: string;
}

export class ApiServiceFactory {
  private static instance: ApiServiceFactory;
  private endpoints: ApiEndpoints;

  private constructor() {
    this.endpoints = this.buildEndpoints();
  }

  static getInstance(): ApiServiceFactory {
    if (!ApiServiceFactory.instance) {
      ApiServiceFactory.instance = new ApiServiceFactory();
    }
    return ApiServiceFactory.instance;
  }

  /**
   * 構建 API 端點
   */
  private buildEndpoints(): ApiEndpoints {
    // 檢測當前環境
    const isClient = typeof window !== 'undefined';
    const isDev = process.env.NODE_ENV === 'development';
    
    let basePath: string;
    
    if (isClient) {
      // 瀏覽器環境：使用當前域名
      const origin = window.location.origin;
      
      // 根據域名判斷平台
      if (origin.includes('netlify.app') || origin.includes('netlify.com')) {
        basePath = `${origin}/.netlify/functions`;
        console.log('🔧 API Service Factory: Detected Netlify platform', { origin, basePath });
      } else if (origin.includes('vercel.app') || origin.includes('vercel.com')) {
        basePath = `${origin}/api`;
        console.log('🔧 API Service Factory: Detected Vercel platform', { origin, basePath });
      } else if (isDev) {
        // 開發環境：檢查是否有 Netlify Dev
        basePath = origin.includes('localhost:8888') 
          ? `${origin}/.netlify/functions`
          : `${origin}/api`;
        console.log('🔧 API Service Factory: Development environment', { origin, basePath });
      } else {
        // 預設使用 Netlify 格式
        basePath = `${origin}/.netlify/functions`;
        console.log('🔧 API Service Factory: Default to Netlify format', { origin, basePath });
      }
    } else {
      // 服務端環境：預設使用 API 格式
      basePath = '/api';
      console.log('🔧 API Service Factory: Server-side environment', { basePath });
    }

    return {
      notionQuery: `${basePath}/notion-query`,
      notionCreate: `${basePath}/notion-create`,
      notionUpdate: `${basePath}/notion-update`,
      notionDelete: `${basePath}/notion-delete`,
      notionBulkUpdate: `${basePath}/notion-bulk-update`,
      notionDatabaseInfo: `${basePath}/notion-database-info`,
      imageProxy: `${basePath}/image-proxy`,
    };
  }

  /**
   * 獲取 API 端點
   */
  getEndpoints(): ApiEndpoints {
    return this.endpoints;
  }

  /**
   * 獲取單一端點
   */
  getEndpoint(name: keyof ApiEndpoints): string {
    return this.endpoints[name];
  }

  /**
   * 重建端點（用於環境切換）
   */
  rebuildEndpoints(): void {
    this.endpoints = this.buildEndpoints();
  }

  /**
   * 檢查 API 端點健康狀態
   */
  async checkHealth(): Promise<{
    platform: string;
    endpoints: ApiEndpoints;
    health: Record<string, boolean>;
  }> {
    const health: Record<string, boolean> = {};
    
    // 簡單的健康檢查（發送 OPTIONS 請求）
    for (const [name, url] of Object.entries(this.endpoints)) {
      try {
        const response = await fetch(url, { 
          method: 'OPTIONS',
          signal: AbortSignal.timeout(5000)
        });
        health[name] = response.ok;
      } catch (error) {
        health[name] = false;
      }
    }

    return {
      platform: this.detectSimplePlatform(),
      endpoints: this.endpoints,
      health,
    };
  }

  /**
   * 簡化的平台檢測
   */
  private detectSimplePlatform(): string {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.includes('netlify')) return 'netlify';
      if (origin.includes('vercel')) return 'vercel';
      return 'unknown';
    }
    return 'server';
  }

  /**
   * 獲取推薦的 API 配置
   */
  getRecommendedConfig(): {
    platform: string;
    timeout: number;
    retries: number;
    rateLimitDelay: number;
  } {
    const platform = this.detectSimplePlatform();
    
    // 根據平台提供不同的建議配置
    switch (platform) {
      case 'netlify':
        return {
          platform: 'netlify',
          timeout: 8000, // Netlify 有 10 秒限制
          retries: 2,
          rateLimitDelay: 100,
        };
      
      case 'vercel':
        return {
          platform: 'vercel',
          timeout: 25000, // Vercel 有 30 秒限制
          retries: 3,
          rateLimitDelay: 200,
        };
      
      default:
        return {
          platform: 'unknown',
          timeout: 10000,
          retries: 2,
          rateLimitDelay: 100,
        };
    }
  }
}