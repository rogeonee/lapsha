import type { ReactNode } from 'react';

export interface ClearDataResult {
  error: string | null;
  incompleteCleanup: ('preferences' | 'photos')[];
}

export interface ClearDataConfirmation {
  confirmClearData: () => void;
  confirmation: ReactNode;
}

export function incompleteCleanupMessage(
  cleanup: ClearDataResult['incompleteCleanup'],
): string {
  if (cleanup.includes('preferences') && cleanup.includes('photos')) {
    return 'People, facts, and dates were removed, but some preferences and photos remain. Try again to finish clearing them.';
  }
  if (cleanup.includes('preferences')) {
    return 'People, facts, and dates were removed, but some preferences remain. Try again to finish clearing them.';
  }
  return 'People, facts, and dates were removed, but some photos remain. Try again to finish clearing them.';
}
