# Notion Itinerary WebApp 部署指南

## 目錄
- [部署概述](#部署概述)
- [前置準備](#前置準備)
- [Netlify 部署](#netlify-部署)
- [環境變數設定](#環境變數設定)
- [域名設定](#域名設定)
- [監控與維護](#監控與維護)
- [故障排除](#故障排除)
- [效能最佳化](#效能最佳化)

## 部署概述

Notion Itinerary WebApp 系統採用 Jamstack 架構，推薦使用 Netlify 進行部署，具有以下優勢：

- **Serverless Functions**: 自動處理後端 API
- **CDN**: 全球內容分發網路
- **自動建置**: Git 推送自動觸發部署
- **HTTPS**: 自動 SSL 憑證
- **環境變數管理**: 安全的設定管理

### 系統架構圖
```
Browser → Netlify CDN → Static Files (React App)
                    ↓
                  Netlify Functions (API)
                    ↓
         External APIs (Notion, Pexels, AI Services)
```

## 前置準備

### 1. 帳號註冊
- [Netlify 帳號](https://www.netlify.com/)
- [GitHub/GitLab/Bitbucket 帳號](https://github.com/) (用於程式碼託管)

### 2. API 服務申請
依照以下步驟申請必要的 API 服務：

#### Notion API
1. 前往 [Notion Integrations](https://www.notion.so/my-integrations)
2. 點擊 "New integration"
3. 填寫基本資訊：
   - Name: Notion Itinerary WebApp Integration
   - Associated workspace: 選擇你的工作區
   - Capabilities: 勾選 "Read content", "Update content", "Insert content"
4. 點擊 "Submit" 建立整合
5. 複製 "Internal Integration Token"
6. 將你的旅遊資料庫分享給這個整合

#### Pexels API  
1. 前往 [Pexels API](https://www.pexels.com/api/)
2. 點擊 "Get Started"
3. 註冊帳號並登入
4. 在 Dashboard 中找到你的 API Key
5. 複製 API Key

#### AI 服務 API Keys (至少選擇一個)

**Google Gemini**
1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 點擊 "Get API key"
3. 選擇或建立 Google Cloud 專案
4. 複製 API Key

**OpenAI**
1. 前往 [OpenAI API Keys](https://platform.openai.com/api-keys)
2. 點擊 "Create new secret key"
3. 命名並複製 API Key
4. 注意：需要有付費帳號才能使用

**Claude**
1. 前往 [Anthropic Console](https://console.anthropic.com/)
2. 註冊並建立 API Key
3. 複製 API Key

**OpenRouter**
1. 前往 [OpenRouter](https://openrouter.ai/)
2. 註冊並前往 API Keys 頁面
3. 建立新的 API Key
4. 複製 API Key

### 3. 本地建置測試
在部署前，先確保專案能在本地正常建置：

```bash
# 安裝相依性
npm install

# 建置專案
npm run build

# 檢查建置產物
ls dist/

# 本地預覽建置結果
npm run preview
```

## Netlify 部署

### 方法 1: Git 整合自動部署 (推薦)

1. **推送程式碼到 Git 倉庫**
   ```bash
   git add .
   git commit -m "Initial commit for deployment"
   git push origin main
   ```

2. **連接 Netlify 到 Git 倉庫**
   - 登入 Netlify
   - 點擊 "New site from Git"
   - 選擇 Git 提供商 (GitHub/GitLab/Bitbucket)
   - 授權 Netlify 存取你的倉庫
   - 選擇 notion-itinerary-webapp 倉庫

3. **設定建置參數**
   ```
   Branch to deploy: main
   Build command: npm run build
   Publish directory: dist
   ```

4. **點擊 "Deploy site"**

### 方法 2: CLI 手動部署

1. **安裝 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登入 Netlify**
   ```bash
   netlify login
   ```

3. **初始化專案**
   ```bash
   netlify init
   ```

4. **建置和部署**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### 方法 3: 拖放部署 (簡單測試用)

1. 執行 `npm run build` 建置專案
2. 將 `dist` 資料夾拖放到 Netlify Dashboard
3. 注意：此方法無法使用 Netlify Functions

## 環境變數設定

### 在 Netlify Dashboard 設定

1. **進入專案設定**
   - 點擊你的專案
   - 前往 "Site settings"
   - 點擊 "Environment variables"

2. **新增環境變數**
   點擊 "Add a variable" 並依次新增以下變數：

   ```env
   # 必要變數
   VITE_NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_PEXELS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_ADMIN_PASSWORD=your_secure_admin_password

   # AI 服務 API Keys (至少設定一個)
   VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

   # 可選設定
   VITE_AI_PROVIDER=gemini
   VITE_OPENROUTER_MODEL=openrouter/cinematika-7b
   ```

3. **觸發重新部署**
   設定完環境變數後，點擊 "Trigger deploy" 重新建置專案。

### 使用 Netlify CLI 設定 (可選)

```bash
# 設定環境變數
netlify env:set VITE_NOTION_API_KEY "your_notion_api_key"
netlify env:set VITE_PEXELS_API_KEY "your_pexels_api_key"
netlify env:set VITE_ADMIN_PASSWORD "your_admin_password"

# 查看已設定的環境變數
netlify env:list
```

## 域名設定

### 使用 Netlify 子域名

Netlify 會自動為你的專案分配一個隨機子域名，如：
`https://amazing-site-123456.netlify.app`

你可以在 "Site settings > Domain management > Options" 中修改子域名。

### 使用自訂域名

1. **DNS 設定**
   在你的域名提供商設定 DNS 記錄：
   ```
   Type: CNAME
   Name: www (或 @)
   Value: your-site-name.netlify.app
   ```

2. **在 Netlify 新增自訂域名**
   - 前往 "Site settings > Domain management"
   - 點擊 "Add custom domain"
   - 輸入你的域名
   - 按照指示完成 DNS 驗證

3. **啟用 HTTPS**
   Netlify 會自動為自訂域名申請 SSL 憑證。

## 監控與維護

### 1. 部署狀態監控

**查看部署歷史**
- 在 Netlify Dashboard 的 "Deploys" 頁面查看所有部署記錄
- 綠色表示成功，紅色表示失敗

**建置日誌**
- 點擊任一部署記錄查看詳細日誌
- 建置錯誤會在這裡顯示

### 2. Functions 監控

**查看 Functions 執行狀況**
- 前往 "Functions" 頁面
- 查看每個 Function 的執行次數和錯誤率

**查看日誌**
```bash
# 使用 Netlify CLI 查看即時日誌
netlify functions:logs
```

### 3. 分析與效能

**內建分析**
- Netlify Analytics 提供基礎的流量統計
- 查看頁面載入時間、熱門頁面等

**整合 Google Analytics**
在 `index.html` 中加入 Google Analytics 程式碼：
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### 4. 錯誤監控

**整合 Sentry (可選)**
1. 安裝 Sentry SDK：
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. 在 `main.tsx` 中初始化：
   ```typescript
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     integrations: [new Sentry.BrowserTracing()],
     tracesSampleRate: 1.0,
   });
   ```

## 故障排除

### 常見部署問題

#### 1. 建置失敗

**問題**: 建置過程中出現錯誤
**解決方案**:
```bash
# 本地測試建置
npm run build

# 檢查 TypeScript 錯誤
npm run lint

# 清除 node_modules 並重新安裝
rm -rf node_modules package-lock.json
npm install
```

#### 2. 環境變數未生效

**問題**: API 呼叫失敗，顯示金鑰錯誤
**檢查清單**:
- ✅ 環境變數名稱正確 (VITE_ 前綴)
- ✅ 環境變數值沒有多餘空格
- ✅ 重新部署後生效
- ✅ 本地 .env 檔案與線上環境變數一致

#### 3. Functions 無法執行

**問題**: API 呼叫返回 404 或 500 錯誤
**解決方案**:
- 確認 `netlify.toml` 設定正確
- 檢查 Functions 程式碼語法
- 查看 Functions 日誌找出錯誤原因

#### 4. 圖片載入失敗

**問題**: 圖片無法顯示或 CORS 錯誤
**解決方案**:
- 確認 `image-proxy` Function 正常運作
- 檢查圖片 URL 是否正確
- 測試 Pexels API 金鑰是否有效

### 效能問題排查

#### 1. 載入速度慢

**檢查項目**:
- Bundle 大小 (建議 < 1MB)
- 圖片最佳化
- CDN 快取設定
- API 回應時間

**最佳化方式**:
```bash
# 分析 Bundle 大小
npm run build -- --analyze

# 檢查快取設定
curl -I https://your-domain.com/assets/index.js
```

#### 2. API 回應慢

**檢查項目**:
- Notion API 回應時間
- AI 服務回應時間
- Functions 冷啟動時間
- 快取機制是否有效

## 效能最佳化

### 1. 建置最佳化

**Vite 設定最佳化**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          query: ['@tanstack/react-query']
        }
      }
    },
    target: 'es2020'
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

### 2. 快取策略

**Netlify Headers 設定**
建立 `public/_headers` 檔案：
```
# 靜態資源快取
/assets/*
  Cache-Control: max-age=31536000

# HTML 檔案
/*.html
  Cache-Control: max-age=0

# API 快取
/.netlify/functions/*
  Cache-Control: max-age=300
```

### 3. 圖片最佳化

**響應式圖片**
```typescript
const OptimizedImage: React.FC<{ src: string, alt: string }> = ({ src, alt }) => (
  <picture>
    <source 
      media="(max-width: 768px)" 
      srcSet={`${src}?auto=format&fit=crop&w=400&q=80`} 
    />
    <img 
      src={`${src}?auto=format&fit=crop&w=800&q=90`} 
      alt={alt}
      loading="lazy"
    />
  </picture>
);
```

### 4. 監控設定

**Web Vitals 監控**
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 維護作業

### 定期維護清單

**每週**:
- [ ] 檢查部署狀態
- [ ] 查看錯誤日誌
- [ ] 監控 API 配額使用量

**每月**:
- [ ] 更新依賴套件
- [ ] 檢查安全性警告
- [ ] 清理舊的部署記錄
- [ ] 備份重要設定

**每季**:
- [ ] 效能評估和最佳化
- [ ] 檢查 API 金鑰安全性
- [ ] 更新文檔
- [ ] 災難復原測試

### 更新部署

**自動更新 (Git 整合)**:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Netlify 會自動觸發部署
```

**手動更新**:
```bash
npm run build
netlify deploy --prod --dir=dist
```

### 備份策略

**程式碼備份**:
- Git 倉庫本身就是備份
- 建議使用多個遠端倉庫 (GitHub + GitLab)

**環境變數備份**:
```bash
# 匯出環境變數
netlify env:list > env-backup.txt
```

**資料庫備份**:
- Notion 資料會持續同步
- 定期匯出重要資料到本地

---

此部署指南涵蓋了 Notion Itinerary WebApp 系統的完整部署流程。按照此指南操作，你應該能夠成功將系統部署到 Netlify 並正常運行。如遇到問題，請參考故障排除章節或查看 Netlify 官方文檔。