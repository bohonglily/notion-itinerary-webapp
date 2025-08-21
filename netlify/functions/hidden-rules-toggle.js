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
    const { user_id, page_id, database_id, action } = JSON.parse(event.body);
    
    // 驗證必要欄位
    if (!user_id || !page_id || !database_id || !action) {
      return createErrorResponse('Missing required fields: user_id, page_id, database_id, action', 400, corsHeaders);
    }

    // 驗證 action 值
    if (!['hide', 'show'].includes(action)) {
      return createErrorResponse('Invalid action. Must be "hide" or "show"', 400, corsHeaders);
    }

    // 建立複合鍵來查找使用者在特定資料庫的隱藏規則
    const userDatabaseKey = `${user_id}_${database_id}`;
    
    // 獲取現有的隱藏列表
    let hiddenPageIds = hiddenRulesDatabase.get(userDatabaseKey) || [];

    if (action === 'hide') {
      // 加入隱藏列表（如果尚未存在）
      if (!hiddenPageIds.includes(page_id)) {
        hiddenPageIds.push(page_id);
        console.log(`Hidden page ${page_id} for user ${user_id} in database ${database_id}`);
      }
    } else if (action === 'show') {
      // 從隱藏列表中移除
      hiddenPageIds = hiddenPageIds.filter(id => id !== page_id);
      console.log(`Showed page ${page_id} for user ${user_id} in database ${database_id}`);
    }

    // 更新資料庫
    hiddenRulesDatabase.set(userDatabaseKey, hiddenPageIds);

    return createSuccessResponse({
      message: `Page ${action === 'hide' ? 'hidden' : 'shown'} successfully`,
      user_id,
      page_id,
      database_id,
      action,
      hiddenPageIds
    }, corsHeaders);

  } catch (error) {
    console.error('Error toggling page visibility:', error);
    return createErrorResponse('Internal server error', 500, corsHeaders);
  }
};