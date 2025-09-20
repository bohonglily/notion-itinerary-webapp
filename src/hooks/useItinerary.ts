import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ItineraryData, EnhancementProgress, NotionItineraryItem } from '../types';
import { notionService } from '../services/notion-service';
import { cacheService } from '../services/cache-service';
import { pexelsService } from '../services/pexels-service';
import { aiManager } from '../services/ai/ai-manager';
import { logger } from '../services/logger-service';
import { useState, useMemo, useEffect } from 'react';

// 時段排序對應表（與 notion-service.ts 保持一致）
const TIME_PERIOD_ORDER = {
  '摘要': 0,
  '清晨': 1,
  '早餐': 2,
  '上午': 3,
  '午餐': 4,
  '下午': 5,
  '傍晚': 6,
  '晚餐': 7,
  '晚上': 8,
  '深夜': 9,
  '夜泊': 10
};

export const useItinerary = (databaseId: string, startDate?: string | null, endDate?: string | null) => {
  const queryClient = useQueryClient();
  const [enhancementProgress, setEnhancementProgress] = useState<EnhancementProgress | null>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['itinerary', databaseId, startDate, endDate],
    queryFn: async (): Promise<ItineraryData> => {
      try {
        logger.info('ITINERARY_HOOK', 'Starting itinerary data fetch', { databaseId, startDate, endDate });
        
        const cachedData = cacheService.getItinerary(databaseId, startDate, endDate);
        
        let latestNotionLastEditedTime;
        try {
          latestNotionLastEditedTime = await notionService.getDatabaseLastEditedTime(databaseId);
          logger.debug('ITINERARY_HOOK', 'Latest Notion last_edited_time', { latestNotionLastEditedTime });
        } catch (dbError) {
          logger.error('ITINERARY_HOOK', 'Failed to get database last edited time', { error: dbError });
          throw new Error(`Database access failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }

        if (cachedData && cachedData.databaseLastEditedTime) {
          const cachedTime = new Date(cachedData.databaseLastEditedTime);
          const latestTime = new Date(latestNotionLastEditedTime);
          logger.debug('ITINERARY_HOOK', 'Cache comparison', { 
            cachedTime: cachedData.databaseLastEditedTime,
            latestTime: latestNotionLastEditedTime,
            isCacheNewer: cachedTime >= latestTime 
          });

          if (cachedTime >= latestTime) {
            logger.info('ITINERARY_HOOK', 'Using cached data');
            return cachedData;
          }
        }

        logger.info('ITINERARY_HOOK', 'Fetching fresh data from Notion');
        let freshData;
        try {
          freshData = await notionService.getItineraryData(databaseId, startDate, endDate);
          logger.info('ITINERARY_HOOK', 'Fresh data received', { 
            itemCount: freshData.items?.length,
            databaseName: freshData.databaseName 
          });
        } catch (queryError) {
          logger.error('ITINERARY_HOOK', 'Failed to get itinerary data', { error: queryError });
          throw new Error(`Query failed: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
        }
        
        const dataToCache = { ...freshData, databaseLastEditedTime: latestNotionLastEditedTime };
        cacheService.setItinerary(databaseId, dataToCache, startDate, endDate);
        logger.info('ITINERARY_HOOK', 'Data cached successfully');
        return dataToCache;
      } catch (error) {
        logger.error('ITINERARY_HOOK', 'Query function failed', { error });
        throw error;
      }
    },
    enabled: !!databaseId,
    staleTime: 5 * 60 * 1000 // 5 minutes 這會影響觸發檢查新版的時間
  });

  const groupedData = useMemo(() => {
    if (!data) return new Map<string, NotionItineraryItem[]>();

    const groups = new Map<string, NotionItineraryItem[]>();
    data.items.forEach(item => {
      const day = item.日期 || '未指定日期';
      if (!groups.has(day)) {
        groups.set(day, []);
      }
      groups.get(day)!.push(item);
    });

    // 對每個日期群組內的項目按時段、排序欄位排序
    groups.forEach((items) => {
      items.sort((a, b) => {
        // 1. 先按時段排序（取第一個時段）
        const timeA = a.時段?.[0] || '';
        const timeB = b.時段?.[0] || '';
        const timeOrderA = TIME_PERIOD_ORDER[timeA as keyof typeof TIME_PERIOD_ORDER] ?? 999;
        const timeOrderB = TIME_PERIOD_ORDER[timeB as keyof typeof TIME_PERIOD_ORDER] ?? 999;
        
        if (timeOrderA !== timeOrderB) {
          return timeOrderA - timeOrderB;
        }
        
        // 2. 同時段內按排序欄位排序
        const sortA = a.排序 ?? 999999; // 沒有排序的項目放到最後
        const sortB = b.排序 ?? 999999;
        return sortA - sortB;
      });
    });

    return groups;
  }, [data?.items, data?.lastOptimisticUpdate]);

const reloadMutation = useMutation({
    mutationFn: async () => {
      // 先清除快取，確保重新取得最新資料
      cacheService.clearItinerary(databaseId, startDate, endDate);
      // 強制重新查詢，確保使用當前的日期參數
      await queryClient.refetchQueries({
        queryKey: ['itinerary', databaseId, startDate, endDate],
        exact: true
      });
    },
    onSuccess: () => {
      logger.info('ITINERARY_HOOK', 'Manual reload completed', { databaseId, startDate, endDate });
    }
  });

  const enhanceContentMutation = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error('No data available');

      const items = data.items.filter(item => item.項目);
      const total = items.length;
      
      setEnhancementProgress({
        total,
        completed: 0,
        current: '',
        stage: 'images'
      });

      // Step 1: Search images
      const imageQueries = items.map(item => item.項目);
      const imageUrls: string[] = [];
      
      for (let i = 0; i < imageQueries.length; i++) {
        const query = imageQueries[i];
        setEnhancementProgress({
          total,
          completed: i,
          current: query,
          stage: 'images'
        });
        
        try {
          const imageUrl = await pexelsService.searchImage(query);
          imageUrls.push(imageUrl);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          imageUrls.push('');
        }
      }

      // Step 2: Generate descriptions
      setEnhancementProgress({
        total,
        completed: 0,
        current: '',
        stage: 'descriptions'
      });

      const descriptions: string[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setEnhancementProgress({
          total,
          completed: i,
          current: item.項目,
          stage: 'descriptions'
        });
        
        try {
            const contextParts = [];
          if (item.人均價) {
            contextParts.push(`人均價: ${item.幣別 || ''} ${item.人均價}`);
          }
          if (item.時段 && item.時段.length > 0) {
            contextParts.push(`時段: ${item.時段.join(', ')}`);
          }
          if (item.前往方式) {
            contextParts.push(`前往方式: ${item.前往方式}`);
          }
          const context = contextParts.join('; ');
          
          const description = await aiManager.generateDescription(item.項目, context);
          descriptions.push(description);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          descriptions.push('');
        }
      }

      // Step 3: Write back to Notion
      setEnhancementProgress({
        total,
        completed: 0,
        current: '',
        stage: 'writing'
      });

      await notionService.bulkUpdateImages(items, imageUrls);
      await notionService.bulkUpdateDescriptions(items, descriptions);

      setEnhancementProgress({
        total,
        completed: total,
        current: '',
        stage: 'complete'
      });

      // Reload data after enhancement
      return await notionService.getItineraryData(databaseId, startDate, endDate);
    },
    onSuccess: (data) => {
      cacheService.setItinerary(databaseId, data, startDate, endDate);
      queryClient.setQueryData(['itinerary', databaseId, startDate, endDate], data);
      setTimeout(() => setEnhancementProgress(null), 2000);
    },
    onError: () => {
      setEnhancementProgress(null);
    }
  });

  const updateNotionPageMutation = useMutation({
    mutationFn: async ({ pageId, updatedItem }: { pageId: string; updatedItem: NotionItineraryItem }) => {
      const properties = notionService.buildNotionProperties(updatedItem);
      return notionService.updateNotionPage(pageId, properties);
    },
    onMutate: async ({ pageId, updatedItem }: { pageId: string; updatedItem: NotionItineraryItem }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['itinerary', databaseId, startDate, endDate] });

      // Snapshot the previous value
      const previousItinerary = queryClient.getQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate]);

      // Optimistically update to the new value
      queryClient.setQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate], (old) => {
        if (!old) return old;
        const updatedItems = old.items.map(item => {
          if (item.id === pageId) {
            // 更新所有屬性，包含空值（允許清空欄位）
            // 只排除 undefined，但保留空字串和 null
            const cleanUpdatedItem = Object.fromEntries(
              Object.entries(updatedItem).filter(([_, value]) => value !== undefined)
            );
            const newItem = { ...item, ...cleanUpdatedItem };
            return newItem;
          }
          return item;
        });
        const newData = { 
          ...old, 
          items: updatedItems,
          // 添加時間戳確保對象引用改變
          lastOptimisticUpdate: Date.now()
        };
        
        return newData;
      });

      return { previousItinerary };
    },
    onSuccess: (_, { pageId, updatedItem }) => {
      // Update succeeded, update local cache with the optimistic data
      const currentData = queryClient.getQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate]);
      if (currentData) {
        // Update the cache with the current (optimistically updated) data
        cacheService.setItinerary(databaseId, currentData, startDate, endDate);
        logger.info('ITINERARY_HOOK', 'Successfully updated item and local cache', { 
          pageId, 
          updatedItemTitle: updatedItem.項目,
          fullUpdatedItem: updatedItem 
        });
      }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context we returned from onMutate to roll back
      queryClient.setQueryData(['itinerary', databaseId, startDate, endDate], context?.previousItinerary);
      console.error("Failed to update Notion page:", err);
      alert("更新失敗！請檢查網路或稍後再試。");
    },
  });

  const createItineraryItemMutation = useMutation({
    mutationFn: async (newItem: Partial<NotionItineraryItem>) => {
      const properties = notionService.buildNotionProperties(newItem);
      return notionService.createNotionPage(databaseId || '', properties);
    },
    onMutate: async (newItem: Partial<NotionItineraryItem>) => {
      await queryClient.cancelQueries({ queryKey: ['itinerary', databaseId, startDate, endDate] });

      const previousItinerary = queryClient.getQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate]);
      const tempId = `temp-${Date.now()}`;

      queryClient.setQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate], (old) => {
        if (!old) return old;
        // Assign a temporary ID for optimistic update
        const itemWithTempId = { ...newItem, id: tempId } as NotionItineraryItem;
        return { ...old, items: [...old.items, itemWithTempId] };
      });

      return { previousItinerary, tempId };
    },
    onSuccess: (createdItem, newItem, context) => {
      // Replace the temporary item with the real one from server
      queryClient.setQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate], (old) => {
        if (!old) return old;
        const updatedItems = old.items.map(item => 
          item.id === context?.tempId ? { ...item, id: createdItem.id } : item
        );
        return { ...old, items: updatedItems };
      });

      // Update local cache
      const currentData = queryClient.getQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate]);
      if (currentData) {
        cacheService.setItinerary(databaseId, currentData, startDate, endDate);
        logger.info('ITINERARY_HOOK', 'Successfully created item and updated local cache', { newItem: newItem.項目 });
      }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['itinerary', databaseId, startDate, endDate], context?.previousItinerary);
      console.error("Failed to create Notion page:", err);
      alert("新增失敗！請檢查網路或稍後再試。");
    },
  });

  const deleteItineraryItemMutation = useMutation({
    mutationFn: async ({ pageId }: { pageId: string }) => {
      return notionService.deleteNotionPage(pageId);
    },
    onMutate: async ({ pageId }: { pageId: string }) => {
      await queryClient.cancelQueries({ queryKey: ['itinerary', databaseId, startDate, endDate] });

      const previousItinerary = queryClient.getQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate]);

      queryClient.setQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate], (old) => {
        if (!old) return old;
        const updatedItems = old.items.filter(item => item.id !== pageId);
        return { ...old, items: updatedItems };
      });

      return { previousItinerary };
    },
    onSuccess: (_, { pageId }) => {
      // Update local cache after successful deletion
      const currentData = queryClient.getQueryData<ItineraryData>(['itinerary', databaseId, startDate, endDate]);
      if (currentData) {
        cacheService.setItinerary(databaseId, currentData, startDate, endDate);
        logger.info('ITINERARY_HOOK', 'Successfully deleted item and updated local cache', { pageId });
      }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['itinerary', databaseId, startDate, endDate], context?.previousItinerary);
      console.error("Failed to delete Notion page:", err);
      alert("刪除失敗！請檢查網路或稍後再試。");
    },
  });

  return {
    data,
    groupedData,
    isLoading,
    error,
    reload: reloadMutation.mutate,
    isReloading: reloadMutation.isPending,
    enhanceContent: enhanceContentMutation.mutate,
    isEnhancing: enhanceContentMutation.isPending,
    enhancementProgress,
    updateNotionPage: updateNotionPageMutation.mutate,
    isUpdatingNotion: updateNotionPageMutation.isPending,
    createItineraryItem: createItineraryItemMutation.mutate,
    isCreatingItineraryItem: createItineraryItemMutation.isPending,
    deleteItineraryItem: deleteItineraryItemMutation.mutate,
    isDeletingItineraryItem: deleteItineraryItemMutation.isPending
  };
};
