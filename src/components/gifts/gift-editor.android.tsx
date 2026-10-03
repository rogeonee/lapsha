import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import { Tabs } from 'heroui-native/tabs';
import { TextField } from 'heroui-native/text-field';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Modal, Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGift } from '~/api/gifts/gifts-service';
import {
  giftStatusLabels,
  type Gift,
  type GiftStatus,
} from '~/api/gifts/gift-schema';
import { getPeople } from '~/api/people/people-service';
import GiftCamera from '~/components/gifts/gift-camera';
import { GiftPhotoViewer } from '~/components/gifts/gift-photo-viewer';
import { useGiftEditor } from '~/components/gifts/use-gift-editor';
import { CameraIcon, PhotoIcon, ChevronRightIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { giftPhotoUri, pickGiftPhoto } from '~/lib/gift-photos';
import {
  fromAndroidPickerDate,
  fromStorageDate,
  toAndroidPickerDate,
  toStorageDate,
} from '~/lib/dates';
import { palette } from '~/lib/theme';
import { useTableVersion } from '~/lib/use-table-version';

function loadPeople(_version: number) {
  return getPeople();
}

export default function GiftEditorScreen() {
  const { id, personId, captured } = useLocalSearchParams<{
    id?: string;
    personId?: string;
    captured?: string;
  }>();
  // The editor owns its draft until it closes, including after deleting the row.
  const [response] = useState(() => (id ? getGift(id) : null));
  if (response?.error || (id && !response?.data))
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <Text>This gift idea is no longer available.</Text>
      </View>
    );
  return (
    <GiftEditor
      key={id ?? 'new'}
      initial={response?.data ?? null}
      personId={personId ?? null}
      captured={captured === '1'}
    />
  );
}

function GiftEditor({
  initial,
  personId,
  captured,
}: {
  initial: Gift | null;
  personId: string | null;
  captured: boolean;
}) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const form = useGiftEditor(initial, personId);
  const version = useTableVersion(['persons']);
  const peopleResponse = loadPeople(version);
  const people = peopleResponse.error ? [] : (peopleResponse.data ?? []);
  const [choosingPerson, setChoosingPerson] = useState(
    captured && !initial?.person_id,
  );
  const [search, setSearch] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraBusy = useRef(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const [picking, setPicking] = useState(false);
  const [datePicker, setDatePicker] = useState(false);
  const photoUri = giftPhotoUri(form.photo);
  const person = people.find((value) => value.id === form.person);

  useEffect(() => {
    if (form.done) {
      Keyboard.dismiss();
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  }, [form.done, router]);
  // Keep native header props stable through the pop; toggling prevention while
  // saving crashes Screens on Android. Decide whether to prompt in the callback.
  usePreventRemove(true, ({ data }) => {
    if (!form.dirty || form.done) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert(
      'Discard unsaved details?',
      form.photo
        ? 'Your saved photo will stay in your gift ideas.'
        : 'These changes haven’t been saved.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  const choosePhoto = async () => {
    if (picking) return;
    Keyboard.dismiss();
    setPicking(true);
    try {
      const uri = await pickGiftPhoto();
      if (uri) form.capturePhoto(uri);
    } catch {
      form.setError('Couldn’t attach the photo. Please try again.');
    } finally {
      setPicking(false);
    }
  };

  return (
    <>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          gap: 18,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {captured && (
          <View className="gap-2">
            <Text
              accessibilityLiveRegion="polite"
              className="text-lg font-medium"
            >
              {person ? `Saved for ${person.name}` : 'Photo saved'}
            </Text>
            <Text className="text-base text-muted-foreground">
              {person
                ? 'You can put your phone away. Details can wait.'
                : 'Who’s it for? You can choose later.'}
            </Text>
          </View>
        )}
        {photoUri && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View gift photo"
            onPress={() => setViewingPhoto(true)}
            className="overflow-hidden rounded-2xl bg-white"
          >
            <Image
              source={{ uri: photoUri }}
              style={{ width: '100%', height: 240 }}
              contentFit="cover"
            />
            <Text className="px-4 py-3 text-sm text-muted-foreground">
              Photo saved · Tap to zoom
            </Text>
          </Pressable>
        )}
        {form.photo && !photoUri && (
          <Text className="text-base text-muted-foreground">
            Photo unavailable on this device. You can attach it again.
          </Text>
        )}
        <View className="flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1 rounded-2xl"
            onPress={() => {
              Keyboard.dismiss();
              setCameraOpen(true);
            }}
          >
            <CameraIcon color={palette.broth} />
            <Button.Label>Take photo</Button.Label>
          </Button>
          <Button
            variant="secondary"
            className="flex-1 rounded-2xl"
            isDisabled={picking}
            onPress={() => void choosePhoto()}
          >
            <PhotoIcon color={palette.broth} />
            <Button.Label>{picking ? 'Opening…' : 'Gallery'}</Button.Label>
          </Button>
        </View>
        <View className="overflow-hidden rounded-2xl bg-white">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose person for gift"
            onPress={() => {
              Keyboard.dismiss();
              setChoosingPerson(!choosingPerson);
            }}
            className="min-h-14 flex-row items-center justify-between px-4 py-3"
          >
            <Text className="flex-1 text-base">
              {person?.name ?? 'Choose someone later'}
            </Text>
            <ChevronRightIcon color={palette.broth} />
          </Pressable>
          {choosingPerson && (
            <View className="gap-1 border-t border-black/5 p-3">
              <TextField>
                <Input
                  accessibilityLabel="Search people"
                  placeholder="Find someone"
                  value={search}
                  onChangeText={setSearch}
                />
              </TextField>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (form.selectPerson(null)) setChoosingPerson(false);
                }}
                className="min-h-12 justify-center px-2"
              >
                <Text className="text-base text-broth">Choose later</Text>
              </Pressable>
              {peopleResponse.error ? (
                <Text>Couldn’t load people. You can choose later.</Text>
              ) : (
                people
                  .filter((p) =>
                    p.name
                      .toLocaleLowerCase()
                      .includes(search.toLocaleLowerCase()),
                  )
                  .map((p) => (
                    <Pressable
                      key={p.id}
                      accessibilityRole="button"
                      onPress={() => {
                        if (form.selectPerson(p.id)) setChoosingPerson(false);
                      }}
                      className="min-h-12 justify-center px-2"
                    >
                      <Text className="text-base">{p.name}</Text>
                    </Pressable>
                  ))
              )}
              {people.length === 0 && (
                <Text className="px-2 py-2 text-base text-muted-foreground">
                  Add someone from People whenever you’re ready.
                </Text>
              )}
            </View>
          )}
        </View>
        <TextField>
          <Input
            accessibilityLabel="Gift title"
            placeholder="Title (optional)"
            value={form.title}
            onChangeText={form.setTitle}
            maxLength={200}
            className="rounded-2xl bg-white"
          />
        </TextField>
        <TextField>
          <Input
            accessibilityLabel="Gift note"
            placeholder="What made you think of them?"
            value={form.note}
            onChangeText={form.setNote}
            multiline
            maxLength={1000}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
            className="rounded-2xl bg-white"
          />
        </TextField>
        <TextField>
          <Input
            accessibilityLabel="Gift link"
            placeholder="Link (optional)"
            value={form.url}
            onChangeText={form.setUrl}
            maxLength={2048}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            className="rounded-2xl bg-white"
          />
        </TextField>
        <Tabs
          value={form.status}
          onValueChange={(value) => form.setStatus(value as GiftStatus)}
        >
          <Tabs.List>
            <Tabs.Indicator />
            {Object.entries(giftStatusLabels).map(([value, label]) => (
              <Tabs.Trigger value={value} key={value}>
                <Tabs.Label>{label}</Tabs.Label>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs>
        {form.status === 'given' && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Keyboard.dismiss();
              setDatePicker(true);
            }}
            className="min-h-14 justify-center rounded-2xl bg-white px-4"
          >
            <Text className="text-base">
              Given on{' '}
              {fromStorageDate(
                form.givenOn ?? toStorageDate(new Date(), true),
              ).date.toLocaleDateString()}
            </Text>
          </Pressable>
        )}
        {form.error && (
          <Text
            accessibilityRole="alert"
            className="text-base text-destructive"
          >
            {form.error}
          </Text>
        )}
        <Button
          className="rounded-2xl bg-primary"
          isDisabled={!form.valid}
          onPress={form.save}
        >
          <Button.Label className="text-primary-foreground">
            {form.savedGift && !form.dirty
              ? 'Done'
              : form.savedGift
                ? 'Save details'
                : 'Save idea'}
          </Button.Label>
        </Button>
        {form.photo && (
          <Button variant="ghost" onPress={form.removePhoto}>
            <Button.Label>Remove photo</Button.Label>
          </Button>
        )}
        {form.savedGift && (
          <Button
            variant="ghost"
            onPress={() =>
              Alert.alert(
                'Delete gift idea?',
                'This removes it from your gift ideas.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: form.remove,
                  },
                ],
              )
            }
          >
            <Button.Label className="text-destructive">
              Delete idea
            </Button.Label>
          </Button>
        )}
      </KeyboardAwareScrollView>
      {datePicker && (
        <Host style={{ position: 'absolute', width: 0, height: 0 }}>
          <DatePickerDialog
            initialDate={toAndroidPickerDate(
              fromStorageDate(form.givenOn ?? toStorageDate(new Date(), true))
                .date,
            )}
            variant="picker"
            showVariantToggle={false}
            color={palette.noodleGold}
            onDateSelected={(date) => {
              form.setGivenOn(toStorageDate(fromAndroidPickerDate(date), true));
              setDatePicker(false);
            }}
            onDismissRequest={() => setDatePicker(false)}
          />
        </Host>
      )}
      {cameraOpen && (
        <Modal
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => {
            if (!cameraBusy.current) setCameraOpen(false);
          }}
        >
          <GiftCamera
            onBusyChange={(busy) => {
              cameraBusy.current = busy;
            }}
            onClose={() => setCameraOpen(false)}
            onCapture={(uri) => {
              form.capturePhoto(uri);
              setCameraOpen(false);
            }}
          />
        </Modal>
      )}
      {viewingPhoto && photoUri && (
        <GiftPhotoViewer
          uri={photoUri}
          onClose={() => setViewingPhoto(false)}
        />
      )}
    </>
  );
}
