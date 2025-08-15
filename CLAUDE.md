# Notion Itinerary WebApp 專案說明文件

# 行為準則
- 每當更新程式碼時，同時更新相關的 CLAUDE.md 文件內容，保持說明與代碼同步。
- 不需每次你特別提醒，這是它在處理修改任務時的「自動流程」之一。

## 專案概述

**Notion Itinerary WebApp** 是一個基於 React + TypeScript 的現代化旅遊行程展示系統，與 Notion 資料庫深度整合，提供美觀的時間軸介面來展示旅遊行程。系統支援多種 AI 服務進行內容增強，包含自動生成景點介紹和圖片搜尋功能。**最新版本已重構為多平台 Serverless 架構，支援 Netlify、Vercel 等多個部署平台。**

## 核心功能特色

### 🗂️ Notion 整合
- 直接連接 Notion 資料庫讀取旅遊行程資料
- 支援即時資料同步與更新
- 完整的 CRUD 操作（透過多平台 Serverless Functions）

### 🧠 AI 智能增強
- **多 AI 提供商支援**：Google Gemini、OpenAI、Claude、OpenRouter
- **智能降級機制**：當主要 AI 服務失效時自動切換
- **自動景點介紹生成**：利用 AI 為景點生成詳細介紹
- **批量處理**：支援批量生成景點介紹

### 🖼️ 圖片管理
- 整合 Pexels API 自動搜尋景點縮圖
- 支援批量圖片搜尋和更新
- 圖片代理服務（避免 CORS 問題）

### 💾 智能快取系統
- 本地瀏覽器快取機制
- 減少 API 呼叫頻率
- 支援快取清除和重新整理

### 🎨 現代化 UI/UX
- 響應式設計，支援手機和桌面裝置
- 時間軸式行程展示
- 浮動式操作選單
- 深色模式切換（部分實作）
- 景點介紹顯示/隱藏切換

### 🔐 管理者功能
- 密碼保護的管理面板
- AI 內容批量增強
- 系統設定管理
- 資料重新載入

### 📊 分層級日誌系統
- **多層級日誌**：DEBUG、INFO、WARN、ERROR
- **分類標籤**：API、USER、SYSTEM、PERFORMANCE、AI_MANAGER、NOTION、ERROR_BOUNDARY
- **智能環境切換**：開發環境顯示詳細日誌，生產環境僅顯示關鍵資訊
- **效能監控**：API 請求時間、操作耗時追蹤
- **用戶行為追蹤**：頁面瀏覽、功能使用、錯誤記錄
- **外部服務整合**：支援發送錯誤日誌到外部監控服務

## 技術架構

### 前端技術棧
```
React 18 + TypeScript
├── 狀態管理：TanStack Query (React Query)
├── 樣式框架：Tailwind CSS
├── 圖示：Lucide React
├── 路由：React Router DOM
└── 建置工具：Vite
```

### 後端服務（多平台 Serverless 架構）
```
多平台 Serverless Functions
├── 抽象層 (src/serverless/)
│   ├── core/
│   │   ├── base-handler.ts         # 基礎 Handler 抽象類別
│   │   └── platform-adapter.ts     # 平台適配器
│   ├── handlers/                   # 業務邏輯處理器
│   │   ├── notion-query-handler.ts
│   │   ├── notion-create-handler.ts
│   │   ├── notion-update-handler.ts
│   │   ├── notion-delete-handler.ts
│   │   ├── notion-bulk-update-handler.ts
│   │   ├── notion-database-info-handler.ts
│   │   └── image-proxy-handler.ts
│   ├── services/                   # 核心服務抽象
│   │   ├── notion-service.ts       # Notion API 抽象
│   │   └── image-proxy-service.ts  # 圖片代理抽象
│   └── config/                     # 配置管理
│       ├── environment.ts          # 環境變數適配
│       └── deployment.ts           # 部署平台配置
├── 平台包裝層
│   ├── netlify/functions/          # Netlify Functions
│   └── api/                       # Vercel API Routes
└── 前端服務工廠
    └── src/services/api-service-factory.ts # 動態端點選擇
```

### 外部 API 整合
- **Notion API**：行程資料來源
- **Pexels API**：圖片搜尋服務
- **AI 服務**：Google Gemini、OpenAI、Claude、OpenRouter

## 專案結構詳解

```
notion-itinerary-webapp/
├── src/
│   ├── components/          # React 元件
│   │   ├── AdminPanel.tsx           # 管理者面板
│   │   ├── AdminPasswordPrompt.tsx  # 管理者密碼驗證
│   │   ├── TravelCard.tsx           # 行程卡片元件
│   │   ├── TravelCardEditModal.tsx  # 行程編輯模態框
│   │   ├── TravelTimeline.tsx       # 時間軸主要元件
│   │   ├── DayTabs.tsx             # 日期分頁
│   │   ├── AddItineraryModal.tsx   # 新增行程模態框
│   │   ├── Modal.tsx               # 通用模態框
│   │   ├── LoadingSpinner.tsx      # 載入動畫
│   │   ├── ErrorBoundary.tsx       # 錯誤邊界
│   │   ├── HomePage.tsx            # 首頁元件
│   │   └── ItineraryFormFields.tsx # 行程表單欄位元件
│   │
│   ├── services/           # 服務層
│   │   ├── ai/                     # AI 服務抽象層
│   │   │   ├── ai-manager.ts       # AI 管理器（主要入口）
│   │   │   ├── abstract-ai-provider.ts  # AI 提供商抽象類別
│   │   │   ├── gemini-provider.ts  # Google Gemini 實作
│   │   │   ├── openai-provider.ts  # OpenAI 實作
│   │   │   ├── claude-provider.ts  # Claude 實作
│   │   │   └── openrouter-provider.ts # OpenRouter 實作
│   │   ├── notion-service.ts       # Notion API 服務
│   │   ├── pexels-service.ts       # Pexels 圖片搜尋
│   │   ├── cache-service.ts        # 快取管理服務
│   │   └── logger-service.ts       # 分層級日誌服務
│   │
│   ├── hooks/              # 自訂 React Hooks
│   │   ├── useItinerary.ts         # 行程資料管理
│   │   ├── useMode.ts              # 模式切換（瀏覽/編輯）
│   │   ├── useUrlParams.ts         # URL 參數處理
│   │   ├── usePerformance.ts       # 效能監控 Hook
│   │   ├── useUserTracking.ts      # 用戶行為追蹤 Hook
│   │   └── useHistory.ts           # 瀏覽歷史記錄
│   │
│   ├── contexts/           # React Contexts
│   │   ├── ModeContext.tsx         # 模式狀態管理
│   │   └── VisibilityContext.tsx   # 顯示狀態管理
│   │
│   ├── config/             # 設定檔
│   │   ├── ai-config.ts            # AI 服務設定
│   │   └── ui-config.ts            # UI 相關設定
│   │
│   ├── types/              # TypeScript 型別定義
│   │   └── index.ts                # 主要型別定義
│   │
│   ├── utils/              # 工具函數
│   ├── App.tsx             # 主要 App 元件
│   ├── main.tsx            # React 應用程式進入點
│   └── vite-env.d.ts       # Vite 類型定義
│
├── netlify/functions/      # Netlify Functions
│   ├── notion-query.js             # Notion 資料查詢
│   ├── notion-create.js            # 建立新行程項目
│   ├── notion-update.js            # 更新行程項目
│   ├── notion-delete.js            # 刪除行程項目
│   ├── notion-bulk-update.js       # 批量更新
│   ├── notion-database-info.js     # 資料庫資訊查詢
│   ├── image-proxy.js              # 圖片代理服務
│   ├── package.json                # Functions 相依性
│   └── utils/                      # Functions 工具函數
│
├── docs/                   # 專案文檔
│   ├── API_DOCUMENTATION.md        # API 文檔說明
│   ├── DEVELOPER_GUIDE.md          # 開發者指南
│   └── DEPLOYMENT_GUIDE.md         # 部署指南
│
├── public/                # 靜態資源
├── pic/                   # 圖片資源
├── tmp/                   # 臨時檔案
├── dist/                  # 建置產出 (自動生成)
├── package.json           # 專案相依性
├── vite.config.ts         # Vite 設定
├── tailwind.config.js     # Tailwind CSS 設定
├── tsconfig.json          # TypeScript 設定根檔案
├── tsconfig.app.json      # App TypeScript 設定
├── tsconfig.node.json     # Node.js TypeScript 設定
├── eslint.config.js       # ESLint 設定
├── postcss.config.js      # PostCSS 設定
├── netlify.toml           # Netlify 設定
├── README.md              # 專案說明文件
├── PROJECT_OVERVIEW.md    # 專案概覽
└── CLAUDE.md              # Claude AI 專案指南
```

## 核心流程說明

### 1. 資料流程
```
Notion 資料庫 → Netlify Functions → Frontend Cache → React Components
```

### 2. AI 內容增強流程
```
用戶觸發 → AI Manager → 選擇可用的 AI Provider → 生成內容 → 更新到 Notion
```

### 3. 圖片搜尋流程
```
景點名稱 → Pexels API → 圖片 URL → 透過 Image Proxy → 更新到 Notion
```

## Notion 資料庫結構

系統期望的 Notion 資料庫欄位：

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| 項目 | Title | 景點/活動名稱（必填） |
| 日期 | Date | 行程日期 |
| 時段 | Multi-select | 時間段（上午、下午、晚上） |
| GoogleMaps | URL | Google Maps 連結 |
| 重要資訊 | Rich Text | 重要注意事項 |
| 人均價 | Number | 每人費用 |
| 前往方式 | Rich Text | 交通方式 |
| 待辦 | Rich Text | 待辦事項 |
| 縮圖網址 | URL | 景點圖片 URL |
| 景點介紹 | Rich Text | AI 生成的景點介紹 |
| 排序 | Number | 排序權重 |

## 環境變數設定

```env
# 必要設定
VITE_NOTION_API_KEY=your_notion_integration_key
VITE_PEXELS_API_KEY=your_pexels_api_key
VITE_ADMIN_PASSWORD=your_admin_password

# AI 服務 API Keys (至少需要一個)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_CLAUDE_API_KEY=your_claude_api_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# 可選設定
VITE_AI_PROVIDER=gemini  # 預設 AI 提供商
```

## 使用方式

### 一般使用者
1. **基本存取**：`https://your-domain.com?db=notion_database_id`
2. **日期篩選**：`?db=database_id&start=2024-01-01&end=2024-01-31`

### 管理者模式
1. 點擊右下角設定選單
2. 輸入管理者密碼
3. 進入管理面板進行以下操作：
   - 重新載入 Notion 資料
   - 批量搜尋圖片
   - 批量生成景點介紹
   - 切換 AI 提供商

## 開發與部署

### 本地開發
```bash
# 安裝相依性
npm install

# 啟動開發伺服器
npm run dev

# Netlify Functions 本地測試
npm run netlify:dev
```

### 建置與部署
```bash
# 建置產品版本
npm run build

# 部署到 Netlify（需要先設定 Netlify CLI）
netlify deploy --prod
```

## 設計模式與架構亮點

### 1. 服務抽象化
- AI 服務採用抽象類別設計，易於擴展新的 AI 提供商
- 統一的服務介面，降低耦合度

### 2. 錯誤處理與降級
- 完整的錯誤邊界設計
- AI 服務失效時的自動降級機制
- 優雅的載入和錯誤狀態顯示

### 3. 效能最佳化
- React Query 實作資料快取和同步
- 批量 API 呼叫減少網路請求
- 圖片懶載入和代理服務

### 4. 使用者體驗
- 響應式設計適配各種裝置
- 直觀的時間軸介面
- 即時的操作回饋

## 未來擴展建議

1. **多語言支援**：國際化功能
2. **離線模式**：Service Worker 實作
3. **協作功能**：多人共同編輯行程
4. **匯出功能**：PDF/Excel 格式匯出
5. **行程分享**：社群分享功能
6. **地圖整合**：嵌入式地圖顯示

## 日誌系統使用指南

### 日誌層級說明
- **DEBUG (0)**：詳細的除錯資訊，僅在開發環境顯示
- **INFO (1)**：一般資訊，記錄正常的業務流程
- **WARN (2)**：警告訊息，需要注意但不影響功能運作
- **ERROR (3)**：錯誤訊息，需要立即處理的問題

### 分類標籤定義
- **API**：所有 API 請求和回應
- **USER**：用戶行為和操作
- **SYSTEM**：系統事件和狀態變化
- **PERFORMANCE**：效能相關測量
- **AI_MANAGER**：AI 服務管理和切換
- **NOTION**：Notion 服務相關操作
- **ERROR_BOUNDARY**：React 錯誤邊界捕獲的錯誤
- **ITINERARY_HOOK**：行程資料處理邏輯

### 使用方式

```typescript
import { logger } from '../services/logger-service';

// 基本日誌記錄
logger.debug('CATEGORY', 'Debug message', { data: 'value' });
logger.info('CATEGORY', 'Info message', { data: 'value' });
logger.warn('CATEGORY', 'Warning message', { data: 'value' }, error);
logger.error('CATEGORY', 'Error message', { data: 'value' }, error);

// API 相關便利方法
logger.apiRequest('POST', '/api/notion-query', requestData);
logger.apiResponse('POST', '/api/notion-query', 200, responseData);
logger.apiError('POST', '/api/notion-query', error);

// 用戶行為追蹤
logger.userAction('BUTTON_CLICK', { buttonName: 'Generate Description' });

// 效能監控
logger.performance('Data Processing', 1250, { itemCount: 10 });
```

### 效能監控 Hook

```typescript
import { usePerformance } from '../hooks/usePerformance';

const { measurePerformance, startMeasurement } = usePerformance();

// 測量操作耗時
startMeasurement();
await someOperation();
measurePerformance('Operation Name', { context: 'additional data' });
```

### 用戶行為追蹤 Hook

```typescript
import { useUserTracking } from '../hooks/useUserTracking';

const { trackUserAction, trackPageView, trackFeatureUsage } = useUserTracking();

// 追蹤用戶行為
trackUserAction('SEARCH_ITEM', { query: 'travel destination' });
trackPageView('Timeline', { databaseId: 'abc123' });
trackFeatureUsage('AI_DESCRIPTION_GENERATION', { provider: 'gemini' });
```

## 多平台 Serverless 架構詳解

### 🚀 架構亮點

1. **統一抽象介面**
   - 所有平台使用相同的 `ServerlessRequest` 和 `ServerlessResponse` 介面
   - 業務邏輯完全平台無關，易於測試和維護

2. **智能平台檢測**
   - 自動檢測當前部署平台（Netlify、Vercel、AWS、本地）
   - 動態適配環境變數和配置選項

3. **靈活環境管理**
   - 支援多種環境變數命名方式
   - 自動降級和適配不同平台的限制

4. **統一錯誤處理**
   - 標準化的錯誤回應格式
   - 跨平台的 CORS 處理

### 🌐 支援的部署平台

| 平台 | 狀態 | 函數執行時間 | 特色 |
|------|------|-------------|------|
| **Netlify** | ✅ 完整支援 | 10 秒 | 原生支援，向後相容 |
| **Vercel** | ✅ 完整支援 | 30 秒 (Pro) | 更長執行時間，優秀的 Edge 函數 |
| **AWS Lambda** | 🚧 規劃中 | 15 分鐘 | 最大彈性和控制能力 |

### 📁 新增的架構檔案

```
src/serverless/
├── core/
│   ├── base-handler.ts         # 基礎 Handler 抽象類別
│   └── platform-adapter.ts     # 平台請求/回應適配器
├── handlers/                   # 業務邏輯處理器（平台無關）
├── services/                   # 核心服務抽象層
├── config/
│   ├── environment.ts          # 智能環境變數管理
│   └── deployment.ts           # 部署平台配置管理
api/                           # Vercel API Routes
├── notion-query.js
├── notion-create.js
├── ...
scripts/
└── deploy.js                  # 統一部署腳本
docs/
└── MULTI_PLATFORM_DEPLOYMENT.md # 詳細部署指南
```

### 🛠️ 開發和部署指令

```bash
# 本地開發（自動偵測平台）
npm run dev

# 平台特定開發
npm run dev:netlify    # Netlify Functions 開發模式
npm run dev:vercel     # Vercel API Routes 開發模式

# 建置
npm run build:netlify  # 針對 Netlify 建置
npm run build:vercel   # 針對 Vercel 建置

# 部署
npm run deploy:netlify # 部署到 Netlify
npm run deploy:vercel  # 部署到 Vercel

# 使用統一部署腳本
node scripts/deploy.js netlify
node scripts/deploy.js vercel --dry-run

# 平台檢測和診斷
npm run platform:detect # 檢測當前平台
npm run platform:info   # 顯示平台詳細資訊
```

### 🔧 環境變數適配

系統會自動適配不同的環境變數命名慣例：

```bash
# 多種命名方式會被自動識別
VITE_NOTION_API_KEY=xxx        # Vite 開發環境
NOTION_API_KEY=xxx             # 標準服務端
NEXT_PUBLIC_NOTION_API_KEY=xxx # Next.js 慣例
```

### 📊 API 端點動態選擇

前端會根據當前域名自動選擇正確的 API 端點：

- `*.netlify.app` → `/.netlify/functions/*`
- `*.vercel.app` → `/api/*`
- `localhost:8888` → `/.netlify/functions/*` (Netlify Dev)
- 其他 → `/api/*` (預設)

## 維護注意事項

1. **API 金鑰安全**：定期更換 API 金鑰
2. **Notion API 版本**：關注 Notion API 版本更新
3. **AI 服務配額**：監控 AI 服務使用量
4. **快取策略**：根據使用情況調整快取時間
5. **日誌監控**：定期檢查錯誤日誌，及時處理異常情況
6. **效能監控**：關注關鍵操作的效能指標，適時最佳化
7. **多平台相容性**：定期測試不同平台的部署和功能
8. **環境變數管理**：確保所有平台的環境變數配置正確

## 擴展新平台

要添加新的部署平台支援：

1. 在 `src/serverless/config/deployment.ts` 中添加平台配置
2. 建立平台特定的函數包裝層目錄
3. 實作包裝函數，使用 `PlatformAdapter` 進行轉換
4. 更新 `src/services/api-service-factory.ts` 的檢測邏輯
5. 添加對應的 npm scripts
6. 更新部署腳本和文檔

詳細指南請參考 `docs/MULTI_PLATFORM_DEPLOYMENT.md`。

---

此專案展現了現代 Web 應用程式的最佳實踐，結合了多種尖端技術和多平台 Serverless 架構來提供優秀的使用者體驗。新的架構提供了更大的靈活性和可擴展性，同時保持了代碼的簡潔和可維護性。