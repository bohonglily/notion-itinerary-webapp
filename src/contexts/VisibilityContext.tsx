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

export type ViewPreset = 'minimal' | 'travel' | 'complete' | 'custom';

interface VisibilityContextType {
  fieldVisibility: FieldVisibilitySettings;
  toggleFieldVisibility: (field: keyof FieldVisibilitySettings) => void;
  resetToDefaults: () => void;
  // 快速切換預設模式
  applyPreset: (preset: ViewPreset) => void;
  getCurrentPreset: () => ViewPreset;
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

// 預設模式配置
const PRESET_CONFIGS: Record<ViewPreset, FieldVisibilitySettings | null> = {
  minimal: {
    景點介紹: false,
    待辦: false,
    人均價: false,
    參考資料: false,
    GoogleMaps: true,
    時段: true,
    縮圖: false,
  },
  travel: {
    景點介紹: false,
    待辦: false,
    人均價: false,
    參考資料: false,
    GoogleMaps: true,
    時段: true,
    縮圖: true,
  },
  complete: {
    景點介紹: true,
    待辦: true,
    人均價: true,
    參考資料: true,
    GoogleMaps: true,
    時段: true,
    縮圖: true,
  },
  custom: null, // 自定義模式，無固定配置
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

  // 快速切換預設模式
  const applyPreset = (preset: ViewPreset) => {
    const config = PRESET_CONFIGS[preset];
    if (config) {
      setFieldVisibility(config);
    }
  };

  // 檢測當前是哪種預設模式
  const getCurrentPreset = (): ViewPreset => {
    // 檢查是否匹配預設模式
    for (const [presetName, config] of Object.entries(PRESET_CONFIGS)) {
      if (config && presetName !== 'custom') {
        const isMatch = Object.entries(config).every(
          ([field, value]) => fieldVisibility[field as keyof FieldVisibilitySettings] === value
        );
        if (isMatch) {
          return presetName as ViewPreset;
        }
      }
    }
    return 'custom'; // 如果不匹配任何預設模式，則為自定義
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
      applyPreset,
      getCurrentPreset,
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
