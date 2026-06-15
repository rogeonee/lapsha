import {
  FloatingActionButton,
  Host,
  Icon,
} from '@expo/ui/jetpack-compose';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Android quick-add trigger: a Material 3 FAB floating above the
 * native bottom tabs. The wrapper covers the screen but passes
 * touches through everywhere except the button itself.
 */
export function QuickAddFab({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-0 items-end justify-end"
    >
      <Host
        matchContents
        // 80dp M3 bottom-nav height + 16dp clearance above it
        style={{ marginRight: 16, marginBottom: insets.bottom + 96 }}
      >
        <FloatingActionButton onClick={onPress} containerColor="#FBEAC9">
          <FloatingActionButton.Icon>
            <Icon source={require('~/assets/icons/add.xml')} tint="#B07818" />
          </FloatingActionButton.Icon>
        </FloatingActionButton>
      </Host>
    </View>
  );
}
