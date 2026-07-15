import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';
import { useState } from 'react';
import { View } from 'react-native';

interface ClearDataResult {
  error: string | null;
}

type ConfirmationPhase = 'confirm' | 'success' | 'error';

const confirmationMessage =
  'This will permanently remove all people, their photos, facts, and dates stored on this device. This action cannot be undone.';

export function useClearDataConfirmation(onClearData: () => ClearDataResult) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<ConfirmationPhase>('confirm');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmClearData = () => {
    setPhase('confirm');
    setErrorMessage(null);
    setIsOpen(true);
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPhase('confirm');
      setErrorMessage(null);
    }
  };

  const clearData = () => {
    const result = onClearData();
    if (result.error) {
      setErrorMessage(result.error);
      setPhase('error');
      return;
    }
    setPhase('success');
  };

  const confirmation = (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          {phase === 'confirm' ? (
            <>
              <Dialog.Title>Clear all data?</Dialog.Title>
              <Dialog.Description>{confirmationMessage}</Dialog.Description>
              <View className="mt-5 flex-row gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-2xl"
                  onPress={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 rounded-2xl"
                  onPress={clearData}
                >
                  Clear
                </Button>
              </View>
            </>
          ) : (
            <>
              <Dialog.Title>
                {phase === 'success' ? 'Data cleared' : 'Clear failed'}
              </Dialog.Title>
              <Dialog.Description>
                {phase === 'success'
                  ? 'All data has been removed.'
                  : errorMessage}
              </Dialog.Description>
              <Button
                variant="secondary"
                className="mt-5 rounded-2xl"
                onPress={() => setIsOpen(false)}
              >
                Done
              </Button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );

  return { confirmClearData, confirmation };
}
