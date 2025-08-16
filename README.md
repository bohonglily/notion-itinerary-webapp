# Notion Itinerary WebApp - 智能旅遊行程展示系統

一個基於 React + TypeScript 的現代化旅遊行程展示系統，與 Notion 資料庫深度整合，提供美觀的時間軸介面來展示旅遊行程。系統支援多種 AI 服務進行內容增強，包含自動生成景點介紹和圖片搜尋功能。採用混合架構設計，前端 TypeScript + 後端純 JavaScript，支援 Netlify 和 Vercel 多平台部署。

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
- 景點介紹顯示/隱藏切換
- 編輯/瀏覽模式切換

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

### 後端服務（混合架構）
```
多平台 Serverless Functions (純 JavaScript)
├── utils/
│   └── notion-client.js - 共用 Notion API 工具函數
├── netlify/functions/ - Netlify Functions
│   ├── notion-query.js - Notion 資料查詢
│   ├── notion-create.js - 建立新行程項目
│   ├── notion-update.js - 更新行程項目
│   ├── notion-delete.js - 刪除行程項目
│   ├── notion-bulk-update.js - 批量更新
│   ├── notion-database-info.js - 資料庫資訊查詢
│   └── image-proxy.js - 圖片代理服務
└── api/ - Vercel API Routes
    └── (相同的檔案結構，適配 Vercel 格式)
```

### 外部 API 整合
- **Notion API**：行程資料來源
- **Pexels API**：圖片搜尋服務
- **AI 服務**：Google Gemini、OpenAI、Claude、OpenRouter

## 快速開始

### 環境需求
- Node.js 18+ 
- npm 或 yarn
- Notion 整合金鑰
- Pexels API 金鑰
- 至少一個 AI 服務 API 金鑰

### 安裝步驟

1. **複製專案並安裝相依性**
   ```bash
   git clone <repository-url>
   cd notion-itinerary-webapp
   npm install
   ```

2. **環境變數設定**
   建立 `.env` 檔案並設定以下變數：
   ```bash
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
   VITE_OPENROUTER_MODEL=openrouter/cinematika-7b  # OpenRouter 模型
   ```

3. **啟動開發伺服器**
   ```bash
   # 僅前端開發
   npm run dev

   # 包含 Netlify Functions 的完整開發環境
   npm run netlify:dev
   ```

4. **存取你的行程**
   瀏覽至：`http://localhost:5173?db=your_notion_database_id`

## 使用方式

### 一般使用者
1. **基本存取**：`https://your-domain.com?db=notion_database_id`
2. **日期篩選**：`?db=database_id&start=2024-01-01&end=2024-01-31`
3. **編輯模式**：點擊左下角的編輯按鈕進入編輯模式
4. **景點介紹切換**：點擊眼睛圖示來顯示/隱藏景點介紹

### 管理者模式
1. 點擊右下角設定選單
2. 輸入管理者密碼
3. 進入管理面板進行以下操作：
   - 重新載入 Notion 資料
   - 批量搜尋圖片
   - 批量生成景點介紹
   - 切換 AI 提供商

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

## API 金鑰設定

### 1. Notion API
1. 前往 https://www.notion.so/my-integrations
2. 建立新的整合
3. 複製整合金鑰
4. 將資料庫分享給你的整合

### 2. Pexels API
1. 註冊 https://www.pexels.com/api/
2. 取得免費 API 金鑰
3. 每月 200 次免費請求

### 3. AI 服務 API 金鑰
- **Google Gemini**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys  
- **Claude**: https://console.anthropic.com/
- **OpenRouter**: https://openrouter.ai/

## 專案結構

```
notion-itinerary-webapp/
├── src/                    # 前端 TypeScript 代碼
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
│   │   └── HomePage.tsx            # 首頁元件
│   │
│   ├── services/           # 前端服務層
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
│   │   ├── logger-service.ts       # 分層級日誌服務
│   │   └── api-service-factory.ts  # API 端點工廠
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
│   └── types/              # TypeScript 型別定義
│       └── index.ts                # 主要型別定義
│
├── utils/                  # 後端共用工具 (JavaScript)
│   └── notion-client.js            # Notion API 共用函數
│
├── netlify/functions/      # Netlify Functions (JavaScript)
│   ├── notion-query.js             # Notion 資料查詢
│   ├── notion-create.js            # 建立新行程項目
│   ├── notion-update.js            # 更新行程項目
│   ├── notion-delete.js            # 刪除行程項目
│   ├── notion-bulk-update.js       # 批量更新
│   ├── notion-database-info.js     # 資料庫資訊查詢
│   └── image-proxy.js              # 圖片代理服務
│
├── api/                    # Vercel API Routes (JavaScript)
│   ├── notion-query.js             # Notion 資料查詢
│   ├── notion-create.js            # 建立新行程項目
│   ├── notion-update.js            # 更新行程項目
│   ├── notion-delete.js            # 刪除行程項目
│   ├── notion-bulk-update.js       # 批量更新
│   ├── notion-database-info.js     # 資料庫資訊查詢
│   └── image-proxy.js              # 圖片代理服務
│
├── public/                # 靜態資源
├── package.json           # 專案相依性
├── vite.config.ts         # Vite 設定
├── tailwind.config.js     # Tailwind CSS 設定
├── tsconfig.json          # TypeScript 設定
├── netlify.toml           # Netlify 設定
└── vercel.json            # Vercel 設定
```

## 開發與部署

### 本地開發
```bash
# 安裝相依性
npm install

# 啟動開發伺服器
npm run dev

# Netlify Functions 本地測試
npm run netlify:dev

# 程式碼檢查
npm run lint

# 建置
npm run build
```

### 建置與部署

#### 部署到 Netlify
1. 建置產品版本：`npm run build`
2. 部署到 Netlify：`netlify deploy --prod`
3. 設定環境變數於 Netlify 控制面板
4. 系統會自動使用 `netlify/functions/` 中的 API

#### 部署到 Vercel  
1. 建置產品版本：`npm run build`
2. 部署到 Vercel：`vercel --prod`
3. 設定環境變數於 Vercel 控制面板
4. 系統會自動使用 `api/` 中的 API Routes

> **智能端點選擇**：前端會根據部署域名自動選擇正確的 API 端點，無需手動配置。

## 維護注意事項

1. **API 金鑰安全**：定期更換 API 金鑰
2. **Notion API 版本**：關注 Notion API 版本更新  
3. **AI 服務配額**：監控 AI 服務使用量
4. **快取策略**：根據使用情況調整快取時間
5. **日誌監控**：定期檢查錯誤日誌，及時處理異常情況
6. **效能監控**：關注關鍵操作的效能指標，適時最佳化

## 授權

MIT License - 詳見 LICENSE 檔案