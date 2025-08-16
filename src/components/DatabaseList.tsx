import React, { useState } from 'react';
import { MapPin, ExternalLink, RefreshCw, Settings, Plus, Trash2 } from 'lucide-react';

interface DatabaseItem {
  id: string;
  name: string;
  description?: string;
  databaseId: string;
  tags?: string[];
  lastUpdated?: string;
}

interface DatabaseListProps {
  databases: DatabaseItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onDatabaseClick: (database: DatabaseItem) => void;
}

const DatabaseList: React.FC<DatabaseListProps> = ({ 
  databases, 
  isLoading, 
  onRefresh, 
  onDatabaseClick 
}) => {
  const [configDatabaseId, setConfigDatabaseId] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (configDatabaseId.trim()) {
      localStorage.setItem('config_database_id', configDatabaseId.trim());
      onRefresh();
      setShowConfig(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">我的資料庫</h2>
        <div className="flex items-center gap-2">
          {!showConfig && (
            <button
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings size={16} />
              設定
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            重新載入
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">配置資料庫 ID</h3>
          <p className="text-sm text-gray-600 mb-4">
            請輸入您的配置資料庫 ID。這個資料庫應該包含以下欄位：
            <br />• 名稱 (Title)
            <br />• 描述 (Rich Text)
            <br />• 資料庫ID (Text)
            <br />• 標籤 (Multi-select)
          </p>
          <form onSubmit={handleConfigSubmit} className="space-y-3">
            <input
              type="text"
              value={configDatabaseId}
              onChange={(e) => setConfigDatabaseId(e.target.value)}
              placeholder="輸入配置資料庫 ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600">載入資料庫列表中...</p>
        </div>
      ) : databases.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">沒有找到資料庫</h3>
          <p className="text-gray-400 mb-4">請先設定配置資料庫 ID</p>
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Settings size={16} />
            設定配置資料庫
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {databases.map((database) => (
            <div
              key={database.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => onDatabaseClick(database)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-gray-800">{database.name}</h3>
                  {database.tags && database.tags.length > 0 && (
                    <div className="flex gap-1">
                      {database.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {database.description && (
                  <p className="text-sm text-gray-600 mb-2">{database.description}</p>
                )}
                <div className="text-xs text-gray-400 font-mono">
                  ID: {database.databaseId}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatabaseList;