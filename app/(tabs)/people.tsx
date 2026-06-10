import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPeople, Person } from '~/api/people/people-service';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

const placeholderUri = 'https://placehold.co/96x96?text=Avatar';

function PersonCard({ person }: { person: Person }) {
  return (
    <View className="flex-row items-center bg-white rounded-xl shadow p-4 mb-4 mx-4">
      <Image
        source={{ uri: placeholderUri }}
        style={{ width: 64, height: 64, borderRadius: 32, marginRight: 16 }}
        className="w-16 h-16 rounded-full bg-gray-100"
        contentFit="cover"
      />
      <Text className="text-lg font-medium">{person.name}</Text>
    </View>
  );
}

export default function PeopleScreen() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handleAddPerson = () => {
    router.push('/(tabs)/../add-person' as any);
  };

  const loadPeople = useCallback(() => {
    const response = getPeople();
    if (response.error) {
      setError(response.error.message || 'Failed to load people');
      setPeople([]);
    } else {
      setError(null);
      setPeople(response.data ?? []);
    }
  }, []);

  // Reload whenever the screen gains focus (e.g. after adding a person)
  useFocusEffect(
    useCallback(() => {
      loadPeople();
    }, [loadPeople]),
  );

  return (
    <View className="flex-1 bg-[#F9F7F4]">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 border-red-500"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text className="text-3xl font-bold">People</Text>
        <Button onPress={handleAddPerson} size="sm">
          <Text className="text-white font-medium">Add Person</Text>
        </Button>
      </View>

      {/* Content */}
      {error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-lg text-red-600 text-center mb-4">
            Error loading people
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">
            {error}
          </Text>
          <Button onPress={loadPeople} variant="outline">
            <Text className="font-medium">Try Again</Text>
          </Button>
        </View>
      ) : people.length > 0 ? (
        <ScrollView className="flex-1 py-8 mb-28">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted-foreground text-center mb-6">
            No people added yet.
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-8 px-8">
            Add people to start keeping track of important facts and dates about
            them.
          </Text>
          <Button onPress={handleAddPerson} variant="outline">
            <Text className="font-medium">Add Your First Person</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
