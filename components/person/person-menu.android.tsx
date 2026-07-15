import { Stack } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';
import { Menu } from 'heroui-native/menu';
import { useState } from 'react';
import { View } from 'react-native';
import {
  CancelCircleIcon,
  EditIcon,
  MoreVertIcon,
  PhotoIcon,
  TrashIcon,
} from '~/components/ui/icons';
import { palette } from '~/lib/theme';

/**
 * Person toolbar menu (edit name / photo actions / delete) for the
 * person screen. The Compose DropdownMenu behind Stack.Toolbar.Menu
 * can't be styled beyond colors, so Android renders the trigger as a
 * headerRight view and opens a HeroUI menu in the Lapsha card language.
 * Delete confirms through a HeroUI dialog (the native Alert is stock M3).
 */
export function PersonMenu({
  personName,
  hasPhoto,
  isPhotoChromeExpanded,
  isOpen,
  onOpenChange,
  onEditName,
  onChoosePhoto,
  onRemovePhoto,
  onDeletePerson,
}: {
  personName: string;
  hasPhoto: boolean;
  /** Header chrome currently sits over the expanded photo scrim */
  isPhotoChromeExpanded: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditName: () => void;
  onChoosePhoto: () => void;
  onRemovePhoto: () => void;
  onDeletePerson: () => void;
}) {
  return (
    <Stack.Screen
      options={{
        headerRight: () => (
          <HeaderMenu
            personName={personName}
            hasPhoto={hasPhoto}
            isPhotoChromeExpanded={isPhotoChromeExpanded}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            onEditName={onEditName}
            onChoosePhoto={onChoosePhoto}
            onRemovePhoto={onRemovePhoto}
            onDeletePerson={onDeletePerson}
          />
        ),
      }}
    />
  );
}

const menuItemClassName = 'px-3.5 py-2.5';

function HeaderMenu({
  personName,
  hasPhoto,
  isPhotoChromeExpanded,
  isOpen,
  onOpenChange,
  onEditName,
  onChoosePhoto,
  onRemovePhoto,
  onDeletePerson,
}: {
  personName: string;
  hasPhoto: boolean;
  isPhotoChromeExpanded: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditName: () => void;
  onChoosePhoto: () => void;
  onRemovePhoto: () => void;
  onDeletePerson: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <>
      <Menu isOpen={isOpen} onOpenChange={onOpenChange}>
        <Menu.Trigger
          className="h-11 w-11 items-center justify-center"
          accessibilityLabel="Manage person"
        >
          <MoreVertIcon
            size={22}
            color={isPhotoChromeExpanded ? 'white' : palette.broth}
          />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Overlay />
          <Menu.Content presentation="popover" width={230}>
            <Menu.Item className={menuItemClassName} onPress={onEditName}>
              <Menu.ItemTitle>Edit name</Menu.ItemTitle>
              <EditIcon size={18} color={palette.ink} />
            </Menu.Item>
            <Menu.Item className={menuItemClassName} onPress={onChoosePhoto}>
              <Menu.ItemTitle>
                {hasPhoto ? 'Change photo' : 'Add photo'}
              </Menu.ItemTitle>
              <PhotoIcon size={18} color={palette.ink} />
            </Menu.Item>
            {hasPhoto && (
              <Menu.Item
                className={menuItemClassName}
                variant="danger"
                onPress={onRemovePhoto}
              >
                <Menu.ItemTitle>Remove photo</Menu.ItemTitle>
                <CancelCircleIcon size={18} color={palette.destructive} />
              </Menu.Item>
            )}
            <View className="mx-3.5 my-1 h-px bg-black/5" />
            <Menu.Item
              className={menuItemClassName}
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            >
              <Menu.ItemTitle>Delete person</Menu.ItemTitle>
              <TrashIcon size={18} color={palette.destructive} />
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu>

      <Dialog isOpen={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Delete {personName}?</Dialog.Title>
            <Dialog.Description>
              Their dates and facts will be removed too.
            </Dialog.Description>
            <View className="mt-5 flex-row gap-3">
              <Button
                variant="secondary"
                className="flex-1 rounded-2xl"
                onPress={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1 rounded-2xl"
                onPress={() => {
                  setConfirmingDelete(false);
                  onDeletePerson();
                }}
              >
                Delete
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
