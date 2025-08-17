import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface FieldVisibilitySettings {
  景點介紹: boolean;
  待辦: boolean;
  人均價: boolean;
  參考資料: boolean;
  GoogleMaps: boolean;
  時段: boolean;
  縮圖: boolean;
}

interface VisibilityContextType {
  fieldVisibility: FieldVisibilitySettings;
  toggleFieldVisibility: (field: keyof FieldVisibilitySettings) => void;
  resetToDefaults: () => void;
  // 向後相容的方法
  isDescriptionVisible: boolean;
  toggleDescriptionVisibility: () => void;
}

const DEFAULT_VISIBILITY: FieldVisibilitySettings = {
  景點介紹: false,
  待辦: true,
  人均價: true,
  參考資料: true,
  GoogleMaps: true,
  時段: true,
  縮圖: true,
};

const STORAGE_KEY = 'itinerary_field_visibility';

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export const VisibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fieldVisibility, setFieldVisibility] = useState<FieldVisibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 確保所有欄位都有值，以防新增欄位
        return { ...DEFAULT_VISIBILITY, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load field visibility settings:', error);
    }
    return DEFAULT_VISIBILITY;
  });

  // 當設定改變時保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fieldVisibility));
    } catch (error) {
      console.warn('Failed to save field visibility settings:', error);
    }
  }, [fieldVisibility]);

  const toggleFieldVisibility = (field: keyof FieldVisibilitySettings) => {
    setFieldVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const resetToDefaults = () => {
    setFieldVisibility(DEFAULT_VISIBILITY);
  };

  // 向後相容的方法
  const toggleDescriptionVisibility = () => {
    toggleFieldVisibility('景點介紹');
  };

  return (
    <VisibilityContext.Provider value={{ 
      fieldVisibility,
      toggleFieldVisibility,
      resetToDefaults,
      isDescriptionVisible: fieldVisibility.景點介紹,
      toggleDescriptionVisibility
    }}>
      {children}
    </VisibilityContext.Provider>
  );
};

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (context === undefined) {
    throw new Error('useVisibility must be used within a VisibilityProvider');
  }
  return context;
};
