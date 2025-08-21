import { useState, useEffect, useCallback } from 'react';
import { UserSession, PersonalizationState, NotionItineraryItem } from '../types';
import { userService } from '../services/user-service';
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

      // 1. 檢查 URL 參數中的 userId
      if (userId) {
        // 從 localStorage 檢查是否有匹配的使用者
        const storedUser = userService.getCurrentUser();
        if (storedUser && storedUser.user_id === userId) {
          currentUser = storedUser;
        } else {
          // URL 中的 userId 和 localStorage 不匹配，清除本地資料
          userService.clearUser();
        }
      } else {
        // 2. 沒有 URL 參數，檢查 localStorage
        currentUser = userService.getCurrentUser();
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
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }, []);

  /**
   * 切換項目的隱藏狀態
   */
  const toggleItemVisibility = useCallback(async (pageId: string): Promise<void> => {
    if (!state.currentUser || !databaseId) {
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