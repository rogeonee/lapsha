import { Stack } from 'expo-router';
import { palette } from '~/lib/theme';

export const unstable_settings = {
  initialRouteName: 'index',
};

const isIOS = process.env.EXPO_OS === 'ios';

export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: palette.broth,
        contentStyle: { backgroundColor: palette.paper },
        ...(isIOS
          ? {
              headerTransparent: true,
              headerShadowVisible: false,
              headerLargeTitleShadowVisible: false,
              headerLargeStyle: { backgroundColor: 'transparent' },
              headerBlurEffect: 'none',
              headerBackButtonDisplayMode: 'minimal',
            }
          : {
              // Header sits on Paper like the screen, no elevation seam
              headerStyle: { backgroundColor: palette.paper },
              headerShadowVisible: false,
            }),
      }}
    >
      {/* Android draws its own collapsing large-title header in-screen
          (use-collapsing-header); the native pinned toolbar stays hidden. */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Upcoming',
          headerLargeTitle: true,
          headerShown: isIOS,
        }}
      />
      <Stack.Screen name="person/[id]" options={{ headerLargeTitle: false }} />
    </Stack>
  );
}
