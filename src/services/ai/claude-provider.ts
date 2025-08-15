import { AbstractAIProvider, ItemToProcess, GeneratedDescription } from './abstract-ai-provider';
import { ProviderInfo } from '../../types';
import axios from 'axios';

export class ClaudeProvider extends AbstractAIProvider {
  name = 'Anthropic Claude';

  async generateDescription(placeName: string, context?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    const prompt = this.createPrompt(placeName, context);
    
    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000
        }
      );

      const description = response.data.content?.[0]?.text?.trim();
      return description || '';
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Claude API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateBulkDescriptionsWithPrompt(items: ItemToProcess[], prompt: string): Promise<GeneratedDescription[]> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    const itemDetails = items.map(item => `- ID: ${item.id}, Name: ${item.name}`).join('\n');
    const userMessage = `你是一個旅遊景點介紹生成器。請根據提供的景點名稱和使用者提示，為每個景點生成一個簡潔的繁體中文介紹。請以 JSON 陣列的格式回傳結果，每個物件包含 'id' 和 'description' 欄位。'id' 必須與原始景點的 ID 相符。如果無法生成介紹，'description' 欄位可以為空字串。\n\n使用者提示: ${prompt}\n\n景點列表:\n${itemDetails}`;

    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 2000, // Increased max_tokens for bulk operations
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000 // Increased timeout for bulk operations
        }
      );

      const rawResponse = response.data.content?.[0]?.text?.trim();
      console.log('Claude Raw Response:', rawResponse); // Log raw response
      if (!rawResponse) {
        throw new Error('Claude API returned empty response for bulk descriptions.');
      }

      // Claude might return a stringified JSON, parse it
      const generatedData: GeneratedDescription[] = JSON.parse(rawResponse);
      return generatedData;
    } catch (error) {
      console.error('Claude Bulk API error:', error);
      throw new Error(`Claude Bulk API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      available: !!this.apiKey,
      rateLimit: 50, // requests per minute
      tokenLimit: 100000 // context window
    };
  }
}