import { useState, useEffect, useCallback } from 'react';
import { UserSession, PersonalizationState, NotionItineraryItem } from '../types';
import { userService } from '../services/user-service-supabase';
import { useUrlParams } from './useUrlParams';
import { useMode } from './useMode';

export const usePersonalization = (databaseId: string | null) => {
  const { userId } = useUrlParams();
  const { mode } = useMode();
  const [state, setState] = useState<PersonalizationState>({
    currentUser: undefined,
    isEditMode: false,
    hiddenCount: 0
  });

  const [showUserPrompt, setShowUserPrompt] = useState(false);

  // 初始化使用者狀態
  useEffect(() => {
    const initializeUser = async () => {
      let currentUser: UserSession | null = null;

      console.log('Initializing user with:', { userId, databaseId });

      // 1. 檢查 URL 參數中的 userId
      if (userId) {
        console.log('Found userId in URL:', userId);
        // 從 localStorage 檢查是否有匹配的使用者
        const storedUser = userService.getCurrentUser();
        console.log('Stored user:', storedUser);
        if (storedUser && storedUser.user_id === userId) {
          currentUser = storedUser;
          console.log('Using stored user');
        } else {
          console.log('URL and stored user mismatch, trying to fetch user from database');
          // 嘗試從 Supabase 載入使用者資料
          try {
            // 建立一個簡單的使用者會話（因為我們只有 user_id）
            currentUser = {
              user_id: userId,
              display_name: userId, // 暫時使用 userId 作為顯示名稱
              hiddenItems: []
            };
            // 直接保存完整的 user 到 localStorage
            localStorage.setItem('user_session', JSON.stringify(currentUser));
            console.log('Created temporary user session:', currentUser);
          } catch (error) {
            console.error('Failed to create user session:', error);
            userService.clearUser();
          }
        }
      } else {
        console.log('No userId in URL, checking localStorage');
        // 2. 沒有 URL 參數，檢查 localStorage
        currentUser = userService.getCurrentUser();
        console.log('Got user from localStorage:', currentUser);
      }

      // 3. 如果有使用者，載入其隱藏規則
      if (currentUser && databaseId) {
        try {
          const hiddenItems = await userService.loadUserHiddenRules(currentUser.user_id, databaseId);
          currentUser.hiddenItems = hiddenItems;
          userService.updateUserSession(hiddenItems);
        } catch (error) {
          console.error('Failed to load hidden rules:', error);
        }
      }

      console.log('Final currentUser before setState:', currentUser);
      setState(prev => ({
        ...prev,
        currentUser: currentUser || undefined,
        isEditMode: mode === 'edit',
        hiddenCount: currentUser ? currentUser.hiddenItems.length : 0
      }));
    };

    initializeUser();
  }, [userId, databaseId, mode]);

  // 同步編輯模式狀態
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isEditMode: mode === 'edit'
    }));
  }, [mode]);

  /**
   * 建立新使用者
   */
  const createUser = useCallback(async (displayName: string): Promise<void> => {
    try {
      const newUser = await userService.createUser(displayName);
      setState(prev => ({
        ...prev,
        currentUser: newUser,
        hiddenCount: 0
      }));
      setShowUserPrompt(false);

      // 更新 URL 參數，加入 user 參數
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('user', newUser.user_id);
      
      // 使用 pushState 更新 URL 但不重新載入頁面
      window.history.pushState({}, '', currentUrl.toString());
      
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }, []);

  /**
   * 切換項目的隱藏狀態
   */
  const toggleItemVisibility = useCallback(async (pageId: string): Promise<void> => {
    console.log('toggleItemVisibility called with:', { 
      pageId, 
      currentUser: state.currentUser, 
      databaseId,
      hasCurrentUser: !!state.currentUser,
      hasDatabaseId: !!databaseId 
    });
    
    if (!state.currentUser || !databaseId) {
      console.log('toggleItemVisibility: Missing currentUser or databaseId, showing user prompt');
      // 如果沒有使用者，顯示建立使用者提示
      setShowUserPrompt(true);
      return;
    }

    const isCurrentlyHidden = state.currentUser.hiddenItems.includes(pageId);
    const newHiddenState = !isCurrentlyHidden;

    try {
      await userService.toggleItemVisibility(
        state.currentUser.user_id,
        pageId,
        databaseId,
        newHiddenState
      );

      // 更新本地狀態
      setState(prev => {
        if (!prev.currentUser) return prev;

        const updatedHiddenItems = newHiddenState
          ? [...prev.currentUser.hiddenItems, pageId]
          : prev.currentUser.hiddenItems.filter(id => id !== pageId);

        return {
          ...prev,
          currentUser: {
            ...prev.currentUser,
            hiddenItems: updatedHiddenItems
          },
          hiddenCount: updatedHiddenItems.length
        };
      });
    } catch (error) {
      console.error('Failed to toggle item visibility:', error);
      throw error;
    }
  }, [state.currentUser, databaseId]);

  /**
   * 檢查項目是否隱藏
   */
  const isItemHidden = useCallback((pageId: string): boolean => {
    return state.currentUser?.hiddenItems.includes(pageId) || false;
  }, [state.currentUser]);

  /**
   * 過濾項目列表（一般模式下移除隱藏項目）
   */
  const filterItems = useCallback((items: NotionItineraryItem[]): NotionItineraryItem[] => {
    // 編輯模式下顯示所有項目
    if (state.isEditMode) {
      return items;
    }

    // 一般模式下過濾隱藏項目
    if (!state.currentUser) {
      return items;
    }

    return items.filter(item => !state.currentUser!.hiddenItems.includes(item.id));
  }, [state.currentUser, state.isEditMode]);

  /**
   * 清除使用者會話
   */
  const clearUser = useCallback(() => {
    userService.clearUser();
    setState({
      currentUser: undefined,
      isEditMode: mode === 'edit',
      hiddenCount: 0
    });
  }, [mode]);

  return {
    // 狀態
    currentUser: state.currentUser,
    isEditMode: state.isEditMode,
    hiddenCount: state.hiddenCount,
    showUserPrompt,
    
    // 方法
    createUser,
    toggleItemVisibility,
    isItemHidden,
    filterItems,
    clearUser,
    setShowUserPrompt
  };
};