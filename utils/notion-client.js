/**
 * 共用的 Notion API 客戶端工具
 * 提供基本的 Notion API 操作，供 Netlify 和 Vercel 使用
 */

/**
 * 轉換 Notion 頁面數據為標準格式
 */
export function transformNotionPage(page) {
  const properties = page.properties;
  
  return {
    id: page.id,
    項目: properties.項目?.title?.[0]?.plain_text || '',
    日期: properties.日期?.date?.start || null,
    時段: properties.時段?.multi_select?.map(item => item.name) || [],
    GoogleMaps: properties.GoogleMaps?.url || '',
    重要資訊: properties.重要資訊?.rich_text?.[0]?.plain_text || '',
    參考資料: properties.參考資料?.rich_text?.[0]?.plain_text || '',
    人均價: properties.人均價?.number || null,
    前往方式: properties.前往方式?.rich_text?.[0]?.plain_text || '',
    待辦: properties.待辦?.rich_text?.[0]?.plain_text || '',
    縮圖網址: properties.縮圖網址?.url || '',
    景點介紹: properties.景點介紹?.rich_text?.[0]?.plain_text || '',
    排序: properties.排序?.number || 0,
    lastEditedTime: page.last_edited_time
  };
}

/**
 * 建構 Notion 查詢條件
 */
export function buildNotionQuery(startDate, endDate) {
  const queryBody = {
    sorts: [
      {
        property: '排序',
        direction: 'ascending'
      },
      {
        property: '日期',
        direction: 'ascending'
      }
    ]
  };

  // 如果有日期範圍，添加篩選條件
  if (startDate || endDate) {
    queryBody.filter = {
      property: '日期',
      date: {}
    };

    if (startDate && endDate) {
      queryBody.filter.date = {
        on_or_after: startDate,
        on_or_before: endDate
      };
    } else if (startDate) {
      queryBody.filter.date.on_or_after = startDate;
    } else if (endDate) {
      queryBody.filter.date.on_or_before = endDate;
    }
  }

  return queryBody;
}

/**
 * 獲取 Notion API Headers
 */
export function getNotionHeaders(apiKey) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
}

/**
 * 標準化的 CORS 標頭
 */
export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

/**
 * 標準化的錯誤回應格式
 */
export function createErrorResponse(error, status = 500) {
  return {
    success: false,
    error: error.message || 'Internal Server Error',
    message: error.message,
    status
  };
}

/**
 * 標準化的成功回應格式
 */
export function createSuccessResponse(data) {
  return {
    success: true,
    ...data
  };
}

/**
 * 建構 Notion 屬性對象
 */
export function buildNotionProperties(item) {
  const properties = {};
  
  if (item.項目) properties['項目'] = { title: [{ text: { content: item.項目 } }] };
  if (item.日期) properties['日期'] = { date: { start: item.日期 } };
  if (item.時段 && item.時段.length > 0) properties['時段'] = { multi_select: item.時段.map(name => ({ name })) };
  if (item.景點介紹) properties['景點介紹'] = { rich_text: [{ text: { content: item.景點介紹 } }] };
  if (item.縮圖網址) properties['縮圖網址'] = { url: item.縮圖網址 };
  if (item.GoogleMaps) properties['GoogleMaps'] = { url: item.GoogleMaps };
  if (item.人均價 !== null && item.人均價 !== undefined) properties['人均價'] = { number: item.人均價 };
  if (item.前往方式) properties['前往方式'] = { rich_text: [{ text: { content: item.前往方式 } }] };
  if (item.重要資訊) properties['重要資訊'] = { rich_text: [{ text: { content: item.重要資訊 } }] };
  if (item.參考資料) properties['參考資料'] = { rich_text: [{ text: { content: item.參考資料 } }] };
  if (item.待辦) properties['待辦'] = { rich_text: [{ text: { content: item.待辦 } }] };
  if (item.排序 !== null && item.排序 !== undefined) properties['排序'] = { number: item.排序 };
  
  return properties;
}