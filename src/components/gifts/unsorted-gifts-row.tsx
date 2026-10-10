import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { getUnsortedGiftCount } from '~/api/gifts/gifts-service';
import { ChevronRightIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { palette } from '~/lib/theme';
import { useTableVersion } from '~/lib/use-table-version';

function loadUnsorted(_version: number) {
  return process.env.EXPO_OS === 'android' ? getUnsortedGiftCount() : null;
}
export function UnsortedGiftsRow() {
  const router = useRouter();
  const version = useTableVersion(['gifts']);
  const response = loadUnsorted(version);
  if (
    process.env.EXPO_OS !== 'android' ||
    !response ||
    (!response.error && !response.data)
  )
    return null;
  return (
    <Pressable
      accessibilityRole="button"
      className="my-3 min-h-14 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3"
      onPress={() => router.push('/gift-inbox')}
    >
      <Text className="flex-1 text-base text-broth">
        {response.error
          ? 'Open unsorted gift ideas'
          : `Unsorted gift ideas · ${response.data}`}
      </Text>
      <ChevronRightIcon color={palette.broth} />
    </Pressable>
  );
}
