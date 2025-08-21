import { UserProfile, UserSession, HiddenRule } from '../types';
import { apiServiceFactory } from './api-service-factory';

class UserService {
  private readonly USER_STORAGE_KEY = 'itinerary-user';
  
  /**
   * 生成唯一的使用者 ID
   */
  private generateUserId(displayName: string): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    const cleanName = displayName.toLowerCase().replace(/\s+/g, '');
    return `${cleanName}_${timestamp}_${randomStr}`;
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
    const userId = this.generateUserId(displayName);
    const now = new Date().toISOString();
    
    const userProfile: UserProfile = {
      user_id: userId,
      display_name: displayName,
      created_at: now
    };

    // 儲存到資料庫
    await this.saveUserToDatabase(userProfile);
    
    // 建立使用者會話
    const userSession: UserSession = {
      user_id: userId,
      display_name: displayName,
      hiddenItems: []
    };
    
    // 保存到 localStorage
    this.saveUserToStorage(userSession);
    
    return userSession;
  }

  /**
   * 從資料庫載入使用者的隱藏規則
   */
  async loadUserHiddenRules(userId: string, databaseId: string): Promise<string[]> {
    try {
      const endpoint = apiServiceFactory.getEndpoint('hidden-rules-get');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          database_id: databaseId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.hiddenPageIds || [];
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
      const endpoint = apiServiceFactory.getEndpoint('hidden-rules-toggle');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          page_id: pageId,
          database_id: databaseId,
          action: isHidden ? 'hide' : 'show'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
   * 儲存使用者檔案到資料庫
   */
  private async saveUserToDatabase(userProfile: UserProfile): Promise<void> {
    try {
      const endpoint = apiServiceFactory.getEndpoint('user-create');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving user to database:', error);
      throw error;
    }
  }

  /**
   * 獲取所有使用者清單（用於選擇器）
   */
  async getUserList(databaseId: string): Promise<UserProfile[]> {
    try {
      const endpoint = apiServiceFactory.getEndpoint('user-list');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ database_id: databaseId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error loading user list:', error);
      return [];
    }
  }
}

export const userService = new UserService();