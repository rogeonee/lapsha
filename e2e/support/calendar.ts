import { expect, type Screen } from 'e2e';

// Days in the previous month avoid the moving "Today" label and exercise month
// navigation on every run, including the January to December rollover.
const now = new Date();
export const givenDate = new Date(now.getFullYear(), now.getMonth() - 1, 8);
export const discardedDate = new Date(now.getFullYear(), now.getMonth() - 1, 9);

export function civilDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const monthHeading = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const dayLabel = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

/**
 * Opens the compact Given date picker, navigates to the date's month, and
 * either selects the day or asserts it is already selected.
 */
export async function pickGivenDate(
  screen: Screen,
  date: Date,
  { select }: { select: boolean },
) {
  const picker = screen.getByRole('button', 'Date Picker');
  const anchor = await picker.boundingBox();
  if (!anchor) throw new Error('Date picker is not on screen');
  await picker.tap();

  const month = screen.getByRole('button', 'Month');
  await expect(month).toBeVisible();
  for (let step = 0; step < 24; step++) {
    const shown = await month.inputValue();
    if (shown === monthHeading(date)) break;
    const later = new Date(`1 ${shown}`) > date;
    await screen
      .getByRole('button', later ? 'Previous Month' : 'Next Month')
      .tap();
  }
  await expect(month).toHaveValue(monthHeading(date));

  // UIKit exposes a day as a button or a list item depending on the snapshot.
  const day = screen.getByLabel(dayLabel(date));
  if (select) await day.tap();
  await expect(day).toBeSelected();

  // The calendar popover covers the sheet. Tapping the control that opened
  // it closes the popover without touching anything else in the form.
  await screen.tapAt({
    x: anchor.x + anchor.width / 2,
    y: anchor.y + anchor.height / 2,
  });
  await expect(month).toBeHidden();
}
