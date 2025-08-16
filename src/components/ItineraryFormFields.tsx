import React from 'react';
import { NotionItineraryItem } from '../types';

interface ItineraryFormFieldsProps {
  item: Partial<NotionItineraryItem>;
  handleFieldChange: <T extends keyof Partial<NotionItineraryItem>>(
    field: T,
    value: Partial<NotionItineraryItem>[T]
  ) => void;
}

const timePeriodOptions = ['摘要', '清晨', '早餐', '上午', '午餐', '下午', '傍晚', '晚餐', '晚上', '深夜', '夜泊'];

const ItineraryFormFields: React.FC<ItineraryFormFieldsProps> = ({ item, handleFieldChange }) => {
  return (
    <>
      {/* Item Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">項目名稱</label>
        <input
          type="text"
          value={item.項目 || ''}
          onChange={(e) => handleFieldChange('項目', e.target.value)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xl font-bold"
          placeholder="必填"
        />
      </div>

      {/* Time Period */}
      <div>
        <label className="block text-sm font-medium text-gray-700">時段</label>
        <select
          multiple
          value={item.時段 || []}
          onChange={(e) => handleFieldChange('時段', Array.from(e.target.selectedOptions, option => option.value))}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-24"
        >
          {timePeriodOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">景點介紹</label>
        <textarea
          value={item.景點介紹 || ''}
          onChange={(e) => handleFieldChange('景點介紹', e.target.value)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="輸入景點介紹..."
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700">縮圖網址</label>
        <input
          type="url"
          value={item.縮圖網址 || ''}
          onChange={(e) => handleFieldChange('縮圖網址', e.target.value)}
          placeholder="縮圖網址"
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700">人均價</label>
        <input
          type="number"
          value={item.人均價 || ''}
          onChange={(e) => handleFieldChange('人均價', e.target.value === '' ? null : Number(e.target.value))}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="0"
        />
      </div>

      {/* Google Maps */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Google Maps</label>
        <input
          type="url"
          value={item.GoogleMaps || ''}
          onChange={(e) => handleFieldChange('GoogleMaps', e.target.value)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Google Maps URL"
        />
      </div>

      {/* Transportation */}
      <div>
        <label className="block text-sm font-medium text-gray-700">前往方式</label>
        <textarea
          value={item.前往方式 || ''}
          onChange={(e) => handleFieldChange('前往方式', e.target.value)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="如何前往..."
        />
      </div>

      {/* Important Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700">重要資訊</label>
        <textarea
          value={item.重要資訊 || ''}
          onChange={(e) => handleFieldChange('重要資訊', e.target.value)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="重要注意事項..."
        />
      </div>

      {/* Reference Materials */}
      <div>
        <label className="block text-sm font-medium text-gray-700">參考資料</label>
        <textarea
          value={item.參考資料 || ''}
          onChange={(e) => handleFieldChange('參考資料', e.target.value)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="參考資料和連結，格式：(https://example.com)..."
        />
        <p className="mt-1 text-xs text-gray-500">
          提示：使用 (https://網址) 格式會自動顯示為 🔗 連結
        </p>
      </div>

      {/* To-Do */}
      <div>
        <label className="block text-sm font-medium text-gray-700">待辦</label>
        <textarea
          value={item.待辦 || ''}
          onChange={(e) => handleFieldChange('待辦', e.target.value)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="待辦事項..."
        />
      </div>

      {/* Sort Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700">排序</label>
        <input
          type="number"
          value={item.排序 || ''}
          onChange={(e) => handleFieldChange('排序', e.target.value === '' ? null : Number(e.target.value))}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="0"
        />
      </div>
    </>
  );
};

export default ItineraryFormFields;