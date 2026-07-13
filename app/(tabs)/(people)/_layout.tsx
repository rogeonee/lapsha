import { Stack } from 'expo-router';
import { palette } from '~/lib/theme';

export const unstable_settings = {
  initialRouteName: 'people',
};

const isIOS = process.env.EXPO_OS === 'ios';

export default function PeopleStackLayout() {
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
      <Stack.Screen
        name="people"
        options={{ title: 'People', headerLargeTitle: true }}
      />
      <Stack.Screen name="person/[id]" options={{ headerLargeTitle: false }} />
    </Stack>
  );
}
