import { useCollapsingHeader as androidUseCollapsingHeader } from './use-collapsing-header.android';
import { useCollapsingHeader as iosUseCollapsingHeader } from './use-collapsing-header.ios';

// TypeScript resolves this facade while Metro selects a platform file.
// Keep both implementations structurally compatible without bundling one
// platform's native dependencies into the other.
const androidHook: typeof iosUseCollapsingHeader = androidUseCollapsingHeader;
void androidHook;

export { useCollapsingHeader } from './use-collapsing-header.ios';
export type {
  CollapsingHeader,
  CollapsingHeaderOptions,
} from './use-collapsing-header.ios';
