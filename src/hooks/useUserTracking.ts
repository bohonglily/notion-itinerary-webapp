import { useCallback } from 'react';
import { logger } from '../services/logger-service';

export const useUserTracking = () => {
  const trackUserAction = useCallback((action: string, data?: any) => {
    logger.userAction(action, data);
  }, []);

  const trackPageView = useCallback((page: string, data?: any) => {
    logger.userAction(`PAGE_VIEW: ${page}`, data);
  }, []);

  const trackFeatureUsage = useCallback((feature: string, data?: any) => {
    logger.userAction(`FEATURE_USAGE: ${feature}`, data);
  }, []);

  const trackError = useCallback((error: string, data?: any) => {
    logger.userAction(`USER_ERROR: ${error}`, data);
  }, []);

  return {
    trackUserAction,
    trackPageView,
    trackFeatureUsage,
    trackError
  };
};