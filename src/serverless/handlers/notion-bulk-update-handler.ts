/**
 * Notion 批量更新 Handler
 */

import { BaseHandler, ServerlessRequest, ServerlessResponse, ServerlessContext } from '../core/base-handler';
import { NotionService } from '../services/notion-service';

export class NotionBulkUpdateHandler extends BaseHandler {
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

      const { updates } = body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return this.createErrorResponse(400, 'Missing or invalid updates array');
      }

      // 驗證每個更新項目的格式
      for (const update of updates) {
        if (!update.pageId || !update.properties) {
          return this.createErrorResponse(400, 'Each update must have pageId and properties');
        }
      }

      const result = await this.notionService.bulkUpdatePages({ updates });

      return this.createSuccessResponse(result);

    } catch (error: any) {
      console.error('Notion bulk update error:', error);
      return this.createErrorResponse(
        500,
        'Failed to bulk update Notion pages',
        error.message
      );
    }
  }
}