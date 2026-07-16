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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { deleteDate, getDatesByPerson } from '~/api/dates/dates-service';
import { deleteFact, getFactsByPerson } from '~/api/facts/facts-service';
import {
  deletePerson,
  getPerson,
  updatePerson,
} from '~/api/people/people-service';
import EntrySheet, {
  type EntrySheetConfig,
} from '~/components/entry/entry-sheet';
import { PersonDetailSections } from '~/components/person/person-detail-sections';
import PersonMenu from '~/components/person/person-menu';
import { PersonPhotoHero } from '~/components/person/person-photo-hero';
import {
  personPhotoCompactHeight,
  personPhotoExpandedHeight,
} from '~/components/person/person-photo-layout';
import { HeaderScrim } from '~/components/ui/header-scrim';
import { Text } from '~/components/ui/text';
import {
  avatarUri,
  deleteAvatarFile,
  pickAvatarImage,
  saveAvatarFile,
} from '~/lib/avatars';
import { getSortPref, setSortPref } from '~/lib/prefs';
import { palette } from '~/lib/theme';
import { useTableVersion } from '~/lib/use-table-version';
import type { EntrySort, Fact, Person, Date as PersonDate } from '~/types/db';

const isIOS = process.env.EXPO_OS === 'ios';
// iOS 26 liquid-glass header buttons adapt to the content behind them;
// forcing them white over the expanded photo washes them out. Only
// pre-26 headers (plain buttons over the scrim) take the white flip.
const isLiquidGlass =
  isIOS && Number.parseInt(String(Platform.Version), 10) >= 26;

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

function handleDeleteFact(factId: string) {
  const response = deleteFact(factId);
  if (response.error) {
    Alert.alert('Error', 'Failed to delete fact. Please try again.');
  }
}

function handleDeleteDate(dateId: string) {
  const response = deleteDate(dateId);
  if (response.error) {
    Alert.alert('Error', 'Failed to delete date. Please try again.');
  }
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

  // Android's transparent header gets the shared paper scrim so rows
  // dissolve under it; it hands the top of the screen to the photo in
  // step with the expand gesture.
  const headerScrimStyle = useAnimatedStyle(() => ({
    opacity: 1 - photoProgress.value,
  }));

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

          <PersonDetailSections
            personId={id}
            dates={dates}
            facts={facts}
            factSort={factSort}
            isSortMenuOpen={openMenu === 'sort'}
            onSortMenuOpenChange={(open) => setOpenMenu(open ? 'sort' : null)}
            onFactSortChange={changeFactSort}
            onOpenSheet={setSheetConfig}
            onDeleteDate={handleDeleteDate}
            onDeleteFact={handleDeleteFact}
          />
        </Animated.ScrollView>
      </GestureDetector>

      {!isIOS ? (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0 },
            headerScrimStyle,
          ]}
        >
          <HeaderScrim height={headerHeight} />
        </Animated.View>
      ) : null}

      <EntrySheet config={sheetConfig} onClose={() => setSheetConfig(null)} />
    </>
  );
}
