import { useObserve } from 'expo-observe';
import { createContext, useContext, useEffect } from 'react';

export const StartupReadyContext = createContext(false);

export function useObserveScreen() {
  const startupReady = useContext(StartupReadyContext);
  const { markInteractive } = useObserve();

  useEffect(() => {
    if (startupReady) {
      markInteractive();
    }
  }, [startupReady, markInteractive]);
}
