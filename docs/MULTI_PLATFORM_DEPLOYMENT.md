# 多平台部署指南

本專案已重構為支援多個 Serverless 平台的架構，目前支援 Netlify 和 Vercel 平台。

## 架構概覽

### 1. 分層架構設計

```
notion-itinerary-webapp/
├── src/serverless/                 # Serverless 抽象層
│   ├── core/                       # 核心抽象
│   │   ├── base-handler.ts         # 基礎 Handler 類別
│   │   └── platform-adapter.ts     # 平台適配器
│   ├── handlers/                   # 業務邏輯 Handlers
│   │   ├── notion-query-handler.ts
│   │   ├── notion-create-handler.ts
│   │   ├── image-proxy-handler.ts
│   │   └── ...
│   ├── services/                   # 核心服務
│   │   ├── notion-service.ts       # Notion 服務抽象
│   │   └── image-proxy-service.ts  # 圖片代理服務抽象
│   └── config/                     # 配置管理
│       ├── environment.ts          # 環境變數管理
│       └── deployment.ts           # 部署平台配置
├── netlify/functions/              # Netlify Functions 包裝層
├── api/                           # Vercel API Routes 包裝層
└── src/services/                  # 前端服務
    └── api-service-factory.ts     # API 端點工廠
```

### 2. 統一抽象介面

所有平台共享相同的業務邏輯，通過統一的 `ServerlessRequest` 和 `ServerlessResponse` 介面進行溝通：

```typescript
interface ServerlessRequest {
  method: string;
  body: string | null;
  headers: Record<string, string>;
  query: Record<string, string>;
  path: string;
}

interface ServerlessResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}
```

## 支援的平台

### 1. Netlify

**特色:**
- 原生支援，向後相容
- 10 秒函數執行時間限制
- 自動 HTTPS 和 CDN
- 優秀的表單處理和身份驗證

**配置檔案:** `netlify.toml`
**函數目錄:** `netlify/functions/`
**環境變數前綴:** `NETLIFY_`

### 2. Vercel

**特色:**
- 30 秒函數執行時間限制（Pro 方案）
- 優秀的 Edge 函數支援
- 自動部署預覽
- 內建分析工具

**配置檔案:** `vercel.json`
**函數目錄:** `api/`
**環境變數前綴:** `VERCEL_`

### 3. AWS Lambda（規劃中）

**特色:**
- 15 分鐘執行時間限制
- 靈活的記憶體和 CPU 配置
- 強大的 VPC 和安全功能
- 多地區部署

## 環境變數配置

系統會自動適配不同平台的環境變數命名方式：

```bash
# Notion API
VITE_NOTION_API_KEY=your_notion_key      # Vite 開發環境
NOTION_API_KEY=your_notion_key            # 標準命名
NEXT_PUBLIC_NOTION_API_KEY=your_notion_key # Next.js 風格

# Pexels API
VITE_PEXELS_API_KEY=your_pexels_key
PEXELS_API_KEY=your_pexels_key
NEXT_PUBLIC_PEXELS_API_KEY=your_pexels_key

# Admin Password
VITE_ADMIN_PASSWORD=your_admin_password
ADMIN_PASSWORD=your_admin_password
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password

# AI API Keys
VITE_GEMINI_API_KEY=your_gemini_key
GEMINI_API_KEY=your_gemini_key

VITE_OPENAI_API_KEY=your_openai_key
OPENAI_API_KEY=your_openai_key

VITE_CLAUDE_API_KEY=your_claude_key
CLAUDE_API_KEY=your_claude_key
ANTHROPIC_API_KEY=your_claude_key

# AI Provider Selection
VITE_AI_PROVIDER=gemini
AI_PROVIDER=gemini
```

## 部署指南

### 1. Netlify 部署

#### 本地開發
```bash
# 安裝 Netlify CLI
npm install -g netlify-cli

# 本地開發（含 Functions）
npm run dev:netlify

# 或分別啟動
npx vite --port 5173
npx netlify functions:serve
```

#### 手動部署
```bash
# 建置專案
npm run build:netlify

# 部署到 Netlify
npm run deploy:netlify

# 或使用部署腳本
node scripts/deploy.js netlify
```

#### 自動部署設定
1. 連接 GitHub 儲存庫到 Netlify
2. 設定建置命令：`npm run build:netlify`
3. 設定發布目錄：`dist`
4. 設定函數目錄：`netlify/functions`
5. 配置環境變數

### 2. Vercel 部署

#### 本地開發
```bash
# 安裝 Vercel CLI
npm install -g vercel

# 本地開發
npm run dev:vercel

# 或直接使用
vercel dev
```

#### 手動部署
```bash
# 建置專案
npm run build:vercel

# 部署到 Vercel
npm run deploy:vercel

# 或使用部署腳本
node scripts/deploy.js vercel
```

#### 自動部署設定
1. 連接 GitHub 儲存庫到 Vercel
2. 框架預設：Other
3. 建置命令：`npm run build:vercel`
4. 輸出目錄：`dist`
5. 配置環境變數

### 3. 部署腳本使用

專案提供了統一的部署腳本：

```bash
# 部署到 Netlify
node scripts/deploy.js netlify

# 部署到 Vercel
node scripts/deploy.js vercel

# 乾燥運行模式（只顯示命令，不執行）
node scripts/deploy.js netlify --dry-run

# 只執行建置，不部署
node scripts/deploy.js netlify --build-only
```

## 平台選擇建議

### 選擇 Netlify 的情況：
- 需要簡單快速的部署
- 重視表單處理和身份驗證功能
- 專案主要為靜態網站 + 簡單 API
- 預算有限（慷慨的免費額度）

### 選擇 Vercel 的情況：
- 需要更長的函數執行時間
- 重視 Edge 函數和全球 CDN 效能
- 需要詳細的部署分析和監控
- 專案有複雜的 API 需求

## 故障排除

### 1. 環境變數問題
```bash
# 檢查當前平台
npm run platform:detect

# 查看平台資訊
npm run platform:info
```

### 2. API 端點問題
檢查 `src/services/api-service-factory.ts` 中的端點配置是否正確。

### 3. 函數執行時間超時
- Netlify：優化程式碼，減少執行時間
- Vercel：考慮升級到 Pro 方案

### 4. CORS 問題
所有 API 端點都已配置 CORS 標頭，如仍有問題請檢查：
- 前端請求的域名是否正確
- API 端點是否正常回應 OPTIONS 請求

## 監控和除錯

### 1. 日誌查看
- **Netlify**: 在 Netlify 控制台的 Functions 標籤頁查看
- **Vercel**: 在 Vercel 控制台的 Functions 標籤頁查看

### 2. 效能監控
系統內建了分層級日誌系統，會自動記錄：
- API 請求時間
- 錯誤詳情
- 用戶行為
- 系統效能指標

### 3. 健康檢查
```typescript
import { ApiServiceFactory } from '../src/services/api-service-factory';

const factory = ApiServiceFactory.getInstance();
const health = await factory.checkHealth();
console.log(health);
```

## 最佳實踐

### 1. 環境管理
- 使用不同的環境變數集合管理不同的部署環境
- 開發環境使用本地配置，生產環境使用平台環境變數

### 2. 安全考量
- API 金鑰不要直接寫在程式碼中
- 使用環境變數管理敏感資訊
- 定期輪換 API 金鑰

### 3. 效能最佳化
- 合理使用快取機制
- 避免長時間執行的函數
- 監控並優化 API 回應時間

### 4. 部署策略
- 使用自動部署減少人為錯誤
- 維護 staging 環境進行測試
- 準備回滾計畫

## 擴展新平台

要添加新的部署平台支援，需要：

1. 在 `src/serverless/config/deployment.ts` 中添加平台配置
2. 建立平台特定的函數包裝層
3. 更新 `src/services/api-service-factory.ts` 的端點檢測邏輯
4. 添加相應的建置和部署腳本
5. 更新文檔

範例請參考現有的 Netlify 和 Vercel 實作。