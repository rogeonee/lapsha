import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import Animated, {
  createAnimatedComponent,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import type { PersonHeaderBlurProps } from './person-header-blur';

const AnimatedBlurView = createAnimatedComponent(BlurView);

export function PersonHeaderBlur({
  progress,
  hasPhoto,
}: PersonHeaderBlurProps) {
  const animatedProps = useAnimatedProps(() => ({
    intensity: hasPhoto ? 100 * (1 - progress.get()) : 100,
  }));
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: hasPhoto ? 1 - progress.get() : 1,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, animatedStyle]}
    >
      <AnimatedBlurView
        tint="systemMaterial"
        animatedProps={animatedProps}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}
