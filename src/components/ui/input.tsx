import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '~/lib/utils';

function Input({
  className,
  ...props
}: TextInputProps & {
  ref?: React.RefObject<TextInput>;
}) {
  return (
    <TextInput
      className={cn(
        'h-10 rounded-md border border-input bg-background px-3 text-base text-foreground file:border-0 file:bg-transparent file:font-medium lg:text-sm web:flex web:w-full web:py-2 web:ring-offset-background web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:outline-none native:h-12 native:text-lg native:leading-[1.25]',
        props.editable === false && 'opacity-50 web:cursor-not-allowed',
        className,
      )}
      placeholderTextColorClassName="accent-muted-foreground"
      {...props}
    />
  );
}

export { Input };
