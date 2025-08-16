# Notion Itinerary WebApp 開發者指南

## 目錄
- [專案概述](#專案概述)
- [技術架構](#技術架構)
- [開發環境設定](#開發環境設定)
- [核心概念](#核心概念)
- [開發工作流](#開發工作流)
- [程式碼規範](#程式碼規範)
- [測試與除錯](#測試與除錯)
- [常見問題](#常見問題)

## 專案概述

Notion Itinerary WebApp 是一個現代化的旅遊行程展示系統，主要特色：

- **混合架構設計**：前端 TypeScript + 後端純 JavaScript，支援多平台 Serverless
- **React 前端**：現代化的使用者介面與體驗
- **多 AI 提供商整合**：支援 Gemini、OpenAI、Claude、OpenRouter
- **智能快取系統**：本地快取 + 智能失效策略
- **響應式設計**：適配桌面和行動裝置
- **分層級日誌系統**：完整的監控和追蹤機制

## 技術架構

### 前端架構
```
App.tsx
├── Context Providers (Mode, Visibility)
├── Error Boundary
├── Router (React Router DOM)
└── Components Tree
    ├── HomePage
    ├── TravelTimeline
    │   ├── DayTabs
    │   └── TravelCard[]
    ├── AdminPanel
    └── Modals
```

### 狀態管理
- **TanStack Query**: API 狀態管理和快取
- **React Context**: 全域 UI 狀態（模式、可見性）
- **Local Storage**: 本地資料持久化

### 服務層設計
```
Services/
├── AI Manager (統一入口)
│   ├── Gemini Provider
│   ├── OpenAI Provider  
│   ├── Claude Provider
│   └── OpenRouter Provider
├── Notion Service (資料 CRUD)
├── Pexels Service (圖片搜尋)
├── Cache Service (快取管理)
└── Logger Service (日誌記錄)
```

## 開發環境設定

### 1. 環境需求
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
```

### 2. 專案安裝
```bash
git clone <repository-url>
cd notion-itinerary-webapp
npm install
```

### 3. 環境變數設定
建立 `.env` 檔案：
```env
# 核心服務
VITE_NOTION_API_KEY=notion_v1_XXXXXXXXXXXXXXXX
VITE_PEXELS_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_ADMIN_PASSWORD=your_secure_password

# AI 服務 (至少設定一個)
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_CLAUDE_API_KEY=sk-ant-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_OPENROUTER_API_KEY=sk-or-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 可選設定
VITE_AI_PROVIDER=gemini
VITE_OPENROUTER_MODEL=openrouter/cinematika-7b
```

### 4. 開發伺服器啟動

#### 🚀 Netlify Functions 本地測試
```bash
# 方式 1：使用預設的並行模式（推薦）
npm run dev:netlify

# 方式 2：分別啟動
# 終端 1：啟動前端開發伺服器
npm run dev

# 終端 2：啟動 Netlify Functions
npx netlify functions:serve
```

**Netlify Functions 端點格式：**
- 本地：`http://localhost:8888/.netlify/functions/[function-name]`

#### 🌐 Vercel API Routes 本地測試
```bash
# 使用 Vercel CLI 本地開發（推薦）
npm run dev:vercel

# 或者直接使用 Vercel CLI
npx vercel dev
```

**Vercel API Routes 端點格式：**
- 本地：`http://localhost:3000/api/[function-name]`

#### 🧪 平台切換測試
```bash
# 檢測當前平台
npm run platform:detect

# 查看平台詳細資訊
npm run platform:info
```

## 核心概念

### 1. AI 服務抽象化

所有 AI 提供商都實作 `AbstractAIProvider` 抽象類別：

```typescript
abstract class AbstractAIProvider implements AIProvider {
  abstract generateDescription(placeName: string, context?: string): Promise<string>;
  abstract generateBulkDescriptions(places: string[]): Promise<string[]>;
  abstract generateBulkDescriptionsWithPrompt(items: ItemToProcess[], prompt: string): Promise<GeneratedDescription[]>;
  abstract getProviderInfo(): ProviderInfo;
}
```

新增 AI 提供商只需：
1. 繼承 `AbstractAIProvider`
2. 實作必要方法
3. 在 `ai-config.ts` 中註冊
4. 在 `ai-manager.ts` 中加入降級鏈

### 2. 快取策略

快取系統分為三層：
- **Memory Cache**: 當前 session 資料
- **Local Storage**: 持久化快取
- **Query Cache**: TanStack Query 管理的 API 快取

```typescript
// 快取金鑰格式
const CACHE_KEYS = {
  DATA: 'travel_data_',
  HISTORY: 'travel_history',
  SETTINGS: 'app_settings'
};
```

### 3. 日誌系統

分層級日誌系統：
```typescript
// 日誌層級
enum LogLevel {
  DEBUG = 0,  // 詳細除錯資訊
  INFO = 1,   // 一般資訊
  WARN = 2,   // 警告訊息  
  ERROR = 3   // 錯誤訊息
}

// 使用範例
logger.info('API', 'Data fetched successfully', { count: 10 });
logger.error('AI_MANAGER', 'Provider failed', { provider: 'gemini' }, error);
```

### 4. Notion 資料結構

系統期望的資料庫結構：
```typescript
interface NotionItineraryItem {
  項目: string;           // 景點名稱 (Title)
  日期: string;           // 行程日期 (Date)
  時段?: string[];        // 時間段 (Multi-select)
  GoogleMaps?: string;    // 地圖連結 (URL)
  重要資訊?: string;      // 重要資訊 (Rich Text)
  人均價?: number;        // 費用 (Number)
  前往方式?: string;      // 交通方式 (Rich Text)
  待辦?: string;          // 待辦事項 (Rich Text)
  縮圖網址?: string;      // 圖片 URL (URL)
  景點介紹?: string;      // AI 生成介紹 (Rich Text)
  排序?: number;          // 排序權重 (Number)
}
```

## 開發工作流

### 1. 功能開發流程

1. **分析需求**：確認功能範圍和影響範圍
2. **設計介面**：定義 TypeScript 介面和 API
3. **實作邏輯**：編寫核心功能
4. **整合測試**：測試與現有系統的整合
5. **文檔更新**：更新相關文檔

### 2. Git 工作流

```bash
# 建立功能分支
git checkout -b feature/new-feature

# 開發完成後
git add .
git commit -m "feat: add new feature"

# 推送並建立 PR
git push origin feature/new-feature
```

### 3. 程式碼審查要點

- **型別安全**: 確保 TypeScript 嚴格型別檢查
- **錯誤處理**: 所有 async 操作都要有錯誤處理
- **效能考量**: 避免不必要的重新渲染和 API 呼叫
- **使用者體驗**: 提供適當的載入和錯誤狀態
- **文檔更新**: 同步更新相關文檔

## 程式碼規範

### 1. TypeScript 規範

```typescript
// ✅ 正確：明確的型別定義
interface UserData {
  id: string;
  name: string;
  email?: string;
}

// ❌ 錯誤：使用 any
const data: any = fetchData();

// ✅ 正確：適當的錯誤處理
const handleApiCall = async (): Promise<Result<Data, Error>> => {
  try {
    const response = await apiCall();
    return { success: true, data: response };
  } catch (error) {
    logger.error('API', 'Call failed', {}, error as Error);
    return { success: false, error: error as Error };
  }
};
```

### 2. React 元件規範

```typescript
// ✅ 正確的元件結構
interface Props {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ title, onClose, children }) => {
  // Hooks 在最上方
  const [isVisible, setIsVisible] = useState(false);
  
  // Event handlers
  const handleClose = useCallback(() => {
    setIsVisible(false);
    onClose();
  }, [onClose]);
  
  // Effects
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  // Render
  return (
    <div className="modal">
      {/* JSX content */}
    </div>
  );
};
```

### 3. 檔案命名規範

```
components/
├── AdminPanel.tsx          # PascalCase for components
├── admin-utils.ts          # kebab-case for utilities
└── useAdminState.ts        # camelCase for hooks

services/
├── notion-service.ts       # kebab-case for services
└── ai/
    ├── ai-manager.ts       # kebab-case for files
    └── GeminiProvider.ts   # PascalCase for classes
```

## 測試與除錯

### 1. 本地測試

#### Netlify Functions 測試
```bash
# 完整環境測試（推薦）
npm run dev:netlify
# 前端：http://localhost:5173
# API：http://localhost:8888/.netlify/functions/*

# 僅前端測試
npm run dev
# 檢查：http://localhost:5173
```

#### Vercel API Routes 測試
```bash
# 完整環境測試
npm run dev:vercel
# 統一端點：http://localhost:3000
# API：http://localhost:3000/api/*
```

#### API 端點測試
```bash
# 測試資料庫資訊
curl http://localhost:8888/.netlify/functions/notion-database-info
curl http://localhost:3000/api/notion-database-info

# 測試圖片代理
curl "http://localhost:8888/.netlify/functions/image-proxy?url=https://example.com/image.jpg"
curl "http://localhost:3000/api/image-proxy?url=https://example.com/image.jpg"
```

### 2. 除錯工具

- **React DevTools**: 元件狀態檢查
- **TanStack Query DevTools**: API 狀態檢查
- **Browser Console**: 日誌輸出檢查
- **Network Tab**: API 請求檢查

### 3. 常見除錯場景

```typescript
// AI 服務除錯
logger.debug('AI_MANAGER', 'Testing provider', { 
  provider: 'gemini',
  apiKey: apiKey ? 'Set' : 'Missing' 
});

// Notion API 除錯  
logger.apiRequest('POST', '/api/notion-query', { databaseId });
logger.apiResponse('POST', '/api/notion-query', response.status, response.data);

// 快取除錯
logger.debug('CACHE', 'Cache status', {
  key: cacheKey,
  exists: !!cachedData,
  age: cachedData ? Date.now() - cachedData.timestamp : 0
});
```

## 常見問題

### 1. AI 服務無法連接

**問題**: AI 提供商回傳錯誤
**解決方案**:
1. 檢查 API 金鑰是否正確設定
2. 確認 API 配額是否足夠
3. 檢查網路連接和防火牆設定
4. 查看降級機制是否正常運作

### 2. Notion API 權限問題

**問題**: 無法讀取或寫入 Notion 資料庫
**解決方案**:
1. 確認整合已分享給資料庫
2. 檢查 API 金鑰權限範圍
3. 驗證資料庫 ID 正確性
4. 確認欄位名稱與程式碼一致

### 3. 快取失效問題

**問題**: 資料沒有及時更新
**解決方案**:
1. 手動清除瀏覽器快取
2. 使用管理面板重新載入資料
3. 檢查快取時效設定
4. 驗證快取金鑰唯一性

### 4. 建置錯誤

**問題**: TypeScript 編譯錯誤
**解決方案**:
1. 執行 `npm run lint` 檢查語法錯誤
2. 確保所有型別定義正確
3. 檢查 import/export 路徑
4. 更新相依性版本

### 5. 效能問題

**問題**: 頁面載入緩慢
**解決方案**:
1. 檢查網路請求數量和大小
2. 使用 React DevTools Profiler 分析渲染效能
3. 確認圖片最佳化設定
4. 檢查記憶體洩漏問題

## 貢獻指南

1. **Fork 專案**並建立功能分支
2. **遵循程式碼規範**和最佳實踐
3. **撰寫測試**（如果適用）
4. **更新文檔**以反映變更
5. **提交 Pull Request**並詳細描述變更

## 進階主題

### 自訂 AI 提供商
實作新的 AI 提供商需要繼承 `AbstractAIProvider` 並實作所有抽象方法。

### 擴展 Notion 欄位
新增欄位需要更新 `NotionItineraryItem` 介面和相關的資料轉換邏輯。

### 效能最佳化
考慮使用 React.memo、useMemo、useCallback 來最佳化渲染效能。

### 國際化支援
可以整合 react-i18next 來支援多語言功能。

---

這份指南涵蓋了開發 Notion Itinerary WebApp 系統的核心概念和最佳實踐。如有任何問題，請參考程式碼內的註解或提出 Issue。