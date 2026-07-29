import { Alert } from 'react-native';
import type {
  ClearDataConfirmation,
  ClearDataResult,
} from '~/components/settings/clear-data-confirmation-types';

const confirmationMessage =
  'This will permanently remove all people, their photos, facts, and dates stored on this device. This action cannot be undone.';

export default function useClearDataConfirmation(
  onClearData: () => ClearDataResult,
): ClearDataConfirmation {
  const confirmClearData = () => {
    Alert.alert('Clear all data?', confirmationMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          const result = onClearData();
          Alert.alert(
            result.error ? 'Clear failed' : 'Data cleared',
            result.error ?? 'All data has been removed.',
          );
        },
      },
    ]);
  };

  return { confirmClearData, confirmation: null };
}
