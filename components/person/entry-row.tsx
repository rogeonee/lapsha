import { Pressable, View } from 'react-native';
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { BIRTHDAY_LABEL } from '~/api/dates/dates-service';
import { PlusCircleIcon, TrashIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { formatDateDetail, formatMonthShort } from '~/lib/dates';
import { palette } from '~/lib/theme';
import { cn } from '~/lib/utils';
import type { Date as PersonDate } from '~/types/db';

/** Swipe-left-to-delete wrapper shared by fact and date rows */
function SwipeableRow({
  deleteLabel,
  divider,
  onDelete,
  children,
}: {
  deleteLabel: string;
  divider?: boolean;
  onDelete: () => void;
  children: React.ReactNode;
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
      className="w-20 items-center justify-center bg-destructive"
      accessibilityLabel={`Delete ${deleteLabel}`}
    >
      <TrashIcon color="white" />
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
        {children}
      </Swipeable>
    </View>
  );
}

/**
 * A fact row inside a person-screen card: optional caption label over a
 * value, tap to edit, swipe left to delete.
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
  return (
    <SwipeableRow
      deleteLabel={label || value}
      divider={divider}
      onDelete={onDelete}
    >
      <Pressable
        onPress={onPress}
        className="bg-white px-4 py-3 active:bg-black/5"
      >
        {label ? (
          <Text className="mb-0.5 text-sm text-muted-foreground">{label}</Text>
        ) : null}
        <Text selectable className="text-lg">
          {value}
        </Text>
      </Pressable>
    </SwipeableRow>
  );
}

/**
 * A date row in the timeline's visual language: day-over-month block on the
 * left, prominent label, muted year + age detail. Tap to edit, swipe left
 * to delete.
 */
export function DateRow({
  date,
  divider,
  onPress,
  onDelete,
}: {
  date: PersonDate;
  divider?: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  // Only the reserved lowercase 'birthday' label gets normalized;
  // user-authored labels display exactly as typed
  const label =
    date.label.toLowerCase() === BIRTHDAY_LABEL ? 'Birthday' : date.label;
  const detail = formatDateDetail(date);

  return (
    <SwipeableRow deleteLabel={label} divider={divider} onDelete={onDelete}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-3 bg-white px-4 py-3 active:bg-black/5"
      >
        <View className="w-11 items-center">
          <Text className="text-lg font-semibold">{date.day}</Text>
          <Text className="text-sm text-muted-foreground">
            {formatMonthShort(date)}
          </Text>
        </View>
        <View className="flex-1">
          <Text selectable className="text-lg font-medium">
            {label}
          </Text>
          {detail ? (
            <Text selectable className="mt-0.5 text-base text-muted-foreground">
              {detail}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </SwipeableRow>
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
      <PlusCircleIcon color={palette.noodleGold} />
      <Text className="text-base text-broth">{title}</Text>
    </Pressable>
  );
}
