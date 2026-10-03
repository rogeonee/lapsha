import { useHeaderHeight } from 'expo-router/react-navigation';
import { View, useWindowDimensions } from 'react-native';
import {
  useSafeAreaInsets,
  useSafeAreaFrame,
} from 'react-native-safe-area-context';
import { Abby } from '~/components/ui/abby';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export function EmptyState({
  kind,
  onPress,
}: {
  kind: 'welcome' | 'people' | 'dates';
  onPress: () => void;
}) {
  const { height, fontScale } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const hasPeople = kind === 'dates';

  return (
    <View
      className="grow items-center justify-center px-6 py-8"
      // iOS's automatic scroll insets sit outside Yoga's layout. Size the
      // empty section to the space between the measured header and tab bar.
      // Android's in-content title and tab layout already reserve that space.
      style={
        process.env.EXPO_OS === 'ios'
          ? {
              minHeight: Math.max(
                0,
                frame.height - headerHeight - insets.bottom,
              ),
            }
          : undefined
      }
    >
      <Abby
        pose={hasPeople ? 'dates' : 'curious'}
        size={height < 700 ? 156 : 200}
      />
      {/* Refresh native text measurements when an inactive tab's type size changes. */}
      <View key={fontScale} className="mt-5 w-full max-w-80 items-center gap-3">
        <Text
          accessibilityRole="header"
          className="text-center text-xl font-medium"
        >
          {hasPeople
            ? 'Good days to remember'
            : kind === 'welcome'
              ? 'Remember the little things'
              : 'Start with someone you care about'}
        </Text>
        <Text className="text-center text-base leading-6 text-muted-foreground">
          {hasPeople
            ? 'Add a birthday or another special date to someone. Their next occasion will appear here.'
            : 'Favorite things, important dates, and details worth keeping close.'}
        </Text>
        <Button
          onPress={onPress}
          className="mt-3 h-auto min-h-[48px] max-w-full px-6 py-3"
        >
          <Text className="text-center font-medium">
            {hasPeople ? 'Add a date' : 'Add someone'}
          </Text>
        </Button>
      </View>
    </View>
  );
}
