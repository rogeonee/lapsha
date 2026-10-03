import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Gift } from '~/api/gifts/gift-schema';

const CaptureFeedback = createContext<{
  gift: Gift | null;
  show: (gift: Gift | null) => void;
}>({ gift: null, show: () => {} });

export function CaptureFeedbackProvider({ children }: { children: ReactNode }) {
  const [gift, show] = useState<Gift | null>(null);
  return <CaptureFeedback value={{ gift, show }}>{children}</CaptureFeedback>;
}

export function useCaptureFeedback() {
  return useContext(CaptureFeedback);
}
