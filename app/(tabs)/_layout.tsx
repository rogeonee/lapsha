import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={
        Platform.OS === 'ios'
          ? DynamicColorIOS({ light: '#F6B756', dark: '#F6B756' })
          : undefined
      }
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          drawable="ic_menu_mylocation"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="people">
        <Label>People</Label>
        <Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          drawable="ic_menu_myplaces"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon sf={'gear'} drawable="ic_menu_preferences" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
