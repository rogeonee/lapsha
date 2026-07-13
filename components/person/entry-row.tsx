import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { BIRTHDAY_LABEL } from '~/api/dates/dates-service';
import { PlusCircleIcon, TrashIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { formatDateDetail, formatMonthShort } from '~/lib/dates';
import { palette } from '~/lib/theme';
import { cn } from '~/lib/utils';
import type { Date as PersonDate } from '~/types/db';

const DELETE_ACTION_WIDTH = 80;
const SWIPE_OPEN_THRESHOLD = 32;
const SWIPE_VELOCITY_THRESHOLD = 500;

/** Swipe-left-to-delete wrapper shared by fact and date rows. */
function SwipeableRow({
  deleteLabel,
  divider,
  onPress,
  onDelete,
  children,
}: {
  deleteLabel: string;
  divider?: boolean;
  onPress: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [revealWidth, setRevealWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const animateTo = (width: number) => {
    if (reduceMotion) {
      setRevealWidth(width);
      return;
    }
    const startWidth = revealWidth;
    requestAnimationFrame((startedAt) => {
      const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / 180);
        const eased = 1 - Math.pow(1 - progress, 3);
        setRevealWidth(startWidth + (width - startWidth) * eased);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };
  const close = () => {
    animateTo(0);
    setIsOpen(false);
  };
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-10, 10])
    .runOnJS(true)
    .onEnd((event) => {
      const nextWidth = Math.min(
        DELETE_ACTION_WIDTH,
        Math.max(0, (isOpen ? DELETE_ACTION_WIDTH : 0) - event.translationX),
      );
      const shouldOpen =
        event.velocityX < -SWIPE_VELOCITY_THRESHOLD ||
        (event.velocityX <= SWIPE_VELOCITY_THRESHOLD &&
          nextWidth >= SWIPE_OPEN_THRESHOLD);
      animateTo(shouldOpen ? DELETE_ACTION_WIDTH : 0);
      setIsOpen(shouldOpen);
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        className={cn('overflow-hidden', divider && 'border-t border-black/5')}
      >
        <Pressable
          onPress={() => {
            if (isOpen) close();
            else onPress();
          }}
          unstable_pressDelay={80}
          className="bg-white active:bg-black/5"
          style={{ zIndex: 1 }}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${deleteLabel}`}
          accessibilityHint="Swipe left to reveal delete"
          accessibilityActions={[
            { name: 'delete', label: `Delete ${deleteLabel}` },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'delete') onDelete();
          }}
        >
          <View pointerEvents="none" aria-hidden>
            {children}
          </View>
        </Pressable>
        <View
          className="absolute top-0 right-0 bottom-0 overflow-hidden"
          style={{ width: revealWidth, zIndex: 2 }}
        >
          <Pressable
            onPress={() => {
              close();
              onDelete();
            }}
            className="absolute top-0 right-0 bottom-0 items-center justify-center bg-destructive active:opacity-80"
            style={{ width: DELETE_ACTION_WIDTH }}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${deleteLabel}`}
          >
            <TrashIcon color="white" />
          </Pressable>
        </View>
      </View>
    </GestureDetector>
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
      onPress={onPress}
      onDelete={onDelete}
    >
      <View className="px-4 py-3">
        {label ? (
          <Text
            selectable={false}
            className="mb-0.5 text-sm text-muted-foreground"
          >
            {label}
          </Text>
        ) : null}
        <Text selectable={false} className="text-lg">
          {value}
        </Text>
      </View>
    </SwipeableRow>
  );
}

/**
 * A date row: day-over-month block on the left, label, muted year + age
 * detail. Tap to edit, swipe left to delete.
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
    <SwipeableRow
      deleteLabel={label}
      divider={divider}
      onPress={onPress}
      onDelete={onDelete}
    >
      <View className="flex-row items-center gap-3 px-4 py-3">
        <View className="w-11 items-center">
          <Text selectable={false} className="text-lg font-semibold">
            {date.day}
          </Text>
          <Text selectable={false} className="text-sm text-muted-foreground">
            {formatMonthShort(date)}
          </Text>
        </View>
        <View className="flex-1">
          <Text selectable={false} className="text-lg font-medium">
            {label}
          </Text>
          {detail ? (
            <Text
              selectable={false}
              className="mt-0.5 text-base text-muted-foreground"
            >
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
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
