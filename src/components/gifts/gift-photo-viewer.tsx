import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { palette } from '~/lib/theme';

export function GiftPhotoViewer({
  uri,
  onClose,
}: {
  uri: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const initialScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const pinch = Gesture.Pinch()
    .onStart(() => initialScale.set(scale.get()))
    .onUpdate((event) =>
      scale.set(Math.max(1, Math.min(5, initialScale.get() * event.scale))),
    )
    .onEnd(() => {
      if (scale.get() === 1) {
        x.set(0);
        y.set(0);
      }
    });
  const pan = Gesture.Pan()
    .onStart(() => {
      startX.set(x.get());
      startY.set(y.get());
    })
    .onUpdate((event) => {
      if (scale.get() > 1) {
        x.set(startX.get() + event.translationX);
        y.set(startY.get() + event.translationY);
      }
    });
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { scale: scale.get() },
    ],
  }));
  return (
    <Modal
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
    >
      <GestureHandlerRootView
        style={{
          flex: 1,
          backgroundColor: palette.ink,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <StatusBar style="light" />
        <View className="flex-row items-center justify-between px-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            onPress={onClose}
            className="min-h-14 justify-center"
          >
            <Text className="text-base text-white">Close</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              scale.set(scale.get() === 1 ? 3 : 1);
              x.set(0);
              y.set(0);
            }}
            className="min-h-14 justify-center"
          >
            <Text className="text-base text-white">Zoom / reset</Text>
          </Pressable>
        </View>
        <View className="flex-1 overflow-hidden">
          <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
            <Animated.View style={[StyleSheet.absoluteFill, style]}>
              <Image
                source={{ uri }}
                contentFit="contain"
                style={StyleSheet.absoluteFill}
                accessibilityLabel="Gift photo"
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
