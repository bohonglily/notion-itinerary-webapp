import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Clock, Search, Trash2, Download, Upload, Plus, ExternalLink, Edit3, Shield, Eye, EyeOff } from 'lucide-react';
import { useHistory } from '../hooks/useHistory';
import { HistoryItem } from '../types';
import DatabaseList from './DatabaseList';
import { SavedDatabaseService, SavedDatabase } from '../services/supabase-service';
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
  const [databases, setDatabases] = useState<SavedDatabase[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [showAddDatabase, setShowAddDatabase] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState<SavedDatabase | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [newDatabase, setNewDatabase] = useState({
    name: '',
    notion_db_id: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredHistory = getFilteredHistory(searchTerm);

  // 檢查管理員密碼
  const checkAdminPassword = () => {
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    if (adminPassword === envPassword) {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('密碼錯誤');
    }
  };

  // 登出管理員模式
  const logoutAdmin = () => {
    setIsAdminMode(false);
    setEditingDatabase(null);
    setShowAddDatabase(false);
  };

  // 載入資料庫列表
  const loadDatabaseList = async () => {
    setIsLoadingDatabases(true);
    try {
      const databaseList = await SavedDatabaseService.getAllDatabases();
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

  const handleDatabaseClick = (database: SavedDatabase) => {
    const params = new URLSearchParams();
    params.set('databaseId', database.notion_db_id);
    if (database.start_date) params.set('startDate', database.start_date);
    if (database.end_date) params.set('endDate', database.end_date);
    
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

  const handleAddDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDatabase.name.trim() || !newDatabase.notion_db_id.trim()) return;

    try {
      await SavedDatabaseService.createDatabase({
        name: newDatabase.name.trim(),
        notion_db_id: newDatabase.notion_db_id.trim(),
        start_date: newDatabase.start_date || undefined,
        end_date: newDatabase.end_date || undefined,
        description: newDatabase.description.trim() || undefined,
        is_active: true,
        sort_order: databases.length
      });
      
      // 重新載入資料庫列表
      await loadDatabaseList();
      
      // 重置表單
      setNewDatabase({
        name: '',
        notion_db_id: '',
        start_date: '',
        end_date: '',
        description: ''
      });
      setShowAddDatabase(false);
      
      alert('資料庫新增成功！');
    } catch (error) {
      console.error('Failed to add database:', error);
      alert('新增失敗：請檢查 Supabase 設定');
    }
  };

  const handleEditDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDatabase || !newDatabase.name.trim() || !newDatabase.notion_db_id.trim()) return;

    try {
      await SavedDatabaseService.updateDatabase(editingDatabase.id, {
        name: newDatabase.name.trim(),
        notion_db_id: newDatabase.notion_db_id.trim(),
        start_date: newDatabase.start_date || undefined,
        end_date: newDatabase.end_date || undefined,
        description: newDatabase.description.trim() || undefined
      });
      
      // 重新載入資料庫列表
      await loadDatabaseList();
      
      // 重置表單
      setNewDatabase({
        name: '',
        notion_db_id: '',
        start_date: '',
        end_date: '',
        description: ''
      });
      setEditingDatabase(null);
      
      alert('資料庫更新成功！');
    } catch (error) {
      console.error('Failed to update database:', error);
      alert('更新失敗：請檢查 Supabase 設定');
    }
  };

  const handleDeleteDatabase = async (database: SavedDatabase) => {
    if (!confirm(`確定要刪除「${database.name}」嗎？`)) return;

    try {
      await SavedDatabaseService.deleteDatabase(database.id);
      
      // 重新載入資料庫列表
      await loadDatabaseList();
      
      alert('資料庫刪除成功！');
    } catch (error) {
      console.error('Failed to delete database:', error);
      alert('刪除失敗：請檢查 Supabase 設定');
    }
  };

  const startEditDatabase = (database: SavedDatabase) => {
    setEditingDatabase(database);
    setNewDatabase({
      name: database.name,
      notion_db_id: database.notion_db_id,
      start_date: database.start_date || '',
      end_date: database.end_date || '',
      description: database.description || ''
    });
    setShowAddDatabase(false);
  };

  const cancelEdit = () => {
    setEditingDatabase(null);
    setNewDatabase({
      name: '',
      notion_db_id: '',
      start_date: '',
      end_date: '',
      description: ''
    });
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

        {/* Supabase Database List Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800">常用資料庫</h2>
              {isAdminMode && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                  <Shield size={12} />
                  管理員模式
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isAdminMode ? (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye size={16} />
                  管理模式
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowAddDatabase(!showAddDatabase);
                      setEditingDatabase(null);
                      setNewDatabase({
                        name: '',
                        notion_db_id: '',
                        start_date: '',
                        end_date: '',
                        description: ''
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Plus size={16} />
                    新增資料庫
                  </button>
                  <button
                    onClick={logoutAdmin}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <EyeOff size={16} />
                    退出管理
                  </button>
                </>
              )}
              <button
                onClick={loadDatabaseList}
                disabled={isLoadingDatabases}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <MapPin size={16} className={isLoadingDatabases ? 'animate-spin' : ''} />
                重新載入
              </button>
            </div>
          </div>

          {/* Admin Login Modal */}
          {showAdminLogin && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">管理員登入</h3>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="請輸入管理員密碼"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && checkAdminPassword()}
                />
                <button
                  onClick={checkAdminPassword}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  登入
                </button>
                <button
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPassword('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {(showAddDatabase || editingDatabase) && isAdminMode && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">
                {editingDatabase ? '編輯資料庫' : '新增常用資料庫'}
              </h3>
              <form onSubmit={editingDatabase ? handleEditDatabase : handleAddDatabase} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      資料庫名稱 *
                    </label>
                    <input
                      type="text"
                      value={newDatabase.name}
                      onChange={(e) => setNewDatabase({ ...newDatabase, name: e.target.value })}
                      placeholder="例：日本關西旅遊 2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notion 資料庫 ID *
                    </label>
                    <input
                      type="text"
                      value={newDatabase.notion_db_id}
                      onChange={(e) => setNewDatabase({ ...newDatabase, notion_db_id: e.target.value })}
                      placeholder="Notion 資料庫 ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述
                  </label>
                  <textarea
                    value={newDatabase.description}
                    onChange={(e) => setNewDatabase({ ...newDatabase, description: e.target.value })}
                    placeholder="資料庫簡短描述（可選）"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      預設開始日期
                    </label>
                    <input
                      type="date"
                      value={newDatabase.start_date}
                      onChange={(e) => setNewDatabase({ ...newDatabase, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      預設結束日期
                    </label>
                    <input
                      type="date"
                      value={newDatabase.end_date}
                      onChange={(e) => setNewDatabase({ ...newDatabase, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {editingDatabase ? '更新' : '儲存'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingDatabase) {
                        cancelEdit();
                      } else {
                        setShowAddDatabase(false);
                      }
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoadingDatabases ? (
            <div className="text-center py-8">
              <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
              <p className="text-gray-600">載入資料庫列表中...</p>
            </div>
          ) : databases.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">還沒有常用資料庫</h3>
              <p className="text-gray-400 mb-4">點擊「新增資料庫」來建立您的第一個常用資料庫</p>
              <button
                onClick={() => setShowAddDatabase(true)}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} />
                新增資料庫
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {databases.map((database) => (
                <div
                  key={database.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleDatabaseClick(database)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">{database.name}</h3>
                      {editingDatabase?.id === database.id && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          編輯中...
                        </span>
                      )}
                    </div>
                    {database.description && (
                      <p className="text-sm text-gray-600 mb-2">{database.description}</p>
                    )}
                    {(database.start_date || database.end_date) && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <Calendar size={14} />
                        {database.start_date && database.end_date
                          ? `${new Date(database.start_date).toLocaleDateString()} - ${new Date(database.end_date).toLocaleDateString()}`
                          : database.start_date
                          ? `從 ${new Date(database.start_date).toLocaleDateString()}`
                          : `到 ${new Date(database.end_date!).toLocaleDateString()}`
                        }
                      </div>
                    )}
                    <div className="text-xs text-gray-400 font-mono">
                      ID: {database.notion_db_id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminMode && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditDatabase(database);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="編輯"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDatabase(database);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="刪除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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