import { cn } from '../../utils/cn';

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs rounded-full', variants[variant], className)}>
      {children}
    </span>
  );
}
