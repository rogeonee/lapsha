import { Alert, Pressable } from 'react-native';
import { SwapVertIcon } from '~/components/ui/icons';
import { palette } from '~/lib/theme';
import type { EntrySort } from '~/types/db';

/**
 * Sort chooser for the Facts card header. Android uses the Alert-chooser
 * pattern (see avatar-menu.ts); the active option carries a checkmark.
 */
export function FactSortMenu({
  sort,
  onChange,
}: {
  sort: EntrySort;
  onChange: (sort: EntrySort) => void;
}) {
  const openChooser = () => {
    const mark = (label: string, value: EntrySort) =>
      sort === value ? `${label} ✓` : label;
    Alert.alert('Sort facts', undefined, [
      {
        text: mark('Date added', 'created'),
        onPress: () => onChange('created'),
      },
      {
        text: mark('Last modified', 'modified'),
        onPress: () => onChange('modified'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      onPress={openChooser}
      hitSlop={12}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel="Sort facts"
    >
      <SwapVertIcon size={16} color={palette.broth} />
    </Pressable>
  );
}
