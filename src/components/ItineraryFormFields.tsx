import React, { useState, useEffect, useRef } from 'react';
import { NotionItineraryItem } from '../types';
import { useItinerary } from '../hooks/useItinerary';
import { useUrlParams } from '../hooks/useUrlParams';
import { ChevronDown, X } from 'lucide-react';

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
  const [showOtherCurrency, setShowOtherCurrency] = useState(false);
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const timePeriodRef = useRef<HTMLDivElement>(null);

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
    if (currency === 'other') {
      const newCurrency = prompt('請輸入幣別（如：USD, EUR）：');
      if (newCurrency && newCurrency.trim()) {
        handleFieldChange('幣別', newCurrency.trim());
      }
    } else {
      handleFieldChange('幣別', currency);
    }
    setCustomCurrency('');
    setShowOtherCurrency(false);
  };

  const handleCustomCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCurrency(value);
    handleFieldChange('幣別', value);
  };

  // 自動調整textarea高度
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // 初始化時設定textarea高度
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      if (textarea.value) {
        adjustTextareaHeight(textarea as HTMLTextAreaElement);
      }
    });
  }, [item]);

  // 處理時段選擇
  const handleTimePeriodSelect = (period: string) => {
    const currentPeriods = item.時段 || [];
    if (!currentPeriods.includes(period)) {
      handleFieldChange('時段', [...currentPeriods, period]);
    }
    setShowTimePeriodDropdown(false);
  };

  // 移除時段
  const removeTimePeriod = (periodToRemove: string) => {
    const currentPeriods = item.時段 || [];
    handleFieldChange('時段', currentPeriods.filter(p => p !== periodToRemove));
  };

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePeriodRef.current && !timePeriodRef.current.contains(event.target as Node)) {
        setShowTimePeriodDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 取得可選的時段選項（排除已選的）
  const availableTimePeriods = timePeriodOptions.filter(
    period => !(item.時段 || []).includes(period)
  );

  return (
    <>
      {/* 1. Item Name */}
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

      {/* 2. Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700">日期</label>
        <input
          type="date"
          value={item.日期 || ''}
          onChange={(e) => handleFieldChange('日期', e.target.value)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 3. Time Period - Custom Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">時段</label>
        
        {/* Dropdown selector with selected tags inside */}
        <div className="relative" ref={timePeriodRef}>
          <div
            className="w-full min-h-[2.5rem] p-2 border rounded-md shadow-sm bg-white text-sm focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer"
            onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1 flex-1 min-h-[1.25rem]">
                {(item.時段 || []).length > 0 ? (
                  (item.時段 || []).map(period => (
                    <span
                      key={period}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full border"
                    >
                      {period}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTimePeriod(period);
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">選擇時段...</span>
                )}
              </div>
              <ChevronDown size={16} className="text-gray-400 ml-2 flex-shrink-0" />
            </div>
          </div>
          
          {/* Dropdown options */}
          {showTimePeriodDropdown && availableTimePeriods.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {availableTimePeriods.map(period => (
                <button
                  key={period}
                  type="button"
                  onClick={() => handleTimePeriodSelect(period)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Sort Order */}
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

      {/* 5. Transportation */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          前往方式
          <span className="ml-2 text-xs text-blue-500 font-normal">網址會自動顯示為 🔗 連結</span>
        </label>
        <textarea
          value={item.前往方式 || ''}
          onChange={(e) => {
            handleFieldChange('前往方式', e.target.value);
            adjustTextareaHeight(e.target);
          }}
          onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[2.5rem] resize-none overflow-hidden"
          placeholder="交通方式、路線說明..."
          style={{ height: 'auto' }}
        />
      </div>

      {/* 6. Google Maps */}
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

      {/* 7. Image URL */}
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

      {/* 8. Price with Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">人均價</label>
        
        {/* Currency buttons and price input in same row */}
        <div className="flex items-center gap-2">
          {/* Currency buttons */}
          <div className="flex gap-1">
            {availableCurrencies.map((currency, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleCurrencySelect(currency)}
                className={`px-2 py-2 text-xs rounded border transition-colors ${
                  item.幣別 === currency
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {currency}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleCurrencySelect('other')}
              className="px-2 py-2 text-xs rounded border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors"
            >
              其他
            </button>
          </div>
          
          {/* Price input */}
          <div className="flex-1">
            <input
              type="number"
              value={item.人均價 || ''}
              onChange={(e) => handleFieldChange('人均價', e.target.value === '' ? null : Number(e.target.value))}
              className="block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="人均價格"
            />
          </div>
        </div>
      </div>

      {/* 9. To-Do */}
      <div>
        <label className="block text-sm font-medium text-gray-700">待辦</label>
        <textarea
          value={item.待辦 || ''}
          onChange={(e) => {
            handleFieldChange('待辦', e.target.value);
            adjustTextareaHeight(e.target);
          }}
          onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[2.5rem] resize-none overflow-hidden"
          placeholder="待辦事項..."
          style={{ height: 'auto' }}
        />
      </div>

      {/* 10. Important Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          重要資訊
          <span className="ml-2 text-xs text-blue-500 font-normal">網址會自動顯示為 🔗 連結</span>
        </label>
        <textarea
          value={item.重要資訊 || ''}
          onChange={(e) => {
            handleFieldChange('重要資訊', e.target.value);
            adjustTextareaHeight(e.target);
          }}
          onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[2.5rem] resize-none overflow-hidden"
          placeholder="重要注意事項..."
          style={{ height: 'auto' }}
        />
      </div>

      {/* 11. Reference Materials */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          參考資料
          <span className="ml-2 text-xs text-blue-500 font-normal">網址會自動顯示為 🔗 連結</span>
        </label>
        <textarea
          value={item.參考資料 || ''}
          onChange={(e) => {
            handleFieldChange('參考資料', e.target.value);
            adjustTextareaHeight(e.target);
          }}
          onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[2.5rem] resize-none overflow-hidden"
          placeholder="參考資料和連結，直接貼上網址即可..."
          style={{ height: 'auto' }}
        />
      </div>

      {/* 12. Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">景點介紹</label>
        <textarea
          value={item.景點介紹 || ''}
          onChange={(e) => {
            handleFieldChange('景點介紹', e.target.value);
            adjustTextareaHeight(e.target);
          }}
          onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
          className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[4rem] resize-none overflow-hidden"
          placeholder="輸入景點介紹..."
          style={{ height: 'auto' }}
        />
      </div>
    </>
  );
};

export default ItineraryFormFields;