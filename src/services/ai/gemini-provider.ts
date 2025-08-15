import { AbstractAIProvider, ItemToProcess, GeneratedDescription } from './abstract-ai-provider';
import { ProviderInfo } from '../../types';
import axios from 'axios';

export class GeminiProvider extends AbstractAIProvider {
  name = 'Google Gemini';

  async generateDescription(placeName: string, context?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.createPrompt(placeName, context);
    
    try {
      const response = await axios.post(
        `${this.endpoint}:generateContent`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey // API key in header
          },
          timeout: 30000
        }
      );

      const description = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return description || '';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateBulkDescriptionsWithPrompt(items: ItemToProcess[], prompt: string): Promise<GeneratedDescription[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const itemDetails = items.map(item => `- ID: ${item.id}, Name: ${item.name}`).join('\n');
    const fullPrompt = `你是一個旅遊行程景點介紹生成器。請根據使用者提示，為每個項目生成繁體中文介紹。請以 JSON 陣列的格式回傳結果，每個物件包含 'id' 和 'description' 欄位。'id' 必須與原始景點的 ID 相符。如果無法生成介紹，'description' 欄位可以為空字串。\n\n使用者提示: ${prompt}\n\n景點列表:\n${itemDetails}`;

    try {
      const response = await axios.post(
        `${this.endpoint}:generateContent`,
        {
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey // API key in header
          },
          timeout: 60000 // Increased timeout for bulk operations
        }
      );

      const rawResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log('Gemini Raw Response:', rawResponse); // Log raw response
      if (!rawResponse) {
        throw new Error('Gemini API returned empty response for bulk descriptions.');
      }

      // Attempt to parse JSON, handle cases where AI might return extra text
      const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
      let jsonString = rawResponse;
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      }

      const generatedData: GeneratedDescription[] = JSON.parse(jsonString);
      return generatedData;
    } catch (error) {
      console.error('Gemini Bulk API error:', error);
      throw new Error(`Gemini Bulk API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      available: !!this.apiKey,
      rateLimit: 60, // requests per minute
      tokenLimit: 30720 // input tokens
    };
  }
}