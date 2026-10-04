export interface GiftCameraProps {
  onCapture: (uri: string) => Promise<void> | void;
  onClose: () => void;
  onBusyChange?: (busy: boolean) => void;
}
export default function GiftCamera(_props: GiftCameraProps) {
  return null;
}
