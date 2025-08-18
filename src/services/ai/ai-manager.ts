import { AIProvider, ProviderInfo, NotionItineraryItem } from '../../types';
import { GeminiProvider } from './gemini-provider';
import { AI_CONFIG, AI_PROVIDERS } from '../../config/ai-config';
import { pexelsService } from '../pexels-service';
import { logger } from '../logger-service';

export class AIManager {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = AI_CONFIG.currentProvider;
  private fallbackChain: string[] = AI_CONFIG.fallbackChain;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    logger.info('AI_MANAGER', 'Initializing Gemini AI provider');
    
    // Initialize Gemini provider
    if (AI_PROVIDERS.gemini.apiKey) {
      this.providers.set('gemini', new GeminiProvider(
        AI_PROVIDERS.gemini.apiKey,
        AI_PROVIDERS.gemini.endpoint
      ));
      logger.debug('AI_MANAGER', 'Gemini provider initialized');
    } else {
      logger.error('AI_MANAGER', 'Gemini API key not found');
    }
    
    logger.info('AI_MANAGER', 'Provider initialization complete', { 
      availableProviders: Array.from(this.providers.keys()) 
    });
  }

  async generateDescription(placeName: string, context?: string): Promise<string> {
    logger.info('AI_MANAGER', 'Generating description', { placeName, context });
    
    const providersToTry = [this.currentProvider, ...this.fallbackChain.filter(p => p !== this.currentProvider)];
    
    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName);
      if (!provider) {
        logger.warn('AI_MANAGER', `Provider ${providerName} not available`);
        continue;
      }

      try {
        logger.debug('AI_MANAGER', `Trying provider: ${providerName}`, { placeName });
        const description = await provider.generateDescription(placeName, context);
        if (description) {
          logger.info('AI_MANAGER', `Successfully generated description with ${providerName}`, { placeName });
          return description;
        }
      } catch (error) {
        logger.warn('AI_MANAGER', `Provider ${providerName} failed`, { placeName, error: (error as Error).message }, error as Error);
        continue;
      }
    }

    const errorMsg = 'All AI providers failed to generate description';
    logger.error('AI_MANAGER', errorMsg, { placeName, providersToTry });
    throw new Error(errorMsg);
  }

  async generateDescriptionsBulk(items: NotionItineraryItem[]): Promise<NotionItineraryItem[]> {
    const updatedItems = [...items];
    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      if (!item.景點介紹 || item.景點介紹.trim() === '' || item.景點介紹.trim() === '沒有提供景點介紹。') {
        try {
          const description = await this.generateDescription(item.項目);
          updatedItems[i] = { ...item, 景點介紹: description };
        } catch (error) {
          console.error(`Failed to generate description for ${item.項目}:`, error);
        }
      }
    }
    return updatedItems;
  }

  async generateDescriptionsWithPromptBulk(items: NotionItineraryItem[], prompt: string): Promise<NotionItineraryItem[]> {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not available`);
    }

    // Pass complete item data for better context
    const itemsToProcess = items.map(item => ({ 
      id: item.id, 
      name: item.項目,
      日期: item.日期,
      時段: item.時段,
      前往方式: item.前往方式,
      重要資訊: item.重要資訊
    }));
    const generatedData = await provider.generateBulkDescriptionsWithPrompt(itemsToProcess, prompt);

    const updatedItems = items.map(item => {
      const matchedData = generatedData.find(data => data.id === item.id);
      if (matchedData && matchedData.description) {
        return { ...item, 景點介紹: matchedData.description };
      }
      return item;
    });
    return updatedItems;
  }

  async searchImage(query: string): Promise<string> {
    try {
      const imageUrl = await pexelsService.searchImage(query);
      return imageUrl;
    } catch (error) {
      console.error(`Failed to search image for ${query}:`, error);
      return '';
    }
  }

  async searchImagesBulk(items: NotionItineraryItem[]): Promise<NotionItineraryItem[]> {
    const updatedItems = [...items];
    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      if (!item.縮圖網址 || item.縮圖網址.trim() === '') {
        try {
          const imageUrl = await this.searchImage(item.項目);
          updatedItems[i] = { ...item, 縮圖網址: imageUrl };
        } catch (error) {
          console.error(`Failed to search image for ${item.項目}:`, error);
        }
      }
    }
    return updatedItems;
  }

  setCurrentProvider(providerName: string): void {
    if (this.providers.has(providerName)) {
      this.currentProvider = providerName;
    } else {
      throw new Error(`Provider ${providerName} not available`);
    }
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderInfo(providerName: string): ProviderInfo | null {
    const provider = this.providers.get(providerName);
    return provider ? provider.getProviderInfo() : null;
  }

  getAllProviderInfo(): Map<string, ProviderInfo> {
    const info = new Map<string, ProviderInfo>();
    for (const [name, provider] of this.providers) {
      info.set(name, provider.getProviderInfo());
    }
    return info;
  }
}

// Export singleton instance
export const aiManager = new AIManager();
