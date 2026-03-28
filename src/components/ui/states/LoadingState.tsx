import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingState = ({ 
  message = "Chargement...", 
  fullScreen = false,
  size = 'md',
  className 
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center text-center", className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary mb-3")} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingState;
