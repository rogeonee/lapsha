import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { deleteGift, getGiftsByPerson } from '~/api/gifts/gifts-service';
import type { Gift } from '~/api/gifts/gift-schema';
import type { EntrySheetConfig } from '~/components/entry/use-entry-form';
import { AddRow } from '~/components/person/entry-row';
import { useCaptureFeedback } from '~/components/gifts/capture-feedback';
import { GiftCard } from '~/components/gifts/gift-card';
import { CameraIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { palette } from '~/lib/theme';
import { useTableVersion } from '~/lib/use-table-version';

function loadGifts(personId: string, _version: number) {
  return getGiftsByPerson(personId);
}

export function GiftSection({
  personId,
  onOpenSheet,
}: {
  personId: string;
  onOpenSheet: (config: EntrySheetConfig) => void;
}) {
  const router = useRouter();
  const feedback = useCaptureFeedback();
  const version = useTableVersion(['gifts', 'persons']);
  const response = loadGifts(personId, version);
  const gifts = response.error ? [] : (response.data ?? []);
  const justSaved = gifts.find((gift) => gift.id === feedback.gift?.id);
  const active = gifts.filter((gift) => gift.status !== 'given');
  const history = gifts
    .filter((gift) => gift.status === 'given')
    .sort((a, b) => (b.given_on ?? '').localeCompare(a.given_on ?? ''));
  const [historyOpen, setHistoryOpen] = useState(false);
  const openGift = (gift?: Gift) => {
    if (process.env.EXPO_OS === 'android')
      router.push({
        pathname: '/gift-editor',
        params: gift ? { id: gift.id } : { personId },
      });
    else
      onOpenSheet(
        gift
          ? { mode: 'edit', kind: 'gift', gift }
          : { mode: 'create', kind: 'gift', personId },
      );
  };
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-base font-medium">Gifts</Text>
        {process.env.EXPO_OS === 'android' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Snap a gift for this person"
            className="min-h-12 min-w-12 items-center justify-center"
            onPress={() =>
              router.push({ pathname: '/gift-capture', params: { personId } })
            }
          >
            <CameraIcon color={palette.broth} size={22} />
          </Pressable>
        )}
      </View>
      {justSaved && (
        <View className="gap-2 rounded-2xl bg-white px-4 py-2">
          <Text accessibilityLiveRegion="polite" className="pt-2 text-base">
            Photo saved
          </Text>
          <View className="flex-row flex-wrap gap-5">
            <Pressable
              accessibilityRole="button"
              className="min-h-12 justify-center"
              onPress={() => {
                openGift(justSaved);
                feedback.show(null);
              }}
            >
              <Text className="text-base text-broth">Add details</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-12 justify-center"
              onPress={() => {
                const result = deleteGift(justSaved.id);
                if (result.error)
                  Alert.alert('Couldn’t undo capture', 'Please try again.');
                else feedback.show(null);
              }}
            >
              <Text className="text-base text-broth">Undo</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-12 justify-center"
              onPress={() => feedback.show(null)}
            >
              <Text className="text-base text-muted-foreground">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      )}
      {response.error ? (
        <Text className="text-base text-muted-foreground">
          Couldn’t load gifts. Reopen this person to try again.
        </Text>
      ) : (
        <>
          {active.map((gift) => (
            <GiftCard key={gift.id} gift={gift} onEdit={() => openGift(gift)} />
          ))}
          <View className="overflow-hidden rounded-2xl bg-white">
            {active.length === 0 && (
              <Text className="px-4 pt-4 text-base leading-6 text-muted-foreground">
                Saw something they’d love? Keep a photo, a thought, or a link.
              </Text>
            )}
            <AddRow title="Add gift idea" onPress={() => openGift()} />
          </View>
          {history.length > 0 && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: historyOpen }}
                className="min-h-12 justify-center px-1"
                onPress={() => setHistoryOpen(!historyOpen)}
              >
                <Text className="text-base text-broth">
                  Previously given ({history.length}) {historyOpen ? '⌃' : '⌄'}
                </Text>
              </Pressable>
              {historyOpen &&
                history.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    onEdit={() => openGift(gift)}
                  />
                ))}
            </>
          )}
        </>
      )}
    </View>
  );
}
