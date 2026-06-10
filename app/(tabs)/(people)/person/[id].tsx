import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import {
  BIRTHDAY_LABEL,
  deleteDate,
  getDatesByPerson,
} from '~/api/dates/dates-service';
import { deleteFact, getFactsByPerson } from '~/api/facts/facts-service';
import { getPerson } from '~/api/people/people-service';
import {
  EntrySheet,
  type EntrySheetConfig,
} from '~/components/entry/entry-sheet';
import { AddRow, EntryRow } from '~/components/person/entry-row';
import { Text } from '~/components/ui/text';
import { formatDisplayDate } from '~/lib/dates';
import { getSortPref, setSortPref } from '~/lib/prefs';
import { useTableVersion } from '~/lib/use-table-version';
import type { EntrySort, Fact, Person, Date as PersonDate } from '~/types/db';

const cardStyle = {
  borderCurve: 'continuous',
  boxShadow: '0 1px 3px rgba(28, 20, 8, 0.06)',
} as const;

// Synchronous reads, derived during render. The unused version arg is an
// invalidation token: React Compiler re-runs this when the db changes.
function loadPersonData(
  id: string | undefined,
  factSort: EntrySort,
  dateSort: EntrySort,
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
    dates: getDatesByPerson(id, dateSort).data ?? [],
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
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {title}
      </Text>
      <View className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
        {children}
      </View>
    </View>
  );
}

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dataVersion = useTableVersion(['persons', 'facts', 'dates']);
  const [factSort, setFactSort] = useState<EntrySort>(() =>
    getSortPref('facts'),
  );
  const [dateSort, setDateSort] = useState<EntrySort>(() =>
    getSortPref('dates'),
  );
  const [sheetConfig, setSheetConfig] = useState<EntrySheetConfig | null>(null);

  const { person, facts, dates, error } = loadPersonData(
    id,
    factSort,
    dateSort,
    dataVersion,
  );

  const birthday =
    dates.find((d) => d.label.toLowerCase() === BIRTHDAY_LABEL) ?? null;
  const otherDates = dates.filter((d) => d.id !== birthday?.id);

  const changeFactSort = (sort: EntrySort) => {
    setSortPref('facts', sort);
    setFactSort(sort);
  };

  const changeDateSort = (sort: EntrySort) => {
    setSortPref('dates', sort);
    setDateSort(sort);
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

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Stack.Screen options={{ title: '' }} />
        <Text className="text-lg text-muted-foreground text-center">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: person?.name ?? '' }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          icon="arrow.up.arrow.down"
          accessibilityLabel="Sort"
        >
          <Stack.Toolbar.Menu title="Sort facts" inline>
            <Stack.Toolbar.MenuAction
              isOn={factSort === 'created'}
              onPress={() => changeFactSort('created')}
            >
              Date added
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction
              isOn={factSort === 'modified'}
              onPress={() => changeFactSort('modified')}
            >
              Last modified
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
          <Stack.Toolbar.Menu title="Sort dates" inline>
            <Stack.Toolbar.MenuAction
              isOn={dateSort === 'created'}
              onPress={() => changeDateSort('created')}
            >
              Date added
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction
              isOn={dateSort === 'modified'}
              onPress={() => changeDateSort('modified')}
            >
              Last modified
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="p-4 gap-6"
      >
        <SectionCard title="Dates">
          {birthday ? (
            <EntryRow
              label="Birthday"
              value={formatDisplayDate(birthday)}
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
            <EntryRow
              key={date.id}
              divider
              label={date.label}
              value={formatDisplayDate(date)}
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
              <Text className="text-sm text-muted-foreground">
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
