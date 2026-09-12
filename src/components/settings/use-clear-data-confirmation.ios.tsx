import { Alert } from 'react-native';
import type {
  ClearDataConfirmation,
  ClearDataResult,
} from '~/components/settings/clear-data-confirmation-types';
import { incompleteCleanupMessage } from '~/components/settings/clear-data-confirmation-types';

const confirmationMessage =
  'This will permanently remove all people, their photos, facts, and dates stored on this device. This action cannot be undone.';

export default function useClearDataConfirmation(
  onClearData: () => ClearDataResult,
): ClearDataConfirmation {
  const showResult = (result: ClearDataResult) => {
    if (result.error) {
      Alert.alert('Clear failed', result.error);
      return;
    }
    if (result.incompleteCleanup.length > 0) {
      Alert.alert(
        'Cleanup incomplete',
        incompleteCleanupMessage(result.incompleteCleanup),
        [
          { text: 'Done', style: 'cancel' },
          {
            text: 'Try again',
            onPress: () => showResult(onClearData()),
          },
        ],
      );
      return;
    }
    Alert.alert('Data cleared', 'All data has been removed.');
  };

  const confirmClearData = () => {
    Alert.alert('Clear all data?', confirmationMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          showResult(onClearData());
        },
      },
    ]);
  };

  return { confirmClearData, confirmation: null };
}
