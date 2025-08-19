import React from 'react';

interface DayTabsProps {
  days: string[];
  selectedDay: string | null;
  setSelectedDay: (day: string) => void;
  isScrolled?: boolean; // 新增滾動狀態參數
}

const DayTabs: React.FC<DayTabsProps> = ({ days, selectedDay, setSelectedDay, isScrolled = false }) => {
    const formatDate = (dateString: string) => {
    if (dateString === '未指定日期') return { date: dateString, weekday: '' };
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    const weekdayPart = date.toLocaleDateString('zh-TW', { weekday: 'short' });
    return { date: datePart, weekday: weekdayPart };
  };

  return (
    <div className={`
      sticky top-0 z-50 py-2 bg-gradient-to-br from-secondary-50/90 via-white/90 to-primary-50/90 backdrop-blur-md border-b border-secondary-200
      transition-all duration-300 ease-out
      ${isScrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
    `}>
      <div className="flex justify-start sm:justify-center px-3">
        <div className="flex space-x-0.5 p-0.5 bg-secondary-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
          {days.map(day => {
            const { date, weekday } = formatDate(day);
            const isSelected = selectedDay === day;
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`
                  flex-shrink-0 min-w-[3.5rem] px-2 py-2 rounded-lg font-medium
                  transition-all duration-300 ease-out
                  ${isSelected
                    ? 'bg-primary-500 text-white shadow-md scale-105 transform'
                    : 'bg-white text-secondary-600 hover:bg-white hover:shadow-sm active:scale-95'
                  }
                `}
              >
                <div className="flex flex-col items-center space-y-0">
                  <span className={`text-xs ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                    {date}
                  </span>
                  {weekday && (
                    <span className={`text-[10px] ${isSelected ? 'text-primary-100' : 'text-secondary-500'}`}>
                      {weekday}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayTabs;
