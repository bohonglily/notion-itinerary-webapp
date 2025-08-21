import { createClient } from '@supabase/supabase-js';
import { UserProfile, HiddenRule } from '../types';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 資料庫操作介面
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      hidden_rules: {
        Row: {
          id: string;
          user_id: string;
          page_id: string;
          database_id: string;
          hidden_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          page_id: string;
          database_id: string;
          hidden_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          page_id?: string;
          database_id?: string;
          hidden_at?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Supabase 服務類別
export class SupabaseService {
  /**
   * 建立使用者檔案
   */
  async createUser(userProfile: UserProfile): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userProfile.user_id,
        display_name: userProfile.display_name
      });

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * 獲取使用者清單
   */
  async getUserList(databaseId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, created_at');

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data.map(user => ({
      user_id: user.user_id,
      display_name: user.display_name,
      created_at: user.created_at
    }));
  }

  /**
   * 獲取使用者的隱藏規則
   */
  async getHiddenRules(userId: string, databaseId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('hidden_rules')
      .select('page_id')
      .eq('user_id', userId)
      .eq('database_id', databaseId);

    if (error) {
      console.error('Error fetching hidden rules:', error);
      throw new Error(`Failed to fetch hidden rules: ${error.message}`);
    }

    return data.map(rule => rule.page_id);
  }

  /**
   * 切換項目隱藏狀態
   */
  async toggleItemVisibility(
    userId: string, 
    pageId: string, 
    databaseId: string, 
    isHidden: boolean
  ): Promise<void> {
    if (isHidden) {
      // 新增隱藏規則
      const { error } = await supabase
        .from('hidden_rules')
        .insert({
          user_id: userId,
          page_id: pageId,
          database_id: databaseId
        });

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error hiding item:', error);
        throw new Error(`Failed to hide item: ${error.message}`);
      }
    } else {
      // 移除隱藏規則
      const { error } = await supabase
        .from('hidden_rules')
        .delete()
        .eq('user_id', userId)
        .eq('page_id', pageId)
        .eq('database_id', databaseId);

      if (error) {
        console.error('Error showing item:', error);
        throw new Error(`Failed to show item: ${error.message}`);
      }
    }
  }

  /**
   * 清理無效的隱藏規則（根據有效的 page_ids）
   */
  async cleanupInvalidRules(validPageIds: string[], databaseId: string): Promise<number> {
    const { data, error } = await supabase
      .from('hidden_rules')
      .delete()
      .eq('database_id', databaseId)
      .not('page_id', 'in', `(${validPageIds.join(',')})`);

    if (error) {
      console.error('Error cleaning up invalid rules:', error);
      throw new Error(`Failed to cleanup invalid rules: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * 測試連接
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();