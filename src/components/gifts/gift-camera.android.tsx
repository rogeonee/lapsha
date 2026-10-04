import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraIcon, CloseIcon, PhotoIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { palette } from '~/lib/theme';
import { pickGiftPhoto, takeGiftPhoto } from '~/lib/gift-photos';
import type { GiftCameraProps } from './gift-camera';

export default function GiftCamera({
  onCapture,
  onClose,
  onBusyChange,
}: GiftCameraProps) {
  const started = useRef(false);
  const locked = useRef(false);
  const [busy, setBusy] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsSettings, setNeedsSettings] = useState(false);
  const insets = useSafeAreaInsets();

  const capture = async (source: 'camera' | 'gallery' | 'retry') => {
    if (locked.current) return;
    locked.current = true;
    onBusyChange?.(true);
    setBusy(true);
    setError(null);
    setNeedsSettings(false);
    try {
      if (source === 'camera') {
        let permission = await ImagePicker.getCameraPermissionsAsync();
        if (!permission.granted && permission.canAskAgain)
          permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setNeedsSettings(!permission.canAskAgain);
          setError('Allow camera access to take a photo.');
          return;
        }
      }
      const uri =
        source === 'retry'
          ? photo
          : source === 'camera'
            ? await takeGiftPhoto()
            : await pickGiftPhoto();
      if (!uri) {
        onClose();
        return;
      }
      setPhoto(uri);
      await onCapture(uri);
    } catch {
      setError('Couldn’t complete the photo. Please try again.');
    } finally {
      locked.current = false;
      onBusyChange?.(false);
      setBusy(false);
    }
  };

  const launchInitialCamera = useEffectEvent(() => void capture('camera'));
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    launchInitialCamera();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => locked.current,
    );
    return () => subscription.remove();
  }, []);

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
      <View className="px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          disabled={busy}
          onPress={onClose}
          className="items-center justify-center rounded-full active:bg-white/10"
          style={{ width: 48, height: 48, opacity: busy ? 0.5 : 1 }}
        >
          <CloseIcon color={palette.cardWhite} size={24} />
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center gap-5 px-6">
        {photo && (
          <Image
            source={{ uri: photo }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
        )}
        {busy && <ActivityIndicator color={palette.cardWhite} />}
        {error && (
          <View className="w-full gap-4 rounded-2xl bg-black/80 p-5">
            <Text
              accessibilityLiveRegion="polite"
              className="text-center text-base text-white"
            >
              {error}
            </Text>
            {needsSettings && (
              <Pressable
                accessibilityRole="button"
                className="min-h-12 items-center justify-center rounded-xl bg-white"
                onPress={() => void Linking.openSettings()}
              >
                <Text className="text-base font-medium">Open settings</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-white"
              onPress={() => void capture(photo ? 'retry' : 'camera')}
            >
              <CameraIcon color={palette.ink} size={22} />
              <Text className="text-base font-medium">
                {photo ? 'Try saving again' : 'Try camera again'}
              </Text>
            </Pressable>
            {!photo && (
              <Pressable
                accessibilityRole="button"
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-white/30 active:bg-white/10"
                onPress={() => void capture('gallery')}
              >
                <PhotoIcon color={palette.cardWhite} size={22} />
                <Text className="text-base text-white">
                  Choose from gallery
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
