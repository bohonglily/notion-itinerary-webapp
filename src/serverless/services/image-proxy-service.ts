/**
 * 圖片代理服務抽象層
 * 提供平台無關的圖片代理功能
 */

export interface ImageProxyParams {
  imageUrl: string;
}

export interface ImageProxyResult {
  data: Buffer;
  contentType: string;
  size: number;
}

export class ImageProxyService {
  private readonly DEFAULT_TIMEOUT = 10000; // 10秒
  private readonly ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  /**
   * 代理圖片請求
   */
  async proxyImage(params: ImageProxyParams): Promise<ImageProxyResult> {
    const { imageUrl } = params;

    // 驗證 URL 格式
    let validUrl: URL;
    try {
      validUrl = new URL(imageUrl);
    } catch (error) {
      throw new Error(`Invalid URL format: ${imageUrl}`);
    }

    // 安全性檢查 - 只允許 HTTP/HTTPS 協議
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      throw new Error(`Unsupported protocol: ${validUrl.protocol}`);
    }

    // 設定請求選項
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotionItineraryWebApp/1.0)',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Encoding': 'identity', // 避免壓縮問題
      },
      signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
    };

    console.log('Proxying image:', imageUrl);

    try {
      const response = await fetch(imageUrl, fetchOptions);
      
      console.log(`Response status: ${response.status} for ${imageUrl}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      // 檢查內容類型
      const contentType = response.headers.get('content-type') || '';
      console.log(`Content-Type: ${contentType} for ${imageUrl}`);
      
      if (!this.isValidImageType(contentType)) {
        throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
      }

      // 獲取圖片數據
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      
      if (imageBuffer.length === 0) {
        throw new Error('Empty image data received');
      }

      console.log(`Image size: ${imageBuffer.length} bytes for ${imageUrl}`);

      return {
        data: imageBuffer,
        contentType,
        size: imageBuffer.length,
      };

    } catch (error: any) {
      console.error('Error proxying image:', {
        url: imageUrl,
        error: error.message,
        stack: error.stack
      });

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout for ${imageUrl}`);
      }
      
      throw error;
    }
  }

  /**
   * 驗證是否為有效的圖片類型
   */
  private isValidImageType(contentType: string): boolean {
    return this.ALLOWED_CONTENT_TYPES.some(type => 
      contentType.toLowerCase().includes(type)
    );
  }

  /**
   * 將圖片轉換為 base64
   */
  static toBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  /**
   * 估算圖片大小是否合理 (預設最大 5MB)
   */
  static validateImageSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
    return size > 0 && size <= maxSize;
  }
}