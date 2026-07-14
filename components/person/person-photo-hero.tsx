import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Avatar } from '~/components/person/avatar';
import { Text } from '~/components/ui/text';

const COMPACT_PHOTO_SIZE = 96;
const COMPACT_PHOTO_GAP = 16;
const PHOTO_ACTION_GAP = 8;
const PHOTO_ACTION_HEIGHT = 20;
const EXPANDED_SECTION_GAP = 20;

export function personPhotoCompactHeight(headerHeight: number): number {
  return (
    headerHeight +
    COMPACT_PHOTO_GAP +
    COMPACT_PHOTO_SIZE +
    PHOTO_ACTION_GAP +
    PHOTO_ACTION_HEIGHT +
    EXPANDED_SECTION_GAP
  );
}

export function personPhotoExpandedHeight(screenWidth: number): number {
  return screenWidth + EXPANDED_SECTION_GAP;
}

export function PersonPhotoHero({
  name,
  photo,
  screenWidth,
  headerHeight,
  progress,
  isExpanded,
  onToggle,
  onEdit,
}: {
  name: string;
  photo: string | null;
  screenWidth: number;
  headerHeight: number;
  progress: SharedValue<number>;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const compactPhotoTop = headerHeight + COMPACT_PHOTO_GAP;
  const compactHeight = personPhotoCompactHeight(headerHeight);
  const expandedHeight = personPhotoExpandedHeight(screenWidth);
  const compactScale = COMPACT_PHOTO_SIZE / screenWidth;
  const compactCenterY = compactPhotoTop + COMPACT_PHOTO_SIZE / 2;
  const photoGrowth = Math.max(
    1,
    screenWidth - (compactPhotoTop + COMPACT_PHOTO_SIZE),
  );
  const actionCoverProgress = Math.min(0.15, PHOTO_ACTION_GAP / photoGrowth);
  const photoActionTop =
    compactPhotoTop + COMPACT_PHOTO_SIZE + PHOTO_ACTION_GAP;

  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [compactHeight, expandedHeight],
      Extrapolation.CLAMP,
    ),
  }));

  const positionStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [compactCenterY - screenWidth / 2, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const photoStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(
      progress.value,
      [0, 1],
      [screenWidth / 2, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 1],
          [compactScale, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    opacity: progress.value < actionCoverProgress ? 1 : 0,
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0.12, 0.22],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  if (!photo) {
    return (
      <View className="items-center" style={{ height: compactHeight }}>
        <View style={{ paddingTop: compactPhotoTop }} aria-hidden>
          <Avatar name={name} size={COMPACT_PHOTO_SIZE} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={onEdit}
          className="active:opacity-80"
          style={{ marginTop: 8 }}
        >
          <Text className="text-base text-broth">Add photo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View
      className="relative overflow-hidden bg-paper"
      style={containerStyle}
    >
      <Animated.View
        pointerEvents="none"
        className="absolute top-0 left-0"
        style={[{ width: screenWidth, height: screenWidth }, positionStyle]}
      >
        <Animated.View
          className="overflow-hidden bg-cream-swirl"
          style={[{ width: screenWidth, height: screenWidth }, photoStyle]}
        >
          <Image
            source={{ uri: photo }}
            style={{ width: screenWidth, height: screenWidth }}
            contentFit="cover"
            transition={150}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        className="absolute top-0 right-0 left-0"
        style={[{ height: headerHeight + 72 }, scrimStyle]}
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.48)', 'rgba(0, 0, 0, 0)']}
          locations={[0, 1]}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Collapse photo' : 'Expand photo'}
        accessibilityHint={
          isExpanded
            ? 'Returns to the compact avatar'
            : 'Shows the photo at full width'
        }
        onPress={onToggle}
        className="absolute"
        style={
          isExpanded
            ? { top: 0, left: 0, width: screenWidth, height: screenWidth }
            : {
                top: compactPhotoTop,
                left: (screenWidth - COMPACT_PHOTO_SIZE) / 2,
                width: COMPACT_PHOTO_SIZE,
                height: COMPACT_PHOTO_SIZE,
                borderRadius: COMPACT_PHOTO_SIZE / 2,
              }
        }
      />

      <Animated.View
        className="absolute right-0 left-0 items-center"
        pointerEvents={isExpanded ? 'none' : 'auto'}
        style={[{ top: photoActionTop }, actionStyle]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change photo"
          onPress={onEdit}
          className="active:opacity-80"
        >
          <Text className="text-base text-broth">Change photo</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
