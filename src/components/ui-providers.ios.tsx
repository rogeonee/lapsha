import type { ReactNode } from 'react';

/** iOS uses native SwiftUI surfaces and needs no extra provider. */
export default function UIProviders({ children }: { children: ReactNode }) {
  return children;
}
