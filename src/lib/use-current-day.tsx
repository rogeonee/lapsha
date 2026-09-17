import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from 'expo-router/react-navigation';
import {
  createCurrentDayMonitor,
  getCurrentDaySnapshot,
  getSystemTimeZone,
  type CalendarDay,
} from '~/lib/current-day';

const TIMEZONE_CHECK_INTERVAL_MS = 60_000;

/**
 * Keeps relative calendar UI on one local-day reference. It refreshes at
 * midnight, after foregrounding or focusing, and shortly after a timezone
 * change even if the app remains active.
 */
interface CurrentDayContextValue {
  today: CalendarDay;
  refresh: () => void;
}

const CurrentDayContext = createContext<CurrentDayContextValue | null>(null);

export function CurrentDayProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(getCurrentDaySnapshot);
  const initialSnapshot = useRef(snapshot);
  const monitor = useRef<ReturnType<typeof createCurrentDayMonitor> | null>(
    null,
  );

  const refresh = () => {
    monitor.current?.resync();
  };

  useEffect(() => {
    monitor.current = createCurrentDayMonitor({
      now: () => new Date(),
      timeZone: getSystemTimeZone,
      initialSnapshot: initialSnapshot.current,
      onChange: setSnapshot,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      timezoneCheckInterval: TIMEZONE_CHECK_INTERVAL_MS,
    });
    monitor.current.start();
    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          monitor.current?.resync();
        }
      },
    );

    return () => {
      monitor.current?.stop();
      monitor.current = null;
      appStateSubscription.remove();
    };
  }, []);

  return (
    <CurrentDayContext value={{ today: snapshot.today, refresh }}>
      {children}
    </CurrentDayContext>
  );
}

export function useCurrentDay(): CalendarDay {
  const isFocused = useIsFocused();
  const context = useContext(CurrentDayContext);

  if (!context) {
    throw new Error('useCurrentDay must be used within CurrentDayProvider');
  }

  useEffect(() => {
    if (isFocused) context.refresh();
  }, [context, isFocused]);

  return context.today;
}
