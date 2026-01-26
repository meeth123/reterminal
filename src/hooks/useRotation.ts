import { useState, useEffect, useCallback } from 'react';

interface UseRotationOptions {
  totalItems: number;
  intervalSeconds: number;
  enabled?: boolean;
}

interface UseRotationReturn {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  reset: () => void;
}

export function useRotation({
  totalItems,
  intervalSeconds,
  enabled = true,
}: UseRotationOptions): UseRotationReturn {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = useCallback(() => {
    setActiveIndex((current) => (current + 1) % totalItems);
  }, [totalItems]);

  const previous = useCallback(() => {
    setActiveIndex((current) => (current - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const reset = useCallback(() => {
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (!enabled || totalItems <= 1) return;

    const interval = setInterval(next, intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [enabled, totalItems, intervalSeconds, next]);

  return {
    activeIndex,
    setActiveIndex,
    next,
    previous,
    reset,
  };
}
