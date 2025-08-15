import { useEffect, useRef } from 'react';
import { logger } from '../services/logger-service';

export const usePerformance = () => {
  const startTime = useRef<number>(Date.now());

  const measurePerformance = (operation: string, data?: any) => {
    const duration = Date.now() - startTime.current;
    logger.performance(operation, duration, data);
    startTime.current = Date.now(); // Reset for next measurement
  };

  const startMeasurement = () => {
    startTime.current = Date.now();
  };

  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  return {
    measurePerformance,
    startMeasurement
  };
};