import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

interface AuthButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function AuthButton({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <Button
      className={cn('w-full', className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <Text className="font-medium">{isLoading ? loadingText : children}</Text>
    </Button>
  );
}
