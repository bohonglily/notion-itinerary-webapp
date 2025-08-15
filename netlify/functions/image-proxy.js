exports.handler = async (event, context) => {
  const imageUrl = event.queryStringParameters?.url;

  if (!imageUrl) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Missing image URL parameter' }),
    };
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
      timeout: 10000, // 10秒超時
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

    // 轉換為 base64
    const base64Data = Buffer.from(imageBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
      body: base64Data,
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error proxying image:', {
      url: imageUrl,
      error: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Failed to proxy image',
        message: error.message,
        url: imageUrl
      }),
    };
  }
};