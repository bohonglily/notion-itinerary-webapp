const { getCorsHeaders, createErrorResponse, createSuccessResponse } = require('../utils/notion-client');

// 模擬資料庫存儲（實際應用中應使用真實資料庫）
let hiddenRulesDatabase = new Map();

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
    const { user_id, database_id } = req.body;
    
    // 驗證必要欄位
    if (!user_id || !database_id) {
      const errorResponse = createErrorResponse('Missing required fields: user_id, database_id', 400, corsHeaders);
      return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
    }

    // 建立複合鍵來查找使用者在特定資料庫的隱藏規則
    const userDatabaseKey = `${user_id}_${database_id}`;
    
    // 獲取隱藏的 page_id 列表
    const hiddenPageIds = hiddenRulesDatabase.get(userDatabaseKey) || [];

    console.log(`Retrieved ${hiddenPageIds.length} hidden rules for user ${user_id} in database ${database_id}`);

    const successResponse = createSuccessResponse({
      user_id,
      database_id,
      hiddenPageIds
    }, corsHeaders);
    
    return res.status(successResponse.statusCode).json(JSON.parse(successResponse.body));

  } catch (error) {
    console.error('Error retrieving hidden rules:', error);
    const errorResponse = createErrorResponse('Internal server error', 500, corsHeaders);
    return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
  }
}