import React, { useState, useEffect } from 'react';
import { X, User, Plus, Search } from 'lucide-react';
import { UserProfile } from '../types';
import { userService } from '../services/user-service-supabase';

interface UserSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  databaseId: string;
  onUserSelect: (userId: string) => void;
  onCreateNewUser: () => void;
}

const UserSelectorModal: React.FC<UserSelectorModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  databaseId,
  onUserSelect,
  onCreateNewUser
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 載入使用者清單
  useEffect(() => {
    if (isOpen && databaseId) {
      loadUsers();
    }
  }, [isOpen, databaseId]);

  // 搜尋過濾
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredUsers(
        users.filter(user =>
          user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const userList = await userService.getUserList(databaseId);
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    console.log('UserSelectorModal - handleUserSelect called with userId:', userId);
    
    // 更新 URL 參數
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('user', userId);
    const newUrl = currentUrl.toString();
    
    console.log('UserSelectorModal - updating URL from', window.location.href, 'to', newUrl);
    window.history.pushState({}, '', newUrl);
    
    // 觸發自定義事件通知 URL 參數已更新
    console.log('UserSelectorModal - dispatching urlParamsChanged event');
    window.dispatchEvent(new CustomEvent('urlParamsChanged'));
    
    // 關閉模態框
    onClose();
  };

  const handleCreateNew = () => {
    onClose();
    onCreateNewUser();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">選擇使用者身份</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 搜尋欄 */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋使用者名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 使用者清單 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">載入中...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <User size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                {searchQuery ? '找不到符合的使用者' : '尚無其他使用者'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => handleUserSelect(user.user_id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left ${
                    currentUserId === user.user_id
                      ? 'bg-primary-50 border border-primary-200'
                      : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={16} className="text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{user.display_name}</p>
                    <p className="text-sm text-gray-500 truncate">@{user.user_id}</p>
                  </div>
                  {currentUserId === user.user_id && (
                    <div className="text-xs text-primary-600 font-medium">目前使用中</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            建立新使用者身份
          </button>
          
          <div className="mt-3 text-xs text-gray-500 text-center">
            💡 提示：儲存此頁面的 URL 即可在其他裝置存取個人化設定
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelectorModal;