import { DatePicker, Host } from '@expo/ui/swift-ui';
import { View, useWindowDimensions } from 'react-native';
import { Text } from '~/components/ui/text';

type BirthdayDateRowProps = {
  date: Date;
  /** iOS's compact picker always shows the year; only Android's inline value hides it. */
  includeYear: boolean;
  onChange: (date: Date) => void;
};

/**
 * Date row inside the birthday card: native SwiftUI compact date picker.
 * Platform-split — @expo/ui/swift-ui has no Android module, so importing
 * it there crashes on load.
 */
export default function BirthdayDateRow({
  date,
  onChange,
}: BirthdayDateRowProps) {
  const { fontScale } = useWindowDimensions();
  const usesExpandedRow = fontScale > 1;

  const picker = (
    <Host matchContents>
      <DatePicker
        selection={date}
        displayedComponents={['date']}
        onDateChange={onChange}
      />
    </Host>
  );

  if (usesExpandedRow) {
    return (
      <View className="items-start gap-2 border-t border-black/5 px-4 py-3">
        <Text className="text-base">Date</Text>
        <View className="self-end">{picker}</View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between border-t border-black/5 px-4 py-2">
      <Text className="text-base">Date</Text>
      {picker}
    </View>
  );
}
