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
    const { user_id, page_id, database_id, action } = req.body;
    
    // 驗證必要欄位
    if (!user_id || !page_id || !database_id || !action) {
      const errorResponse = createErrorResponse('Missing required fields: user_id, page_id, database_id, action', 400, corsHeaders);
      return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
    }

    // 驗證 action 值
    if (!['hide', 'show'].includes(action)) {
      const errorResponse = createErrorResponse('Invalid action. Must be "hide" or "show"', 400, corsHeaders);
      return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
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

    const successResponse = createSuccessResponse({
      message: `Page ${action === 'hide' ? 'hidden' : 'shown'} successfully`,
      user_id,
      page_id,
      database_id,
      action,
      hiddenPageIds
    }, corsHeaders);
    
    return res.status(successResponse.statusCode).json(JSON.parse(successResponse.body));

  } catch (error) {
    console.error('Error toggling page visibility:', error);
    const errorResponse = createErrorResponse('Internal server error', 500, corsHeaders);
    return res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
  }
}