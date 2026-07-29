import {
  DarkTheme,
  DefaultTheme,
  SplashScreen,
  Stack,
  ThemeProvider,
} from 'expo-router';
import type { Theme } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Uniwind } from 'uniwind';
import UIProviders from '~/components/ui-providers';
import { NAV_THEME } from '~/lib/constants';
import { palette } from '~/lib/theme';
import { useColorScheme } from '~/lib/useColorScheme';
import '../global.css';

const isIOS = process.env.EXPO_OS === 'ios';

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export { ErrorBoundary } from 'expo-router';

// Lock to light: screens use light surfaces (bg-paper, bg-white) and
// the warm palette has no designed dark counterpart yet, so system dark
// mode renders foreground text nearly invisible. Uniwind needs its own
// explicit lock — on cold start it captures the system scheme before the
// Appearance override applies (HeroUI components follow Uniwind). Remove
// both together with app.json userInterfaceStyle when a dark theme lands.
Appearance.setColorScheme('light');
Uniwind.setTheme('light');

SplashScreen.preventAutoHideAsync();

export default function Root() {
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <UIProviders>
          <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
            <StatusBar style={!isDarkColorScheme ? 'dark' : 'light'} />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
        </UIProviders>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
