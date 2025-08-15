import { useState, useEffect } from 'react';

export const useUrlParams = () => {
  const [params, setParams] = useState<{
    databaseId: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    databaseId: null,
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const databaseId = urlParams.get('databaseId');
    const startDate = urlParams.get('startDate');
    const endDate = urlParams.get('endDate');

    setParams({
      databaseId,
      startDate,
      endDate
    });
  }, []);

  return params;
};