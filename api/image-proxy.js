/**
 * Vercel API Route - Image Proxy
 * 純 JavaScript 實作，與 Netlify 版本保持一致
 */

export default async function handler(req, res) {
  // 設定 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允許 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const imageUrl = req.query?.url;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing image URL parameter' });
  }

  try {
    console.log('Attempting to proxy image:', imageUrl);

    // 檢查 URL 格式
    let validUrl;
    try {
      validUrl = new URL(imageUrl);
    } catch (urlError) {
      throw new Error(`Invalid URL format: ${imageUrl}`);
    }

    // 設定請求選項
    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotionItineraryWebApp/1.0)',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Encoding': 'identity', // 避免壓縮問題
      },
      signal: AbortSignal.timeout(10000), // 10秒超時
    };

    const response = await fetch(imageUrl, fetchOptions);
    
    console.log(`Response status: ${response.status} for ${imageUrl}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    // 檢查內容類型
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType} for ${imageUrl}`);
    
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
    }

    // 獲取圖片數據
    const imageBuffer = await response.arrayBuffer();
    
    if (imageBuffer.byteLength === 0) {
      throw new Error('Empty image data received');
    }

    console.log(`Image size: ${imageBuffer.byteLength} bytes for ${imageUrl}`);

    // 設定回應標頭
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // 直接回傳 Buffer
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Error proxying image:', {
      url: imageUrl,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      error: 'Failed to proxy image',
      message: error.message,
      url: imageUrl
    });
  }
}