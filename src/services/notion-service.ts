import { NotionItineraryItem, ItineraryData, NotionPageResponse } from '../types';
import { logger } from './logger-service';
import { ApiServiceFactory } from './api-service-factory';

// 時段排序對應表
const TIME_PERIOD_ORDER = {
  '摘要': 0,
  '清晨': 1,
  '早餐': 2,
  '上午': 3,
  '午餐': 4,
  '下午': 5,
  '傍晚': 6,
  '晚餐': 7,
  '晚上': 8,
  '深夜': 9,
  '夜泊': 10
};

export class NotionService {
  private apiFactory: ApiServiceFactory;

  constructor() {
    this.apiFactory = ApiServiceFactory.getInstance();
  }
  private async _makeRequest<T>(path: string, method: string, body?: object): Promise<T> {
    logger.apiRequest(method, path, body);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 秒超時
      
      const response = await window.fetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      logger.info('API', `Response received: ${method} ${path}`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const errorText = await response.text();
            errorData = { error: errorText, raw: errorText };
          }
        } catch (parseError) {
          logger.error('API', `Failed to parse error response for ${method} ${path}`, { parseError });
          errorData = { error: `HTTP ${response.status} ${response.statusText}` };
        }
        
        logger.apiResponse(method, path, response.status, errorData);
        throw new Error(`${method} ${path} failed: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      logger.apiResponse(method, path, response.status, result);
      return result;
    } catch (error) {
      logger.apiError(method, path, error as Error);
      throw error;
    }
  }

  buildNotionProperties(item: Partial<NotionItineraryItem>): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    if (item.項目) properties['項目'] = { title: [{ text: { content: item.項目 } }] };
    if (item.日期) properties['日期'] = { date: { start: item.日期 } };
    if (item.時段 && item.時段.length > 0) properties['時段'] = { multi_select: item.時段.map(name => ({ name })) };
    if (item.景點介紹) properties['景點介紹'] = { rich_text: [{ text: { content: item.景點介紹 } }] };
    if (item.縮圖網址) properties['縮圖網址'] = { url: item.縮圖網址 };
    if (item.GoogleMaps) properties['GoogleMaps'] = { url: item.GoogleMaps };
        if (item.人均價 !== null && item.人均價 !== undefined) properties['人均價'] = { number: item.人均價 };
    if (item.前往方式) properties['前往方式'] = { rich_text: [{ text: { content: item.前往方式 } }] };
    if (item.重要資訊) properties['重要資訊'] = { rich_text: [{ text: { content: item.重要資訊 } }] };
    if (item.待辦) properties['待辦'] = { rich_text: [{ text: { content: item.待辦 } }] };
    if (item.排序 !== null && item.排序 !== undefined) properties['排序'] = { number: item.排序 };
    return properties;
  }

  // 只保留 fetch 代理呼叫
async getItineraryData(databaseId: string, startDate?: string | null, endDate?: string | null): Promise<ItineraryData> {
    logger.info('NOTION', 'Getting itinerary data', { databaseId, startDate, endDate });
    
    // 格式化日期，只取 YYYY-MM-DD 部分
    const formattedStartDate = startDate ? startDate.split('T')[0] : null;
    const formattedEndDate = endDate ? endDate.split('T')[0] : null;

    // 使用動態 API 端點
    const endpoint = this.apiFactory.getEndpoint('notionQuery');
    const notionData = await this._makeRequest<any>(endpoint, 'POST', { databaseId, startDate: formattedStartDate, endDate: formattedEndDate });
    
    logger.debug('NOTION', 'Notion data received', { resultsCount: notionData.results?.length });
    let items: NotionItineraryItem[] = notionData.results.map((page: NotionPageResponse) => {
      const properties = page.properties;
      return {
        id: page.id,
        項目: properties['項目']?.title?.[0]?.plain_text || '',
        日期: properties['日期']?.date?.start || '',
        時段: properties['時段']?.multi_select?.map((s) => s.name) || [],
        GoogleMaps: properties['GoogleMaps']?.url || '',
        重要資訊: properties['重要資訊']?.rich_text?.map((t) => t.plain_text).join('') || '',
        人均價: properties['人均價']?.number || 0,
        前往方式: properties['前往方式']?.rich_text?.map((t) => t.plain_text).join('') || '',
        待辦: properties['待辦']?.rich_text?.map((t) => t.plain_text).join('') || '',
        縮圖網址: properties['縮圖網址']?.url || '',
        景點介紹: properties['景點介紹']?.rich_text?.map((t) => t.plain_text).join('') || '',
        排序: properties['排序']?.number || null
      };
    });
    // 依照日期、時段、排序欄位進行排序
    items = items.sort((a, b) => {
      // 1. 先按日期排序
      if (a.日期 !== b.日期) {
        return a.日期 > b.日期 ? 1 : -1;
      }
      
      // 2. 同日期內按時段排序（取第一個時段）
      const timeA = a.時段?.[0] || '';
      const timeB = b.時段?.[0] || '';
      const timeOrderA = TIME_PERIOD_ORDER[timeA as keyof typeof TIME_PERIOD_ORDER] ?? 999;
      const timeOrderB = TIME_PERIOD_ORDER[timeB as keyof typeof TIME_PERIOD_ORDER] ?? 999;
      
      if (timeOrderA !== timeOrderB) {
        return timeOrderA - timeOrderB;
      }
      
      // 3. 同時段內按排序欄位排序
      const sortA = a.排序 ?? 999999; // 沒有排序的項目放到最後
      const sortB = b.排序 ?? 999999;
      return sortA - sortB;
    });
    return {
      items,
      lastUpdated: new Date().toISOString(),
      databaseId,
      databaseName: notionData.databaseName,
      databaseLastEditedTime: notionData.databaseLastEditedTime
    };
  }

  async updateNotionPage(pageId: string, properties: Record<string, unknown>): Promise<unknown> {
    const endpoint = this.apiFactory.getEndpoint('notionUpdate');
    return this._makeRequest(endpoint, 'POST', { pageId, properties });
  }

  async createNotionPage(databaseId: string, properties: Record<string, unknown>): Promise<unknown> {
    const endpoint = this.apiFactory.getEndpoint('notionCreate');
    return this._makeRequest(endpoint, 'POST', { databaseId, properties });
  }

  async deleteNotionPage(pageId: string): Promise<unknown> {
    const endpoint = this.apiFactory.getEndpoint('notionDelete');
    return this._makeRequest(endpoint, 'POST', { pageId });
  }

  async bulkUpdateImages(items: NotionItineraryItem[], imageUrls: string[]): Promise<unknown> {
    const updates = items.map((item, index) => ({
      pageId: item.id,
      properties: {
        '縮圖網址': { url: imageUrls[index] || null }
      }
    }));
    const endpoint = this.apiFactory.getEndpoint('notionBulkUpdate');
    return this._makeRequest(endpoint, 'POST', { updates });
  }

  async bulkUpdateDescriptions(items: NotionItineraryItem[], descriptions: string[]): Promise<unknown> {
    const updates = items.map((item, index) => ({
      pageId: item.id,
      properties: {
        '景點介紹': {
          rich_text: [{
            type: 'text',
            text: { content: descriptions[index] || '' }
          }]
        }
      }
    }));
    const endpoint = this.apiFactory.getEndpoint('notionBulkUpdate');
    return this._makeRequest(endpoint, 'POST', { updates });
  }

  async getDatabaseLastEditedTime(databaseId: string): Promise<string> {
    const endpoint = this.apiFactory.getEndpoint('notionDatabaseInfo');
    const data = await this._makeRequest<any>(endpoint, 'POST', { databaseId });
    return data.databaseLastEditedTime;
  }
}

export const notionService = new NotionService();