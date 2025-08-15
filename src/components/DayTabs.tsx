import React from 'react';

interface DayTabsProps {
  days: string[];
  selectedDay: string | null;
  setSelectedDay: (day: string) => void;
}

const DayTabs: React.FC<DayTabsProps> = ({ days, selectedDay, setSelectedDay }) => {
    const formatDate = (dateString: string) => {
    if (dateString === '未指定日期') return dateString;
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    const weekdayPart = date.toLocaleDateString('zh-TW', { weekday: 'short' });
    return (
      <React.Fragment>
        {datePart}
        <br />
        {weekdayPart}
      </React.Fragment>
    );
  };

  return (
    <div className="sticky top-0 z-50 py-2">
      <div className="flex justify-start sm:justify-center space-x-2 p-1 bg-gray-100 rounded-full overflow-x-auto no-scrollbar">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-full transition-colors duration-200 ${
              selectedDay === day
                ? 'bg-blue-500 text-white shadow'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {formatDate(day)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DayTabs;
