import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';
import { Input } from 'heroui-native/input';
import { Tabs } from 'heroui-native/tabs';
import { TextField } from 'heroui-native/text-field';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
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
import { Avatar } from '~/components/person/avatar';
import {
  CameraIcon,
  CheckIcon,
  PhotoIcon,
  ChevronRightIcon,
  TrashIcon,
} from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { giftPhotoUri, pickGiftPhoto } from '~/lib/gift-photos';
import { avatarUri } from '~/lib/avatars';
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

type Confirmation = {
  title: string;
  description: string;
  actionLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
};

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
  const [choosingPerson, setChoosingPerson] = useState(false);
  const [search, setSearch] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraBusy = useRef(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const picking = useRef(false);
  const [datePicker, setDatePicker] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const confirm = (next: Confirmation) => {
    Keyboard.dismiss();
    setConfirmation(next);
    setConfirming(true);
  };
  const photoUri = giftPhotoUri(form.photo);
  const person = people.find((value) => value.id === form.person);
  const matchingPeople = people.filter((value) =>
    value.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const selectPerson = (value: string | null) => {
    if (!form.selectPerson(value)) return;
    Keyboard.dismiss();
    setChoosingPerson(false);
    setSearch('');
  };

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
    confirm({
      title: 'Discard unsaved details?',
      description: form.photo
        ? 'Your saved photo will stay in your gift ideas.'
        : 'These changes haven’t been saved.',
      cancelLabel: 'Keep editing',
      actionLabel: 'Discard',
      onConfirm: () => navigation.dispatch(data.action),
    });
  });

  const choosePhoto = async () => {
    if (picking.current) return;
    picking.current = true;
    Keyboard.dismiss();
    try {
      const uri = await pickGiftPhoto();
      if (uri) form.capturePhoto(uri);
    } catch {
      form.setError('Couldn’t attach the photo. Please try again.');
    } finally {
      picking.current = false;
    }
  };

  return (
    <View className="flex-1">
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={footerHeight - insets.bottom + 12}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          gap: 28,
          paddingBottom: 24,
        }}
      >
        <View
          className="overflow-hidden rounded-2xl bg-white"
          style={{ borderCurve: 'continuous' }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              person
                ? `Gift for ${person.name}. Change person`
                : 'Choose someone for this gift'
            }
            accessibilityState={{ expanded: choosingPerson }}
            onPress={() => {
              Keyboard.dismiss();
              setChoosingPerson(!choosingPerson);
            }}
            className="min-h-14 flex-row items-center gap-3 px-4 py-4 active:bg-black/5"
          >
            <Avatar
              name={person?.name ?? ''}
              photo={avatarUri(person?.avatar)}
              size={40}
            />
            <View className="flex-1 gap-1">
              <Text className="text-sm text-muted-foreground">For</Text>
              <Text
                className={
                  person
                    ? 'text-lg font-medium'
                    : 'text-lg font-medium text-broth'
                }
              >
                {person?.name ?? 'Choose someone'}
              </Text>
            </View>
            {person && <Text className="text-sm text-broth">Change</Text>}
            <View
              style={{
                transform: [{ rotate: choosingPerson ? '90deg' : '0deg' }],
              }}
            >
              <ChevronRightIcon color={palette.broth} />
            </View>
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
                accessibilityState={{ selected: !form.person }}
                onPress={() => selectPerson(null)}
                className="min-h-12 flex-row items-center gap-3 rounded-xl px-2 py-3 active:bg-black/5"
              >
                <Text className="flex-1 text-base text-broth">
                  Choose later
                </Text>
                {!form.person && <CheckIcon color={palette.broth} />}
              </Pressable>
              {peopleResponse.error ? (
                <Text>Couldn’t load people. You can choose later.</Text>
              ) : (
                matchingPeople.map((p) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: p.id === form.person }}
                    onPress={() => selectPerson(p.id)}
                    className="min-h-12 flex-row items-center gap-3 rounded-xl px-2 py-3 active:bg-black/5"
                  >
                    <Text className="flex-1 text-base">{p.name}</Text>
                    {p.id === form.person && (
                      <CheckIcon color={palette.broth} />
                    )}
                  </Pressable>
                ))
              )}
              {!peopleResponse.error && matchingPeople.length === 0 && (
                <Text className="px-2 py-2 text-base text-muted-foreground">
                  {people.length === 0
                    ? 'Add someone from People whenever you’re ready.'
                    : 'No matching people.'}
                </Text>
              )}
            </View>
          )}
        </View>
        <View className="gap-3">
          {form.photo && (
            <View className="flex-row flex-wrap items-center justify-between gap-x-3">
              <Text
                accessibilityLiveRegion="polite"
                className="text-base font-medium"
              >
                {captured ? 'Photo saved' : 'Photo'}
              </Text>
              <Button
                variant="ghost"
                className="rounded-2xl"
                animation={{ scale: false }}
                onPress={() =>
                  confirm({
                    title: 'Remove photo?',
                    description:
                      'The idea will stay. You can add another photo later.',
                    actionLabel: 'Remove',
                    onConfirm: form.removePhoto,
                  })
                }
              >
                <TrashIcon color={palette.destructive} />
                <Button.Label className="text-destructive">
                  Remove photo
                </Button.Label>
              </Button>
            </View>
          )}
          {photoUri && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View gift photo"
              onPress={() => setViewingPhoto(true)}
              className="overflow-hidden rounded-2xl bg-white"
              style={{ borderCurve: 'continuous' }}
            >
              <Image
                source={{ uri: photoUri }}
                style={{ width: '100%', height: 240 }}
                contentFit="cover"
              />
            </Pressable>
          )}
          {form.photo && !photoUri && (
            <Text className="text-base text-muted-foreground">
              Photo unavailable on this device. You can attach it again.
            </Text>
          )}
          <View className="flex-row flex-wrap gap-3">
            <Button
              variant="secondary"
              className="flex-1 rounded-2xl"
              style={{ minWidth: 140 }}
              animation={{ scale: false }}
              onPress={() => {
                Keyboard.dismiss();
                setCameraOpen(true);
              }}
            >
              <CameraIcon color={palette.broth} />
              <Button.Label>
                {form.photo ? 'Retake' : 'Take photo'}
              </Button.Label>
            </Button>
            <Button
              variant="secondary"
              className="flex-1 rounded-2xl"
              style={{ minWidth: 140 }}
              animation={{ scale: false }}
              onPress={() => void choosePhoto()}
            >
              <PhotoIcon color={palette.broth} />
              <Button.Label>Gallery</Button.Label>
            </Button>
          </View>
        </View>
        <View className="gap-3">
          <TextField>
            <Input
              accessibilityLabel="Gift title"
              placeholder="Title"
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
              placeholder="Link"
              value={form.url}
              onChangeText={form.setUrl}
              maxLength={2048}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="rounded-2xl bg-white"
            />
          </TextField>
        </View>
        <View className="gap-3">
          <Text className="text-base font-medium">Status</Text>
          <Tabs
            value={form.status}
            onValueChange={(value) => form.setStatus(value as GiftStatus)}
          >
            <Tabs.List className="w-full">
              <Tabs.Indicator />
              {Object.entries(giftStatusLabels).map(([value, label]) => (
                <Tabs.Trigger
                  value={value}
                  key={value}
                  className="min-h-12 flex-1"
                >
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
        </View>
        {form.savedGift && (
          <View className="mt-2">
            <Button
              variant="outline"
              className="rounded-2xl border-destructive bg-white"
              animation={{ scale: false }}
              onPress={() =>
                confirm({
                  title: 'Delete gift idea?',
                  description: 'This removes it from your gift ideas.',
                  actionLabel: 'Delete',
                  onConfirm: form.remove,
                })
              }
            >
              <Button.Label className="text-destructive">
                Delete idea
              </Button.Label>
            </Button>
          </View>
        )}
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View
          className="gap-3 border-t border-black/10 bg-paper px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
        >
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
              Done
            </Button.Label>
          </Button>
        </View>
      </KeyboardStickyView>
      {confirmation && (
        <Dialog isOpen={confirming} onOpenChange={setConfirming}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content>
              <Dialog.Title>{confirmation.title}</Dialog.Title>
              <Dialog.Description>
                {confirmation.description}
              </Dialog.Description>
              <View className="mt-5 flex-row flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-2xl"
                  style={{ minWidth: 140 }}
                  onPress={() => setConfirming(false)}
                >
                  {confirmation.cancelLabel ?? 'Cancel'}
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 rounded-2xl"
                  style={{ minWidth: 140 }}
                  onPress={() => {
                    setConfirming(false);
                    confirmation.onConfirm();
                  }}
                >
                  {confirmation.actionLabel}
                </Button>
              </View>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      )}
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
    </View>
  );
}
