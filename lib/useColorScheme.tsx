import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  const colorScheme = useRNColorScheme() ?? 'dark';

  return {
    colorScheme,
    isDarkColorScheme: colorScheme === 'dark',
  };
}
