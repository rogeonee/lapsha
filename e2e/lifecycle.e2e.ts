import assert from 'node:assert/strict';
import { test } from '@e2e-dev/mobile';
import { expect, type App, type Screen } from 'e2e';
import {
  civilDate,
  discardedDate,
  givenDate,
  pickGivenDate,
} from './support/calendar';
import { readRows } from './support/native-database';

const maya = {
  name: 'Maya',
  factLabel: 'Favorite tea',
  factValue: 'Jasmine green tea',
  giftTitle: 'Blue ceramic mug',
  giftNote: 'For slow Sunday mornings',
  giftUrl: 'https://example.com/maya-mug',
};

// iOS reports tab bar items as tabs or as buttons depending on the snapshot.
const peopleTab = (screen: Screen) =>
  screen.getByRole('tablist').getByLabel('People');

async function launch(app: App, screen: Screen, { clear = false } = {}) {
  await (clear ? app.clearState() : app.restart());
  // The first launch waits for Metro to bundle the app.
  await expect(peopleTab(screen)).toBeVisible({ timeout: 120_000 });
}

async function expectPersonScreen(screen: Screen, name: string) {
  await expect(screen.getByRole('button', 'Manage person')).toBeVisible();
  // iOS 18 ignores taps until the push finishes, which is when the People
  // list behind the screen leaves the accessibility tree.
  await expect(screen.getByRole('button', name)).toBeHidden();
}

async function addPerson(screen: Screen, name: string) {
  await peopleTab(screen).tap();
  await screen.getByRole('button', 'Add person').tap();
  await screen.getByLabel("Person's name").fill(name);
  await screen.getByRole('button', 'Add').tap();
  await expectPersonScreen(screen, name);
}

async function openPerson(screen: Screen, name: string) {
  await peopleTab(screen).tap();
  await screen.getByRole('button', name).tap();
  await expectPersonScreen(screen, name);
}

async function openGift(screen: Screen, title: string) {
  const gift = screen.getByLabel(`Edit gift: ${title}`);
  if (!(await gift.isVisible())) {
    const given = screen.getByRole('button', /^Previously given/);
    await screen.scrollUntilVisible(given);
    await given.tap();
  }
  await screen.scrollUntilVisible(gift);
  await gift.tap();
}

async function dismissSheet(screen: Screen) {
  // Tap the dimmed backdrop just above the sheet's grabber.
  const grabber = await screen
    .getByRole('button', 'Sheet Grabber')
    .boundingBox();
  if (!grabber) throw new Error('Sheet grabber is not on screen');
  await screen.tapAt({ x: grabber.x + grabber.width / 2, y: grabber.y / 2 });
}

test('a person, fact and Given gift persist through relaunch and discarded edits', async ({
  app,
  screen,
}) => {
  await launch(app, screen, { clear: true });
  assert.deepEqual(readRows(), { persons: [], facts: [], gifts: [] });

  await peopleTab(screen).tap();
  await screen.getByRole('button', 'Add person').tap();
  await screen.getByLabel("Person's name").fill('Discarded draft');
  await screen.getByRole('button', 'Cancel').tap();
  await expect(screen.getByLabel("Person's name")).toBeHidden();
  assert.deepEqual(readRows().persons, [], 'a cancelled draft saves nothing');

  await addPerson(screen, maya.name);
  await screen.getByRole('button', 'Add fact').tap();
  await screen.getByPlaceholder('The fact itself').fill(maya.factValue);
  await screen.getByPlaceholder('Label (optional)').fill(maya.factLabel);
  await screen.getByRole('button', 'Save').tap();
  await expect(screen.getByText('New fact')).toBeHidden();

  const addGift = screen.getByRole('button', 'Add gift idea');
  await screen.scrollUntilVisible(addGift);
  await addGift.tap();
  await screen.getByPlaceholder('Title (optional)').fill(maya.giftTitle);
  await screen.getByLabel('Note').fill(maya.giftNote);
  await screen.getByPlaceholder('Link (optional)').fill(maya.giftUrl);
  await screen.getByRole('tab', 'Given').tap();
  await pickGivenDate(screen, givenDate, { select: true });
  await screen.getByRole('button', 'Save').tap();
  await expect(screen.getByText('New gift idea')).toBeHidden();

  const expectSaved = () => {
    const { persons, facts, gifts } = readRows();
    assert.equal(persons.length, 1);
    const [person] = persons;
    assert.deepEqual([person.name, person.deleted_at], [maya.name, null]);
    assert.deepEqual(
      facts.map((f) => [f.person_id, f.label, f.value, f.deleted_at]),
      [[person.id, maya.factLabel, maya.factValue, null]],
    );
    assert.deepEqual(
      gifts.map((g) => [
        g.person_id,
        g.title,
        g.note,
        g.url,
        g.photo,
        g.status,
        g.given_on,
        g.deleted_at,
      ]),
      [
        [
          person.id,
          maya.giftTitle,
          maya.giftNote,
          maya.giftUrl,
          null,
          'given',
          civilDate(givenDate),
          null,
        ],
      ],
    );
  };

  await launch(app, screen);
  expectSaved();

  // Dismissing the editor discards a changed date.
  await openPerson(screen, maya.name);
  await openGift(screen, maya.giftTitle);
  await pickGivenDate(screen, discardedDate, { select: true });
  await dismissSheet(screen);
  await expect(screen.getByText('Edit gift')).toBeHidden();

  await launch(app, screen);
  expectSaved();
  await openPerson(screen, maya.name);
  await openGift(screen, maya.giftTitle);
  await expect(screen.getByPlaceholder('Title (optional)')).toHaveValue(
    maya.giftTitle,
  );
  await expect(screen.getByLabel('Note')).toHaveValue(maya.giftNote);
  await expect(screen.getByPlaceholder('Link (optional)')).toHaveValue(
    maya.giftUrl,
  );
  await pickGivenDate(screen, givenDate, { select: false });
  await app.screenshot('saved-gift');
});

test('deleting is cancellable and leaves tombstones after relaunch', async ({
  app,
  screen,
}) => {
  await launch(app, screen, { clear: true });
  await addPerson(screen, maya.name);
  const addGift = screen.getByRole('button', 'Add gift idea');
  await screen.scrollUntilVisible(addGift);
  await addGift.tap();
  await screen.getByPlaceholder('Title (optional)').fill(maya.giftTitle);
  await screen.getByRole('button', 'Save').tap();
  await expect(screen.getByText('New gift idea')).toBeHidden();

  const deletePerson = async (choice: 'Cancel' | 'Delete') => {
    await screen.getByRole('button', 'Manage person').tap();
    await screen.getByText('Delete person').tap();
    await expect(screen.getByText(`Delete ${maya.name}?`)).toBeVisible();
    await screen.getByRole('button', choice).tap();
    await expect(screen.getByText(`Delete ${maya.name}?`)).toBeHidden();
  };

  await deletePerson('Cancel');
  let rows = readRows();
  assert.deepEqual(
    [rows.persons[0]?.deleted_at, rows.gifts[0]?.deleted_at],
    [null, null],
    'cancelling keeps the person and gift',
  );

  // Swipe the row left to reveal its delete button.
  const gift = screen.getByLabel(`Edit gift: ${maya.giftTitle}`);
  await screen.scrollUntilVisible(gift);
  const row = await gift.boundingBox();
  if (!row) throw new Error('Gift row is not on screen');
  await screen.swipe({
    from: { x: row.x + row.width * 0.8, y: row.y + row.height / 2 },
    to: { x: row.x + row.width * 0.2, y: row.y + row.height / 2 },
  });
  await screen.getByLabel(`Delete gift: ${maya.giftTitle}`).tap();
  await expect(gift).toBeHidden();
  rows = readRows();
  assert.ok(rows.gifts[0]?.deleted_at, 'the gift is soft-deleted');
  assert.equal(rows.persons[0]?.deleted_at, null);

  await deletePerson('Delete');
  await expect(screen.getByRole('button', 'Manage person')).toBeHidden();

  await launch(app, screen);
  await peopleTab(screen).tap();
  await expect(
    screen.getByText('Start with someone you care about'),
  ).toBeVisible();
  await expect(screen.getByRole('button', maya.name)).toBeHidden();
  rows = readRows();
  assert.equal(rows.persons.length, 1);
  assert.ok(rows.persons[0]?.deleted_at, 'the person is soft-deleted');
  assert.ok(rows.gifts[0]?.deleted_at, 'the gift stays soft-deleted');
  await app.screenshot('deleted-person');
});
