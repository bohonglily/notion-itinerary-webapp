/**
 * Notion 服務抽象層
 * 提供平台無關的 Notion API 操作
 */

import { Client } from '@notionhq/client';

export interface NotionQueryParams {
  databaseId: string;
  startDate?: string;
  endDate?: string;
}

export interface NotionCreateParams {
  databaseId: string;
  properties: any;
}

export interface NotionUpdateParams {
  pageId: string;
  properties: any;
}

export interface NotionBulkUpdateParams {
  updates: Array<{
    pageId: string;
    properties: any;
  }>;
}

export class NotionService {
  private notion: Client;

  constructor(apiKey?: string) {
    // 優先使用傳入的 API key，否則使用環境變數
    const notionApiKey = apiKey || 
      process.env.VITE_NOTION_API_KEY || 
      process.env.NOTION_API_KEY;
      
    if (!notionApiKey) {
      throw new Error('Notion API key is required');
    }

    this.notion = new Client({ auth: notionApiKey });
  }

  /**
   * 查詢資料庫
   */
  async queryDatabase(params: NotionQueryParams) {
    const { databaseId, startDate, endDate } = params;

    // 獲取資料庫資訊
    const database = await this.notion.databases.retrieve({ database_id: databaseId });
    const databaseName = database.title?.[0]?.plain_text || '未命名資料庫';
    const databaseLastEditedTime = database.last_edited_time;

    // 建立查詢負載
    const queryPayload: any = {
      database_id: databaseId,
      sorts: [
        {
          property: '日期',
          direction: 'ascending',
        },
        {
          property: '時段',
          direction: 'ascending',
        },
        {
          property: '排序',
          direction: 'ascending',
        },
      ],
    };

    // 如果有提供日期，則加入篩選條件
    if (startDate && endDate) {
      queryPayload.filter = {
        and: [
          {
            property: '日期',
            date: {
              on_or_after: startDate,
            },
          },
          {
            property: '日期',
            date: {
              on_or_before: endDate,
            },
          },
        ],
      };
    }

    // 查詢資料庫
    const response = await this.notion.databases.query(queryPayload);
    
    return { 
      ...response, 
      databaseName, 
      databaseLastEditedTime 
    };
  }

  /**
   * 建立新頁面
   */
  async createPage(params: NotionCreateParams) {
    const { databaseId, properties } = params;

    const response = await this.notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties,
    });

    return response;
  }

  /**
   * 更新頁面
   */
  async updatePage(params: NotionUpdateParams) {
    const { pageId, properties } = params;

    const response = await this.notion.pages.update({
      page_id: pageId,
      properties: properties,
    });

    return response;
  }

  /**
   * 刪除頁面 (實際上是歸檔)
   */
  async deletePage(pageId: string) {
    const response = await this.notion.pages.update({
      page_id: pageId,
      archived: true,
    });

    return response;
  }

  /**
   * 批量更新頁面
   */
  async bulkUpdatePages(params: NotionBulkUpdateParams) {
    const { updates } = params;
    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const result = await this.updatePage(update);
        results.push({ 
          pageId: update.pageId, 
          success: true, 
          data: result 
        });
      } catch (error: any) {
        errors.push({ 
          pageId: update.pageId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return {
      total: updates.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  /**
   * 獲取資料庫資訊
   */
  async getDatabaseInfo(databaseId: string) {
    const database = await this.notion.databases.retrieve({ database_id: databaseId });
    
    return {
      id: database.id,
      title: database.title,
      description: database.description,
      properties: database.properties,
      created_time: database.created_time,
      last_edited_time: database.last_edited_time,
    };
  }
}