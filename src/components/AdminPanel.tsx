import React, { useState } from 'react';
import { RefreshCw, Wand2, Settings, CheckCircle, AlertCircle, X, Sparkles } from 'lucide-react';
import { aiManager } from '../services/ai/ai-manager';
import { EnhancementProgress } from '../types';

interface AdminPanelProps {
  onGenerateDescriptions: (prompt: string, forceRegenerate?: boolean) => Promise<void>;
  isProcessing: boolean;
  enhancementProgress: EnhancementProgress | null;
  onClose?: () => void; // New optional prop for closing the panel
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  onGenerateDescriptions,
  isProcessing,
  enhancementProgress,
  onClose // Destructure onClose prop
}) => {
  const [currentProvider, setCurrentProvider] = useState(aiManager.getCurrentProvider());
  const [showProviderInfo, setShowProviderInfo] = useState(false);
  const [descriptionPrompt, setDescriptionPrompt] = useState('每個景點50字以內，考慮時段與季節，風格活潑生動。跳過交通和摘要項目。'); // Enhanced default prompt
  const [forceRegenerate, setForceRegenerate] = useState(false); // New state for generation mode

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

      {/* Usage Tips */}
      <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
        <h4 className="text-sm font-semibold text-amber-800 mb-2">💡 智能生成說明</h4>
        <div className="text-xs text-amber-700 space-y-1">
          <p>• 系統會自動考慮日期、時段、交通方式等上下文資訊</p>
          <p>• 自動跳過交通、摘要、備註等非景點項目</p>
          <p>• 可在提示中指定風格、字數、重點內容</p>
          <p>• <strong>僅空白項目</strong>：只處理沒有景點介紹的項目（節省成本）</p>
          <p>• <strong>重新生成全部</strong>：覆蓋所有現有介紹（獲得最新內容）</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6">
        <div className="w-full">
          <label htmlFor="description-prompt" className="block text-sm font-medium text-gray-700 mb-1">景點介紹生成提示 (Prompt):</label>
          <textarea
            id="description-prompt"
            value={descriptionPrompt}
            onChange={(e) => setDescriptionPrompt(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 mb-3"
            placeholder="每個景點50字以內，考慮時段與季節，風格活潑生動。跳過交通和摘要項目。"
          ></textarea>
          
          {/* Generation Mode Selection */}
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">生成模式：</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="generation-mode"
                  checked={!forceRegenerate}
                  onChange={() => setForceRegenerate(false)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">僅空白項目</span>
                <span className="text-xs text-gray-500">（跳過已有介紹的項目）</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="generation-mode"
                  checked={forceRegenerate}
                  onChange={() => setForceRegenerate(true)}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">重新生成全部</span>
                <span className="text-xs text-gray-500">（覆蓋所有現有介紹）</span>
              </label>
            </div>
          </div>

          <button
            onClick={() => onGenerateDescriptions(descriptionPrompt, forceRegenerate)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
            {isProcessing ? '生成介紹中...' : `AI 自動產生景點介紹 (${forceRegenerate ? '全部重新生成' : '僅空白項目'})`}
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
