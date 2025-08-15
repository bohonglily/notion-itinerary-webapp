/**
 * Notion 更新頁面 Handler
 */

import { BaseHandler, ServerlessRequest, ServerlessResponse, ServerlessContext } from '../core/base-handler';
import { NotionService } from '../services/notion-service';

export class NotionUpdateHandler extends BaseHandler {
  private notionService: NotionService;

  constructor(apiKey?: string) {
    super();
    this.notionService = new NotionService(apiKey);
  }

  async handle(request: ServerlessRequest, context: ServerlessContext): Promise<ServerlessResponse> {
    // 處理 CORS 預檢請求
    if (request.method === 'OPTIONS') {
      return this.handleCorsPrelight();
    }

    // 只允許 POST 請求
    if (!this.validateMethod(request, ['POST'])) {
      return this.createErrorResponse(405, 'Method not allowed');
    }

    try {
      const body = this.parseJsonBody(request);
      if (!body) {
        return this.createErrorResponse(400, 'Invalid JSON body');
      }

      const { pageId, properties } = body;

      if (!pageId || !properties) {
        return this.createErrorResponse(400, 'Missing pageId or properties');
      }

      const result = await this.notionService.updatePage({
        pageId,
        properties,
      });

      return this.createSuccessResponse(result);

    } catch (error: any) {
      console.error('Notion update error:', error);
      return this.createErrorResponse(
        500,
        'Failed to update Notion page',
        error.message
      );
    }
  }
}