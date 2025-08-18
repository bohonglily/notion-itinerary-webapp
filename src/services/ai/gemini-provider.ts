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

    const itemDetails = items.map(item => {
      const details = [`- ID: ${item.id}, Name: ${item.name}`];
      if ((item as any).日期) details.push(`Date: ${(item as any).日期}`);
      if ((item as any).時段) details.push(`Time: ${(item as any).時段.join(', ')}`);
      if ((item as any).前往方式) details.push(`Transport: ${(item as any).前往方式}`);
      if ((item as any).重要資訊) details.push(`Notes: ${(item as any).重要資訊.substring(0, 50)}...`);
      return details.join(', ');
    }).join('\n');

    const fullPrompt = `你是一個旅遊行程景點介紹生成器。請根據使用者提示，為每個項目生成繁體中文介紹。

重要指引：
1. 只為真正的景點、餐廳、活動生成介紹
2. 跳過以下類型的項目：交通資訊、行程摘要、待辦事項、純文字記錄
3. 判斷標準：如果項目名稱包含「交通」、「搭乘」、「前往」、「摘要」、「TODO」、「備註」等關鍵字，則跳過
4. 生成時請考慮日期、時段等上下文資訊
5. 請以 JSON 陣列格式回傳結果，每個物件包含 'id' 和 'description' 欄位
6. 不需要介紹的項目，'description' 欄位請設為空字串

使用者提示: ${prompt}

景點列表:
${itemDetails}`;

    // 詳細記錄完整 prompt 內容
    console.log('='.repeat(80));
    console.log('🤖 [GEMINI PROMPT] 完整的 Prompt 內容：');
    console.log('='.repeat(80));
    console.log(fullPrompt);
    console.log('='.repeat(80));
    console.log(`📊 [GEMINI INFO] 處理 ${items.length} 個項目`);
    console.log('='.repeat(80));

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
      
      // 詳細記錄 AI 回應內容
      console.log('='.repeat(80));
      console.log('🤖 [GEMINI RESPONSE] AI 完整回應內容：');
      console.log('='.repeat(80));
      console.log(rawResponse);
      console.log('='.repeat(80));
      
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
      
      // 記錄解析後的結果
      console.log('='.repeat(80));
      console.log('📄 [GEMINI PARSED] 解析後的 JSON 結果：');
      console.log('='.repeat(80));
      console.log('Generated Data:', JSON.stringify(generatedData, null, 2));
      console.log(`✅ 成功生成 ${generatedData.length} 個項目的描述`);
      console.log('='.repeat(80));
      
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