/**
 * 圖片代理 Handler
 */

import { BaseHandler, ServerlessRequest, ServerlessResponse, ServerlessContext } from '../core/base-handler';
import { ImageProxyService } from '../services/image-proxy-service';

export class ImageProxyHandler extends BaseHandler {
  private imageProxyService: ImageProxyService;

  constructor() {
    super();
    this.imageProxyService = new ImageProxyService();
  }

  async handle(request: ServerlessRequest, context: ServerlessContext): Promise<ServerlessResponse> {
    // 處理 CORS 預檢請求
    if (request.method === 'OPTIONS') {
      return this.handleCorsPrelight();
    }

    // 允許 GET 請求
    if (!this.validateMethod(request, ['GET'])) {
      return this.createErrorResponse(405, 'Method not allowed');
    }

    try {
      const imageUrl = request.query.url;

      if (!imageUrl) {
        return this.createErrorResponse(400, 'Missing image URL parameter');
      }

      const result = await this.imageProxyService.proxyImage({ imageUrl });

      // 驗證圖片大小
      if (!ImageProxyService.validateImageSize(result.size)) {
        return this.createErrorResponse(413, 'Image size too large');
      }

      // 轉換為 base64
      const base64Data = ImageProxyService.toBase64(result.data);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': result.contentType,
          'Cache-Control': 'public, max-age=3600',
          ...this.corsHeaders,
        },
        body: base64Data,
        isBase64Encoded: true,
      };

    } catch (error: any) {
      console.error('Image proxy error:', error);
      return this.createErrorResponse(
        500,
        'Failed to proxy image',
        error.message
      );
    }
  }
}