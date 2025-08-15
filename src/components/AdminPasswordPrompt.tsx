import React, { useState } from 'react';

interface AdminPasswordPromptProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminPasswordPrompt: React.FC<AdminPasswordPromptProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) { // Read password from environment variable
      onSuccess();
    } else {
      setError('密碼錯誤，請重新輸入。');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">請輸入管理員密碼</h3>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
        placeholder="管理員密碼"
      />
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          登入
        </button>
      </div>
    </div>
  );
};

export default AdminPasswordPrompt;
