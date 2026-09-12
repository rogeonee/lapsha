import { Switch as HeroSwitch } from 'heroui-native/switch';

type SwitchProps = {
  accessibilityLabel: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/**
 * Lapsha switch (Android): HeroUI's M3 switch, which follows the brand
 * amber accent — same control the entry sheet uses.
 */
export default function Switch({
  accessibilityLabel,
  value,
  onValueChange,
}: SwitchProps) {
  return (
    <HeroSwitch
      accessibilityLabel={accessibilityLabel}
      isSelected={value}
      onSelectedChange={onValueChange}
    />
  );
}
