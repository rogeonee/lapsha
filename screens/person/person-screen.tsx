import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import {
  BIRTHDAY_LABEL,
  deleteDate,
  getDatesByPerson,
} from '~/api/dates/dates-service';
import { deleteFact, getFactsByPerson } from '~/api/facts/facts-service';
import { getPerson, updatePerson } from '~/api/people/people-service';
import {
  EntrySheet,
  type EntrySheetConfig,
} from '~/components/entry/entry-sheet';
import { Avatar } from '~/components/person/avatar';
import { showAvatarMenu } from '~/components/person/avatar-menu';
import { AddRow, DateRow, EntryRow } from '~/components/person/entry-row';
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

const cardStyle = {
  borderCurve: 'continuous',
  boxShadow: shadows.whisper,
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="px-1 text-base font-medium">{title}</Text>
      <View className="overflow-hidden rounded-2xl bg-white" style={cardStyle}>
        {children}
      </View>
    </View>
  );
}

export function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dataVersion = useTableVersion(['persons', 'facts', 'dates']);
  const [factSort, setFactSort] = useState<EntrySort>(() =>
    getSortPref('facts'),
  );
  const [sheetConfig, setSheetConfig] = useState<EntrySheetConfig | null>(null);

  const { person, facts, dates, error } = loadPersonData(
    id,
    factSort,
    dataVersion,
  );

  const birthday =
    dates.find((d) => d.label.toLowerCase() === BIRTHDAY_LABEL) ?? null;
  const otherDates = dates.filter((d) => d.id !== birthday?.id);

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

  const handleAvatarPress = () => {
    if (!person) return;
    showAvatarMenu({
      hasPhoto: person.avatar !== null,
      onChoose: () => void choosePhoto(),
      onRemove: removePhoto,
    });
  };

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Stack.Screen options={{ title: '' }} />
        <Text className="text-center text-lg text-muted-foreground">
          {error}
        </Text>
      </View>
    );
  }

  // Array, not a fragment: Stack.Toolbar.Menu validates its direct children
  // and rejects anything that isn't a menu primitive
  const sortActions = [
    <Stack.Toolbar.MenuAction
      key="created"
      isOn={factSort === 'created'}
      onPress={() => changeFactSort('created')}
    >
      Date added
    </Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction
      key="modified"
      isOn={factSort === 'modified'}
      onPress={() => changeFactSort('modified')}
    >
      Last modified
    </Stack.Toolbar.MenuAction>,
  ];

  return (
    <>
      <Stack.Screen options={{ title: person?.name ?? '' }} />
      {/* Android tints menu text with the toolbar tint (ink), while the
          Menu's own tintColor keeps the trigger icon amber. The inline
          "Sort facts" group is iOS-only: Android renders a stray divider. */}
      <Stack.Toolbar
        placement="right"
        tintColor={isIOS ? undefined : palette.ink}
      >
        <Stack.Toolbar.Menu
          // Android ignores SF Symbol names; it needs an image source
          icon={
            isIOS
              ? 'arrow.up.arrow.down'
              : require('~/assets/icons/swap_vert.xml')
          }
          tintColor={isIOS ? undefined : palette.broth}
          accessibilityLabel="Sort"
        >
          {isIOS ? (
            <Stack.Toolbar.Menu title="Sort facts" inline>
              {sortActions}
            </Stack.Toolbar.Menu>
          ) : (
            sortActions
          )}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="p-4 gap-5"
      >
        {/* The header announces the name; this circle is the photo slot.
            The Broth caption is the affordance (Contacts-style). */}
        <View className="items-center pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={person?.avatar ? 'Change photo' : 'Add photo'}
            onPress={handleAvatarPress}
            className="items-center gap-2 active:opacity-80"
          >
            <Avatar
              name={person?.name ?? ''}
              photo={avatarUri(person?.avatar)}
              size={72}
            />
            <Text className="text-base text-broth">
              {person?.avatar ? 'Change photo' : 'Add photo'}
            </Text>
          </Pressable>
        </View>

        <SectionCard title="Dates">
          {birthday ? (
            <DateRow
              date={birthday}
              onPress={() =>
                setSheetConfig({ mode: 'edit', kind: 'date', date: birthday })
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

        <SectionCard title="Facts">
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
      </ScrollView>

      <EntrySheet config={sheetConfig} onClose={() => setSheetConfig(null)} />
    </>
  );
}
