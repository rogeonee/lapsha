import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Platform, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  BIRTHDAY_LABEL,
  deleteDate,
  getDatesByPerson,
} from '~/api/dates/dates-service';
import { deleteFact, getFactsByPerson } from '~/api/facts/facts-service';
import {
  deletePerson,
  getPerson,
  updatePerson,
} from '~/api/people/people-service';
import {
  EntrySheet,
  type EntrySheetConfig,
} from '~/components/entry/entry-sheet';
import { AddRow, DateRow, EntryRow } from '~/components/person/entry-row';
import { FactSortMenu } from '~/components/person/fact-sort-menu';
import { PersonMenu } from '~/components/person/person-menu';
import {
  personPhotoCompactHeight,
  personPhotoExpandedHeight,
  PersonPhotoHero,
} from '~/components/person/person-photo-hero';
import { Text } from '~/components/ui/text';
import {
  avatarUri,
  deleteAvatarFile,
  pickAvatarImage,
  saveAvatarFile,
} from '~/lib/avatars';
import { getSortPref, setSortPref } from '~/lib/prefs';
import { palette, shadows } from '~/lib/theme';
import { useTableVersion } from '~/lib/use-table-version';
import type { EntrySort, Fact, Person, Date as PersonDate } from '~/types/db';

const isIOS = process.env.EXPO_OS === 'ios';
// iOS 26 liquid-glass header buttons adapt to the content behind them;
// forcing them white over the expanded photo washes them out. Only
// pre-26 headers (plain buttons over the scrim) take the white flip.
const isLiquidGlass =
  isIOS && Number.parseInt(String(Platform.Version), 10) >= 26;

const cardStyle = {
  borderCurve: 'continuous',
  boxShadow: shadows.whisper,
} as const;

const PHOTO_SNAP_VELOCITY = 650;
const PHOTO_CHROME_THRESHOLD = 0.22;
const photoTiming = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.Never,
} as const;

function loadPersonData(
  id: string | undefined,
  factSort: EntrySort,
  _dataVersion: number,
): {
  person: Person | null;
  facts: Fact[];
  dates: PersonDate[];
  error: string | null;
} {
  if (!id) {
    return { person: null, facts: [], dates: [], error: 'Person not found' };
  }

  const personRes = getPerson(id);
  if (personRes.error || !personRes.data) {
    return {
      person: null,
      facts: [],
      dates: [],
      error: personRes.error?.message || 'Person not found',
    };
  }

  return {
    person: personRes.data,
    facts: getFactsByPerson(id, factSort).data ?? [],
    // Dates keep their defined order: birthday pinned, then date added
    dates: getDatesByPerson(id).data ?? [],
    error: null,
  };
}

function SectionCard({
  title,
  accessory,
  children,
}: {
  title: string;
  /** Right-aligned control on the title row, e.g. the facts sort menu */
  accessory?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-base font-medium">{title}</Text>
        {accessory}
      </View>
      <View className="overflow-hidden rounded-2xl bg-white" style={cardStyle}>
        {children}
      </View>
    </View>
  );
}

export function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const dataVersion = useTableVersion(['persons', 'facts', 'dates']);
  const [factSort, setFactSort] = useState<EntrySort>(() =>
    getSortPref('facts'),
  );
  const [sheetConfig, setSheetConfig] = useState<EntrySheetConfig | null>(null);
  // Deleting unmounts the data out from under the screen; suppress the
  // "Person not found" error view while the pop animation runs
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [isPhotoChromeExpanded, setIsPhotoChromeExpanded] = useState(false);
  // Android HeroUI popovers need to be controlled so the photo/scroll
  // gesture underneath their overlay can dismiss them on a vertical swipe.
  // iOS ignores these props because its native menus dismiss themselves.
  const [openMenu, setOpenMenu] = useState<'person' | 'sort' | null>(null);
  const photoProgress = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const pullStart = useSharedValue(0);
  const pullEligible = useSharedValue(false);

  const { person, facts, dates, error } = loadPersonData(
    id,
    factSort,
    dataVersion,
  );

  const birthday =
    dates.find((d) => d.label.toLowerCase() === BIRTHDAY_LABEL) ?? null;
  const otherDates = dates.filter((d) => d.id !== birthday?.id);
  const photo = avatarUri(person?.avatar);
  const photoTravel = Math.max(
    1,
    personPhotoExpandedHeight(screenWidth) -
      personPhotoCompactHeight(headerHeight),
  );

  useAnimatedReaction(
    () => photoProgress.value >= PHOTO_CHROME_THRESHOLD,
    (expanded, previous) => {
      if (expanded !== previous) {
        scheduleOnRN(setIsPhotoChromeExpanded, expanded);
      }
    },
  );

  const setPhotoExpanded = (expanded: boolean) => {
    setIsPhotoExpanded(expanded);
  };

  const dismissMenus = () => {
    setOpenMenu(null);
  };

  const animatePhotoTo = (expanded: boolean) => {
    setPhotoExpanded(expanded);
    photoProgress.value = withTiming(expanded ? 1 : 0, photoTiming);
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const nativeScrollGesture = Gesture.Native();
  const pullGesture = Gesture.Pan()
    .enabled(photo !== null || openMenu !== null)
    .activeOffsetY([-8, 8])
    .failOffsetX([-12, 12])
    .onBegin(() => {
      if (openMenu !== null) scheduleOnRN(dismissMenus);
      pullEligible.value = photo !== null && scrollY.value <= 0.5;
      pullStart.value = photoProgress.value;
    })
    .onUpdate((event) => {
      if (!pullEligible.value) return;
      if (pullStart.value <= 0.001 && event.translationY < 0) return;
      photoProgress.value = Math.min(
        1,
        Math.max(0, pullStart.value + event.translationY / photoTravel),
      );
    })
    .onEnd((event) => {
      if (!pullEligible.value) return;

      const shouldExpand =
        event.velocityY > PHOTO_SNAP_VELOCITY ||
        (event.velocityY >= -PHOTO_SNAP_VELOCITY && photoProgress.value >= 0.5);
      photoProgress.value = withTiming(
        shouldExpand ? 1 : 0,
        photoTiming,
        (finished) => {
          if (finished) scheduleOnRN(setPhotoExpanded, shouldExpand);
        },
      );
    });
  const scrollAndPullGesture = Gesture.Simultaneous(
    nativeScrollGesture,
    pullGesture,
  );

  const changeFactSort = (sort: EntrySort) => {
    setSortPref('facts', sort);
    setFactSort(sort);
  };

  const handleDeleteFact = (factId: string) => {
    const response = deleteFact(factId);
    if (response.error) {
      Alert.alert('Error', 'Failed to delete fact. Please try again.');
    }
  };

  const handleDeleteDate = (dateId: string) => {
    const response = deleteDate(dateId);
    if (response.error) {
      Alert.alert('Error', 'Failed to delete date. Please try again.');
    }
  };

  const choosePhoto = async () => {
    if (!person) return;
    try {
      const picked = await pickAvatarImage();
      if (!picked) return;

      const fileName = await saveAvatarFile(picked);
      const previous = person.avatar;
      const response = updatePerson(person.id, { avatar: fileName });
      if (response.error) {
        deleteAvatarFile(fileName);
        Alert.alert('Error', "The photo couldn't be saved. Please try again.");
        return;
      }
      deleteAvatarFile(previous);
    } catch {
      Alert.alert('Error', "The photo couldn't be saved. Please try again.");
    }
  };

  const removePhoto = () => {
    if (!person?.avatar) return;
    const previous = person.avatar;
    const response = updatePerson(person.id, { avatar: null });
    if (response.error) {
      Alert.alert('Error', "The photo couldn't be removed. Please try again.");
      return;
    }
    deleteAvatarFile(previous);
  };

  const handleEditName = () => {
    if (!person) return;
    setSheetConfig({ mode: 'edit', kind: 'person', person });
  };

  // Confirmation lives in PersonMenu (native Alert on iOS, HeroUI
  // dialog on Android); this runs only after the user confirms.
  const handleDeletePerson = () => {
    if (!person) return;
    setIsDeleting(true);
    const response = deletePerson(person.id);
    if (response.error) {
      setIsDeleting(false);
      Alert.alert('Error', 'Failed to delete. Please try again.');
      return;
    }
    router.back();
  };

  if (error) {
    if (isDeleting) {
      return <Stack.Screen options={{ title: '' }} />;
    }
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Stack.Screen options={{ title: '' }} />
        <Text className="text-center text-lg text-muted-foreground">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isPhotoChromeExpanded ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: person?.name ?? '',
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor:
            isPhotoChromeExpanded && !isLiquidGlass ? 'white' : palette.broth,
          // The title sits over the scrim, not in a glass circle, so it
          // goes white on every version
          headerTitleStyle: {
            color: isPhotoChromeExpanded ? 'white' : palette.broth,
          },
          ...(isIOS ? { headerBlurEffect: 'none' as const } : null),
        }}
      />
      <PersonMenu
        personName={person?.name ?? ''}
        hasPhoto={Boolean(person?.avatar)}
        isPhotoChromeExpanded={isPhotoChromeExpanded}
        isOpen={openMenu === 'person'}
        onOpenChange={(open) => setOpenMenu(open ? 'person' : null)}
        onEditName={handleEditName}
        onChoosePhoto={() => void choosePhoto()}
        onRemovePhoto={removePhoto}
        onDeletePerson={handleDeletePerson}
      />

      <GestureDetector gesture={scrollAndPullGesture}>
        <Animated.ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerClassName="pb-4"
          style={isIOS ? { marginTop: -headerHeight } : undefined}
          bounces={false}
          overScrollMode="never"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <PersonPhotoHero
            name={person?.name ?? ''}
            photo={photo}
            screenWidth={screenWidth}
            headerHeight={headerHeight}
            progress={photoProgress}
            isExpanded={isPhotoExpanded}
            onToggle={() => animatePhotoTo(!isPhotoExpanded)}
            onAddPhoto={() => void choosePhoto()}
          />

          <View className="gap-5 px-4">
            <SectionCard title="Dates">
              {birthday ? (
                <DateRow
                  date={birthday}
                  onPress={() =>
                    setSheetConfig({
                      mode: 'edit',
                      kind: 'date',
                      date: birthday,
                    })
                  }
                  onDelete={() => handleDeleteDate(birthday.id)}
                />
              ) : (
                <AddRow
                  title="Add birthday"
                  onPress={() =>
                    setSheetConfig({
                      mode: 'create',
                      kind: 'date',
                      personId: id,
                      dateLabel: 'Birthday',
                    })
                  }
                />
              )}
              {otherDates.map((date) => (
                <DateRow
                  key={date.id}
                  divider
                  date={date}
                  onPress={() =>
                    setSheetConfig({ mode: 'edit', kind: 'date', date })
                  }
                  onDelete={() => handleDeleteDate(date.id)}
                />
              ))}
              <AddRow
                title="Add date"
                divider
                onPress={() =>
                  setSheetConfig({ mode: 'create', kind: 'date', personId: id })
                }
              />
            </SectionCard>

            <SectionCard
              title="Facts"
              accessory={
                <FactSortMenu
                  sort={factSort}
                  isOpen={openMenu === 'sort'}
                  onOpenChange={(open) => setOpenMenu(open ? 'sort' : null)}
                  onChange={changeFactSort}
                />
              }
            >
              {facts.length === 0 ? (
                <View className="px-4 py-3">
                  <Text className="text-base text-muted-foreground">
                    Nothing here yet — save the little things worth remembering.
                  </Text>
                </View>
              ) : (
                facts.map((fact, index) => (
                  <EntryRow
                    key={fact.id}
                    divider={index > 0}
                    label={fact.label}
                    value={fact.value}
                    onPress={() =>
                      setSheetConfig({ mode: 'edit', kind: 'fact', fact })
                    }
                    onDelete={() => handleDeleteFact(fact.id)}
                  />
                ))
              )}
              <AddRow
                title="Add fact"
                divider
                onPress={() =>
                  setSheetConfig({ mode: 'create', kind: 'fact', personId: id })
                }
              />
            </SectionCard>
          </View>
        </Animated.ScrollView>
      </GestureDetector>

      <EntrySheet config={sheetConfig} onClose={() => setSheetConfig(null)} />
    </>
  );
}
