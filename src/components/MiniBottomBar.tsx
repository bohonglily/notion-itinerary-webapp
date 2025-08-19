import React, { useState } from 'react';
import { ChevronDown, Edit, Settings, X, Sliders } from 'lucide-react';
import { useMode } from '../hooks/useMode';
import FieldVisibilityMenu from './FieldVisibilityMenu';
import { ItineraryData } from '../types';

interface MiniBottomBarProps {
  days: string[];
  selectedDay: string | null;
  setSelectedDay: (day: string) => void;
  itineraryData: ItineraryData | null;
  onToggleAdminPanel: () => void;
  isScrolled: boolean; // 改為 isScrolled，表示是否滾動狀態
}

const MiniBottomBar: React.FC<MiniBottomBarProps> = ({
  days,
  selectedDay,
  setSelectedDay,
  itineraryData,
  onToggleAdminPanel,
  isScrolled
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
          fixed bottom-0 left-0 right-0 z-40 bg-white/50 backdrop-blur-md border-t border-gray-200/50 shadow-lg
          transition-transform duration-300 ease-out
          translate-y-0
        `}
      >
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 左側：滾動時才顯示日期選擇器，未滾動時留空 */}
            <div className="flex items-center">
              {isScrolled && (
                <button
                  onClick={() => setShowDaySelector(!showDaySelector)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm leading-none">{currentDate.date}</span>
                    {currentDate.weekday && (
                      <span className="text-xs text-primary-600 leading-none mt-0.5">{currentDate.weekday}</span>
                    )}
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showDaySelector ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* 右側：功能按鈕群組 - 總是靠右顯示 */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMode}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label={mode === 'browse' ? '進入編輯模式' : '退出編輯模式'}
              >
                {mode === 'browse' ? <Edit size={18} /> : <X size={18} />}
              </button>
              
              <button
                onClick={() => setShowFieldVisibilityMenu(!showFieldVisibilityMenu)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="欄位顯示設定"
              >
                <Sliders size={18} />
              </button>
              
              <button
                onClick={onToggleAdminPanel}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="管理面板"
              >
                <Settings size={18} />
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
              const { date } = formatDate(day);
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
                  {date}
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