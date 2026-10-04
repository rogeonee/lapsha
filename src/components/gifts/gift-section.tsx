import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { getGiftsByPerson } from '~/api/gifts/gifts-service';
import type { Gift } from '~/api/gifts/gift-schema';
import type { EntrySheetConfig } from '~/components/entry/use-entry-form';
import { AddRow } from '~/components/person/entry-row';
import { PersonSectionHeader } from '~/components/person/person-section-header';
import { GiftCard } from '~/components/gifts/gift-card';
import { CameraIcon, ChevronRightIcon } from '~/components/ui/icons';
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
  const version = useTableVersion(['gifts', 'persons']);
  const response = loadGifts(personId, version);
  const gifts = response.error ? [] : (response.data ?? []);
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
    <View className="gap-1">
      <PersonSectionHeader
        title="Gifts"
        accessory={
          process.env.EXPO_OS === 'android' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Snap a gift for this person"
              className="items-center justify-center rounded-full active:bg-black/5"
              style={{ width: 48, height: 48 }}
              onPress={() =>
                router.push({ pathname: '/gift-capture', params: { personId } })
              }
            >
              <CameraIcon color={palette.broth} size={22} />
            </Pressable>
          )
        }
      />
      <View className="gap-3">
        {response.error ? (
          <Text className="text-base text-muted-foreground">
            Couldn’t load gifts. Reopen this person to try again.
          </Text>
        ) : (
          <>
            {active.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                onEdit={() => openGift(gift)}
              />
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
                  className="min-h-12 flex-row items-center gap-3 rounded-xl px-1 active:bg-black/5"
                  onPress={() => setHistoryOpen(!historyOpen)}
                >
                  <Text className="flex-1 text-base text-broth">
                    Previously given
                  </Text>
                  <View
                    style={{
                      transform: [{ rotate: historyOpen ? '270deg' : '90deg' }],
                    }}
                  >
                    <ChevronRightIcon color={palette.warmGrayDeep} size={18} />
                  </View>
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
    </View>
  );
}
