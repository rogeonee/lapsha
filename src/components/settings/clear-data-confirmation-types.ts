import type { ReactNode } from 'react';

export interface ClearDataResult {
  error: string | null;
}

export interface ClearDataConfirmation {
  confirmClearData: () => void;
  confirmation: ReactNode;
}
