import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabBarIconProps = React.ComponentProps<typeof Pressable> & {
  iconName: React.ComponentProps<typeof Feather>['name'];
  isFocused?: boolean;
};

const TabBarIcon = ({ iconName, isFocused, ...props }: TabBarIconProps) => {
  return (
    <Pressable {...props} style={styles.tabItem}>
      <Feather
        name={iconName}
        size={26}
        color={isFocused ? '#F6B756' : '#2E2E2B80'}
      />
    </Pressable>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />

      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.7)',
          'rgba(255, 255, 255, 1)',
        ]}
        style={[
          styles.gradient,
          {
            height:
              Platform.OS === 'android'
                ? 68 + insets.bottom
                : 52 + insets.bottom,
          },
        ]}
        pointerEvents="none"
      />

      <TabList
        style={[
          styles.tabBar,
          { bottom: insets.bottom + (Platform.OS === 'android' ? 15 : 0) },
        ]}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabBarIcon iconName="home" />
        </TabTrigger>

        <TabTrigger name="people" href="/people" asChild>
          <TabBarIcon iconName="users" />
        </TabTrigger>

        <TabTrigger name="settings" href="/settings" asChild>
          <TabBarIcon iconName="settings" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBar: {
    position: 'absolute',
    left: 80,
    right: 80,
    height: 65,
    backgroundColor: 'white',
    borderRadius: 32.5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...(Platform.OS === 'android' ? { elevation: 4 } : {}),
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }
      : {}),
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
