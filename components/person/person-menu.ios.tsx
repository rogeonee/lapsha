import { Stack } from 'expo-router';
import { Alert, Platform } from 'react-native';

// iOS 26 liquid-glass header buttons adapt to the content behind them;
// forcing them white over the expanded photo washes them out. Only
// pre-26 headers (plain buttons over the scrim) take the white flip.
const isLiquidGlass = Number.parseInt(String(Platform.Version), 10) >= 26;

/**
 * Person toolbar menu (edit name / photo actions / delete) for the
 * person screen. iOS renders a native Stack.Toolbar menu.
 */
export function PersonMenu({
  personName,
  hasPhoto,
  isPhotoChromeExpanded,
  isOpen: _isOpen,
  onOpenChange: _onOpenChange,
  onEditName,
  onChoosePhoto,
  onRemovePhoto,
  onDeletePerson,
}: {
  personName: string;
  hasPhoto: boolean;
  /** Header chrome currently sits over the expanded photo scrim */
  isPhotoChromeExpanded: boolean;
  /** Android-only controlled HeroUI menu state */
  isOpen: boolean;
  /** Android-only controlled HeroUI menu state */
  onOpenChange: (open: boolean) => void;
  onEditName: () => void;
  onChoosePhoto: () => void;
  onRemovePhoto: () => void;
  onDeletePerson: () => void;
}) {
  const confirmDelete = () => {
    Alert.alert(
      `Delete ${personName}?`,
      'Their dates and facts will be removed too.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDeletePerson },
      ],
    );
  };

  // Arrays, not fragments: Stack.Toolbar.Menu validates its direct
  // children and rejects anything that isn't a menu primitive.
  const manageActions = [
    <Stack.Toolbar.MenuAction
      key="edit-name"
      icon="pencil"
      onPress={onEditName}
    >
      Edit name
    </Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="photo" icon="photo" onPress={onChoosePhoto}>
      {hasPhoto ? 'Change photo' : 'Add photo'}
    </Stack.Toolbar.MenuAction>,
    ...(hasPhoto
      ? [
          <Stack.Toolbar.MenuAction
            key="remove-photo"
            destructive
            icon="xmark.circle"
            onPress={onRemovePhoto}
          >
            Remove photo
          </Stack.Toolbar.MenuAction>,
        ]
      : []),
  ];
  const deleteAction = [
    <Stack.Toolbar.MenuAction
      key="delete"
      destructive
      icon="trash"
      onPress={confirmDelete}
    >
      Delete person
    </Stack.Toolbar.MenuAction>,
  ];

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu
        icon="ellipsis.circle"
        tintColor={
          isPhotoChromeExpanded && !isLiquidGlass ? 'white' : undefined
        }
        accessibilityLabel="Manage person"
      >
        {/* Inline groups render a hairline divider on iOS 26 but a
            chunky section gap on iOS 18, so pre-26 stays flat */}
        {isLiquidGlass
          ? [
              <Stack.Toolbar.Menu key="manage" inline>
                {manageActions}
              </Stack.Toolbar.Menu>,
              <Stack.Toolbar.Menu key="delete" inline>
                {deleteAction}
              </Stack.Toolbar.Menu>,
            ]
          : [...manageActions, ...deleteAction]}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
