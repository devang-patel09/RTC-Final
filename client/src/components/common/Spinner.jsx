import { cn } from '../../utils/cn';

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-b-2 border-primary-600', sizes[size])} />
    </div>
  );
}
