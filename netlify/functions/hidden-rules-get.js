const { getCorsHeaders, createErrorResponse, createSuccessResponse } = require('../../utils/notion-client');

// 模擬資料庫存儲（實際應用中應使用真實資料庫）
let hiddenRulesDatabase = new Map();

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
    const { user_id, database_id } = JSON.parse(event.body);
    
    // 驗證必要欄位
    if (!user_id || !database_id) {
      return createErrorResponse('Missing required fields: user_id, database_id', 400, corsHeaders);
    }

    // 建立複合鍵來查找使用者在特定資料庫的隱藏規則
    const userDatabaseKey = `${user_id}_${database_id}`;
    
    // 獲取隱藏的 page_id 列表
    const hiddenPageIds = hiddenRulesDatabase.get(userDatabaseKey) || [];

    console.log(`Retrieved ${hiddenPageIds.length} hidden rules for user ${user_id} in database ${database_id}`);

    return createSuccessResponse({
      user_id,
      database_id,
      hiddenPageIds
    }, corsHeaders);

  } catch (error) {
    console.error('Error retrieving hidden rules:', error);
    return createErrorResponse('Internal server error', 500, corsHeaders);
  }
};