import {
  FloatingActionButton,
  Host,
  Icon,
} from '@expo/ui/jetpack-compose';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '~/lib/theme';

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
        <FloatingActionButton
          onClick={onPress}
          containerColor={palette.creamSwirl}
        >
          <FloatingActionButton.Icon>
            <Icon
              source={require('~/assets/icons/add.xml')}
              tint={palette.broth}
            />
          </FloatingActionButton.Icon>
        </FloatingActionButton>
      </Host>
    </View>
  );
}
