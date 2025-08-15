import { AbstractAIProvider, ItemToProcess, GeneratedDescription } from './abstract-ai-provider';
import { ProviderInfo } from '../../types';
import axios from 'axios';

export class OpenAIProvider extends AbstractAIProvider {
  name = 'OpenAI';

  async generateDescription(placeName: string, context?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.createPrompt(placeName, context);
    
    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const description = response.data.choices?.[0]?.message?.content?.trim();
      return description || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateBulkDescriptionsWithPrompt(items: ItemToProcess[], prompt: string): Promise<GeneratedDescription[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const itemDetails = items.map(item => `- ID: ${item.id}, Name: ${item.name}`).join('\n');
    const systemMessage = `你是一個旅遊景點介紹生成器。請根據提供的景點名稱和使用者提示，為每個景點生成一個簡潔的繁體中文介紹。請以 JSON 陣列的格式回傳結果，每個物件包含 'id' 和 'description' 欄位。'id' 必須與原始景點的 ID 相符。如果無法生成介紹，'description' 欄位可以為空字串。`;
    const userMessage = `使用者提示: ${prompt}\n\n景點列表:\n${itemDetails}`;

    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: "json_object" }, // Request JSON object
          temperature: 0.7,
          max_tokens: 2000 // Increased max_tokens for bulk operations
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // Increased timeout for bulk operations
        }
      );

      const rawResponse = response.data.choices?.[0]?.message?.content?.trim();
      console.log('OpenAI Raw Response:', rawResponse); // Log raw response
      if (!rawResponse) {
        throw new Error('OpenAI API returned empty response for bulk descriptions.');
      }

      // OpenAI might return a stringified JSON, parse it
      const generatedData: GeneratedDescription[] = JSON.parse(rawResponse);
      return generatedData;
    } catch (error) {
      console.error('OpenAI Bulk API error:', error);
      throw new Error(`OpenAI Bulk API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      available: !!this.apiKey,
      rateLimit: 60, // requests per minute
      tokenLimit: 4096 // context window
    };
  }
}