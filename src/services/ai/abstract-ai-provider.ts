import { AIProvider, ProviderInfo } from '../../types';

export interface ItemToProcess {
  id: string;
  name: string;
}

export interface GeneratedDescription {
  id: string;
  description: string;
}

export abstract class AbstractAIProvider implements AIProvider {
  abstract name: string;
  protected apiKey: string;
  protected endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  abstract generateDescription(placeName: string, context?: string): Promise<string>;
  
  async generateBulkDescriptions(places: string[]): Promise<string[]> {
    const descriptions: string[] = [];
    
    for (const place of places) {
      try {
        const description = await this.generateDescription(place);
        descriptions.push(description);
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to generate description for ${place}:`, error);
        descriptions.push('');
      }
    }
    
    return descriptions;
  }

  abstract generateBulkDescriptionsWithPrompt(items: ItemToProcess[], prompt: string): Promise<GeneratedDescription[]>;

  abstract getProviderInfo(): ProviderInfo;

  protected createPrompt(placeName: string, context?: string): string {
    const basePrompt = `請用繁體中文為「${placeName}」寫一個簡潔的景點介紹，不超過50字。`;
    
    if (context) {
      return `${basePrompt}\n參考資訊：${context}`;
    }
    
    return basePrompt;
  }
}