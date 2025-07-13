import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

interface AuthInputProps extends TextInputProps {
  label?: string;
  error?: string;
  type?: 'text' | 'password' | 'email';
  className?: string;
}

export const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ label, error, type = 'text', className, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPasswordType = type === 'password';

    return (
      <View className={cn('space-y-2', className)}>
        {label && (
          <Text className="text-sm font-medium text-foreground">{label}</Text>
        )}
        <View className="relative">
          <Input
            ref={ref as any}
            secureTextEntry={isPasswordType && !isPasswordVisible}
            autoCapitalize={type === 'email' ? 'none' : 'sentences'}
            keyboardType={type === 'email' ? 'email-address' : 'default'}
            className={cn(
              'pr-12',
              error && 'border-destructive',
              isPasswordType && 'pr-12',
            )}
            {...props}
          />
          {isPasswordType && (
            <Pressable
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 web:top-3 web:translate-y-0"
            >
              {isPasswordVisible ? (
                <EyeOff size={20} className="text-muted-foreground" />
              ) : (
                <Eye size={20} className="text-muted-foreground" />
              )}
            </Pressable>
          )}
        </View>
        {error && <Text className="text-sm text-destructive">{error}</Text>}
      </View>
    );
  },
);

AuthInput.displayName = 'AuthInput';
