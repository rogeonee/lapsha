import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { saveGiftCapture } from '~/api/gifts/capture-service';
import { useCaptureFeedback } from '~/components/gifts/capture-feedback';
import GiftCamera from '~/components/gifts/gift-camera';
import { stageGiftPhoto, type PendingGiftPhoto } from '~/lib/gift-photos';

export default function GiftCaptureScreen() {
  const router = useRouter();
  const feedback = useCaptureFeedback();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  const pending = useRef<PendingGiftPhoto | null>(null);
  return (
    <>
      <GiftCamera
        onClose={() =>
          router.canGoBack() ? router.back() : router.replace('/')
        }
        onCapture={(uri) => {
          pending.current ??= stageGiftPhoto(uri, personId ?? null);
          const result = saveGiftCapture(pending.current);
          if (result.error || !result.data)
            throw new Error('Gift capture failed');
          if (result.data.person_id && router.canGoBack()) {
            feedback.show(result.data);
            router.back();
          } else {
            router.replace({
              pathname: '/gift-editor',
              params: { id: result.data.id, captured: '1' },
            });
          }
        }}
      />
    </>
  );
}
