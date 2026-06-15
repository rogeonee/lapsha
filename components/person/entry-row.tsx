import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

/**
 * A row inside a person-screen card: optional caption label over a value,
 * tap to edit, swipe left to delete. Shared by facts and dates.
 */
export function EntryRow({
  label,
  value,
  divider,
  onPress,
  onDelete,
}: {
  label?: string | null;
  value: string;
  divider?: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const renderDeleteAction = (
    _progress: unknown,
    _translation: unknown,
    methods: SwipeableMethods,
  ) => (
    <Pressable
      onPress={() => {
        methods.close();
        onDelete();
      }}
      className="bg-destructive items-center justify-center w-20"
      accessibilityLabel={`Delete ${label || value}`}
    >
      <Image
        source="sf:trash.fill"
        tintColor="white"
        style={{ width: 18, height: 18 }}
      />
    </Pressable>
  );

  return (
    <View className={cn(divider && 'border-t border-black/5')}>
      <Swipeable
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={renderDeleteAction}
      >
        <Pressable
          onPress={onPress}
          className="bg-white px-4 py-3 active:bg-black/5"
        >
          {label ? (
            <Text className="text-xs text-muted-foreground mb-0.5">
              {label}
            </Text>
          ) : null}
          <Text selectable className="text-base">
            {value}
          </Text>
        </Pressable>
      </Swipeable>
    </View>
  );
}

/** "Add …" row at the foot of a card section */
export function AddRow({
  title,
  divider,
  onPress,
}: {
  title: string;
  divider?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-2 px-4 py-3 active:bg-black/5',
        divider && 'border-t border-black/5',
      )}
    >
      <Image
        source="sf:plus.circle.fill"
        tintColor="#F6B756"
        style={{ width: 18, height: 18 }}
      />
      <Text className="text-base" style={{ color: '#B07818' }}>
        {title}
      </Text>
    </Pressable>
  );
}
