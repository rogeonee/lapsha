import { useState } from 'react';
import {
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { Text } from '~/components/ui/text';
import { palette } from '~/lib/theme';
import type {
  CollapsingHeader,
  CollapsingHeaderOptions,
} from './use-collapsing-header.ios';

// Same height as the native Material toolbar this bar replaces.
const BAR_HEIGHT = 56;
// Screens put the large title inside their `p-4` content container
// (1rem = 14px under the Metro rem polyfill), so the collapse threshold
// includes that leading padding.
const CONTENT_TOP_PADDING = 14;
// How far the paper scrim bleeds past the bar before going transparent.
const SCRIM_FALLOFF = 24;
const TITLE_SWAP_DURATION = 175;
// The compact title rises into place as it fades in and sinks as it
// fades out, matching the iOS 26 directional swap.
const SMALL_TITLE_RISE = 8;
// Titles swap as a fade+blur combo (iOS 26): each renders a crisp copy
// and a statically blurred twin (RN `filter`, Android 12+ RenderEffect;
// animating the radius itself is not supported), and the swap crossfades
// between them so text appears to sharpen in and haze out.
const SMALL_TITLE_BLUR = 3;
const LARGE_TITLE_BLUR = 6;

// Android has no native collapsing large-title header reachable from
// expo-router (the classic screens header no-ops every largeTitle prop),
// so this hand-rolls the iOS 26 pattern: content dissolves under an
// always-on progressive paper scrim (a gradient stand-in for the iOS
// progressive blur — Android live blur is still experimental and janky),
// and the large/small titles swap with a quick timed fade at a single
// threshold so both are never readable at once.
export function useCollapsingHeader({
  title,
  right,
}: CollapsingHeaderOptions): CollapsingHeader {
  const insets = useSafeAreaInsets();
  const [titleHeight, setTitleHeight] = useState(41);
  // Mirrored flags: the shared value drives the UI-thread title swap
  // (React state would cancel in-flight withTiming on re-render); the
  // React state drives pointer-event props.
  const collapsedSv = useSharedValue(false);
  const [collapsed, setCollapsed] = useState(false);

  // Swap once the large title has fully scrolled under the bar.
  const collapsePoint = CONTENT_TOP_PADDING + titleHeight;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = event.nativeEvent.contentOffset.y >= collapsePoint;
    if (collapsedSv.value !== next) collapsedSv.value = next;
    setCollapsed(next);
  };

  // 0 = expanded (large title showing), 1 = collapsed (compact bar title).
  const collapseProgress = useDerivedValue(() =>
    withTiming(collapsedSv.value ? 1 : 0, { duration: TITLE_SWAP_DURATION }),
  );

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: 1 - collapseProgress.value,
  }));

  const largeTitleBlurStyle = useAnimatedStyle(() => ({
    opacity: collapseProgress.value,
  }));

  const smallTitleStyle = useAnimatedStyle(() => ({
    opacity: collapseProgress.value,
    transform: [
      { translateY: (1 - collapseProgress.value) * SMALL_TITLE_RISE },
    ],
  }));

  const smallTitleBlurStyle = useAnimatedStyle(() => ({
    opacity: 1 - collapseProgress.value,
  }));

  const barHeight = insets.top + BAR_HEIGHT;
  const scrimHeight = barHeight + SCRIM_FALLOFF;
  // Solid paper through the status bar, easing out below the bar.
  const statusStop = insets.top / scrimHeight;
  const midStop = (insets.top + BAR_HEIGHT * 0.55) / scrimHeight;

  const largeTitle = (
    <View style={{ paddingTop: barHeight }}>
      <Animated.View style={largeTitleStyle}>
        <Text
          accessibilityRole="header"
          style={styles.largeTitle}
          onLayout={(event) => setTitleHeight(event.nativeEvent.layout.height)}
        >
          {title}
        </Text>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.largeTitleBlurTwin,
            largeTitleBlurStyle,
          ]}
        >
          <Text numberOfLines={1} style={styles.largeTitle}>
            {title}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );

  const bar = (
    <View
      pointerEvents="box-none"
      style={[styles.barContainer, { height: scrimHeight }]}
    >
      <Svg
        pointerEvents="none"
        width="100%"
        height={scrimHeight}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgLinearGradient id="header-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.paper} stopOpacity="1" />
            <Stop
              offset={String(statusStop)}
              stopColor={palette.paper}
              stopOpacity="1"
            />
            <Stop
              offset={String(midStop)}
              stopColor={palette.paper}
              stopOpacity="0.8"
            />
            <Stop offset="1" stopColor={palette.paper} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height={scrimHeight}
          fill="url(#header-scrim)"
        />
      </Svg>
      <View
        style={[styles.barRow, { marginTop: insets.top }]}
        pointerEvents={collapsed ? 'auto' : 'box-none'}
        // Once the compact title owns the bar, swallow taps meant for rows
        // hidden behind it; while expanded they pass through to the content.
        onStartShouldSetResponder={() => collapsed}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.barTitleWrap, smallTitleStyle]}
        >
          <Text numberOfLines={1} style={styles.barTitle}>
            {title}
          </Text>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.smallTitleBlurTwin,
              smallTitleBlurStyle,
            ]}
          >
            <Text numberOfLines={1} style={styles.barTitle}>
              {title}
            </Text>
          </Animated.View>
        </Animated.View>
        {right ? <View style={styles.barAccessory}>{right}</View> : null}
      </View>
    </View>
  );

  return { onScroll, largeTitle, bar };
}

const styles = StyleSheet.create({
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    color: palette.broth,
  },
  barContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  barRow: {
    height: BAR_HEIGHT,
    justifyContent: 'center',
  },
  barTitleWrap: {
    position: 'absolute',
    left: BAR_HEIGHT,
    right: BAR_HEIGHT,
    alignItems: 'center',
  },
  barTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.broth,
  },
  largeTitleBlurTwin: {
    filter: [{ blur: LARGE_TITLE_BLUR }],
  },
  smallTitleBlurTwin: {
    alignItems: 'center',
    filter: [{ blur: SMALL_TITLE_BLUR }],
  },
  barAccessory: {
    position: 'absolute',
    right: 6,
    height: BAR_HEIGHT,
    justifyContent: 'center',
  },
});
