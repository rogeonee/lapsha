import { Link, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { getPeople } from '~/api/people/people-service';
import { PersonCard } from '~/components/person/person-card';
import { Button } from '~/components/ui/button';
import { PlusIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { useCollapsingHeader } from '~/components/ui/use-collapsing-header';
import { palette } from '~/lib/theme';
import { useTableVersion } from '~/lib/use-table-version';
import type { Person } from '~/types/db';

const isIOS = process.env.EXPO_OS === 'ios';

// Synchronous read, derived during render. The unused args are
// invalidation tokens: React Compiler re-runs this when they change.
function loadPeople(_personsVersion: number, _retryNonce: number) {
  return getPeople();
}

function PersonSeparator() {
  return <View className="h-3" />;
}

function PersonListItem({ person }: { person: Person }) {
  return (
    <Link
      href={{
        pathname: '/(tabs)/(people)/person/[id]',
        params: { id: person.id },
      }}
      asChild
    >
      <Link.Trigger>
        <Pressable>
          <PersonCard person={person} />
        </Pressable>
      </Link.Trigger>
      <Link.Preview />
    </Link>
  );
}

function renderPerson({ item }: ListRenderItemInfo<Person>) {
  return <PersonListItem person={item} />;
}

export default function PeopleScreen() {
  const router = useRouter();
  const header = useCollapsingHeader({
    title: 'People',
    right: (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add person"
        onPress={() => router.push('/add-person')}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-black/5"
      >
        <PlusIcon size={24} color={palette.broth} />
      </Pressable>
    ),
  });
  const personsVersion = useTableVersion(['persons']);
  const [retryNonce, setRetryNonce] = useState(0);

  const response = loadPeople(personsVersion, retryNonce);
  const people = response.data ?? [];
  const error = response.error
    ? response.error.message || 'Failed to load people'
    : null;

  return (
    <>
      {/* Android's add action lives in the collapsing header bar instead */}
      {isIOS ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="plus"
            accessibilityLabel="Add person"
            onPress={() => router.push('/add-person')}
          />
        </Stack.Toolbar>
      ) : null}

      {error ? (
        <View className="flex-1">
          {header.largeTitle ? (
            <View className="px-4">{header.largeTitle}</View>
          ) : null}
          <View className="flex-1 items-center justify-center px-8">
            <Text className="mb-4 text-center text-lg text-destructive">
              Error loading people
            </Text>
            <Text
              selectable
              className="mb-6 text-center text-sm text-muted-foreground"
            >
              {error}
            </Text>
            <Button
              onPress={() => setRetryNonce((n) => n + 1)}
              variant="outline"
            >
              <Text className="font-medium">Try Again</Text>
            </Button>
          </View>
        </View>
      ) : people.length > 0 ? (
        <FlatList
          data={people}
          keyExtractor={(person) => person.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="p-4"
          ItemSeparatorComponent={PersonSeparator}
          renderItem={renderPerson}
          ListHeaderComponent={
            header.largeTitle ? (
              <View className="pb-5">{header.largeTitle}</View>
            ) : null
          }
          onScroll={header.onScroll}
          scrollEventThrottle={16}
        />
      ) : (
        <View className="flex-1">
          {header.largeTitle ? (
            <View className="px-4">{header.largeTitle}</View>
          ) : null}
          <View className="flex-1 items-center justify-center px-8">
            <Text className="mb-6 text-center text-lg text-muted-foreground">
              No people added yet.
            </Text>
            <Text className="mb-8 text-center text-sm text-muted-foreground">
              Add people to start keeping track of important facts and dates
              about them.
            </Text>
            <Button
              onPress={() => router.push('/add-person')}
              variant="outline"
            >
              <Text className="font-medium">Add Your First Person</Text>
            </Button>
          </View>
        </View>
      )}
      {header.bar}
    </>
  );
}
