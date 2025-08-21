# 🚀 Supabase 本機測試設定指南

## 📋 快速步驟

### 1. 設定 Supabase 專案
1. 進入 [Supabase 控制台](https://app.supabase.com)
2. 建立新專案或選擇現有專案
3. 在 **SQL Editor** 中執行 `sql/create_personalization_tables.sql`

### 2. 取得連接資訊
1. 在 Supabase 專案中進入 **Settings → API**
2. 複製以下資訊：
   - `Project URL`
   - `anon/public` API key

### 3. 設定本機環境變數
編輯 `.env.local` 檔案：

```env
# Supabase 設定
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 其他現有設定
VITE_NOTION_API_KEY=your_notion_api_key
VITE_PEXELS_API_KEY=your_pexels_api_key
VITE_ADMIN_PASSWORD=your_admin_password
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. 執行連接測試

```bash
# 測試 Supabase 連接
npm run test:supabase
```

### 5. 啟動開發伺服器

```bash
# 啟動本機開發環境
npm run dev
```

## 🧪 測試功能

測試腳本會檢查：
- ✅ Supabase 基本連接
- ✅ 資料表存在性
- ✅ 使用者建立功能
- ✅ 隱藏規則操作
- ✅ 資料清理功能

## ⚡ 常見問題

### 問題：連接失敗
```
❌ 連接失敗: relation "user_profiles" does not exist
```

**解決方法：** 
1. 確認已在 Supabase SQL Editor 中執行建表 SQL
2. 檢查 RLS 政策是否正確設定

### 問題：權限不足
```
❌ permission denied for table user_profiles
```

**解決方法：**
1. 確認使用 `anon` key 而非 `service_role` key
2. 檢查 RLS 政策設定

### 問題：環境變數未設定
```
❌ 請在 .env.local 中設定 SUPABASE_URL 和 SUPABASE_ANON_KEY
```

**解決方法：**
1. 確認 `.env.local` 檔案存在
2. 確認變數名稱正確（需要 `VITE_` 前綴）

## 🎯 接下來步驟

測試通過後：
1. 修改 `usePersonalization.ts` 導入改為 Supabase 版本
2. 重新啟動開發伺服器
3. 測試個人化隱藏功能

## 📝 Supabase CLI 指令（可選）

如果想要更進階的本機開發：

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入 Supabase
supabase login

# 初始化本機專案
supabase init

# 啟動本機 Supabase
supabase start

# 重設本機資料庫
supabase db reset
```