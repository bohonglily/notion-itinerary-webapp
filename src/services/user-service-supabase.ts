import { UserProfile, UserSession } from '../types';
import { supabaseService } from './supabase';

class UserServiceSupabase {
  private readonly USER_STORAGE_KEY = 'itinerary-user';
  
  /**
   * 生成使用者 ID（使用使用者名稱）
   */
  private generateUserId(displayName: string): string {
    // 清理名稱：轉小寫、移除空格和特殊字符、限制長度
    return displayName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\w\u4e00-\u9fff]/g, '') // 只保留字母、數字、中文
      .substring(0, 20); // 限制最大長度
  }

  /**
   * 從 localStorage 獲取當前使用者
   */
  getCurrentUser(): UserSession | null {
    try {
      const stored = localStorage.getItem(this.USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      return null;
    }
  }

  /**
   * 保存使用者到 localStorage
   */
  private saveUserToStorage(user: UserSession): void {
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  }

  /**
   * 建立新使用者
   */
  async createUser(displayName: string): Promise<UserSession> {
    let userId = this.generateUserId(displayName);
    let attempts = 0;
    const maxAttempts = 10;
    const now = new Date().toISOString();
    
    // 處理重複名稱：如果名稱已存在，加上數字後綴
    while (attempts < maxAttempts) {
      try {
        const userProfile: UserProfile = {
          user_id: userId,
          display_name: displayName,
          created_at: now
        };

        // 嘗試儲存到 Supabase
        await supabaseService.createUser(userProfile);
        
        // 建立使用者會話
        const userSession: UserSession = {
          user_id: userId,
          display_name: displayName,
          hiddenItems: []
        };
        
        // 保存到 localStorage
        this.saveUserToStorage(userSession);
        
        return userSession;
      } catch (error: any) {
        // 如果是唯一性約束錯誤，嘗試新的 ID
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          attempts++;
          const baseUserId = this.generateUserId(displayName);
          userId = `${baseUserId}${attempts}`;
        } else {
          throw error;
        }
      }
    }
    
    throw new Error(`無法建立使用者，名稱 "${displayName}" 過於熱門，請嘗試其他名稱`);
  }

  /**
   * 從 Supabase 載入使用者的隱藏規則
   */
  async loadUserHiddenRules(userId: string, databaseId: string): Promise<string[]> {
    try {
      return await supabaseService.getHiddenRules(userId, databaseId);
    } catch (error) {
      console.error('Error loading hidden rules:', error);
      return [];
    }
  }

  /**
   * 切換項目的隱藏狀態
   */
  async toggleItemVisibility(userId: string, pageId: string, databaseId: string, isHidden: boolean): Promise<void> {
    try {
      await supabaseService.toggleItemVisibility(userId, pageId, databaseId, isHidden);

      // 更新本地快取
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        if (isHidden) {
          if (!currentUser.hiddenItems.includes(pageId)) {
            currentUser.hiddenItems.push(pageId);
          }
        } else {
          currentUser.hiddenItems = currentUser.hiddenItems.filter(id => id !== pageId);
        }
        this.saveUserToStorage(currentUser);
      }
    } catch (error) {
      console.error('Error toggling item visibility:', error);
      throw error;
    }
  }

  /**
   * 更新使用者會話的隱藏項目清單
   */
  updateUserSession(hiddenItems: string[]): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.hiddenItems = hiddenItems;
      this.saveUserToStorage(currentUser);
    }
  }

  /**
   * 清除使用者會話
   */
  clearUser(): void {
    localStorage.removeItem(this.USER_STORAGE_KEY);
  }

  /**
   * 獲取所有使用者清單（用於選擇器）
   */
  async getUserList(databaseId: string): Promise<UserProfile[]> {
    try {
      return await supabaseService.getUserList(databaseId);
    } catch (error) {
      console.error('Error loading user list:', error);
      return [];
    }
  }

  /**
   * 清理無效的隱藏規則
   */
  async cleanupInvalidRules(validPageIds: string[], databaseId: string): Promise<number> {
    try {
      return await supabaseService.cleanupInvalidRules(validPageIds, databaseId);
    } catch (error) {
      console.error('Error cleaning up invalid rules:', error);
      return 0;
    }
  }

  /**
   * 測試 Supabase 連接
   */
  async testConnection(): Promise<boolean> {
    return await supabaseService.testConnection();
  }
}

export const userService = new UserServiceSupabase();