// Supabase 連接測試腳本
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase 連接測試');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '已設定' : '未設定');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 請在 .env.local 中設定 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('\n📡 測試基本連接...');
  
  try {
    // 測試連接
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ 連接失敗:', error.message);
      return false;
    }
    
    console.log('✅ Supabase 連接成功！');
    return true;
  } catch (err) {
    console.error('❌ 連接異常:', err.message);
    return false;
  }
}

async function testTables() {
  console.log('\n📊 檢查資料表...');
  
  try {
    // 檢查 user_profiles 表
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (userError) {
      console.error('❌ user_profiles 表不存在或無法訪問:', userError.message);
      return false;
    }
    
    console.log(`✅ user_profiles 表存在，有 ${users.length} 筆測試資料`);
    
    // 檢查 hidden_rules 表
    const { data: rules, error: ruleError } = await supabase
      .from('hidden_rules')
      .select('*')
      .limit(5);
    
    if (ruleError) {
      console.error('❌ hidden_rules 表不存在或無法訪問:', ruleError.message);
      return false;
    }
    
    console.log(`✅ hidden_rules 表存在，有 ${rules.length} 筆測試資料`);
    return true;
  } catch (err) {
    console.error('❌ 表檢查異常:', err.message);
    return false;
  }
}

async function testUserOperations() {
  console.log('\n👤 測試使用者操作...');
  
  try {
    // 建立測試使用者
    const testUser = {
      user_id: `test_${Date.now()}`,
      display_name: 'Test User'
    };
    
    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert(testUser)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ 建立使用者失敗:', createError.message);
      return false;
    }
    
    console.log('✅ 成功建立測試使用者:', newUser.display_name);
    
    // 建立測試隱藏規則
    const testRule = {
      user_id: testUser.user_id,
      page_id: 'test_page_123',
      database_id: 'test_db_456'
    };
    
    const { data: newRule, error: ruleError } = await supabase
      .from('hidden_rules')
      .insert(testRule)
      .select()
      .single();
    
    if (ruleError) {
      console.error('❌ 建立隱藏規則失敗:', ruleError.message);
      return false;
    }
    
    console.log('✅ 成功建立測試隱藏規則');
    
    // 清理測試資料
    await supabase
      .from('hidden_rules')
      .delete()
      .eq('user_id', testUser.user_id);
    
    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', testUser.user_id);
    
    console.log('✅ 測試資料已清理');
    return true;
  } catch (err) {
    console.error('❌ 使用者操作測試異常:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 開始 Supabase 全面測試...\n');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ 基本連接測試失敗，請檢查設定');
    process.exit(1);
  }
  
  const tablesOk = await testTables();
  if (!tablesOk) {
    console.log('\n❌ 資料表測試失敗，請執行 SQL 建立表格');
    process.exit(1);
  }
  
  const operationsOk = await testUserOperations();
  if (!operationsOk) {
    console.log('\n❌ 操作測試失敗，請檢查權限設定');
    process.exit(1);
  }
  
  console.log('\n🎉 所有測試通過！Supabase 設定完成');
  console.log('\n📝 接下來步驟：');
  console.log('1. 確認 .env.local 中的設定正確');
  console.log('2. 啟動開發伺服器: npm run dev');
  console.log('3. 測試個人化隱藏功能');
}

main().catch(console.error);