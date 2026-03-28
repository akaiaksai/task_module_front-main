import { useRef, useCallback } from 'react';

export const useInitializationFlag = () => {
  const initializedRef = useRef(false);

  const resetInitialization = useCallback(() => {
    initializedRef.current = false;
  }, []);

  const markAsInitialized = useCallback(() => {
    initializedRef.current = true;
  }, []);

  return {
    isInitialized: initializedRef.current,
    markAsInitialized,
    resetInitialization,
  };
};
