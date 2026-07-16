import { useState } from 'react';
import {
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
// Scroll distance over which the pinned bar chrome crossfades in.
const FADE_DISTANCE = 24;

// Android has no native collapsing large-title header reachable from
// expo-router (the classic screens header no-ops every largeTitle prop),
// so this hand-rolls the iOS pattern: a large in-content title that
// scrolls away while a pinned compact bar fades in over it.
export function useCollapsingHeader({
  title,
  right,
}: CollapsingHeaderOptions): CollapsingHeader {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [titleHeight, setTitleHeight] = useState(41);
  const [collapsed, setCollapsed] = useState(false);

  // The bar turns opaque once the large title has scrolled under it.
  const collapsePoint = CONTENT_TOP_PADDING + titleHeight;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollY.value = y;
    setCollapsed(y >= collapsePoint - FADE_DISTANCE / 2);
  };

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [collapsePoint - FADE_DISTANCE, collapsePoint],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const barHeight = insets.top + BAR_HEIGHT;

  const largeTitle = (
    <View style={{ paddingTop: barHeight }}>
      <Text
        accessibilityRole="header"
        style={styles.largeTitle}
        onLayout={(event) => setTitleHeight(event.nativeEvent.layout.height)}
      >
        {title}
      </Text>
    </View>
  );

  const bar = (
    <View
      pointerEvents="box-none"
      style={[styles.barContainer, { height: barHeight }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.chrome, chromeStyle]}
      />
      <View
        style={[styles.barRow, { marginTop: insets.top }]}
        pointerEvents={collapsed ? 'auto' : 'box-none'}
        // Once opaque, the bar must swallow taps meant for rows hidden
        // behind it; while transparent they pass through to the content.
        onStartShouldSetResponder={() => collapsed}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.barTitleWrap, chromeStyle]}
        >
          <Text numberOfLines={1} style={styles.barTitle}>
            {title}
          </Text>
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
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.paper,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
  barAccessory: {
    position: 'absolute',
    right: 6,
    height: BAR_HEIGHT,
    justifyContent: 'center',
  },
});
