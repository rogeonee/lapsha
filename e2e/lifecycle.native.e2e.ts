import assert from 'node:assert/strict';
import { test } from '@e2e-dev/mobile';
import { expect, type Screen } from 'e2e';
import { maya } from './persistence-contract';
import {
  assertNativeEmpty,
  assertNativeMaya,
  readNativeRows,
} from './native-oracle';
import {
  givenDate,
  selectedDate,
  discardedDate,
  dismissSheet,
} from './calendar';

async function openGift(screen: Screen) {
  const gift = screen.getByRole('button', `Edit gift: ${maya.title}`);
  if (!(await gift.isVisible())) {
    const section = screen.getByRole('button', /^Previously given/);
    await screen.scrollUntilVisible(section);
    await section.tap();
  }
  await screen.scrollUntilVisible(gift);
  await gift.tap();
}

test('create, persist, relaunch, cancel edits and delete', async ({
  app,
  screen,
  device,
}) => {
  const ready = async () => {
    await expect(device.locator('role=button label="People"')).toBeVisible({
      timeout: 60_000,
    });
  };
  const openPerson = async () => {
    await device.locator('role=button label="People"').tap();
    await screen.getByRole('button', `Open person: ${maya.name}`).tap();
    await expect(screen.getByRole('button', 'Manage person')).toBeVisible();
  };
  const relaunch = async () => {
    await device.closeApp();
    await app.open();
    await ready();
  };
  await app.open();
  await ready();
  assertNativeEmpty();
  await device.locator('role=button label="People"').tap();
  await screen.getByRole('button', 'Add person').tap();
  await screen.getByLabel("Person's name").fill('Discarded draft');
  await screen.getByRole('button', 'Cancel').tap();
  await expect(screen.getByLabel("Person's name")).toBeHidden();
  assertNativeEmpty();
  await screen.getByRole('button', 'Add person').tap();
  await screen.getByLabel("Person's name").fill(maya.name);
  await screen.getByRole('button', 'Add').tap();
  await expect(screen.getByRole('button', 'Manage person')).toBeVisible();
  await screen.getByRole('button', 'Add fact').tap();
  await screen.getByPlaceholder('The fact itself').fill(maya.factValue);
  await screen.getByPlaceholder('Label (optional)').fill(maya.factLabel);
  await screen.getByRole('button', 'Save').tap();
  await expect(screen.getByText('New fact')).toBeHidden();
  await screen.scrollUntilVisible(screen.getByRole('button', 'Add gift idea'));
  await screen.getByRole('button', 'Add gift idea').tap();
  await screen.getByPlaceholder('Title (optional)').fill(maya.title);
  await screen.getByLabel('Note').fill(maya.note);
  await screen.getByPlaceholder('Link (optional)').fill(maya.url);
  await device.locator('role=button label="Given"').tap();
  await givenDate(screen, selectedDate, true);
  await screen.getByRole('button', 'Save').tap();
  await expect(screen.getByText('New gift idea')).toBeHidden();
  await relaunch();
  assertNativeMaya();
  await openPerson();
  await screen.getByRole('button', 'Manage person').tap();
  await screen.getByText('Delete person').tap();
  await expect(screen.getByText(`Delete ${maya.name}?`)).toBeVisible();
  await screen.getByRole('button', 'Cancel').tap();
  await expect(screen.getByText(`Delete ${maya.name}?`)).toBeHidden();
  assertNativeMaya();
  await openGift(screen);
  await givenDate(screen, discardedDate, true);
  await dismissSheet(screen);
  await expect(screen.getByText('Edit gift')).toBeHidden();
  await relaunch();
  assertNativeMaya();
  await openPerson();
  await openGift(screen);
  await expect(screen.getByPlaceholder('Title (optional)')).toHaveValue(
    maya.title,
  );
  await expect(screen.getByDisplayValue(maya.note)).toHaveValue(maya.note);
  await expect(screen.getByPlaceholder('Link (optional)')).toHaveValue(
    maya.url,
  );
  await givenDate(screen, selectedDate, false);
  await app.screenshot('persisted-gift');
  await dismissSheet(screen);
  await expect(screen.getByText('Edit gift')).toBeHidden();
  const gift = screen.getByRole('button', `Edit gift: ${maya.title}`);
  await screen.scrollUntilVisible(gift);
  // Accessibility visibility includes content behind the native tab bar. Bring
  // the entire row above it before the horizontal gesture.
  for (let step = 0; step < 6; step++) {
    const row = await gift.boundingBox();
    const tabs = await screen.getByRole('tablist', 'Tab Bar').boundingBox();
    assert.ok(row && tabs, 'gift and native tab bounds must be observable');
    if (row.y + row.height < tabs.y) break;
    await screen.swipe({ direction: 'down', momentum: 'slow' });
  }
  const row = await gift.boundingBox();
  const tabs = await screen.getByRole('tablist', 'Tab Bar').boundingBox();
  assert.ok(
    row && tabs && row.y + row.height < tabs.y,
    'gift row must be clear of the tab bar',
  );
  // The driver uses scroll directions for locator.swipe. An explicit path
  // anchored to the named row expresses a leftward finger gesture unambiguously.
  await screen.swipe({
    from: { x: row.x + row.width * 0.8, y: row.y + row.height / 2 },
    to: { x: row.x + row.width * 0.2, y: row.y + row.height / 2 },
  });
  await screen.getByRole('button', `Delete gift: ${maya.title}`).tap();
  await expect(gift).toBeHidden();
  let rows = readNativeRows();
  assert.equal(rows.gifts.length, 1);
  assert.ok(
    rows.gifts[0]!.deleted_at,
    'confirmed gift delete creates a tombstone',
  );
  assert.equal(rows.persons[0]!.deleted_at, null);
  await screen.getByRole('button', 'Manage person').tap();
  await screen.getByText('Delete person').tap();
  await expect(screen.getByText(`Delete ${maya.name}?`)).toBeVisible();
  await screen.getByRole('button', 'Delete').tap();
  await expect(screen.getByRole('button', 'Manage person')).toBeHidden();
  await relaunch();
  await device.locator('role=button label="People"').tap();
  await expect(
    screen.getByRole('button', `Open person: ${maya.name}`),
  ).toBeHidden();
  rows = readNativeRows();
  assert.deepEqual(
    [rows.persons.length, rows.facts.length, rows.gifts.length],
    [1, 1, 1],
  );
  assert.ok(
    rows.persons[0]!.deleted_at,
    'confirmed person delete survives relaunch',
  );
  assert.ok(rows.gifts[0]!.deleted_at, 'gift tombstone survives relaunch');
  await app.screenshot('deleted-person');
});
