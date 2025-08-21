import React, { useState, useEffect, useRef } from 'react';
import { NotionItineraryItem, UserSession } from '../types';
import TravelCard from './TravelCard';
import DayTabs from './DayTabs';
import { useMode } from '../hooks/useMode';
import { PlusCircle, ArrowDown } from 'lucide-react';
import AddItineraryModal from './AddItineraryModal';
import { notionService } from '../services/notion-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUrlParams } from '../hooks/useUrlParams';
import { useItinerary } from '../hooks/useItinerary';

interface TravelTimelineProps {
  groupedItems: Map<string, NotionItineraryItem[]>;
  selectedDay?: string | null; // 從 App 傳入的選中日期
  setSelectedDay?: (day: string) => void; // 從 App 傳入的日期設定函數
  isScrolled?: boolean; // 滾動狀態
  // 個人化功能相關
  currentUser?: UserSession | null;
  onToggleItemVisibility?: (pageId: string) => void;
  isItemHidden?: (pageId: string) => boolean;
  filterItems?: (items: NotionItineraryItem[]) => NotionItineraryItem[];
}

const TravelTimeline: React.FC<TravelTimelineProps> = ({ 
  groupedItems, 
  selectedDay: propSelectedDay = null, 
  setSelectedDay: propSetSelectedDay = null,
  isScrolled = false,
  // 個人化功能 props
  currentUser,
  onToggleItemVisibility,
  isItemHidden,
  filterItems
}) => {
  // 使用本地狀態作為後備，但優先使用從 App 傳入的狀態
  const [localSelectedDay, setLocalSelectedDay] = useState<string | null>(null);
  const selectedDay = propSelectedDay !== null ? propSelectedDay : localSelectedDay;
  const setSelectedDay = propSetSelectedDay || setLocalSelectedDay;
  const [showAddModal, setShowAddModal] = useState(false);
  const { mode } = useMode();
  const { databaseId } = useUrlParams();
  const { createItineraryItem } = useItinerary(databaseId || '');
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // 檢測是否為觸控設備
  const isTouchDevice = 'ontouchstart' in window;
  
  // 觸控相關狀態
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const sortedDays = Array.from(groupedItems.keys()).sort((a, b) => a.localeCompare(b));
  
  // 滑動切換邏輯
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = sortedDays.indexOf(selectedDay || '');
      
      if (isLeftSwipe && currentIndex < sortedDays.length - 1) {
        // 左滑：下一天
        handleDayChange(sortedDays[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        // 右滑：前一天
        handleDayChange(sortedDays[currentIndex - 1]);
      }
    }
  };
  
  // 統一的日期切換處理（包含自動滾動）
  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    
    // 滾動到頂部
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  useEffect(() => {
    if (sortedDays.length > 0 && !selectedDay && !propSelectedDay) {
      setSelectedDay(sortedDays[0]);
    }
  }, [sortedDays, selectedDay, propSelectedDay]);

  const handleAddItinerary = () => {
    setShowAddModal(true);
  };

  const handleSaveNewItem = (newItem: Partial<NotionItineraryItem>) => {
    createItineraryItem(newItem);
  };

  // 先獲取原始項目，然後應用個人化篩選
  const rawCurrentItems = selectedDay ? groupedItems.get(selectedDay) || [] : [];
  const currentItems = filterItems ? filterItems(rawCurrentItems) : rawCurrentItems;


  return (
    <div 
      ref={timelineRef}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50"
      onTouchStart={isTouchDevice ? onTouchStart : undefined}
      onTouchMove={isTouchDevice ? onTouchMove : undefined}
      onTouchEnd={isTouchDevice ? onTouchEnd : undefined}
    >
      <DayTabs 
        days={sortedDays}
        selectedDay={selectedDay}
        setSelectedDay={handleDayChange}
        isScrolled={isScrolled}
      />

      <div className="mt-6 sm:mt-8">
        {mode === 'edit' && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <button 
              onClick={handleAddItinerary}
              className="flex items-center gap-3 px-6 py-3 text-white bg-gradient-to-r from-success-500 to-success-600 rounded-2xl hover:from-success-600 hover:to-success-700 hover:scale-105 transition-all duration-200 shadow-floating font-medium"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline">新增本日行程</span>
              <span className="sm:hidden">新增行程</span>
            </button>
          </div>
        )}

        <div className="space-y-3">
          {currentItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && item.前往方式 && (
                <div className="flex items-center justify-center py-0.5">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-md border border-secondary-200">
                    <ArrowDown className="w-5 h-5 text-primary-500" />
                    <span className="text-sm text-secondary-700 font-medium whitespace-pre-wrap">{item.前往方式}</span>
                  </div>
                </div>
              )}
              <TravelCard 
                key={item.id} 
                item={item} 
                index={index}
                isHidden={isItemHidden ? isItemHidden(item.id) : false}
                onToggleVisibility={onToggleItemVisibility}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
      <AddItineraryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveNewItem}
        selectedDay={selectedDay}
      />
    </div>
  );
};

export default TravelTimeline;