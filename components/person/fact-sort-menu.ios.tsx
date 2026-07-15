import { Host, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { palette } from '~/lib/theme';
import type { EntrySort } from '~/types/db';

/**
 * Sort chooser for the Facts card header: a tap-activated SwiftUI Menu
 * whose inline Picker renders native checkmarked options.
 */
export function FactSortMenu({
  sort,
  isOpen: _isOpen,
  onOpenChange: _onOpenChange,
  onChange,
}: {
  sort: EntrySort;
  /** Android-only controlled HeroUI menu state */
  isOpen: boolean;
  /** Android-only controlled HeroUI menu state */
  onOpenChange: (open: boolean) => void;
  onChange: (sort: EntrySort) => void;
}) {
  return (
    <Host style={{ width: 44, height: 24 }}>
      <Menu
        label={
          <Image
            systemName="arrow.up.arrow.down"
            size={15}
            color={palette.broth}
          />
        }
      >
        <Picker
          label="Sort facts"
          selection={sort}
          onSelectionChange={(selection) => onChange(selection as EntrySort)}
          modifiers={[pickerStyle('inline')]}
        >
          <Text modifiers={[tag('created')]}>Date added</Text>
          <Text modifiers={[tag('modified')]}>Last modified</Text>
        </Picker>
      </Menu>
    </Host>
  );
}
