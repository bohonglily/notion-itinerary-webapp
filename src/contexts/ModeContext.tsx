import React, { createContext, useState, ReactNode } from 'react';

// 定義模式的類型
type Mode = 'browse' | 'edit';

// 定義 Context 的形狀
export interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

// 建立 Context
export const ModeContext = createContext<ModeContextType | undefined>(undefined);

// 建立 Provider 元件
export const ModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>('browse');

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'browse' ? 'edit' : 'browse'));
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
};
