import * as React from 'react';
import { NotionItineraryItem } from '../types';
import { DollarSign, Info, Trash2, Pencil, CheckSquare, BookOpen, MapPin } from 'lucide-react';
import { renderTextWithLinks } from '../utils/text-renderer';
import { useState, useEffect } from 'react';
import { useUrlParams } from '../hooks/useUrlParams';
import { useMode } from '../hooks/useMode';
import { useVisibility } from '../contexts/VisibilityContext';
import TravelCardEditModal from './TravelCardEditModal';
import { useItinerary } from '../hooks/useItinerary';
import { ApiServiceFactory } from '../services/api-service-factory';

interface TravelCardProps {
  item: NotionItineraryItem;
  index: number;
}

// Simplified title section - only contains the title
const TitleSection = ({ item, hasImage }: { item: NotionItineraryItem; hasImage: boolean }) => {
  return (
    <div className={`absolute bottom-0 left-0 right-0 p-4 z-10 ${!hasImage ? 'pb-0' : ''}`}>
      {/* Simplified container with only title */}
      <div className="bg-gradient-to-r from-black/70 to-black/50 text-white py-3 px-4 rounded-xl shadow-floating backdrop-blur-sm">
        <h3 className="text-lg sm:text-xl font-bold [text-shadow:_2px_2px_8px_rgb(0_0_0_/_90%)] break-words leading-tight line-clamp-1">
          {item.項目}
        </h3>
      </div>
    </div>
  );
};

const LinkifiedText = ({ text }: { text: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
};

const TravelCard: React.FC<TravelCardProps> = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  const [proxyError, setProxyError] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { databaseId, startDate, endDate } = useUrlParams();
  const { mode } = useMode();
  const { fieldVisibility } = useVisibility();
  const { updateNotionPage, deleteItineraryItem } = useItinerary(databaseId || '', startDate, endDate);


  const PathIcon = () => (
    <img src="/pathicon.png" alt="Path Icon" className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
  );

  useEffect(() => {
    setImageError(false);
    setProxyError(false);
  }, [item]);

  const handleSave = (updatedItem: NotionItineraryItem) => {
    updateNotionPage({ pageId: item.id, updatedItem });
  };

  const handleDelete = () => {
    if (window.confirm(`確定要刪除「${item.項目}」嗎？`)) {
      deleteItineraryItem({ pageId: item.id });
    }
  };

  const hasImage = !!item.縮圖網址 && !imageError;

  return (
    <div className="group relative">
      <div className="transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
        <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden border border-secondary-100">
          
          {/* Header: Image or White Placeholder, with Title Overlay */}
          <div className={`relative overflow-hidden ${hasImage && fieldVisibility.縮圖 ? 'h-40 sm:h-48' : 'h-14 sm:h-16'}`}>
            {hasImage && fieldVisibility.縮圖 ? (
              <>
                <img 
                  src={proxyError ? item.縮圖網址! : `${ApiServiceFactory.getInstance().getEndpoint('imageProxy')}?url=${encodeURIComponent(item.縮圖網址!)}`}
                  alt={item.項目}
                  crossOrigin={proxyError ? undefined : "anonymous"}
                  className="w-full h-full object-cover"
                  onError={() => {
                    if (!proxyError) {
                      console.log('Proxy failed, trying direct URL for:', item.縮圖網址);
                      setProxyError(true);
                    } else {
                      console.log('Direct URL also failed for:', item.縮圖網址);
                      setImageError(true);
                    }
                  }}
                />
                {/* Gradient overlay for better text contrast on images */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent"></div>
              </>
            ) : (
              // White placeholder background when there is no image
              <div className="w-full h-full bg-white"></div>
            )}
            {/* The TitleSection is now outside the conditional, applying to both cases */}
            <TitleSection item={item} hasImage={hasImage && fieldVisibility.縮圖} />
          </div>

          {/* Edit/Delete Icons */}
          {mode === 'edit' && (
            <div className="absolute top-3 right-3 flex gap-2 z-20">
              <button 
                onClick={() => setShowEditModal(true)}
                className="p-2.5 bg-primary-500 text-white rounded-xl shadow-floating hover:bg-primary-600 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
                title="編輯"
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={handleDelete}
                className="p-2.5 bg-danger-500 text-white rounded-xl shadow-floating hover:bg-danger-600 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
                title="刪除"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
          
          {/* Content Section Below Header */}
          <div className="p-3 sm:p-4">
            {(() => {
              // 決定顯示順序，移除分隔線並優化間距
              const sections = [];
              
              // Info row: Time tags, Price, and Google Maps (moved from title section)
              const hasInfoRow = (fieldVisibility.時段 && Array.isArray(item.時段) && item.時段.length > 0) ||
                               (fieldVisibility.人均價 && (item.人均價 || 0) > 0) ||
                               (fieldVisibility.GoogleMaps && item.GoogleMaps);
              
              if (hasInfoRow) {
                sections.push(
                  <div key="info-row" className="mb-3">
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Time tags */}
                      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                        {fieldVisibility.時段 && Array.isArray(item.時段) && item.時段.length > 0 && (
                          <>
                            {item.時段.map((time, idx) => {
                              const timeColors = {
                                '上午': 'bg-warning-500/10 text-warning-700 border-warning-300',
                                '下午': 'bg-primary-500/10 text-primary-700 border-primary-300',
                                '晚上': 'bg-secondary-600/10 text-secondary-700 border-secondary-300'
                              };
                              const colorClass = timeColors[time as keyof typeof timeColors] || 'bg-gray-500/10 text-gray-700 border-gray-300';
                              
                              return (
                                <span key={idx} className={`text-xs px-2.5 py-1 rounded-full border ${colorClass} font-medium whitespace-nowrap`}>
                                  {time}
                                </span>
                              );
                            })}
                          </>
                        )}
                      </div>

                      {/* Right side: Price and Google Maps */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Price display */}
                        {fieldVisibility.人均價 && (item.人均價 || 0) > 0 && (
                          <div className="flex items-center gap-1 bg-success-500/10 text-success-700 border border-success-300 px-2.5 py-1 rounded-full">
                            <DollarSign className="w-3 h-3" />
                            <span className="text-xs font-medium whitespace-nowrap">
                              {item.幣別 || ''} {item.人均價?.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Google Maps Icon */}
                        {fieldVisibility.GoogleMaps && item.GoogleMaps && (
                          <div className="bg-white hover:bg-gray-50 p-2 rounded-full shadow-sm border border-gray-200 transition-all duration-200 hover:scale-110">
                            <a href={item.GoogleMaps} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700" title="在 Google Maps 上查看">
                              <img src="/googlemaps.png" alt="Google Maps" className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // 待辦項目
              if (fieldVisibility.待辦 && item.待辦 && item.待辦.trim()) {
                sections.push(
                  <div key="todo" className="text-sm mb-2">
                    <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-xl border border-warning-200">
                      <CheckSquare className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
                      <div className="text-warning-800 font-medium whitespace-pre-wrap leading-relaxed break-words">
                        <LinkifiedText text={item.待辦} />
                      </div>
                    </div>
                  </div>
                );
              }
              
              // 重要資訊（永久顯示，無需切換）
              if (item.重要資訊 && item.重要資訊.trim()) {
                sections.push(
                  <div key="important" className="text-sm mb-2">
                    <div className="flex items-start gap-3 p-3 bg-danger-50 rounded-xl border border-danger-200">
                      <Info className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" />
                      <div className="text-danger-800 leading-relaxed font-medium whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        <LinkifiedText text={item.重要資訊} />
                      </div>
                    </div>
                  </div>
                );
              }
              
              // 參考資料
              if (fieldVisibility.參考資料 && item.參考資料 && item.參考資料.trim()) {
                sections.push(
                  <div key="reference" className="text-sm mb-2">
                    <div className="flex items-start gap-3 p-3 bg-info-50 rounded-xl border border-info-200">
                      <BookOpen className="w-5 h-5 text-info-600 mt-0.5 flex-shrink-0" />
                      <div className="text-info-800 leading-relaxed">
                        {renderTextWithLinks(item.參考資料)}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // 景點介紹
              if (fieldVisibility.景點介紹 && item.景點介紹 && item.景點介紹.trim()) {
                sections.push(
                  <div key="description" className="text-sm mb-2">
                    <div className="flex items-start gap-3 p-3 bg-secondary-50 rounded-xl border border-secondary-200">
                      <MapPin className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
                      <div className="text-secondary-700 leading-relaxed whitespace-pre-wrap">
                        {item.景點介紹}
                      </div>
                    </div>
                  </div>
                );
              }
              
              return sections;
            })()}
          </div>
        </div>
      </div>
      <TravelCardEditModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        item={item}
        onSave={handleSave}
      />
    </div>
  );
};

export default TravelCard;