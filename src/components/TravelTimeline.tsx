import React, { useState, useEffect, useRef } from 'react';
import { NotionItineraryItem } from '../types';
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
}

const TravelTimeline: React.FC<TravelTimelineProps> = ({ groupedItems }) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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
    if (sortedDays.length > 0 && !selectedDay) {
      setSelectedDay(sortedDays[0]);
    }
  }, [sortedDays, selectedDay]);

  const handleAddItinerary = () => {
    setShowAddModal(true);
  };

  const handleSaveNewItem = (newItem: Partial<NotionItineraryItem>) => {
    createItineraryItem(newItem);
  };

  const currentItems = selectedDay ? groupedItems.get(selectedDay) || [] : [];


  return (
    <div 
      ref={timelineRef}
      className="max-w-4xl mx-auto px-4 py-8 min-h-screen"
      onTouchStart={isTouchDevice ? onTouchStart : undefined}
      onTouchMove={isTouchDevice ? onTouchMove : undefined}
      onTouchEnd={isTouchDevice ? onTouchEnd : undefined}
    >
      <DayTabs 
        days={sortedDays}
        selectedDay={selectedDay}
        setSelectedDay={handleDayChange}
      />

      <div className="mt-8">
        {mode === 'edit' && (
          <div className="flex justify-center mb-8">
            <button 
              onClick={handleAddItinerary}
              className="flex items-center gap-2 px-4 py-2 text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors shadow-lg"
            >
              <PlusCircle size={20} />
              新增本日行程
            </button>
          </div>
        )}

        {currentItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && item.前往方式 && (
              <div className="ml-4 mb-4 flex items-center gap-1 text-sm text-gray-600">
                <ArrowDown className="w-5 h-5 text-blue-500" />
                <span className="whitespace-pre-wrap">{item.前往方式}</span>
              </div>
            )}
            <div className="mb-4">
              <TravelCard 
                key={item.id} 
                item={item} 
                index={index} 
              />
            </div>
          </React.Fragment>
        ))}
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