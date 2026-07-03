import { Switch as HeroSwitch } from 'heroui-native/switch';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/**
 * Lapsha switch (Android): HeroUI's M3 switch, which follows the brand
 * amber accent — same control the entry sheet uses.
 */
export function Switch({ value, onValueChange }: SwitchProps) {
  return <HeroSwitch isSelected={value} onSelectedChange={onValueChange} />;
}
