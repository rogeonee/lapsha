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
import {
  personPhotoCompactHeight,
  personPhotoExpandedHeight,
  personPhotoLayout,
} from '~/components/person/person-photo-layout';

export function PersonPhotoHero({
  name,
  photo,
  screenWidth,
  headerHeight,
  progress,
  isExpanded,
  onToggle,
  onAddPhoto,
}: {
  name: string;
  photo: string | null;
  screenWidth: number;
  headerHeight: number;
  progress: SharedValue<number>;
  isExpanded: boolean;
  onToggle: () => void;
  onAddPhoto: () => void;
}) {
  const compactPhotoTop = headerHeight + personPhotoLayout.compactGap;
  const compactHeight = personPhotoCompactHeight(headerHeight);
  const expandedHeight = personPhotoExpandedHeight(screenWidth);
  const compactScale = personPhotoLayout.compactSize / screenWidth;
  const compactCenterY = compactPhotoTop + personPhotoLayout.compactSize / 2;

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          accessibilityHint="Opens the photo library"
          onPress={onAddPhoto}
          className="active:opacity-80"
          style={{ marginTop: compactPhotoTop }}
        >
          <Avatar name={name} size={personPhotoLayout.compactSize} />
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
                left: (screenWidth - personPhotoLayout.compactSize) / 2,
                width: personPhotoLayout.compactSize,
                height: personPhotoLayout.compactSize,
                borderRadius: personPhotoLayout.compactSize / 2,
              }
        }
      />
    </Animated.View>
  );
}
