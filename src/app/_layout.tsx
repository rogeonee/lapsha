import {
  Observe,
  ObserveRoot,
  type ObserveErrorBoundaryFallbackProps,
} from 'expo-observe';
import {
  DarkTheme,
  DefaultTheme,
  ErrorBoundary as RouterErrorBoundary,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import type { Theme } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Uniwind } from 'uniwind';
import { CaptureFeedbackProvider } from '~/components/gifts/capture-feedback';
import UIProviders from '~/components/ui-providers';
import { NAV_THEME } from '~/lib/constants';
import { palette } from '~/lib/theme';
import { useColorScheme } from '~/lib/useColorScheme';
import { CurrentDayProvider } from '~/lib/use-current-day';
import { StartupReadyContext } from '~/lib/use-observe-screen';
import { recoverGiftLibrarySelection } from '~/lib/recover-gift-library-selection';
import { recoverGiftCaptures } from '~/api/gifts/capture-service';
import '../global.css';

const isIOS = process.env.EXPO_OS === 'ios';
const splashFadeDuration = isIOS ? 150 : 0;

Observe.configure({
  integrations: { 'expo-router': { filteredParams: ['id', 'personId'] } },
});

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export function ErrorBoundary(props: ErrorBoundaryProps) {
  useEffect(() => {
    Observe.reportError(props.error);
  }, [props.error]);

  return <RouterErrorBoundary {...props} />;
}

function ObserveFallback({
  error,
  resetError,
}: ObserveErrorBoundaryFallbackProps) {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <RouterErrorBoundary
      error={
        error instanceof Error ? error : new Error('Unable to display Lapsha')
      }
      retry={async () => resetError()}
    />
  );
}

// Lock to light: screens use light surfaces (bg-paper, bg-white) and
// the warm palette has no designed dark counterpart yet, so system dark
// mode renders foreground text nearly invisible. Uniwind needs its own
// explicit lock — on cold start it captures the system scheme before the
// Appearance override applies (HeroUI components follow Uniwind). Remove
// both together with app.json userInterfaceStyle when a dark theme lands.
Appearance.setColorScheme('light');
Uniwind.setTheme('light');

SplashScreen.preventAutoHideAsync();
if (isIOS) {
  SplashScreen.setOptions({ fade: true, duration: splashFadeDuration });
}

function Root() {
  const { isDarkColorScheme } = useColorScheme();
  const [startupReady, setStartupReady] = useState(false);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      recoverGiftCaptures();
      if (!isIOS) await recoverGiftLibrarySelection();
      if (!active) return;
      SplashScreen.hide();
      // Native hide returns before the iOS fade finishes.
      timeout = setTimeout(() => setStartupReady(true), splashFadeDuration);
    })();
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <StartupReadyContext value={startupReady}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <UIProviders>
            <CaptureFeedbackProvider>
              <CurrentDayProvider>
                <ThemeProvider
                  value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}
                >
                  <StatusBar style={!isDarkColorScheme ? 'dark' : 'light'} />
                  <Stack>
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="gift-capture"
                      options={{ headerShown: false, animation: 'fade' }}
                    />
                    <Stack.Screen
                      name="gift-inbox"
                      options={{
                        title: 'Unsorted gift ideas',
                        headerTintColor: palette.broth,
                        headerStyle: { backgroundColor: palette.paper },
                        headerShadowVisible: false,
                      }}
                    />
                    <Stack.Screen
                      name="gift-editor"
                      options={{
                        title: 'Gift idea',
                        headerTintColor: palette.broth,
                        headerStyle: { backgroundColor: palette.paper },
                        headerShadowVisible: false,
                        contentStyle: { backgroundColor: palette.paper },
                      }}
                    />
                    <Stack.Screen
                      name="add-person"
                      options={{
                        title: 'New Person',
                        ...(isIOS
                          ? {
                              presentation: 'modal' as const,
                              headerTintColor: palette.broth,
                              contentStyle: { backgroundColor: palette.paper },
                              headerTransparent: true,
                              headerShadowVisible: false,
                              headerBlurEffect: 'none' as const,
                            }
                          : {
                              // Android: the route is an invisible host for the
                              // HeroUI bottom sheet (AddPersonSheet), which
                              // renders its own scrim and pops the route on close
                              presentation: 'transparentModal' as const,
                              animation: 'none' as const,
                              headerShown: false,
                              contentStyle: { backgroundColor: 'transparent' },
                            }),
                      }}
                    />
                  </Stack>
                </ThemeProvider>
              </CurrentDayProvider>
            </CaptureFeedbackProvider>
          </UIProviders>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </StartupReadyContext>
  );
}

export default function RootLayout() {
  return (
    <ObserveRoot
      errorBoundaryFallback={(props) => <ObserveFallback {...props} />}
    >
      <Root />
    </ObserveRoot>
  );
}
