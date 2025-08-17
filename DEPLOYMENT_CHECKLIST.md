# 🚀 Vercel 多環境部署檢查清單

## 📋 初始設定檢查清單

### ✅ 1. Vercel CLI 設定
- [ ] 安裝 Vercel CLI: `npm install -g vercel`
- [ ] 登入 Vercel: `vercel login`
- [ ] 連結專案: `vercel link`
- [ ] 獲取專案資訊: `vercel project ls`

### ✅ 2. GitHub Secrets 設定
在 GitHub Settings → Secrets and variables → Actions 中添加：
- [ ] `VERCEL_TOKEN` (從 https://vercel.com/account/tokens)
- [ ] `VERCEL_ORG_ID` (從 `vercel project ls`)
- [ ] `VERCEL_PROJECT_ID` (從 `vercel project ls`)

### ✅ 3. Vercel 環境變數設定
在 Vercel Dashboard → Project → Settings → Environment Variables 中設定：

#### Production 環境
- [ ] `NODE_ENV` = `production`
- [ ] `VITE_ENV` = `production` 
- [ ] `VITE_NOTION_API_KEY` = `your_production_notion_key`
- [ ] `NOTION_API_KEY` = `your_production_notion_key`
- [ ] `VITE_ADMIN_PASSWORD` = `secure_production_password`
- [ ] `VITE_PEXELS_API_KEY` = `your_pexels_key`
- [ ] `PEXELS_API_KEY` = `your_pexels_key`
- [ ] `VITE_GEMINI_API_KEY` = `your_gemini_key` (至少一個 AI 服務)

#### Staging 環境  
- [ ] `NODE_ENV` = `staging`
- [ ] `VITE_ENV` = `staging`
- [ ] `VITE_NOTION_API_KEY` = `your_staging_notion_key`
- [ ] `NOTION_API_KEY` = `your_staging_notion_key`
- [ ] `VITE_ADMIN_PASSWORD` = `staging_password`
- [ ] `VITE_PEXELS_API_KEY` = `your_pexels_key`
- [ ] `PEXELS_API_KEY` = `your_pexels_key`
- [ ] `VITE_GEMINI_API_KEY` = `your_gemini_key`

## 🧪 部署前測試檢查清單

### ✅ 本地測試
- [ ] 環境變數驗證: `npm run env:verify`
- [ ] 本地建置測試: `npm run build`
- [ ] 本地開發測試: `npm run dev:vercel`
- [ ] API 端點測試: 訪問 `http://localhost:3000/api/notion-database-info`
- [ ] 程式碼檢查: `npm run lint`

### ✅ Staging 部署測試
- [ ] 切換到 clean-main 分支: `git checkout clean-main`
- [ ] 推送變更: `git push origin clean-main`
- [ ] 檢查 GitHub Actions 狀態
- [ ] 訪問 Staging 環境並測試功能
- [ ] 驗證 API 端點正常運作
- [ ] 測試管理員功能

### ✅ Production 部署準備
- [ ] Staging 測試通過
- [ ] 合併到 main 分支: `git checkout main && git merge clean-main`
- [ ] 推送到 Production: `git push origin main`
- [ ] 檢查 GitHub Actions 狀態
- [ ] 訪問 Production 環境並測試

## 🔍 部署後檢查清單

### ✅ 功能驗證
- [ ] 首頁正常載入
- [ ] Notion 資料庫連接正常
- [ ] 行程顯示正確
- [ ] 管理員面板登入正常
- [ ] AI 服務運作正常
- [ ] 圖片搜尋功能正常
- [ ] 新增/編輯/刪除行程功能正常

### ✅ 效能檢查
- [ ] 頁面載入速度 < 3 秒
- [ ] API 回應時間 < 2 秒
- [ ] 圖片載入正常
- [ ] 手機版顯示正確

### ✅ 安全檢查
- [ ] 管理員密碼設定正確
- [ ] API 金鑰未暴露在前端
- [ ] HTTPS 連接正常
- [ ] CORS 設定正確

## 🚨 問題排除檢查清單

### ❌ 建置失敗
- [ ] 檢查環境變數是否設定完整: `npm run env:verify:production`
- [ ] 檢查依賴是否安裝完整: `npm install`
- [ ] 檢查程式碼語法錯誤: `npm run lint`
- [ ] 查看 Vercel 建置日誌

### ❌ API 錯誤
- [ ] 檢查 Notion API 金鑰是否有效
- [ ] 檢查 Notion 資料庫權限設定
- [ ] 檢查 API 端點路徑是否正確
- [ ] 查看 Vercel Functions 日誌

### ❌ 環境變數問題
- [ ] 確認變數名稱拼寫正確
- [ ] 確認 Production/Staging 環境變數分別設定
- [ ] 確認敏感資訊使用非 VITE_ 前綴
- [ ] 重新部署以更新環境變數

## 📊 監控設定檢查清單

### ✅ Vercel Analytics
- [ ] 啟用 Vercel Analytics
- [ ] 設定效能監控
- [ ] 設定錯誤追蹤

### ✅ 日誌監控
- [ ] 定期檢查 Vercel Functions 日誌
- [ ] 監控 API 請求錯誤率
- [ ] 設定警報通知（如需要）

## 🔄 定期維護檢查清單

### 🗓️ 每週檢查
- [ ] 檢查 Staging 環境狀態
- [ ] 檢查 Production 環境效能
- [ ] 查看錯誤日誌

### 🗓️ 每月檢查  
- [ ] 更新依賴套件: `npm update`
- [ ] 檢查 API 金鑰是否即將過期
- [ ] 檢查 Vercel 使用量

### 🗓️ 每季檢查
- [ ] 更新 Notion API 版本
- [ ] 更新 Node.js 版本
- [ ] 審查安全設定

---

## 🛠️ 快速命令參考

```bash
# 環境設定
npm run setup:vercel              # 一鍵設定 Vercel 環境
npm run env:verify               # 驗證當前環境變數
npm run env:verify:staging       # 驗證 Staging 環境
npm run env:verify:production    # 驗證 Production 環境

# 建置與部署
npm run build:staging            # Staging 環境建置
npm run build:production         # Production 環境建置
npm run deploy:staging           # 手動部署到 Staging
npm run deploy:production        # 手動部署到 Production

# 本地開發
npm run dev:vercel               # Vercel 本地開發
npm run dev:netlify              # Netlify 本地開發
```

## 📞 支援資源

- [Vercel 部署指南](./docs/VERCEL_DEPLOYMENT_GUIDE.md)
- [API 文檔](./docs/API_DOCUMENTATION.md)
- [開發者指南](./docs/DEVELOPER_GUIDE.md)
- [Vercel 官方文檔](https://vercel.com/docs)

---

**記住：部署前先在 Staging 環境測試，確保一切正常再部署到 Production！**