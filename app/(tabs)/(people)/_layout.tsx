import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'people',
};

const isIOS = process.env.EXPO_OS === 'ios';

export default function PeopleStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#B07818',
        contentStyle: { backgroundColor: '#F9F7F4' },
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
        name="people"
        options={{ title: 'People', headerLargeTitle: true }}
      />
      <Stack.Screen name="person/[id]" options={{ headerLargeTitle: false }} />
    </Stack>
  );
}
