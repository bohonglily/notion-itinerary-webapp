import * as React from 'react';
import { NotionItineraryItem } from '../types';
import { DollarSign, Info, Trash2, Pencil, CheckSquare } from 'lucide-react';
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

// A unified, styled component for the title section, used in all cases.
const TitleSection = ({ item, hasImage }: { item: NotionItineraryItem; hasImage: boolean }) => {
  return (
    <div className={`absolute bottom-0 left-0 right-0 p-4 z-10 flex items-end gap-3 ${!hasImage ? 'pb-0' : ''}`}>
      {/* Left side: Title and Tags with a shared background */}
      <div className="bg-black/50 text-white py-2 px-4 rounded-lg shadow-lg flex-1 min-w-0">
        {Array.isArray(item.時段) && item.時段.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {item.時段.map((time, idx) => (
              <span key={idx} className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                {time}
              </span>
            ))}
          </div>
        )}
        <h3 className="text-xl font-bold [text-shadow:_2px_2px_6px_rgb(0_0_0_/_80%)] break-words">
          {item.項目}
        </h3>
      </div>

      {/* Right side: Google Maps Icon with its own background */}
      {item.GoogleMaps && (
        <div className="bg-white/90 p-2 rounded-full shadow-lg flex-shrink-0">
          <a href={item.GoogleMaps} target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200" title="在 Google Maps 上查看">
            <img src="/googlemaps.png" alt="Google Maps" className="w-5 h-5" />
          </a>
        </div>
      )}
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
  const { isDescriptionVisible } = useVisibility();
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
      
      
      <div className="">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          
          {/* Header: Image or White Placeholder, with Title Overlay */}
          <div className={`relative overflow-hidden ${hasImage ? 'h-48' : 'h-16'}`}>
            {hasImage ? (
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
            <TitleSection item={item} hasImage={hasImage} />
          </div>

          {/* Edit/Delete Icons */}
          {mode === 'edit' && (
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <button 
                onClick={() => setShowEditModal(true)}
                className="p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                title="編輯"
              >
                <Pencil size={20} />
              </button>
              <button 
                onClick={handleDelete}
                className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                title="刪除"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
          
          {/* Content Section Below Header */}
          <div className="p-4">
            <div className="flex flex-wrap justify-between items-center gap-y-2 mb-3">
              </div>

            {/* To-Do Items */}
            {item.待辦 && (
              <div className="text-sm mb-3 border-t border-gray-100 pt-3">
                <div className="flex items-start gap-2">
                  <CheckSquare className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-red-600 font-medium whitespace-pre-wrap">
                    <LinkifiedText text={item.待辦} />
                  </div>
                </div>
              </div>
            )}

            {/* Important Info */}
            {(item.重要資訊 || (item.人均價 || 0) > 0) && (
              <div className="text-sm text-gray-600 mb-3 border-t border-gray-100 pt-3">
                {item.重要資訊 && (
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <LinkifiedText text={item.重要資訊} />
                  </div>
                )}
                {(item.人均價 || 0) > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-yellow-500" />
                    <span>{item.人均價}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {isDescriptionVisible && item.景點介紹 && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-gray-600 leading-relaxed">
                  {item.景點介紹}
                </p>
              </div>
            )}
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