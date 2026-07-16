import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import type { Pressable } from 'react-native';

export const buttonVariants = cva(
  'flex items-center justify-center rounded-md web:ring-offset-background web:transition-colors web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-primary active:opacity-90 web:hover:opacity-90',
        destructive: 'bg-destructive active:opacity-90 web:hover:opacity-90',
        outline:
          'border border-input bg-background active:bg-secondary web:hover:bg-secondary',
        secondary: 'bg-secondary active:opacity-80 web:hover:opacity-80',
        ghost: 'active:bg-secondary web:hover:bg-secondary',
        link: 'web:underline-offset-4 web:hover:underline web:focus:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 native:h-12 native:px-5 native:py-3',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8 native:h-14',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export const buttonTextVariants = cva(
  'text-sm font-medium text-foreground web:whitespace-nowrap web:transition-colors native:text-base',
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-destructive-foreground',
        outline: '',
        secondary: 'text-secondary-foreground',
        ghost: '',
        link: 'text-primary',
      },
      size: {
        default: '',
        sm: '',
        lg: 'native:text-lg',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants>;
