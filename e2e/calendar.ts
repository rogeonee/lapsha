import assert from 'node:assert/strict';
import { expect, type Screen } from 'e2e';

// Previous month's day 8 avoids today-specific accessibility labels and tests
// month navigation on every run, including January -> December rollover.
const now = new Date();
export const selectedDate = new Date(
  now.getFullYear(),
  now.getMonth() - 1,
  8,
  12,
);
export const discardedDate = new Date(
  now.getFullYear(),
  now.getMonth() - 1,
  9,
  12,
);
export function civilDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const heading = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const dayLabel = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
export async function givenDate(screen: Screen, date: Date, select: boolean) {
  const picker = screen.getByRole('button', 'Date Picker');
  const anchor = await picker.boundingBox();
  assert.ok(
    anchor && anchor.width > 0 && anchor.height > 0,
    'visible date picker anchor',
  );
  await picker.tap();
  // Navigate by the observed month, never by a fixed number of guessed taps.
  const month = screen.getByRole('button', 'Month');
  await expect(month).toBeVisible();
  for (let attempts = 0; attempts < 24; attempts++) {
    const value = await month.inputValue();
    if (value === heading(date)) break;
    const observed = new Date(`1 ${value} 12:00:00`);
    assert.ok(
      Number.isFinite(observed.getTime()),
      `English calendar month required: ${value}`,
    );
    await screen
      .getByRole('button', observed > date ? 'Previous Month' : 'Next Month')
      .tap();
  }
  await expect(screen.getByText(heading(date))).toBeVisible();
  // UIKit exposes the day as either a button or a list item across snapshots.
  const day = screen.getByLabel(dayLabel(date));
  if (select) await day.tap();
  await expect(day).toBeSelected();
  // The system popover covers its dismiss region. Tap its originating control's
  // measured center, which remains inside the sheet and outside the calendar.
  // There are no device-specific coordinates or screen dimensions here.
  await screen.tapAt({
    x: anchor.x + anchor.width / 2,
    y: anchor.y + anchor.height / 2,
  });
  await expect(month).toBeHidden();
}
export async function dismissSheet(screen: Screen) {
  const grabber = await screen
    .getByRole('button', 'Sheet Grabber')
    .boundingBox();
  assert.ok(
    grabber && grabber.y > 0,
    'sheet must expose a backdrop above its grabber',
  );
  // iOS can expose two PopoverDismissRegion nodes while the calendar closes.
  // The sheet's unique grabber supplies a stable point in the backdrop above it.
  await screen.tapAt({
    x: grabber.x + grabber.width / 2,
    y: grabber.y / 2,
  });
}
