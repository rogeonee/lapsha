import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { getGiftsByPerson } from '~/api/gifts/gifts-service';
import { GiftCard } from '~/components/gifts/gift-card';
import { Text } from '~/components/ui/text';
import { useTableVersion } from '~/lib/use-table-version';

function loadUnsorted(_version: number, _retry: number) {
  return getGiftsByPerson(null);
}
export default function GiftInboxScreen() {
  const router = useRouter();
  const version = useTableVersion(['gifts', 'persons']);
  const [retry, setRetry] = useState(0);
  const response = loadUnsorted(version, retry);
  return (
    <View className="flex-1 bg-paper">
      <FlatList
        data={response.error ? [] : (response.data ?? [])}
        keyExtractor={(gift) => gift.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
        renderItem={({ item }) => (
          <GiftCard
            gift={item}
            onEdit={() =>
              router.push({ pathname: '/gift-editor', params: { id: item.id } })
            }
          />
        )}
        ListHeaderComponent={
          <Text className="text-base leading-6 text-muted-foreground">
            Safe here until you choose who they’re for.
          </Text>
        }
        ListEmptyComponent={
          response.error ? (
            <Pressable onPress={() => setRetry(retry + 1)}>
              <Text>Couldn’t load ideas. Tap to retry.</Text>
            </Pressable>
          ) : (
            <Text className="py-8 text-center text-base">
              All sorted. Your next little discovery can go here.
            </Text>
          )
        }
      />
    </View>
  );
}
