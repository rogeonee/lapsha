import { Switch as RNSwitch } from 'react-native';
import { palette } from '~/lib/theme';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/**
 * Lapsha switch (iOS): the native UISwitch with a Noodle Gold on-track.
 * Platform-split so Android gets the HeroUI/M3 switch instead — the RN
 * Switch there mixes the stock Material thumb with our gold track.
 */
export default function Switch({ value, onValueChange }: SwitchProps) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: palette.noodleGold }}
    />
  );
}
