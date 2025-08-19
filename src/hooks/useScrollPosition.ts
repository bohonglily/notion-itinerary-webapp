import { useState, useEffect } from 'react';

interface ScrollPositionHook {
  isScrolled: boolean;
  scrollY: number;
  scrollDirection: 'up' | 'down' | 'none';
}

/**
 * 滾動位置監聽 Hook
 * @param threshold 觸發 isScrolled 的滾動閾值（預設 100px）
 * @returns 滾動狀態資訊
 */
export const useScrollPosition = (threshold: number = 100): ScrollPositionHook => {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'none'>('none');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollInfo = () => {
      const currentScrollY = window.scrollY;
      
      // 更新滾動位置
      setScrollY(currentScrollY);
      
      // 更新是否已滾動
      setIsScrolled(currentScrollY > threshold);
      
      // 更新滾動方向
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      } else {
        setScrollDirection('none');
      }
      
      setLastScrollY(currentScrollY);
    };

    // 使用 passive 監聽器提升效能
    const options = { passive: true };
    
    // 初始化
    updateScrollInfo();
    
    // 添加事件監聽器
    window.addEventListener('scroll', updateScrollInfo, options);
    window.addEventListener('resize', updateScrollInfo, options);

    return () => {
      window.removeEventListener('scroll', updateScrollInfo);
      window.removeEventListener('resize', updateScrollInfo);
    };
  }, [threshold, lastScrollY]);

  return {
    isScrolled,
    scrollY,
    scrollDirection
  };
};