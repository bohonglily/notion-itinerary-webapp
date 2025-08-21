import React, { useState } from 'react';
import { User, X } from 'lucide-react';
import Modal from './Modal';

interface UserPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (displayName: string) => Promise<void>;
}

const UserPromptModal: React.FC<UserPromptModalProps> = ({
  isOpen,
  onClose,
  onCreateUser
}) => {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('請輸入您的姓名');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('姓名至少需要 2 個字符');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onCreateUser(displayName.trim());
      setDisplayName('');
      onClose();
    } catch (error) {
      setError('建立使用者失敗，請稍後再試');
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setDisplayName('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">建立個人識別</h2>
          </div>
          {!isLoading && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-2">
            要使用個人化隱藏功能，請先建立您的識別資料：
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 您可以隱藏不想看到的行程項目</li>
            <li>• 隱藏設定會同步到所有裝置</li>
            <li>• 其他人不會看到您的隱藏設定</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              您的姓名 *
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例如：Alice"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              maxLength={50}
            />
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !displayName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  建立中...
                </>
              ) : (
                '建立識別'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-700">
            <strong>隱私說明：</strong>您的姓名僅用於個人識別，不會被其他功能使用或分享。
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default UserPromptModal;