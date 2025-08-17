# Vercel 多環境部署指南

## 🎯 環境架構概覽

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   環境          │   分支          │   觸發條件       │   域名          │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Production      │ main           │ Push to main    │ your-app.vercel.app │
│ Staging         │ clean-main     │ Push to clean-* │ *-staging.vercel.app │
│ Preview         │ feature/*      │ PR 建立/更新     │ *-git-*.vercel.app  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

## 🚀 初始設定

### 1. Vercel CLI 安裝與登入

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入 Vercel
vercel login

# 初始化專案（在專案根目錄執行）
vercel
```

### 2. 獲取專案識別碼

```bash
# 連結到 Vercel 專案
vercel link

# 查看專案資訊
vercel project ls
```

### 3. 設定 GitHub Secrets

在 GitHub 專案設定中添加以下 Secrets：

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

**獲取方法：**
- `VERCEL_TOKEN`: [Vercel Dashboard](https://vercel.com/account/tokens) → Settings → Tokens
- `VERCEL_ORG_ID` & `VERCEL_PROJECT_ID`: 執行 `vercel project ls` 查看

## 📱 環境變數配置

### Vercel Dashboard 設定

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案
3. 進入 Settings → Environment Variables

### 環境變數對應表

| 變數名稱 | Production | Staging | Preview | 說明 |
|---------|-----------|---------|---------|------|
| `NODE_ENV` | production | staging | development | 運行環境 |
| `VITE_ENV` | production | staging | preview | 前端環境標識 |
| `VITE_NOTION_API_KEY` | ✅ | ✅ | ✅ | Notion API 金鑰 |
| `VITE_ADMIN_PASSWORD` | ✅ (secure) | ✅ (test) | ✅ (test) | 管理員密碼 |
| `VITE_PEXELS_API_KEY` | ✅ | ✅ | ✅ | 圖片搜尋 API |
| `VITE_GEMINI_API_KEY` | ✅ | ✅ (optional) | ✅ (optional) | AI 服務 |

### 設定範例

```bash
# Production 環境
NODE_ENV=production
VITE_ENV=production
VITE_NOTION_API_KEY=secret_prod_xxx
VITE_ADMIN_PASSWORD=secure_prod_password

# Staging 環境  
NODE_ENV=staging
VITE_ENV=staging
VITE_NOTION_API_KEY=secret_staging_xxx
VITE_ADMIN_PASSWORD=staging_password
```

## 🔄 部署工作流程

### 手動部署

#### 部署到 Staging
```bash
# 切換到 clean-main 分支
git checkout clean-main

# 確保代碼最新
git pull origin clean-main

# 驗證環境變數
npm run env:verify:staging

# 部署到 staging
npm run deploy:staging
```

#### 部署到 Production
```bash
# 切換到 main 分支
git checkout main

# 合併 staging 分支（推薦）
git merge clean-main

# 驗證環境變數
npm run env:verify:production

# 部署到 production
npm run deploy:production
```

### 自動部署（推薦）

透過 GitHub Actions 自動觸發：

```bash
# 部署到 Staging
git checkout clean-main
git add .
git commit -m "feat: 新功能開發完成"
git push origin clean-main
# → 自動部署到 staging

# 部署到 Production
git checkout main
git merge clean-main
git push origin main
# → 自動部署到 production
```

## 🧪 本地開發與測試

### 本地環境設定

```bash
# 複製環境變數模板
cp .env.example .env

# 編輯環境變數
# 填入您的 API 金鑰和設定

# 驗證環境配置
npm run env:verify

# 啟動本地開發
npm run dev:vercel
```

### 測試不同環境

```bash
# 測試 staging 環境建置
npm run build:staging

# 測試 production 環境建置  
npm run build:production

# 預覽建置結果
npm run preview
```

## 🔧 進階配置

### 自訂域名設定

1. 在 Vercel Dashboard 中設定自訂域名
2. 更新 `vercel.json` 中的 alias 設定：

```json
{
  "alias": [
    "your-custom-domain.com",
    "staging.your-custom-domain.com"
  ]
}
```

### 分支保護規則

建議在 GitHub 設定以下保護規則：

```
main 分支：
- 需要 PR review
- 需要狀態檢查通過
- 需要分支為最新狀態

clean-main 分支：
- 允許直接推送（staging 環境）
- 可選的狀態檢查
```

### 環境特定的建置配置

建立不同環境的 Vercel 配置：

```bash
# 使用 staging 配置部署
vercel --local-config vercel.staging.json

# 使用預設配置部署到 production
vercel --prod
```

## 📊 監控與除錯

### 查看部署狀態

```bash
# 查看所有部署
vercel list

# 查看特定部署詳情
vercel inspect [deployment-url]

# 查看即時日誌
vercel logs [deployment-url]
```

### 除錯常見問題

1. **環境變數未設定**
   ```bash
   npm run env:verify:production
   ```

2. **建置失敗**
   ```bash
   # 本地測試建置
   npm run build:production
   
   # 檢查建置日誌
   vercel logs [deployment-url]
   ```

3. **API 端點問題**
   ```bash
   # 測試 API 端點
   curl https://your-app.vercel.app/api/notion-database-info
   ```

## 🔄 工作流程最佳實踐

### 開發流程

1. **功能開發** → `clean-main` 分支
2. **測試驗證** → Staging 環境自動部署
3. **功能確認** → 合併到 `main` 分支  
4. **正式發布** → Production 環境自動部署

### 緊急修復流程

```bash
# 建立緊急修復分支
git checkout -b hotfix/critical-bug main

# 修復並測試
git add .
git commit -m "fix: 修復關鍵問題"

# 部署到 staging 測試
git checkout clean-main
git merge hotfix/critical-bug
git push origin clean-main

# 確認修復後部署到 production
git checkout main  
git merge hotfix/critical-bug
git push origin main
```

### 回滾策略

```bash
# 查看部署歷史
vercel list

# 推廣特定版本到 production
vercel promote [deployment-url] --scope [team-name]

# 或使用 Git 回滾
git checkout main
git revert [commit-hash]
git push origin main
```

## 📱 使用指南

### 訪問不同環境

- **Production**: `https://your-app.vercel.app`
- **Staging**: `https://your-app-git-clean-main.vercel.app`  
- **Preview**: 在 PR 中會自動生成預覽連結

### 管理員功能

每個環境都有獨立的管理員密碼：
- Production: 使用安全的生產密碼
- Staging: 使用測試密碼
- Preview: 使用開發密碼

### API 端點測試

```bash
# 測試 production API
curl https://your-app.vercel.app/api/notion-database-info

# 測試 staging API  
curl https://your-app-git-clean-main.vercel.app/api/notion-database-info
```

---

## 💡 小貼士

1. **環境隔離**: 使用不同的 Notion 資料庫和 API 金鑰來隔離環境
2. **監控**: 設定 Vercel Analytics 監控應用效能
3. **安全**: 定期更換 API 金鑰，特別是 production 環境
4. **備份**: 定期備份 Notion 資料庫和環境配置
5. **文檔**: 保持部署文檔與實際配置同步

有任何問題請參考 [Vercel 官方文檔](https://vercel.com/docs) 或聯繫開發團隊。