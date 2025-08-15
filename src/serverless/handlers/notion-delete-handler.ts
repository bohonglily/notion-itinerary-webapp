/**
 * Notion 刪除頁面 Handler
 */

import { BaseHandler, ServerlessRequest, ServerlessResponse, ServerlessContext } from '../core/base-handler';
import { NotionService } from '../services/notion-service';

export class NotionDeleteHandler extends BaseHandler {
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

      const { pageId } = body;

      if (!pageId) {
        return this.createErrorResponse(400, 'Missing pageId');
      }

      const result = await this.notionService.deletePage(pageId);

      return this.createSuccessResponse(result);

    } catch (error: any) {
      console.error('Notion delete error:', error);
      return this.createErrorResponse(
        500,
        'Failed to delete Notion page',
        error.message
      );
    }
  }
}