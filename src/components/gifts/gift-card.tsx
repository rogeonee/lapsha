import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  giftDomain,
  giftLabel,
  giftStatusLabels,
  type Gift,
} from '~/api/gifts/gift-schema';
import { deleteGift } from '~/api/gifts/gifts-service';
import { SwipeableRow } from '~/components/person/entry-row';
import { GiftPhotoViewer } from '~/components/gifts/gift-photo-viewer';
import { Text } from '~/components/ui/text';
import { giftPhotoUri } from '~/lib/gift-photos';
import { fromStorageDate } from '~/lib/dates';
import { shadows } from '~/lib/theme';

const THUMBNAIL_SIZE = 80;
const PHOTO_INSET = 14;

export function GiftCard({ gift, onEdit }: { gift: Gift; onEdit: () => void }) {
  const { fontScale, width } = useWindowDimensions();
  const [viewing, setViewing] = useState(false);
  const uri = giftPhotoUri(gift.photo);
  const hasText = Boolean(gift.title || gift.note);
  const stacked = !hasText || fontScale > 1.2 || width < 350;
  const caption =
    gift.status === 'given' && gift.given_on
      ? `Given · ${fromStorageDate(gift.given_on).date.toLocaleDateString()}`
      : giftStatusLabels[gift.status];
  return (
    <View
      className="overflow-hidden rounded-2xl bg-white"
      style={{ borderCurve: 'continuous', boxShadow: shadows.whisper }}
    >
      <SwipeableRow
        accessibilityValue={giftLabel(gift)}
        editLabel={`gift: ${giftLabel(gift)}`}
        deleteLabel={`gift: ${giftLabel(gift)}`}
        onPress={onEdit}
        onDelete={() => {
          const response = deleteGift(gift.id);
          if (response.error)
            Alert.alert('Couldn’t delete gift', 'Please try again.');
        }}
        accessoryPosition={stacked ? 'bottom' : 'right'}
        accessory={
          uri
            ? {
                accessibilityLabel: 'View gift photo',
                onPress: () => setViewing(true),
                style: stacked
                  ? {
                      paddingHorizontal: PHOTO_INSET,
                      paddingBottom: PHOTO_INSET,
                    }
                  : {
                      width: THUMBNAIL_SIZE + PHOTO_INSET,
                      paddingRight: PHOTO_INSET,
                      paddingVertical: PHOTO_INSET,
                    },
                content: (
                  <Image
                    source={{ uri }}
                    style={{
                      width: '100%',
                      height: stacked ? 210 : THUMBNAIL_SIZE,
                      borderRadius: 12,
                    }}
                    contentFit="cover"
                  />
                ),
              }
            : undefined
        }
      >
        <View
          className="gap-1 px-4 py-4"
          style={
            uri && !stacked
              ? { minHeight: THUMBNAIL_SIZE + PHOTO_INSET * 2 }
              : undefined
          }
        >
          <Text className="text-sm text-muted-foreground">{caption}</Text>
          {gift.title && (
            <Text className="text-lg font-medium">{gift.title}</Text>
          )}
          {gift.note && (
            <Text className="text-base leading-6">{gift.note}</Text>
          )}
          {!hasText && (
            <Text className="text-base text-muted-foreground">
              Saved {new Date(gift.created_at).toLocaleDateString()} · Edit
              details
            </Text>
          )}
          {gift.photo && !uri && (
            <Text className="text-sm text-muted-foreground">
              Photo unavailable · Tap to replace
            </Text>
          )}
        </View>
      </SwipeableRow>
      {gift.url && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open ${giftDomain(gift.url)}`}
          className="min-h-12 justify-center border-t border-black/5 px-4 py-3 active:bg-black/5"
          onPress={() => {
            if (gift.url)
              void Linking.openURL(gift.url).catch(() =>
                Alert.alert(
                  'Couldn’t open link',
                  'Edit the gift to check its link.',
                ),
              );
          }}
        >
          <Text className="text-base text-broth">{giftDomain(gift.url)} ↗</Text>
        </Pressable>
      )}
      {viewing && uri && (
        <GiftPhotoViewer uri={uri} onClose={() => setViewing(false)} />
      )}
    </View>
  );
}
