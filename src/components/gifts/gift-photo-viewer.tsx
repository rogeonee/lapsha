import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useLayoutEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useKeyboardController } from 'react-native-keyboard-controller';
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnUI } from 'react-native-worklets';
import {
  boundPhotoTransform,
  photoTransformAtPoint,
  type PhotoPoint,
  type PhotoSize,
  type PhotoTransform,
} from '~/components/gifts/gift-photo-geometry';
import { CloseIcon } from '~/components/ui/icons';
import { palette } from '~/lib/theme';

export function GiftPhotoViewer({
  uri,
  onClose,
}: {
  uri: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { enabled: keyboardEnabled, setEnabled: setKeyboardEnabled } =
    useKeyboardController();
  const [keyboardWasEnabled] = useState(keyboardEnabled);

  useLayoutEffect(() => {
    if (process.env.EXPO_OS !== 'android') return;
    // Its status-bar override only updates the activity, not Modal windows.
    setKeyboardEnabled(false);
    return () => setKeyboardEnabled(keyboardWasEnabled);
  }, [keyboardWasEnabled, setKeyboardEnabled]);

  const viewport = useSharedValue<PhotoSize>({ width: 0, height: 0 });
  const imageSize = useSharedValue<PhotoSize>({ width: 0, height: 0 });
  const transform = useSharedValue<PhotoTransform>({ scale: 1, x: 0, y: 0 });
  const pinchStart = useSharedValue<PhotoTransform>({ scale: 1, x: 0, y: 0 });
  const pinchOrigin = useSharedValue<PhotoPoint>({ x: 0, y: 0 });
  const pinching = useSharedValue(false);
  const panStart = useSharedValue<PhotoTransform>({ scale: 1, x: 0, y: 0 });
  const panOrigin = useSharedValue<PhotoPoint>({ x: 0, y: 0 });
  const panNeedsRebase = useSharedValue(false);

  const currentTransform = () => {
    'worklet';
    return boundPhotoTransform(
      imageSize.get(),
      viewport.get(),
      transform.get(),
    );
  };
  const animateTo = (next: PhotoTransform) => {
    'worklet';
    cancelAnimation(transform);
    transform.set(
      withTiming(next, { duration: 180, reduceMotion: ReduceMotion.System }),
    );
  };
  const zoomAt = (point: PhotoPoint) => {
    'worklet';
    const bounds = viewport.get();
    const image = imageSize.get();
    if (!image.width || !bounds.width) return;
    const current = currentTransform();
    animateTo(
      current.scale > 1.01
        ? { scale: 1, x: 0, y: 0 }
        : photoTransformAtPoint(
            image,
            bounds,
            current,
            point,
            { x: bounds.width / 2, y: bounds.height / 2 },
            3,
          ),
    );
  };
  const pinch = Gesture.Pinch()
    .onStart((event) => {
      pinching.set(true);
      panNeedsRebase.set(true);
      cancelAnimation(transform);
      pinchStart.set(currentTransform());
      pinchOrigin.set({ x: event.focalX, y: event.focalY });
    })
    .onUpdate((event) => {
      if (!imageSize.get().width) return;
      transform.set(
        photoTransformAtPoint(
          imageSize.get(),
          viewport.get(),
          pinchStart.get(),
          pinchOrigin.get(),
          { x: event.focalX, y: event.focalY },
          pinchStart.get().scale * event.scale,
        ),
      );
    })
    .onFinalize(() => {
      pinching.set(false);
      panNeedsRebase.set(true);
    });
  const pan = Gesture.Pan()
    .averageTouches(true)
    .minDistance(10)
    .onStart((event) => {
      cancelAnimation(transform);
      panStart.set(currentTransform());
      panOrigin.set({ x: event.translationX, y: event.translationY });
      panNeedsRebase.set(pinching.get() || event.numberOfPointers !== 1);
    })
    .onUpdate((event) => {
      if (pinching.get() || event.numberOfPointers !== 1) {
        panNeedsRebase.set(true);
        return;
      }
      if (panNeedsRebase.get()) {
        panStart.set(currentTransform());
        panOrigin.set({ x: event.translationX, y: event.translationY });
        panNeedsRebase.set(false);
      }
      const start = panStart.get();
      const origin = panOrigin.get();
      transform.set(
        boundPhotoTransform(imageSize.get(), viewport.get(), {
          scale: start.scale,
          x: start.x + event.translationX - origin.x,
          y: start.y + event.translationY - origin.y,
        }),
      );
    });
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(280)
    .maxDistance(10)
    .onEnd((event, success) => {
      if (success) zoomAt({ x: event.x, y: event.y });
    });
  const style = useAnimatedStyle(() => {
    // Reanimated subscribes to shared values captured directly by this mapper.
    const current = boundPhotoTransform(
      imageSize.get(),
      viewport.get(),
      transform.get(),
    );
    return {
      transform: [
        { translateX: current.x },
        { translateY: current.y },
        { scale: current.scale },
      ],
    };
  });
  const accessibilityAction = (action: string) => {
    'worklet';
    const bounds = viewport.get();
    const center = { x: bounds.width / 2, y: bounds.height / 2 };
    if (action === 'activate') {
      zoomAt(center);
    } else if (action === 'resetZoom') {
      animateTo({ scale: 1, x: 0, y: 0 });
    } else if (action === 'zoomIn' || action === 'zoomOut') {
      if (!imageSize.get().width || !bounds.width) return;
      const current = currentTransform();
      animateTo(
        photoTransformAtPoint(
          imageSize.get(),
          bounds,
          current,
          center,
          center,
          current.scale + (action === 'zoomIn' ? 1 : -1),
        ),
      );
    }
  };
  return (
    <Modal
      visible={process.env.EXPO_OS !== 'android' || !keyboardEnabled}
      onRequestClose={onClose}
      // Reapply after the dialog copies the activity's initial bar appearance.
      onShow={() => StatusBar.setStyle('light')}
      statusBarTranslucent
      navigationBarTranslucent
      animationType={reduceMotion ? 'none' : 'fade'}
    >
      <GestureHandlerRootView
        style={{
          flex: 1,
          backgroundColor: palette.ink,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <StatusBar style="light" />
        <View className="px-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            onPress={onClose}
            className="items-center justify-center rounded-full active:bg-white/10"
            style={{ width: 48, height: 48 }}
          >
            <CloseIcon size={24} color={palette.cardWhite} />
          </Pressable>
        </View>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
          <View
            collapsable={false}
            className="flex-1 overflow-hidden"
            accessible
            accessibilityRole="image"
            accessibilityLabel="Gift photo"
            accessibilityHint="Use the actions to zoom in, zoom out, or reset."
            accessibilityActions={[
              { name: 'activate', label: 'Zoom or reset' },
              { name: 'zoomIn', label: 'Zoom in' },
              { name: 'zoomOut', label: 'Zoom out' },
              { name: 'resetZoom', label: 'Reset zoom' },
            ]}
            onAccessibilityAction={(event) =>
              scheduleOnUI(accessibilityAction, event.nativeEvent.actionName)
            }
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              scheduleOnUI(() => {
                'worklet';
                const previous = viewport.get();
                if (previous.width === width && previous.height === height)
                  return;
                viewport.set({ width, height });
                cancelAnimation(transform);
                transform.set({ scale: 1, x: 0, y: 0 });
              });
            }}
          >
            <Animated.View
              pointerEvents="none"
              aria-hidden
              style={[StyleSheet.absoluteFill, style]}
            >
              <Image
                source={{ uri }}
                contentFit="contain"
                style={StyleSheet.absoluteFill}
                onLoad={(event) => {
                  const { width, height } = event.source;
                  imageSize.set({ width, height });
                }}
              />
            </Animated.View>
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}
