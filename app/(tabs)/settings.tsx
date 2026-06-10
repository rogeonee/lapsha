import Constants from 'expo-constants';
import { Alert, ScrollView, View } from 'react-native';
import { clearAllData } from '~/api/database';
import { mapDatabaseError } from '~/api/error-handling';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function SettingsScreen() {
  const confirmClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently remove all people, facts, and dates stored on this device. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: onClearData },
      ],
    );
  };

  const onClearData = () => {
    try {
      clearAllData();
      Alert.alert('Data Cleared', 'All data has been removed.');
    } catch (error) {
      console.warn(error);
      Alert.alert('Clear Failed', mapDatabaseError(error).message);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#F9F7F4]"
      contentContainerStyle={{ padding: 24, gap: 24 }}
    >
      <View className="gap-3">
        <Text className="text-2xl font-bold text-foreground">About</Text>
        <Text className="text-muted-foreground">
          Lapsha keeps notes about the people in your life — facts, important
          dates, and more. All data is stored locally on this device.
        </Text>
        <Text className="text-muted-foreground">
          Version {Constants.expoConfig?.version ?? 'unknown'}
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-2xl font-bold text-destructive">Danger zone</Text>
        <Text className="text-muted-foreground">
          Permanently delete all people, facts, and dates from this device.
        </Text>

        <View className="mt-4 gap-3">
          <Button
            variant="destructive"
            className="h-12"
            onPress={confirmClearData}
          >
            <Text>Clear All Data</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
