import React, { useState } from 'react';
import { Eye, EyeOff, X, RotateCcw } from 'lucide-react';
import { useVisibility } from '../contexts/VisibilityContext';

interface FieldVisibilityMenuProps {
  onClose?: () => void;
}

const FIELD_NAMES = {
  景點介紹: '景點介紹',
  待辦: '待辦事項',
  重要資訊: '重要資訊',
  人均價: '人均價格',
  參考資料: '參考資料',
  GoogleMaps: 'Google Maps',
  時段: '時段標籤',
  縮圖: '縮圖圖片',
} as const;

const FieldVisibilityMenu: React.FC<FieldVisibilityMenuProps> = ({ onClose }) => {
  const { fieldVisibility, toggleFieldVisibility, resetToDefaults } = useVisibility();

  return (
    <div className="w-72 bg-white rounded-lg shadow-xl py-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">欄位顯示設定</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        )}
      </div>
      
      <div className="px-2 py-2">
        {(Object.keys(FIELD_NAMES) as Array<keyof typeof FIELD_NAMES>).map((field) => (
          <button
            key={field}
            onClick={() => toggleFieldVisibility(field)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          >
            <span>{FIELD_NAMES[field]}</span>
            <div className="flex items-center gap-2">
              {fieldVisibility[field] ? (
                <Eye size={16} className="text-green-500" />
              ) : (
                <EyeOff size={16} className="text-gray-400" />
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="px-4 pt-3 border-t border-gray-200">
        <button
          onClick={resetToDefaults}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <RotateCcw size={16} />
          重設為預設值
        </button>
      </div>
    </div>
  );
};

export default FieldVisibilityMenu;