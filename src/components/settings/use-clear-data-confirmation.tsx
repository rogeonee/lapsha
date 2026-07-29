import useAndroidClearDataConfirmation from './use-clear-data-confirmation.android';
import useIOSClearDataConfirmation from './use-clear-data-confirmation.ios';

const useAndroidConfirmation: typeof useIOSClearDataConfirmation =
  useAndroidClearDataConfirmation;
void useAndroidConfirmation;

export { default } from './use-clear-data-confirmation.ios';
