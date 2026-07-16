import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import EntrySheet, {
  type EntrySheetConfig,
} from '~/components/entry/entry-sheet';
import QuickAddFab from '~/components/quick-add/quick-add-fab';
import { palette } from '~/lib/theme';

// iOS 26 renders a `role="search"` tab as a detached circular button on the
// right of the tab bar (build with Xcode 26). We co-opt it as the quick-add
// button there. On older iOS the same role would show as a plain inline tab,
// so we hide it; Android keeps the FAB.
const SEARCH_TAB_QUICK_ADD =
  Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;

// Android's tab bar defaults every slot to Material You dynamic (wallpaper
// derived) colors, so pin them all to the Lapsha palette: a Deep Paper bar
// (one step below Paper, so it separates from screens without a border), a
// Cream Swirl indicator pill, Broth selected items, Ink Muted idle items.
// Kept Android-only so iOS retains the system blur bar untouched.
// The ripple is masked to the indicator pill and drawn over the icon on
// press, so it must be a low-alpha state layer (M3 uses ~12%); an opaque
// color flashes a solid pill that swallows the icon.
const ANDROID_TAB_BAR_PROPS =
  Platform.OS === 'android'
    ? {
        backgroundColor: palette.paperDeep,
        indicatorColor: palette.creamSwirl,
        rippleColor: `${palette.broth}1F`,
        iconColor: { default: palette.inkMuted, selected: palette.broth },
        labelStyle: {
          default: { color: palette.inkMuted },
          selected: { color: palette.broth },
        },
      }
    : {};

export default function TabLayout() {
  const [quickAdd, setQuickAdd] = useState<EntrySheetConfig | null>(null);
  const openQuickAdd = () => setQuickAdd({ mode: 'create', kind: 'fact' });

  return (
    <>
      <NativeTabs
        minimizeBehavior="onScrollDown"
        tintColor={
          Platform.OS === 'ios'
            ? DynamicColorIOS({
                light: palette.noodleGold,
                dark: palette.noodleGold,
              })
            : undefined
        }
        {...ANDROID_TAB_BAR_PROPS}
      >
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'house', selected: 'house.fill' }}
            src={{
              default: (
                <NativeTabs.Trigger.VectorIcon
                  family={MaterialCommunityIcons}
                  name="home-outline"
                />
              ),
              selected: (
                <NativeTabs.Trigger.VectorIcon
                  family={MaterialCommunityIcons}
                  name="home"
                />
              ),
            }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(people)">
          <NativeTabs.Trigger.Label>People</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'person.2', selected: 'person.2.fill' }}
            src={{
              default: (
                <NativeTabs.Trigger.VectorIcon
                  family={MaterialCommunityIcons}
                  name="account-multiple-outline"
                />
              ),
              selected: (
                <NativeTabs.Trigger.VectorIcon
                  family={MaterialCommunityIcons}
                  name="account-multiple"
                />
              ),
            }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(settings)">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={'gear'}
            src={{
              default: (
                <NativeTabs.Trigger.VectorIcon
                  family={MaterialCommunityIcons}
                  name="cog-outline"
                />
              ),
              selected: (
                <NativeTabs.Trigger.VectorIcon
                  family={MaterialCommunityIcons}
                  name="cog"
                />
              ),
            }}
          />
        </NativeTabs.Trigger>

        {/* Quick-add as a detached search-role button (iOS 26 only). `disabled`
            keeps the current tab active, while Expo Router re-emits the
            prevented native selection as `tabPress`. The route still needs a
            trigger so Expo Router does not surface it automatically. */}
        <NativeTabs.Trigger
          name="quick-add"
          role={SEARCH_TAB_QUICK_ADD ? 'search' : undefined}
          hidden={!SEARCH_TAB_QUICK_ADD}
          disabled={SEARCH_TAB_QUICK_ADD}
          listeners={{ tabPress: openQuickAdd }}
        >
          <NativeTabs.Trigger.Icon sf={'plus'} />
        </NativeTabs.Trigger>
      </NativeTabs>

      {/* Android only; iOS 26+ quick add is the search-role tab above */}
      <QuickAddFab onPress={openQuickAdd} />

      <EntrySheet config={quickAdd} onClose={() => setQuickAdd(null)} />
    </>
  );
}
