import { ActionSheetIOS, Alert } from 'react-native';

const isIOS = process.env.EXPO_OS === 'ios';

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
