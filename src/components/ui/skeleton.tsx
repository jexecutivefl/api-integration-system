interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'card';
}

export function Skeleton({ className = '', variant = 'line' }: SkeletonProps) {
  const variantClasses: Record<string, string> = {
    line: 'h-4 w-full rounded',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-lg',
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 ${variantClasses[variant]} ${className}`}
    />
  );
}

interface SkeletonLineProps {
  className?: string;
  width?: string;
}

export function SkeletonLine({ className = '', width = 'w-full' }: SkeletonLineProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 h-4 rounded ${width} ${className}`}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-gray-200 bg-white p-6 ${className}`}
    >
      <div className="space-y-4">
        <div className="h-4 w-3/4 rounded bg-gray-300" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Header row */}
      <div className="flex gap-4 border-b border-gray-200 pb-3 mb-3">
        {Array.from({ length: columns }).map((_, col) => (
          <div
            key={`header-${col}`}
            className="animate-pulse h-4 rounded bg-gray-300 flex-1"
          />
        ))}
      </div>

      {/* Data rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={`row-${row}`} className="flex gap-4">
            {Array.from({ length: columns }).map((_, col) => (
              <div
                key={`cell-${row}-${col}`}
                className="animate-pulse h-4 rounded bg-gray-200 flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
