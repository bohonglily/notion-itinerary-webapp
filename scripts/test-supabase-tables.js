// 測試所有 Supabase 表格的存取權限
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase 表格權限測試');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 請在 .env.local 中設定 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableAccess(tableName) {
  console.log(`\n📊 測試表格: ${tableName}`);
  
  try {
    // 測試基本查詢
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ ${tableName} 查詢失敗:`, error.message);
      console.error(`   錯誤代碼: ${error.code}`);
      console.error(`   錯誤詳情: ${error.details}`);
      return false;
    }
    
    console.log(`✅ ${tableName} 查詢成功，共 ${data?.length || 0} 筆資料`);
    return true;
  } catch (err) {
    console.error(`❌ ${tableName} 查詢異常:`, err.message);
    return false;
  }
}

async function testRLSStatus() {
  console.log(`\n🔐 檢查 RLS 政策狀態`);
  
  try {
    // 查詢 RLS 狀態（需要使用 service_role key 或在 SQL 中檢查）
    const { data, error } = await supabase.rpc('check_rls_status');
    
    if (error && !error.message.includes('function')) {
      console.error('RLS 狀態檢查失敗:', error.message);
    } else {
      console.log('ℹ️  無法直接檢查 RLS 狀態（需要 service_role 權限）');
    }
  } catch (err) {
    console.log('ℹ️  RLS 狀態檢查跳過');
  }
}

async function suggestFixes() {
  console.log(`\n🛠️  建議解決方案:`);
  console.log('1. 檢查 Supabase RLS 政策設定');
  console.log('2. 確認 API Key 是正確的 anon key');
  console.log('3. 在 Supabase SQL Editor 執行以下 SQL:');
  console.log('');
  console.log('-- 檢查表格是否存在');
  console.log("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
  console.log('');
  console.log('-- 檢查 RLS 狀態');
  console.log("SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';");
  console.log('');
  console.log('-- 重設 RLS 政策（如果需要）');
  console.log('ALTER TABLE saved_databases ENABLE ROW LEVEL SECURITY;');
  console.log('DROP POLICY IF EXISTS "Allow all operations on saved_databases" ON saved_databases;');
  console.log('CREATE POLICY "Allow all operations on saved_databases" ON saved_databases FOR ALL USING (true) WITH CHECK (true);');
}

async function main() {
  console.log('🚀 開始 Supabase 表格權限測試...\n');
  
  const tables = [
    'user_profiles',
    'hidden_rules', 
    'saved_databases'
  ];
  
  let allPassed = true;
  
  for (const table of tables) {
    const passed = await testTableAccess(table);
    if (!passed) {
      allPassed = false;
    }
  }
  
  await testRLSStatus();
  
  if (!allPassed) {
    console.log('\n❌ 部分表格存取失敗');
    await suggestFixes();
    process.exit(1);
  }
  
  console.log('\n🎉 所有表格權限測試通過！');
  console.log('\n✅ 可以正常啟動開發伺服器了');
}

main().catch(console.error);