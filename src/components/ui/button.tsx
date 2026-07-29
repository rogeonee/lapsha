import { Pressable } from 'react-native';
import { TextClassContext } from '~/components/ui/text';
import {
  buttonTextVariants,
  buttonVariants,
  type ButtonProps,
} from '~/components/ui/button-variants';
import { cn } from '~/lib/utils';

function Button({ ref, className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider
      value={buttonTextVariants({
        variant,
        size,
        className: 'web:pointer-events-none',
      })}
    >
      <Pressable
        className={cn(
          props.disabled && 'opacity-50 web:pointer-events-none',
          buttonVariants({ variant, size, className }),
        )}
        ref={ref}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button };
