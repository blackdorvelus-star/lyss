import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  compact = false
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-6",
      compact ? "py-4" : "py-12",
      className
    )}>
      {Icon && (
        <div className={cn(
          "rounded-full bg-muted flex items-center justify-center mb-4",
          compact ? "w-10 h-10" : "w-16 h-16"
        )}>
          <Icon className={cn(
            "text-muted-foreground",
            compact ? "w-5 h-5" : "w-8 h-8"
          )} />
        </div>
      )}
      
      <h3 className={cn(
        "font-semibold mb-2",
        compact ? "text-sm" : "text-base"
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          "text-muted-foreground mb-4 max-w-sm",
          compact ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <Button 
          size={compact ? "sm" : "default"} 
          onClick={onAction}
          variant="outline"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const NoDataState = ({ 
  type = "données",
  actionLabel,
  onAction 
}: { 
  type?: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <EmptyState
    title={`Aucune ${type} disponible`}
    description={`Commencez par ajouter votre première ${type}.`}
    actionLabel={actionLabel || `Ajouter une ${type}`}
    onAction={onAction}
  />
);

export const NoResultsState = ({ 
  searchTerm,
  onClearSearch 
}: { 
  searchTerm?: string;
  onClearSearch?: () => void;
}) => (
  <EmptyState
    title={searchTerm ? "Aucun résultat trouvé" : "Aucun élément"}
    description={searchTerm ? `Aucun résultat pour "${searchTerm}". Essayez d'autres termes.` : undefined}
    actionLabel={searchTerm ? "Effacer la recherche" : undefined}
    onAction={onClearSearch}
  />
);

export const ErrorState = ({ 
  message = "Une erreur est survenue",
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) => (
  <EmptyState
    title="Oups !"
    description={message}
    actionLabel="Réessayer"
    onAction={onRetry}
  />
);

export default EmptyState;
