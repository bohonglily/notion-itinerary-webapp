import React, { useState } from 'react';
import { RefreshCw, Wand2, Settings, CheckCircle, AlertCircle, X, Sparkles, Image } from 'lucide-react';
import { aiManager } from '../services/ai/ai-manager';
import { EnhancementProgress } from '../types';

interface AdminPanelProps {
  onSearchImages: () => Promise<void>;
  onGenerateDescriptions: (prompt: string) => Promise<void>;
  isProcessing: boolean;
  enhancementProgress: EnhancementProgress | null;
  onClose?: () => void; // New optional prop for closing the panel
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  onSearchImages,
  onGenerateDescriptions,
  isProcessing,
  enhancementProgress,
  onClose // Destructure onClose prop
}) => {
  const [currentProvider, setCurrentProvider] = useState(aiManager.getCurrentProvider());
  const [showProviderInfo, setShowProviderInfo] = useState(false);
  const [descriptionPrompt, setDescriptionPrompt] = useState(''); // Correctly defined here

  const availableProviders = aiManager.getAvailableProviders();
  const providerInfo = aiManager.getAllProviderInfo();

  const handleProviderChange = (provider: string) => {
    try {
      aiManager.setCurrentProvider(provider);
      setCurrentProvider(provider);
    } catch (error) {
      console.error('Failed to switch provider:', error);
    }
  };

  const getProgressStageText = (stage: string) => {
    switch (stage) {
      case 'images': return '搜尋圖片中...';
      case 'descriptions': return '生成描述中...';
      case 'writing': return '寫入資料中...';
      case 'complete': return '完成！';
      default: return '處理中...';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 relative">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close Admin Panel"
        >
          <X size={20} className="text-gray-500" />
        </button>
      )}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-bold text-gray-800">管理員面板</h2>
      </div>

      {/* AI Provider Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-3">AI 服務提供者</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {availableProviders.map((provider) => (
            <button
              key={provider}
              onClick={() => handleProviderChange(provider)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                currentProvider === provider
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {provider}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowProviderInfo(!showProviderInfo)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showProviderInfo ? '隱藏' : '顯示'}服務資訊
        </button>
        
        {showProviderInfo && (
          <div className="mt-3 space-y-2">
            {Array.from(providerInfo.entries()).map(([name, info]) => (
              <div key={name} className="text-sm p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{info.name}</span>
                  {info.available ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  限制: {info.rateLimit} 次/分鐘 | Token: {info.tokenLimit}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={onSearchImages}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Image className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
          {isProcessing ? '搜尋縮圖中...' : 'AI 自動搜尋縮圖'}
        </button>

        <div className="w-full">
          <label htmlFor="description-prompt" className="block text-sm font-medium text-gray-700 mb-1">景點介紹生成提示 (Prompt):</label>
          <textarea
            id="description-prompt"
            value={descriptionPrompt}
            onChange={(e) => setDescriptionPrompt(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 mb-2"
            placeholder="每個項目50字以內，儘量精簡，活潑"
          ></textarea>
          <button
            onClick={() => onGenerateDescriptions(descriptionPrompt)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
            {isProcessing ? '生成介紹中...' : 'AI 自動產生景點介紹'}
          </button>
        </div>
      </div>

      {/* Enhancement Progress */}
      {enhancementProgress && (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {getProgressStageText(enhancementProgress.stage)}
            </span>
            <span className="text-sm text-gray-600">
              {enhancementProgress.completed}/{enhancementProgress.total}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(enhancementProgress.completed / enhancementProgress.total) * 100}%`
              }}
            />
          </div>
          
          {enhancementProgress.current && (
            <div className="text-sm text-gray-600">
              處理中: {enhancementProgress.current}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
