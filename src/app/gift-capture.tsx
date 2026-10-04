import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { saveGiftCapture } from '~/api/gifts/capture-service';
import { useCaptureFeedback } from '~/components/gifts/capture-feedback';
import GiftCamera from '~/components/gifts/gift-camera';
import { stageGiftPhoto, type PendingGiftPhoto } from '~/lib/gift-photos';
import { consumeRecoveredGiftSelection } from '~/lib/recover-gift-library-selection';
import { StartupReadyContext } from '~/lib/use-observe-screen';

export default function GiftCaptureScreen() {
  const router = useRouter();
  const feedback = useCaptureFeedback();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  const startupReady = useContext(StartupReadyContext);
  const resumeStartupCapture = useRef(!startupReady);
  const pending = useRef<PendingGiftPhoto | null>(null);
  const [ready, setReady] = useState(process.env.EXPO_OS !== 'android');
  const recovery = useRef<ReturnType<
    typeof consumeRecoveredGiftSelection
  > | null>(null);

  useEffect(() => {
    if (process.env.EXPO_OS !== 'android') return;
    let active = true;
    recovery.current ??= consumeRecoveredGiftSelection(
      resumeStartupCapture.current,
    );
    void recovery.current.then((result) => {
      if (!active) return;
      if (result.status === 'none') {
        setReady(true);
      } else if (result.status === 'recovered') {
        router.replace({
          pathname: '/gift-editor',
          params: { id: result.gift.id, captured: '1' },
        });
      } else {
        if (router.canGoBack()) router.back();
        else router.replace('/');
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) return null;
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
