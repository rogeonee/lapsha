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
 * Date row inside the birthday card: tappable value opening the
 * Material 3 date picker dialog (same pattern as the Android entry sheet).
 */
export function BirthdayDateRow({
  date,
  includeYear,
  onChange,
}: BirthdayDateRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setPickerOpen(true)}
        className="flex-row items-center justify-between border-t border-black/5 px-4 py-3 active:bg-black/5"
        accessibilityLabel="Pick birthday date"
      >
        <Text className="text-base">Date</Text>
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
