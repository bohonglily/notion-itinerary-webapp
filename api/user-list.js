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
    const { database_id } = req.body;
    
    // 驗證必要欄位
    if (!database_id) {
      const errorResponse = createErrorResponse('Missing required field: database_id', 400, corsHeaders);
      return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
    }

    // 獲取所有使用者（在實際應用中可能需要根據 database_id 篩選）
    const users = Array.from(usersDatabase.values());

    console.log(`Retrieved ${users.length} users for database: ${database_id}`);

    const successResponse = createSuccessResponse({
      users,
      database_id
    }, corsHeaders);
    
    return res.status(successResponse.statusCode).json(JSON.parse(successResponse.body));

  } catch (error) {
    console.error('Error retrieving users:', error);
    const errorResponse = createErrorResponse('Internal server error', 500, corsHeaders);
    return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
  }
}