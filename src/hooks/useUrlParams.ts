import { useState, useEffect } from 'react';

export const useUrlParams = () => {
  const [params, setParams] = useState<{
    databaseId: string | null;
    startDate: string | null;
    endDate: string | null;
    userId: string | null;
  }>({
    databaseId: null,
    startDate: null,
    endDate: null,
    userId: null
  });

  useEffect(() => {
    const updateParams = () => {
      console.log('useUrlParams - updateParams called, current URL:', window.location.href);
      const urlParams = new URLSearchParams(window.location.search);
      // 支援兩種格式：優先使用 db，回退到 databaseId
      const databaseId = urlParams.get('db') || urlParams.get('databaseId');
      // 支援兩種格式：優先使用 start，回退到 startDate
      const startDate = urlParams.get('start') || urlParams.get('startDate');
      // 支援兩種格式：優先使用 end，回退到 endDate
      const endDate = urlParams.get('end') || urlParams.get('endDate');
      // 新增 user 參數
      const userId = urlParams.get('user');
      
      console.log('useUrlParams - extracted params:', { databaseId, startDate, endDate, userId });

      setParams({
        databaseId,
        startDate,
        endDate,
        userId
      });
    };

    // 初始化
    updateParams();

    // 監聽 popstate 事件（用戶點擊瀏覽器前進/後退按鈕）
    window.addEventListener('popstate', updateParams);
    
    // 監聽自定義的 URL 更新事件
    window.addEventListener('urlParamsChanged', updateParams);

    return () => {
      window.removeEventListener('popstate', updateParams);
      window.removeEventListener('urlParamsChanged', updateParams);
    };
  }, []);

  return params;
};