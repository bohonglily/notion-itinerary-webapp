import React, { useState, useEffect } from 'react';
import { NotionItineraryItem } from '../types';
import { useItinerary } from '../hooks/useItinerary';
import { useUrlParams } from '../hooks/useUrlParams';

interface ItineraryFormFieldsProps {
  item: Partial<NotionItineraryItem>;
  handleFieldChange: <T extends keyof Partial<NotionItineraryItem>>(
    field: T,
    value: Partial<NotionItineraryItem>[T]
  ) => void;
}

const timePeriodOptions = ['摘要', '清晨', '早餐', '上午', '午餐', '下午', '傍晚', '晚餐', '晚上', '深夜', '夜泊'];

const ItineraryFormFields: React.FC<ItineraryFormFieldsProps> = ({ item, handleFieldChange }) => {
  const { databaseId, startDate, endDate } = useUrlParams();
  const { data: itineraryData } = useItinerary(databaseId || '', startDate, endDate);
  const [customCurrency, setCustomCurrency] = useState('');

  // 從所有項目中獲取現有的幣別選項
  const availableCurrencies = React.useMemo(() => {
    if (!itineraryData?.items) return [];
    const currencies = itineraryData.items
      .map(item => item.幣別)
      .filter(Boolean)
      .filter(currency => currency.trim() !== '');
    return [...new Set(currencies)];
  }, [itineraryData]);

  const handleCurrencySelect = (currency: string) => {
    handleFieldChange('幣別', currency);
    setCustomCurrency('');
  };

  const handleCustomCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCurrency(value);
    handleFieldChange('幣別', value);
  };

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

      {/* Price and Currency */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">人均價與幣別</label>
        
        {/* Currency Selection */}
        <div>
          <div className="mb-2">
            <span className="text-xs text-gray-500">選擇幣別：</span>
          </div>
          
          {/* Currency buttons */}
          {availableCurrencies.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {availableCurrencies.map((currency, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleCurrencySelect(currency)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    item.幣別 === currency
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          )}
          
          {/* Custom currency input */}
          <input
            type="text"
            value={item.幣別 && !availableCurrencies.includes(item.幣別) ? item.幣別 : customCurrency}
            onChange={handleCustomCurrencyChange}
            placeholder="或輸入新幣別 (如：USD, JPY, EUR)"
            className="block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Price input */}
        <div>
          <input
            type="number"
            value={item.人均價 || ''}
            onChange={(e) => handleFieldChange('人均價', e.target.value === '' ? null : Number(e.target.value))}
            className="block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>
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