import { Link, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { getPeople } from '~/api/people/people-service';
import { PersonCard } from '~/components/person/person-card';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useTableVersion } from '~/lib/use-table-version';

// Synchronous read, derived during render. The unused args are
// invalidation tokens: React Compiler re-runs this when they change.
function loadPeople(_personsVersion: number, _retryNonce: number) {
  return getPeople();
}

export default function PeopleScreen() {
  const router = useRouter();
  const personsVersion = useTableVersion(['persons']);
  const [retryNonce, setRetryNonce] = useState(0);

  const response = loadPeople(personsVersion, retryNonce);
  const people = response.data ?? [];
  const error = response.error
    ? response.error.message || 'Failed to load people'
    : null;

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          // Android ignores SF Symbol names; it needs an image source
          icon={
            process.env.EXPO_OS === 'ios'
              ? 'plus'
              : require('~/assets/icons/add.xml')
          }
          accessibilityLabel="Add person"
          onPress={() => router.push('/add-person')}
        />
      </Stack.Toolbar>

      {error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-lg text-red-600 text-center mb-4">
            Error loading people
          </Text>
          <Text
            selectable
            className="text-sm text-muted-foreground text-center mb-6"
          >
            {error}
          </Text>
          <Button onPress={() => setRetryNonce((n) => n + 1)} variant="outline">
            <Text className="font-medium">Try Again</Text>
          </Button>
        </View>
      ) : people.length > 0 ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="p-4 gap-3"
        >
          {people.map((person) => (
            <Link
              key={person.id}
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
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-lg text-muted-foreground text-center mb-6">
            No people added yet.
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-8">
            Add people to start keeping track of important facts and dates about
            them.
          </Text>
          <Button onPress={() => router.push('/add-person')} variant="outline">
            <Text className="font-medium">Add Your First Person</Text>
          </Button>
        </View>
      )}
    </>
  );
}
