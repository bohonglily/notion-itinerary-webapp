import axios from 'axios';
import { ADMIN_CONFIG } from '../config/ai-config';
import { ApiServiceFactory } from './api-service-factory';

export class PexelsService {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/v1';
  private apiFactory: ApiServiceFactory;

  constructor() {
    this.apiKey = ADMIN_CONFIG.pexelsApiKey;
    this.apiFactory = ApiServiceFactory.getInstance();
  }

  /**
   * 透過圖片代理獲取圖片
   * 避免 CORS 問題並提供統一的圖片存取
   */
  private async getProxiedImageUrl(originalUrl: string): Promise<string> {
    try {
      const proxyEndpoint = this.apiFactory.getEndpoint('imageProxy');
      return `${proxyEndpoint}?url=${encodeURIComponent(originalUrl)}`;
    } catch (error) {
      console.warn('Image proxy not available, returning original URL:', error);
      return originalUrl;
    }
  }

  async searchImage(query: string, orientation: 'landscape' | 'portrait' | 'square' | undefined = undefined): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Pexels API key not configured');
    }

    try {
      const params: any = {
        query,
        per_page: 1,
      };
      if (orientation) {
        params.orientation = orientation;
      }

      const response = await axios.get(`${this.baseUrl}/search`, {
        params,
        headers: {
          'Authorization': this.apiKey
        }
      });

      const photo = response.data.photos?.[0];
      const originalUrl = photo?.src?.medium || '';
      
      if (originalUrl) {
        // 透過代理獲取圖片 URL
        return await this.getProxiedImageUrl(originalUrl);
      }
      
      return '';
    } catch (error) {
      console.error('Pexels API error:', error);
      throw new Error('Failed to search image');
    }
  }

  async searchImageWithAspectPreference(query: string): Promise<string> {
    // Only search for landscape images as per user's request
    try {
      const landscapeImage = await this.searchImage(query, 'landscape');
      if (landscapeImage) return landscapeImage;
    } catch (error) {
      console.warn(`No landscape image found for ${query}.`);
    }

    return ''; // Return empty string if no image found
  }

  async bulkSearchImages(queries: string[]): Promise<string[]> {
    const imageUrls: string[] = [];
    
    for (const query of queries) {
      try {
        const imageUrl = await this.searchImageWithAspectPreference(query); // Use new preference method
        imageUrls.push(imageUrl);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to search image for ${query}:`, error);
        imageUrls.push('');
      }
    }

    return imageUrls;
  }
}

export const pexelsService = new PexelsService();