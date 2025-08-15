import React, { createContext, useState, useContext, ReactNode } from 'react';

interface VisibilityContextType {
  isDescriptionVisible: boolean;
  toggleDescriptionVisibility: () => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export const VisibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);

  const toggleDescriptionVisibility = () => {
    setIsDescriptionVisible(prev => !prev);
  };

  return (
    <VisibilityContext.Provider value={{ isDescriptionVisible, toggleDescriptionVisibility }}>
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
