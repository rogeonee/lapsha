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
        ...(isIOS && {
          headerTransparent: true,
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          headerLargeStyle: { backgroundColor: 'transparent' },
          headerBlurEffect: 'none',
          headerBackButtonDisplayMode: 'minimal',
        }),
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Upcoming', headerLargeTitle: true }}
      />
    </Stack>
  );
}
