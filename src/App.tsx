import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Settings, Sparkles, Edit, X, RotateCw, Eye, EyeOff, Sliders } from 'lucide-react';
import { useUrlParams } from './hooks/useUrlParams';
import { useItinerary } from './hooks/useItinerary';
import { useHistory } from './hooks/useHistory';
import TravelTimeline from './components/TravelTimeline';
import AdminPanel from './components/AdminPanel';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './components/HomePage';
import { useMode } from './hooks/useMode';
import { ItineraryData } from './types';
import Modal from './components/Modal'; // Import Modal component
import AdminPasswordPrompt from './components/AdminPasswordPrompt'; // Import AdminPasswordPrompt
import { aiManager } from './services/ai/ai-manager'; // Import aiManager
import { notionService } from './services/notion-service'; // Import notionService
import { cacheService } from './services/cache-service'; // Import cacheService
import { useVisibility } from './contexts/VisibilityContext';
import { useScrollPosition } from './hooks/useScrollPosition';
import MiniBottomBar from './components/MiniBottomBar';
import packageJson from '../package.json';


const AppContent: React.FC = () => {
  const { databaseId, startDate, endDate } = useUrlParams();
  const { addToHistory } = useHistory();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false); // State for password prompt modal
  const [showAdminPanelModal, setShowAdminPanelModal] = useState(false); // State for AdminPanel modal
  const { mode, toggleMode } = useMode();
  const { isScrolled } = useScrollPosition(100); // 滾動監聽，100px 作為觸發閾值
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // 提升日期狀態到 App 層級
  
  const { data, groupedData, isLoading, error, reload } = useItinerary(databaseId || '', startDate, endDate);
  const [isProcessing, setIsProcessing] = useState(false); // New state for AI processing

  // Auto-save to history when data is successfully loaded
  useEffect(() => {
    if (data && databaseId) {
      addToHistory({
        databaseId,
        databaseName: data.databaseName,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
    }
  }, [data, databaseId, startDate, endDate, addToHistory]);

  // 當資料載入完成時，設定預設選中的日期
  const sortedDays = data ? Array.from(groupedData.keys()).sort((a, b) => a.localeCompare(b)) : [];
  useEffect(() => {
    if (sortedDays.length > 0 && !selectedDay) {
      setSelectedDay(sortedDays[0]);
    }
  }, [sortedDays, selectedDay]);

  const toggleAdminPanel = () => setShowPasswordPrompt(true); // Open password prompt first

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setShowAdminPanelModal(true);
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
  };

  const handleCloseAdminPanel = () => {
    setShowAdminPanelModal(false);
  };


  const handleGenerateDescriptions = async (prompt: string, forceRegenerate: boolean = false) => {
    if (!data) return;
    setIsProcessing(true);
    try {
      // Use aiManager's filtering logic instead of duplicating it here
      const updatedItems = await aiManager.generateDescriptionsWithPromptBulk(data.items, prompt, forceRegenerate);
      
      // Extract only items that actually had descriptions generated
      const itemsWithNewDescriptions = updatedItems.filter((item, index) => {
        const originalItem = data.items[index];
        return item.景點介紹 !== originalItem.景點介紹; // Description was changed
      });

      if (itemsWithNewDescriptions.length === 0) {
        alert(forceRegenerate ? "沒有找到可以重新生成介紹的項目。" : "沒有找到需要生成景點介紹的項目。");
        return;
      }

      console.log(`🚀 開始分批更新 ${itemsWithNewDescriptions.length} 個項目到 Notion...`);
      
      // 分批更新到 Notion（每批10個項目）
      const BATCH_SIZE = 10;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < itemsWithNewDescriptions.length; i += BATCH_SIZE) {
        const batch = itemsWithNewDescriptions.slice(i, i + BATCH_SIZE);
        const descriptions = batch.map(item => item.景點介紹 || '');
        
        try {
          console.log(`📝 更新批次 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(itemsWithNewDescriptions.length / BATCH_SIZE)}（${batch.length} 個項目）`);
          await notionService.bulkUpdateDescriptions(batch, descriptions);
          successCount += batch.length;
          console.log(`✅ 批次 ${Math.floor(i / BATCH_SIZE) + 1} 更新成功`);
        } catch (err) {
          console.error(`❌ 批次 ${Math.floor(i / BATCH_SIZE) + 1} 更新失敗:`, err);
          errorCount += batch.length;
        }
        
        // 批次間延遲，避免過於頻繁的請求
        if (i + BATCH_SIZE < itemsWithNewDescriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      reload();
      const message = errorCount > 0 
        ? `景點介紹更新完成！成功: ${successCount} 個，失敗: ${errorCount} 個。`
        : `自動產生景點介紹成功！處理了 ${successCount} 個項目。`;
      alert(message);
    } catch (err) {
      console.error("Failed to generate descriptions:", err);
      alert("自動產生景點介紹失敗！");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!databaseId) {
    return <HomePage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入行程資料中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">載入失敗</h2>
          <p className="text-gray-600 mb-6">無法載入行程資料，請檢查資料庫 ID 是否正確。</p>
          <button onClick={() => reload()} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            重試
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">暫無行程資料</h2>
          <p className="text-gray-600">此資料庫中沒有找到任何行程項目。</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      
      {/* 迷你底部欄 - 隨時顯示 */}
      <MiniBottomBar
        days={sortedDays}
        selectedDay={selectedDay}
        setSelectedDay={handleDayChange}
        itineraryData={data}
        onToggleAdminPanel={toggleAdminPanel}
        isScrolled={isScrolled}
      />
      
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{data.databaseName}</h1>
                <div className="flex items-center gap-3">
                  {data.databaseLastEditedTime && (
                    <p className="text-xs text-gray-500">
                      最後更新: {new Date(data.databaseLastEditedTime).toLocaleString()}
                    </p>
                  )}
                  <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    v{packageJson.version}
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      <main className="pb-12">{/* 縮小底部間距，配合更緊湊的 MiniBottomBar */}
        <TravelTimeline 
          groupedItems={groupedData}
          selectedDay={selectedDay}
          setSelectedDay={handleDayChange}
          isScrolled={isScrolled}
        />
      </main>

      {/* Password Prompt Modal */}
      <Modal isOpen={showPasswordPrompt} onClose={handlePasswordCancel} title="管理員登入">
        <AdminPasswordPrompt onSuccess={handlePasswordSuccess} onCancel={handlePasswordCancel} />
      </Modal>

      {/* Admin Panel Modal */}
      <Modal isOpen={showAdminPanelModal} onClose={handleCloseAdminPanel} title="管理員面板">
        <AdminPanel 
          onClose={handleCloseAdminPanel}
          onGenerateDescriptions={handleGenerateDescriptions}
          isProcessing={isProcessing}
          enhancementProgress={null} // Placeholder, replace with actual state if available
        />
      </Modal>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;

