import Constants from 'expo-constants';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { clearAllData } from '~/api/database';
import { mapDatabaseError } from '~/api/error-handling';
import useClearDataConfirmation from '~/components/settings/use-clear-data-confirmation';
import { ChevronRightIcon, TrashIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { useCollapsingHeader } from '~/components/ui/use-collapsing-header';
import { palette, shadows } from '~/lib/theme';

const privacyPolicyUrl = 'https://lapsha-landing.vercel.app/privacy';

async function openPrivacyPolicy() {
  try {
    await Linking.openURL(privacyPolicyUrl);
  } catch {
    Alert.alert(
      "Couldn't open privacy policy",
      `Please try again, or visit ${privacyPolicyUrl} in your browser.`,
    );
  }
}

function clearDeviceData() {
  try {
    clearAllData();
    return { error: null };
  } catch (error) {
    console.warn(error);
    return { error: mapDatabaseError(error).message };
  }
}

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? 'Unknown';
  const header = useCollapsingHeader({ title: 'Settings' });
  const { confirmClearData, confirmation } =
    useClearDataConfirmation(clearDeviceData);

  return (
    <>
      <ScrollView
        className="flex-1 bg-paper"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 p-4 pb-32"
        onScroll={header.onScroll}
        scrollEventThrottle={16}
      >
        {header.largeTitle}
        <View>
          <Text className="mb-2 px-1 text-base font-medium">About</Text>
          <View
            className="overflow-hidden rounded-2xl bg-white"
            style={{ borderCurve: 'continuous', boxShadow: shadows.whisper }}
          >
            <View className="px-4 py-4">
              <Text className="text-base leading-5">
                Lapsha is a private notebook for remembering the people in your
                life. Everything is stored locally on this device.
              </Text>
            </View>
            <View className="min-h-12 flex-row items-center justify-between border-t border-black/5 px-4 py-3">
              <Text className="text-base">Version</Text>
              <Text selectable className="text-base text-muted-foreground">
                {version}
              </Text>
            </View>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Privacy policy"
              accessibilityHint="Opens the Lapsha privacy policy in your browser"
              className="min-h-12 flex-row items-center justify-between gap-3 border-t border-black/5 px-4 py-3 active:bg-black/5"
              onPress={openPrivacyPolicy}
            >
              <Text className="flex-1 text-base">Privacy policy</Text>
              <ChevronRightIcon color={palette.warmGrayDeep} />
            </Pressable>
          </View>
        </View>

        {Platform.OS === 'android' && (
          <View>
            <Text className="mb-2 px-1 text-base font-medium">Backup</Text>
            <View
              className="rounded-2xl bg-white px-4 py-4"
              style={{ borderCurve: 'continuous', boxShadow: shadows.whisper }}
            >
              <Text className="text-base leading-5">
                Android can back up your people, facts, dates, and preferences,
                depending on your device settings. Photos are not included in
                backups or transfers to another device. You’ll need to add them
                again after restoring.
              </Text>
            </View>
          </View>
        )}

        <View>
          <Text className="mb-2 px-1 text-base font-medium">Data</Text>
          <View
            className="overflow-hidden rounded-2xl bg-white"
            style={{ borderCurve: 'continuous', boxShadow: shadows.whisper }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all data"
              accessibilityHint="Permanently deletes all Lapsha data from this device"
              className="min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-black/5"
              onPress={confirmClearData}
            >
              <TrashIcon size={20} color={palette.destructive} />
              <Text className="text-base font-medium text-destructive">
                Clear all data
              </Text>
            </Pressable>
          </View>
          <Text className="mt-2 px-1 text-sm leading-5 text-muted-foreground">
            Permanently deletes all people, photos, facts, and dates from this
            device.
          </Text>
        </View>
      </ScrollView>
      {header.bar}

      {confirmation}
    </>
  );
}
