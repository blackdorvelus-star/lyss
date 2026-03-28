import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'text' | 'avatar' | 'button';
  count?: number;
  className?: string;
}

const SkeletonLoader = ({ type = 'card', count = 1, className }: SkeletonLoaderProps) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const getSkeletonClass = () => {
    switch (type) {
      case 'card':
        return "h-32 rounded-lg";
      case 'list':
        return "h-12 rounded";
      case 'text':
        return "h-4 rounded";
      case 'avatar':
        return "h-10 w-10 rounded-full";
      case 'button':
        return "h-10 rounded";
      default:
        return "h-32 rounded-lg";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {skeletons.map((key) => (
        <div
          key={key}
          className={cn(
            "animate-pulse bg-muted",
            getSkeletonClass(),
            type === 'card' && "p-4 space-y-3"
          )}
        >
          {type === 'card' && (
            <>
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
              <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
              <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
            </>
          )}
          {type === 'list' && (
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-muted-foreground/20 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                <div className="h-2 bg-muted-foreground/20 rounded w-1/2" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Pre-configured skeleton loaders
export const CardSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <SkeletonLoader type="card" count={count} />
  </div>
);

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    <SkeletonLoader type="list" count={count} />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonLoader type="card" count={4} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SkeletonLoader type="card" count={2} />
      </div>
      <div>
        <SkeletonLoader type="card" />
      </div>
    </div>
  </div>
);

export default SkeletonLoader;
