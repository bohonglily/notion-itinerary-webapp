import { useState, useEffect, useCallback } from 'react';
import { HistoryItem } from '../types';

const HISTORY_STORAGE_KEY = 'travel-history';

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
    }
  }, []);


  // Add or update a history item
  const addToHistory = useCallback((item: Omit<HistoryItem, 'lastVisited' | 'visitCount'>) => {
    setHistory(currentHistory => {
      const existingIndex = currentHistory.findIndex(h => h.databaseId === item.databaseId);
      const now = new Date().toISOString();

      let newHistory: HistoryItem[];

      if (existingIndex >= 0) {
        // Update existing item
        newHistory = [...currentHistory];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          ...item,
          lastVisited: now,
          visitCount: newHistory[existingIndex].visitCount + 1
        };
      } else {
        // Add new item
        const newItem: HistoryItem = {
          ...item,
          lastVisited: now,
          visitCount: 1
        };
        newHistory = [newItem, ...currentHistory];
      }

      // Sort by last visited (most recent first)
      newHistory.sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime());

      // Keep only the most recent 50 items
      newHistory = newHistory.slice(0, 50);

      // Save to localStorage
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save history to localStorage:', error);
      }

      return newHistory;
    });
  }, []);

  // Remove a history item
  const removeFromHistory = useCallback((databaseId: string) => {
    setHistory(currentHistory => {
      const newHistory = currentHistory.filter(item => item.databaseId !== databaseId);
      
      // Save to localStorage
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save history to localStorage:', error);
      }
      
      return newHistory;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
    }
  }, []);

  // Get formatted history with search functionality
  const getFilteredHistory = useCallback((searchTerm: string = '') => {
    if (!searchTerm) return history;
    
    const term = searchTerm.toLowerCase();
    return history.filter(item => 
      item.databaseName?.toLowerCase().includes(term) ||
      item.databaseId.toLowerCase().includes(term)
    );
  }, [history]);

  // Export history as JSON
  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [history]);

  // Import history from JSON file
  const importHistory = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedHistory = JSON.parse(content) as HistoryItem[];
          
          // Validate imported data
          if (!Array.isArray(importedHistory)) {
            throw new Error('Invalid history format');
          }

          setHistory(currentHistory => {
            // Merge with existing history (avoiding duplicates)
            const mergedHistory = [...importedHistory];
            currentHistory.forEach(existing => {
              if (!importedHistory.some(imported => imported.databaseId === existing.databaseId)) {
                mergedHistory.push(existing);
              }
            });

            // Sort and limit
            mergedHistory.sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime());
            const finalHistory = mergedHistory.slice(0, 50);

            // Save to localStorage
            try {
              localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(finalHistory));
            } catch (error) {
              console.error('Failed to save history to localStorage:', error);
            }

            return finalHistory;
          });
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getFilteredHistory,
    exportHistory,
    importHistory
  };
};