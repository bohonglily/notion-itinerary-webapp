import React, { useState } from 'react';
import { ChevronDown, Edit, Settings, X, Sliders, User } from 'lucide-react';
import { useMode } from '../hooks/useMode';
import FieldVisibilityMenu from './FieldVisibilityMenu';
import { ItineraryData, UserSession } from '../types';

interface MiniBottomBarProps {
  days: string[];
  selectedDay: string | null;
  setSelectedDay: (day: string) => void;
  itineraryData: ItineraryData | null;
  onToggleAdminPanel: () => void;
  isScrolled: boolean; // 改為 isScrolled，表示是否滾動狀態
  currentUser?: UserSession | null; // 當前使用者
  onShowUserSelector?: () => void; // 顯示使用者選擇器
}

const MiniBottomBar: React.FC<MiniBottomBarProps> = ({
  days,
  selectedDay,
  setSelectedDay,
  itineraryData,
  onToggleAdminPanel,
  isScrolled,
  currentUser,
  onShowUserSelector
}) => {
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [showFieldVisibilityMenu, setShowFieldVisibilityMenu] = useState(false);
  const { mode, toggleMode } = useMode();

  const formatDate = (dateString: string) => {
    if (dateString === '未指定日期') return { date: dateString, weekday: '' };
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    const weekdayPart = date.toLocaleDateString('zh-TW', { weekday: 'short' });
    return { date: datePart, weekday: weekdayPart };
  };

  const currentDate = selectedDay ? formatDate(selectedDay) : { date: '選擇日期', weekday: '' };

  // 處理日期切換
  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    setShowDaySelector(false);
    // 滾動到頂部
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  return (
    <>
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-40 bg-transparent
          transition-transform duration-300 ease-out
          translate-y-0
        `}
      >
        <div className="max-w-5xl mx-auto px-4 py-1.5">
          <div className="grid grid-cols-3 items-center">
            {/* 左側：滾動時才顯示日期選擇器，為 iPhone 圓角留出空間 */}
            <div className="flex items-center justify-start ml-2">
              {isScrolled && (
                <button
                  onClick={() => setShowDaySelector(!showDaySelector)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors"
                >
                  <span className="font-medium text-sm">
                    {currentDate.date}{currentDate.weekday && ` ${currentDate.weekday}`}
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${showDaySelector ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* 中間：使用者名稱或提示 - 固定在正中間 */}
            <button
              onClick={onShowUserSelector}
              className="flex items-center justify-center gap-1.5 px-2 py-1 text-gray-600 hover:bg-gray-100/80 rounded-md transition-colors"
              aria-label="切換使用者"
            >
              {currentUser ? (
                <span className="text-sm font-medium">
                  {currentUser.display_name}
                </span>
              ) : (
                <User size={14} />
              )}
            </button>

            {/* 右側：功能按鈕群組 - 總是靠右顯示，為 iPhone 圓角留出空間 */}
            <div className="flex items-center justify-end gap-1 mr-2">
              <button
                onClick={toggleMode}
                className="p-2 bg-gray-100/80 rounded-md hover:bg-gray-200/80 transition-colors"
                aria-label={mode === 'browse' ? '進入編輯模式' : '退出編輯模式'}
              >
                {mode === 'browse' ? <Edit size={17} /> : <X size={17} />}
              </button>
              
              <button
                onClick={() => setShowFieldVisibilityMenu(!showFieldVisibilityMenu)}
                className="p-2 bg-gray-100/80 rounded-md hover:bg-gray-200/80 transition-colors"
                aria-label="欄位顯示設定"
              >
                <Sliders size={17} />
              </button>
              
              <button
                onClick={onToggleAdminPanel}
                className="p-2 bg-gray-100/80 rounded-md hover:bg-gray-200/80 transition-colors"
                aria-label="管理面板"
              >
                <Settings size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 日期選擇器下拉選單 - 只在滾動時顯示 */}
      {showDaySelector && isScrolled && (
        <div className="fixed bottom-16 left-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
          <div className="p-2">
            {days.map(day => {
              const { date, weekday } = formatDate(day);
              const isSelected = selectedDay === day;
              
              return (
                <button
                  key={day}
                  onClick={() => handleDayChange(day)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg transition-colors
                    ${isSelected
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                    }
                  `}
                >
                  {date}{weekday && ` ${weekday}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 欄位顯示設定選單 */}
      {showFieldVisibilityMenu && (
        <div className="fixed bottom-16 right-4 z-50">
          <FieldVisibilityMenu onClose={() => setShowFieldVisibilityMenu(false)} />
        </div>
      )}

      {/* 點擊外部關閉選單 */}
      {(showDaySelector || showFieldVisibilityMenu) && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowDaySelector(false);
            setShowFieldVisibilityMenu(false);
          }}
        />
      )}
    </>
  );
};

export default MiniBottomBar;