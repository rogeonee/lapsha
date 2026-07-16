import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { palette } from '~/lib/theme';

type BirthdayDateRowProps = {
  date: Date;
  includeYear: boolean;
  onChange: (date: Date) => void;
};

/**
 * Date row for the Android add-person sheet: tappable value opening the
 * Material 3 date picker dialog — same row style and dialog handling as
 * the entry sheet.
 */
export default function BirthdayDateRow({
  date,
  includeYear,
  onChange,
}: BirthdayDateRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setPickerOpen(true)}
        className="flex-row items-center justify-between rounded-xl bg-secondary px-4 py-3"
        accessibilityLabel="Pick birthday date"
      >
        <Text className="text-sm text-muted-foreground">Date</Text>
        <Text className="text-base">
          {date.toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            ...(includeYear ? { year: 'numeric' } : {}),
          })}
        </Text>
      </Pressable>
      {pickerOpen && (
        // The dialog renders in its own window; the Host is zero-size
        <Host style={{ position: 'absolute', width: 0, height: 0 }}>
          <DatePickerDialog
            initialDate={date.toISOString()}
            variant="picker"
            showVariantToggle={false}
            color={palette.noodleGold}
            onDateSelected={(picked) => {
              // Material 3 returns UTC-midnight millis; re-read the
              // date in UTC or it shifts a day in western timezones
              onChange(
                new Date(
                  picked.getUTCFullYear(),
                  picked.getUTCMonth(),
                  picked.getUTCDate(),
                ),
              );
              setPickerOpen(false);
            }}
            onDismissRequest={() => setPickerOpen(false)}
          />
        </Host>
      )}
    </>
  );
}
