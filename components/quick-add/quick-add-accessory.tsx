import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Pressable } from 'react-native';
import { Text } from '~/components/ui/text';

/**
 * Content for the iOS 26+ tab bar bottom accessory: a quick-add strip
 * that opens the EntrySheet from any tab.
 *
 * The system renders TWO copies of this component simultaneously — one for
 * the 'regular' placement (above the tab bar) and one for 'inline' (docked
 * beside the minimized tab bar) — and state is NOT shared between them.
 * Keep this component stateless; the sheet and its state live in the tab
 * layout and arrive via `onPress`.
 */
export function QuickAddAccessory({ onPress }: { onPress: () => void }) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const inline = placement === 'inline';

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel="Quick add a fact or date"
      className={
        inline
          ? 'flex-1 flex-row items-center justify-center'
          : 'flex-1 flex-row items-center justify-between px-5'
      }
    >
      {!inline && (
        <Text className="text-base text-muted-foreground">Quick add…</Text>
      )}
      <Image
        source="sf:plus.circle.fill"
        tintColor="#F6B756"
        style={{ width: 24, height: 24 }}
      />
    </Pressable>
  );
}
