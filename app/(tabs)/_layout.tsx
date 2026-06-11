import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import {
  EntrySheet,
  type EntrySheetConfig,
} from '~/components/entry/entry-sheet';
import { QuickAddAccessory } from '~/components/quick-add/quick-add-accessory';
import { QuickAddFab } from '~/components/quick-add/quick-add-fab';

export default function TabLayout() {
  // The accessory is rendered twice by the system (regular + inline
  // placements) with no shared internal state, so the quick-add sheet and
  // its state are hoisted here and mounted once, outside the accessory.
  const [quickAdd, setQuickAdd] = useState<EntrySheetConfig | null>(null);

  return (
    <>
      <NativeTabs
        minimizeBehavior="onScrollDown"
        tintColor={
          Platform.OS === 'ios'
            ? DynamicColorIOS({ light: '#F6B756', dark: '#F6B756' })
            : undefined
        }
      >
        {/* iOS 26+ only; older iOS and Android never render it */}
        <NativeTabs.BottomAccessory>
          <QuickAddAccessory
            onPress={() => setQuickAdd({ mode: 'create', kind: 'fact' })}
          />
        </NativeTabs.BottomAccessory>

        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'house', selected: 'house.fill' }}
            drawable="ic_menu_mylocation"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(people)">
          <NativeTabs.Trigger.Label>People</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'person.2', selected: 'person.2.fill' }}
            drawable="ic_menu_myplaces"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={'gear'} drawable="ic_menu_preferences" />
        </NativeTabs.Trigger>
      </NativeTabs>

      {/* Android only; iOS quick add is the BottomAccessory above */}
      <QuickAddFab
        onPress={() => setQuickAdd({ mode: 'create', kind: 'fact' })}
      />

      <EntrySheet config={quickAdd} onClose={() => setQuickAdd(null)} />
    </>
  );
}
