const { getCorsHeaders, createErrorResponse, createSuccessResponse } = require('../../utils/notion-client');

// 模擬資料庫存儲（實際應用中應使用真實資料庫）
let usersDatabase = new Map();

exports.handler = async (event, context) => {
  // 設定 CORS
  const corsHeaders = getCorsHeaders();
  
  // 預檢請求處理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, corsHeaders);
  }

  try {
    // 解析請求體
    const { user_id, display_name, created_at } = JSON.parse(event.body);
    
    // 驗證必要欄位
    if (!user_id || !display_name) {
      return createErrorResponse('Missing required fields: user_id, display_name', 400, corsHeaders);
    }

    // 檢查使用者是否已存在
    if (usersDatabase.has(user_id)) {
      return createErrorResponse('User already exists', 409, corsHeaders);
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

    return createSuccessResponse({
      message: 'User created successfully',
      user: userProfile
    }, corsHeaders);

  } catch (error) {
    console.error('Error creating user:', error);
    return createErrorResponse('Internal server error', 500, corsHeaders);
  }
};