interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = {
    active: 'success',
    completed: 'success',
    running: 'info',
    syncing: 'info',
    processing: 'info',
    pending: 'warning',
    inactive: 'default',
    partial: 'warning',
    error: 'error',
    failed: 'error',
  }[status] as BadgeProps['variant'] || 'default';

  return <Badge variant={variant}>{status}</Badge>;
}
