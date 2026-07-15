import { Menu } from 'heroui-native/menu';
import { SwapVertIcon } from '~/components/ui/icons';
import { palette } from '~/lib/theme';
import type { EntrySort } from '~/types/db';

/**
 * Sort chooser for the Facts card header: a HeroUI menu anchored to the
 * sort glyph with native checkmarked options, mirroring the iOS SwiftUI
 * menu picker.
 */
export function FactSortMenu({
  sort,
  isOpen,
  onOpenChange,
  onChange,
}: {
  sort: EntrySort;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (sort: EntrySort) => void;
}) {
  return (
    <Menu isOpen={isOpen} onOpenChange={onOpenChange}>
      <Menu.Trigger hitSlop={12} accessibilityLabel="Sort facts">
        <SwapVertIcon size={24} color={palette.broth} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content presentation="popover" width={190}>
          <Menu.Group
            selectionMode="single"
            selectedKeys={new Set([sort])}
            onSelectionChange={(keys) => {
              const [next] = keys;
              if (next) onChange(next as EntrySort);
            }}
          >
            <Menu.Item id="created" className="px-3.5 py-2.5">
              <Menu.ItemIndicator iconProps={{ color: palette.broth }} />
              <Menu.ItemTitle>Date added</Menu.ItemTitle>
            </Menu.Item>
            <Menu.Item id="modified" className="px-3.5 py-2.5">
              <Menu.ItemIndicator iconProps={{ color: palette.broth }} />
              <Menu.ItemTitle>Last modified</Menu.ItemTitle>
            </Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
}
