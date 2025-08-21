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
    const { database_id } = JSON.parse(event.body);
    
    // 驗證必要欄位
    if (!database_id) {
      return createErrorResponse('Missing required field: database_id', 400, corsHeaders);
    }

    // 獲取所有使用者（在實際應用中可能需要根據 database_id 篩選）
    const users = Array.from(usersDatabase.values());

    console.log(`Retrieved ${users.length} users for database: ${database_id}`);

    return createSuccessResponse({
      users,
      database_id
    }, corsHeaders);

  } catch (error) {
    console.error('Error retrieving users:', error);
    return createErrorResponse('Internal server error', 500, corsHeaders);
  }
};