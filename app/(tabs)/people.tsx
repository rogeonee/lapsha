import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '~/api/auth/auth-context';
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

function arePeopleListsEqual(a: Person[], b: Person[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].name !== b[i].name ||
      a[i].photo_url !== b[i].photo_url
    ) {
      return false;
    }
  }
  return true;
}

export default function PeopleScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const hasLoadedOnce = useRef(false);
  const lastPeopleRef = useRef<Person[]>([]);

  const handleAddPerson = () => {
    router.push('/(tabs)/../add-person' as any);
  };

  // Initial load (show loading spinner)
  const fetchPeopleInitial = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getPeople(session.user.id);
      if (response.error) {
        setError(response.error.message || 'Failed to load people');
        setPeople([]);
        lastPeopleRef.current = [];
      } else {
        setPeople(response.data || []);
        lastPeopleRef.current = response.data || [];
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setPeople([]);
      lastPeopleRef.current = [];
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [session?.user?.id]);

  // Background refresh (no spinner, only update if changed)
  const fetchPeopleBackground = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await getPeople(session.user.id);
      if (!response.error && response.data) {
        if (!arePeopleListsEqual(response.data, lastPeopleRef.current)) {
          setPeople(response.data);
          lastPeopleRef.current = response.data;
        }
      }
    } catch {}
  }, [session?.user?.id]);

  // On mount, do initial load
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnce.current) {
        fetchPeopleInitial();
      } else {
        fetchPeopleBackground();
      }
    }, [fetchPeopleInitial, fetchPeopleBackground]),
  );

  const handleRetry = () => {
    fetchPeopleInitial();
  };

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
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F6B756" />
          <Text className="text-muted-foreground mt-2">Loading people...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-lg text-red-600 text-center mb-4">
            Error loading people
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">
            {error}
          </Text>
          <Button onPress={handleRetry} variant="outline">
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
