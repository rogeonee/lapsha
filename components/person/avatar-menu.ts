import { ActionSheetIOS, Alert } from 'react-native';

const isIOS = process.env.EXPO_OS === 'ios';

/**
 * The avatar tap behavior shared by the person screen and add-person:
 * no photo goes straight to the picker; an existing photo offers
 * choose/remove through the platform's own menu (action sheet on iOS,
 * M3 dialog on Android).
 */
export function showAvatarMenu({
  hasPhoto,
  onChoose,
  onRemove,
}: {
  hasPhoto: boolean;
  onChoose: () => void;
  onRemove: () => void;
}): void {
  if (!hasPhoto) {
    onChoose();
    return;
  }

  if (isIOS) {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Choose photo', 'Remove photo', 'Cancel'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) onChoose();
        else if (buttonIndex === 1) onRemove();
      },
    );
    return;
  }

  Alert.alert('Photo', undefined, [
    { text: 'Choose photo', onPress: onChoose },
    { text: 'Remove photo', style: 'destructive', onPress: onRemove },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
