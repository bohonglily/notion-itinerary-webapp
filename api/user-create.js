const { getCorsHeaders, createErrorResponse, createSuccessResponse } = require('../utils/notion-client');

// 模擬資料庫存儲（實際應用中應使用真實資料庫）
let usersDatabase = new Map();

export default async function handler(req, res) {
  // 設定 CORS
  const corsHeaders = getCorsHeaders();
  
  // 設定 CORS 標頭
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // 預檢請求處理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允許 POST 請求
  if (req.method !== 'POST') {
    const errorResponse = createErrorResponse('Method not allowed', 405, corsHeaders);
    return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
  }

  try {
    // 解析請求體
    const { user_id, display_name, created_at } = req.body;
    
    // 驗證必要欄位
    if (!user_id || !display_name) {
      const errorResponse = createErrorResponse('Missing required fields: user_id, display_name', 400, corsHeaders);
      return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
    }

    // 檢查使用者是否已存在
    if (usersDatabase.has(user_id)) {
      const errorResponse = createErrorResponse('User already exists', 409, corsHeaders);
      return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
    }

    // 建立使用者記錄
    const userProfile = {
      user_id,
      display_name,
      created_at: created_at || new Date().toISOString()
    };

    // 儲存到模擬資料庫
    usersDatabase.set(user_id, userProfile);

    console.log(`User created: ${user_id} (${display_name})`);

    const successResponse = createSuccessResponse({
      message: 'User created successfully',
      user: userProfile
    }, corsHeaders);
    
    return res.status(successResponse.statusCode).json(JSON.parse(successResponse.body));

  } catch (error) {
    console.error('Error creating user:', error);
    const errorResponse = createErrorResponse('Internal server error', 500, corsHeaders);
    return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
  }
}