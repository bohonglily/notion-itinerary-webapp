import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Clock, Search, Trash2, Download, Upload, Plus, ExternalLink } from 'lucide-react';
import { useHistory } from '../hooks/useHistory';
import { HistoryItem } from '../types';
import DatabaseList from './DatabaseList';
import { databaseConfigService, DatabaseConfigItem } from '../services/database-config-service';
import packageJson from '../../package.json';

const HomePage: React.FC = () => {
  const { history, removeFromHistory, clearHistory, getFilteredHistory, exportHistory, importHistory } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState({
    databaseId: '',
    startDate: '',
    endDate: ''
  });
  const [databases, setDatabases] = useState<DatabaseConfigItem[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredHistory = getFilteredHistory(searchTerm);

  // 載入資料庫列表
  const loadDatabaseList = async () => {
    const configDatabaseId = databaseConfigService.getConfigDatabaseId();
    if (!configDatabaseId) {
      setDatabases([]);
      return;
    }

    setIsLoadingDatabases(true);
    try {
      const databaseList = await databaseConfigService.getDatabaseList(configDatabaseId);
      setDatabases(databaseList);
    } catch (error) {
      console.error('Failed to load database list:', error);
      setDatabases([]);
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadDatabaseList();
  }, []);

  const handleHistoryClick = (item: HistoryItem) => {
    const params = new URLSearchParams();
    params.set('databaseId', item.databaseId);
    if (item.startDate) params.set('startDate', item.startDate);
    if (item.endDate) params.set('endDate', item.endDate);
    
    window.location.href = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleDatabaseClick = (database: DatabaseConfigItem) => {
    const params = new URLSearchParams();
    params.set('databaseId', database.databaseId);
    if (database.startDate) params.set('startDate', database.startDate);
    if (database.endDate) params.set('endDate', database.endDate);
    
    window.location.href = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.databaseId.trim()) return;

    const params = new URLSearchParams();
    params.set('databaseId', manualInput.databaseId.trim());
    if (manualInput.startDate) params.set('startDate', manualInput.startDate);
    if (manualInput.endDate) params.set('endDate', manualInput.endDate);
    
    window.location.href = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importHistory(file);
      alert('歷史記錄匯入成功！');
    } catch (error) {
      alert('匯入失敗：請確認檔案格式正確');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatLastVisited = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MapPin className="w-12 h-12 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800">旅遊行程管理</h1>
          </div>
          <div className="flex items-center justify-center gap-3">
            <p className="text-gray-600">管理您的 Notion 旅遊資料庫</p>
            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full font-medium">
              v{packageJson.version}
            </span>
          </div>
        </div>

        {/* Database List Section */}
        <DatabaseList 
          databases={databases}
          isLoading={isLoadingDatabases}
          onRefresh={loadDatabaseList}
          onDatabaseClick={handleDatabaseClick}
        />

        {/* Manual Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">新增資料庫</h2>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              {showManualInput ? '收起' : '手動輸入'}
            </button>
          </div>
          
          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  資料庫 ID *
                </label>
                <input
                  type="text"
                  value={manualInput.databaseId}
                  onChange={(e) => setManualInput({ ...manualInput, databaseId: e.target.value })}
                  placeholder="輸入 Notion 資料庫 ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始日期
                  </label>
                  <input
                    type="date"
                    value={manualInput.startDate}
                    onChange={(e) => setManualInput({ ...manualInput, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    結束日期
                  </label>
                  <input
                    type="date"
                    value={manualInput.endDate}
                    onChange={(e) => setManualInput({ ...manualInput, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <ExternalLink className="inline w-5 h-5 mr-2" />
                前往資料庫
              </button>
            </form>
          )}
        </div>

        {/* History Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">歷史記錄</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportHistory}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={history.length === 0}
              >
                <Download size={16} />
                匯出
              </button>
              <button
                onClick={handleImportClick}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Upload size={16} />
                匯入
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={16} />
                  清空
                </button>
              )}
            </div>
          </div>

          {history.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="搜尋資料庫名稱或 ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">還沒有歷史記錄</h3>
              <p className="text-gray-400">開始使用資料庫後，歷史記錄會顯示在這裡</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">找不到符合的記錄</h3>
              <p className="text-gray-400">試試其他搜尋詞彙</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.databaseId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => handleHistoryClick(item)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">
                        {item.databaseName || item.databaseId}
                      </h3>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {item.visitCount} 次訪問
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatLastVisited(item.lastVisited)}
                      </span>
                      {(item.startDate || item.endDate) && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {item.startDate && item.endDate
                            ? `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
                            : item.startDate
                            ? `從 ${formatDate(item.startDate)}`
                            : `到 ${formatDate(item.endDate!)}`
                          }
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">
                      ID: {item.databaseId}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.databaseId);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;