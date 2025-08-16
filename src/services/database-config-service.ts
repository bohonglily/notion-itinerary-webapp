import { notionService } from './notion-service';

export interface DatabaseConfigItem {
  id: string;
  name: string;
  description?: string;
  databaseId: string;
  tags?: string[];
  lastUpdated?: string;
}

class DatabaseConfigService {
  async getDatabaseList(configDatabaseId: string): Promise<DatabaseConfigItem[]> {
    try {
      const response = await notionService.queryDatabase(configDatabaseId);
      
      return response.items.map((item: any) => {
        // 根據 Notion 資料結構解析資料
        const properties = item.properties || {};
        
        return {
          id: item.id,
          name: this.extractTitle(properties['名稱'] || properties['Name'] || properties['title']),
          description: this.extractRichText(properties['描述'] || properties['Description']),
          databaseId: this.extractText(properties['資料庫ID'] || properties['DatabaseID'] || properties['Database ID']),
          tags: this.extractMultiSelect(properties['標籤'] || properties['Tags']),
          lastUpdated: item.last_edited_time
        };
      }).filter(item => item.databaseId); // 只保留有資料庫ID的項目
    } catch (error) {
      console.error('Failed to load database config:', error);
      throw new Error('無法載入資料庫配置');
    }
  }

  private extractTitle(property: any): string {
    if (!property || !property.title) return '';
    return property.title.map((item: any) => item.plain_text || '').join('');
  }

  private extractRichText(property: any): string {
    if (!property || !property.rich_text) return '';
    return property.rich_text.map((item: any) => item.plain_text || '').join('');
  }

  private extractText(property: any): string {
    if (!property) return '';
    if (property.rich_text) {
      return property.rich_text.map((item: any) => item.plain_text || '').join('');
    }
    return '';
  }

  private extractMultiSelect(property: any): string[] {
    if (!property || !property.multi_select) return [];
    return property.multi_select.map((item: any) => item.name || '');
  }

  getConfigDatabaseId(): string | null {
    return localStorage.getItem('config_database_id');
  }

  setConfigDatabaseId(databaseId: string): void {
    localStorage.setItem('config_database_id', databaseId);
  }

  clearConfigDatabaseId(): void {
    localStorage.removeItem('config_database_id');
  }
}

export const databaseConfigService = new DatabaseConfigService();