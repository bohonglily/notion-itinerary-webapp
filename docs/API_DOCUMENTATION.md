# Notion Itinerary WebApp API 文檔

## 目錄
- [概述](#概述)
- [認證方式](#認證方式)
- [Netlify Functions API](#netlify-functions-api)
- [外部服務 API](#外部服務-api)
- [錯誤處理](#錯誤處理)
- [API 使用範例](#api-使用範例)
- [限制與配額](#限制與配額)

## 概述

Notion Itinerary WebApp 系統採用 Serverless 架構，主要 API 透過 Netlify Functions 提供。系統整合了多個外部服務，包括 Notion API、Pexels API 和多個 AI 服務提供商。

### 基礎 URL
- **開發環境**: `http://localhost:8888/.netlify/functions/`
- **生產環境**: `https://your-domain.com/.netlify/functions/`

### 通用回應格式
```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 認證方式

### API 金鑰
所有 API 呼叫都需要適當的環境變數設定：
- `VITE_NOTION_API_KEY`: Notion 整合金鑰
- `VITE_PEXELS_API_KEY`: Pexels API 金鑰
- AI 服務金鑰（至少一個）

### CORS 設定
所有 API 端點都支援 CORS，允許跨域請求。

## Netlify Functions API

### 1. 查詢行程資料 - notion-query

**端點**: `POST /.netlify/functions/notion-query`

**描述**: 從 Notion 資料庫查詢行程資料，支援日期篩選和排序。

**請求格式**:
```json
{
  "databaseId": "string",
  "startDate": "2024-01-01",  // 可選
  "endDate": "2024-01-31"     // 可選
}
```

**回應格式**:
```json
{
  "results": [
    {
      "id": "notion-page-id",
      "properties": {
        "項目": {
          "title": [{"plain_text": "景點名稱"}]
        },
        "日期": {
          "date": {"start": "2024-01-01"}
        },
        "時段": {
          "multi_select": [{"name": "上午"}]
        },
        "GoogleMaps": {
          "url": "https://maps.google.com/..."
        },
        "重要資訊": {
          "rich_text": [{"plain_text": "重要資訊內容"}]
        },
        "人均價": {
          "number": 1000
        },
        "前往方式": {
          "rich_text": [{"plain_text": "交通方式"}]
        },
        "待辦": {
          "rich_text": [{"plain_text": "待辦事項"}]
        },
        "縮圖網址": {
          "url": "https://example.com/image.jpg"
        },
        "景點介紹": {
          "rich_text": [{"plain_text": "景點介紹內容"}]
        },
        "排序": {
          "number": 1
        }
      }
    }
  ],
  "databaseName": "資料庫名稱",
  "databaseLastEditedTime": "2024-01-01T00:00:00Z"
}
```

**錯誤代碼**:
- `400`: 缺少必要參數
- `404`: 資料庫不存在
- `500`: Notion API 錯誤

### 2. 建立行程項目 - notion-create

**端點**: `POST /.netlify/functions/notion-create`

**描述**: 在 Notion 資料庫中建立新的行程項目。

**請求格式**:
```json
{
  "databaseId": "string",
  "properties": {
    "項目": "新景點名稱",
    "日期": "2024-01-01",
    "時段": ["上午"],
    "GoogleMaps": "https://maps.google.com/...",
    "重要資訊": "重要資訊內容",
    "人均價": 1000,
    "前往方式": "交通方式",
    "待辦": "待辦事項",
    "縮圖網址": "https://example.com/image.jpg",
    "景點介紹": "景點介紹內容",
    "排序": 1
  }
}
```

**回應格式**:
```json
{
  "id": "new-page-id",
  "created_time": "2024-01-01T00:00:00Z",
  "properties": {
    // 建立的頁面屬性
  }
}
```

### 3. 更新行程項目 - notion-update

**端點**: `POST /.netlify/functions/notion-update`

**描述**: 更新現有的行程項目。

**請求格式**:
```json
{
  "pageId": "string",
  "properties": {
    "項目": "更新後的景點名稱",
    "景點介紹": "更新後的介紹"
  }
}
```

**回應格式**:
```json
{
  "id": "page-id",
  "last_edited_time": "2024-01-01T00:00:00Z",
  "properties": {
    // 更新後的頁面屬性
  }
}
```

### 4. 刪除行程項目 - notion-delete

**端點**: `POST /.netlify/functions/notion-delete`

**描述**: 刪除指定的行程項目（實際上是封存）。

**請求格式**:
```json
{
  "pageId": "string"
}
```

**回應格式**:
```json
{
  "id": "page-id",
  "archived": true,
  "last_edited_time": "2024-01-01T00:00:00Z"
}
```

### 5. 批量更新 - notion-bulk-update

**端點**: `POST /.netlify/functions/notion-bulk-update`

**描述**: 批量更新多個行程項目，主要用於 AI 內容增強。

**請求格式**:
```json
{
  "updates": [
    {
      "pageId": "string",
      "properties": {
        "景點介紹": "AI 生成的介紹",
        "縮圖網址": "https://example.com/image.jpg"
      }
    }
  ]
}
```

**回應格式**:
```json
{
  "success": true,
  "updated": 5,
  "failed": 0,
  "results": [
    {
      "pageId": "string",
      "success": true,
      "error": null
    }
  ]
}
```

### 6. 資料庫資訊 - notion-database-info

**端點**: `POST /.netlify/functions/notion-database-info`

**描述**: 取得 Notion 資料庫的基本資訊和結構。

**請求格式**:
```json
{
  "databaseId": "string"
}
```

**回應格式**:
```json
{
  "id": "database-id",
  "title": [{"plain_text": "資料庫名稱"}],
  "properties": {
    "項目": {"type": "title"},
    "日期": {"type": "date"},
    "時段": {"type": "multi_select"}
  },
  "created_time": "2024-01-01T00:00:00Z",
  "last_edited_time": "2024-01-01T00:00:00Z"
}
```

### 7. 圖片代理 - image-proxy

**端點**: `GET /.netlify/functions/image-proxy?url=<encoded-url>`

**描述**: 代理外部圖片請求，解決 CORS 問題。

**請求參數**:
- `url`: 經過 URL 編碼的圖片網址

**回應**:
- 直接回傳圖片二進制資料
- Content-Type: 對應的圖片 MIME 類型

**使用範例**:
```javascript
const proxyUrl = `/.netlify/functions/image-proxy?url=${encodeURIComponent(imageUrl)}`;
```

## 外部服務 API

### 1. Notion API

**基礎 URL**: `https://api.notion.com/v1/`

**認證方式**: Bearer Token

**主要端點**:
- `GET /databases/{database_id}`: 取得資料庫資訊
- `POST /databases/{database_id}/query`: 查詢資料庫內容
- `POST /pages`: 建立新頁面
- `PATCH /pages/{page_id}`: 更新頁面

### 2. Pexels API

**基礎 URL**: `https://api.pexels.com/v1/`

**認證方式**: API Key Header

**主要端點**:
- `GET /search`: 搜尋圖片

**使用範例**:
```javascript
const response = await fetch('https://api.pexels.com/v1/search?query=travel&per_page=1', {
  headers: {
    'Authorization': `Bearer ${PEXELS_API_KEY}`
  }
});
```

### 3. AI 服務 API

#### Google Gemini
**端點**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

#### OpenAI
**端點**: `https://api.openai.com/v1/chat/completions`

#### Claude
**端點**: `https://api.anthropic.com/v1/messages`

#### OpenRouter
**端點**: `https://openrouter.ai/api/v1/chat/completions`

## 錯誤處理

### 標準錯誤格式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 常見錯誤代碼

#### 客戶端錯誤 (4xx)
- `400`: 請求參數錯誤
- `401`: 認證失敗
- `403`: 權限不足
- `404`: 資源不存在
- `429`: 請求頻率過高

#### 伺服器錯誤 (5xx)
- `500`: 內部伺服器錯誤
- `502`: 外部服務錯誤
- `503`: 服務暫時不可用
- `504`: 請求超時

### 錯誤處理最佳實踐

```javascript
try {
  const response = await fetch('/api/notion-query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ databaseId })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  logger.error('API', 'Request failed', { databaseId }, error);
  throw error;
}
```

## API 使用範例

### 1. 完整的資料查詢流程

```javascript
// 1. 查詢行程資料
const queryItinerary = async (databaseId, startDate, endDate) => {
  const response = await fetch('/.netlify/functions/notion-query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      databaseId,
      startDate,
      endDate
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch itinerary data');
  }
  
  return await response.json();
};

// 2. 使用範例
const itineraryData = await queryItinerary('database-id', '2024-01-01', '2024-01-31');
```

### 2. AI 內容增強流程

```javascript
// 1. 生成景點介紹
const generateDescriptions = async (items) => {
  const descriptions = await aiManager.generateBulkDescriptionsWithPrompt(
    items,
    '請為這個景點生成 50 字以內的簡潔介紹'
  );
  
  // 2. 批量更新到 Notion
  const updates = descriptions.map(desc => ({
    pageId: desc.id,
    properties: {
      '景點介紹': desc.description
    }
  }));
  
  const response = await fetch('/.netlify/functions/notion-bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ updates })
  });
  
  return await response.json();
};
```

### 3. 圖片搜尋和更新

```javascript
// 1. 搜尋圖片
const searchImages = async (placeName) => {
  const imageUrl = await pexelsService.searchImage(placeName);
  return imageUrl;
};

// 2. 更新到 Notion
const updateImage = async (pageId, imageUrl) => {
  const response = await fetch('/.netlify/functions/notion-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pageId,
      properties: {
        '縮圖網址': imageUrl
      }
    })
  });
  
  return await response.json();
};
```

## 限制與配額

### Notion API 限制
- **請求頻率**: 每秒 3 個請求
- **頁面大小**: 每次查詢最多 100 項目
- **檔案大小**: 單檔最大 5MB

### Pexels API 限制
- **免費方案**: 每月 200 個請求
- **請求頻率**: 無明確限制
- **圖片格式**: JPEG, PNG

### AI 服務限制

#### Google Gemini
- **免費配額**: 每分鐘 15 個請求
- **付費方案**: 依使用量計費
- **內容限制**: 最大 1MB 輸入

#### OpenAI
- **費用**: 依 token 使用量計費
- **請求頻率**: 依方案而定
- **模型**: GPT-3.5-turbo, GPT-4

#### Claude
- **費用**: 依 token 使用量計費
- **請求頻率**: 依方案而定
- **上下文**: 最大 200K tokens

#### OpenRouter
- **費用**: 依模型和使用量計費
- **模型**: 多種開源和商業模型
- **請求頻率**: 依模型而定

### 最佳實踐

1. **快取策略**: 適當使用快取減少 API 呼叫
2. **批量操作**: 盡量使用批量 API 減少請求次數
3. **錯誤重試**: 實作指數退避重試機制
4. **監控配額**: 定期檢查 API 使用量
5. **降級策略**: AI 服務失效時的替代方案

---

此 API 文檔涵蓋了 Notion Itinerary WebApp 系統的所有 API 端點和整合方式。如需更多詳細資訊，請參考各服務的官方文檔。