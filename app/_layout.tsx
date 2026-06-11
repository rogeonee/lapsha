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
import { Uniwind } from 'uniwind';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { UIProviders } from '~/components/ui-providers';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import '../global.css';

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export { ErrorBoundary } from 'expo-router';

// Lock to light: screens hardcode light surfaces (#F9F7F4, bg-white) and
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
                  title: 'Add New Person',
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
            </Stack>
          </ThemeProvider>
        </UIProviders>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
