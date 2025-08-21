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
    const urlParams = new URLSearchParams(window.location.search);
    // 支援兩種格式：優先使用 db，回退到 databaseId
    const databaseId = urlParams.get('db') || urlParams.get('databaseId');
    // 支援兩種格式：優先使用 start，回退到 startDate
    const startDate = urlParams.get('start') || urlParams.get('startDate');
    // 支援兩種格式：優先使用 end，回退到 endDate
    const endDate = urlParams.get('end') || urlParams.get('endDate');
    // 新增 user 參數
    const userId = urlParams.get('user');

    setParams({
      databaseId,
      startDate,
      endDate,
      userId
    });
  }, []);

  return params;
};