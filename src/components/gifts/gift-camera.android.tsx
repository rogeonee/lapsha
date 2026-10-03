import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { palette } from '~/lib/theme';
import { pickGiftPhoto } from '~/lib/gift-photos';

export interface GiftCameraProps {
  onCapture: (uri: string) => Promise<void> | void;
  onClose: () => void;
  onBusyChange?: (busy: boolean) => void;
}

export default function GiftCamera({
  onCapture,
  onClose,
  onBusyChange,
}: GiftCameraProps) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const locked = useRef(false);
  const requested = useRef(false);
  const [ready, setReady] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState === 'active',
  );
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [flash, setFlash] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (
      permission &&
      !permission.granted &&
      permission.status === 'undetermined' &&
      !requested.current
    ) {
      requested.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => locked.current,
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setForeground(state === 'active');
      setReady(false);
      if (state === 'active') void getPermission();
    });
    return () => subscription.remove();
  }, [getPermission]);

  const save = async (source: 'camera' | 'gallery' | 'retry') => {
    if (locked.current) return;
    locked.current = true;
    onBusyChange?.(true);
    setBusy(true);
    setError(null);
    try {
      const uri =
        source === 'retry'
          ? photo
          : source === 'gallery'
            ? await pickGiftPhoto()
            : (await camera.current?.takePictureAsync({ quality: 0.85 }))?.uri;
      if (!uri) return;
      setPhoto(uri);
      await onCapture(uri);
    } catch {
      setError('Couldn’t save the photo. Keep this screen open and try again.');
    } finally {
      locked.current = false;
      onBusyChange?.(false);
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.ink,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <StatusBar style="light" />
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          disabled={busy}
          onPress={onClose}
          className="min-h-12 justify-center px-2"
        >
          <Text className="text-base text-white">Close</Text>
        </Pressable>
        <Text className="text-lg font-medium text-white">Snap a gift</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={flash ? 'Turn flash off' : 'Turn flash on'}
          accessibilityState={{ selected: flash }}
          onPress={() => setFlash(!flash)}
          className="min-h-12 justify-center px-2"
        >
          <Text className="text-base text-white">
            {flash ? 'Flash on' : 'Flash off'}
          </Text>
        </Pressable>
      </View>
      <View className="flex-1 overflow-hidden">
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
        ) : permission?.granted && !cameraError && foreground ? (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="back"
            flash={flash ? 'on' : 'off'}
            mode="picture"
            onCameraReady={() => setReady(true)}
            onMountError={() => setCameraError(true)}
          />
        ) : (
          <View className="flex-1 items-center justify-center gap-5 px-8">
            {!permission ? (
              <ActivityIndicator color={palette.cardWhite} />
            ) : (
              <>
                <Text className="text-center text-lg text-white">
                  {cameraError
                    ? 'Camera unavailable'
                    : 'Allow camera access to capture a gift idea.'}
                </Text>
                {!cameraError && (
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-12 justify-center px-4"
                    onPress={() =>
                      permission.canAskAgain
                        ? void requestPermission()
                        : void Linking.openSettings()
                    }
                  >
                    <Text className="text-base text-white">
                      {permission.canAskAgain
                        ? 'Allow camera'
                        : 'Open settings'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}
      </View>
      <View className="gap-3 px-6 py-5">
        <Text
          accessibilityLiveRegion="polite"
          className="text-center text-base text-white"
        >
          {error ?? (busy ? 'Saving photo…' : 'Snap now. Add details later.')}
        </Text>
        {error && photo ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void save('retry')}
            disabled={busy}
            className="min-h-14 items-center justify-center rounded-2xl bg-white"
          >
            <Text className="text-lg font-medium">Try saving again</Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              onPress={() => void save('gallery')}
              disabled={busy}
              className="min-h-14 min-w-20 justify-center"
            >
              <Text className="text-base text-white">Gallery</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take photo and save gift"
              accessibilityState={{ disabled: !ready || busy }}
              onPress={() => void save('camera')}
              disabled={!ready || busy}
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                borderWidth: 4,
                borderColor: palette.cardWhite,
                padding: 5,
                opacity: ready && !busy ? 1 : 0.5,
              }}
            >
              <View className="flex-1 items-center justify-center rounded-full bg-white">
                {busy && <ActivityIndicator color={palette.ink} />}
              </View>
            </Pressable>
            <View className="w-20" />
          </View>
        )}
      </View>
    </View>
  );
}
