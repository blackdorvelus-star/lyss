import { Phone, Mail, CheckCircle, MessageSquare } from "lucide-react";

interface ActivityItem {
  id: string;
  icon: "phone" | "email" | "payment" | "sms";
  text: string;
  time: string;
}

interface ActivityHistoryProps {
  items: ActivityItem[];
}

const iconMap = {
  phone: { icon: Phone, color: "text-accent", bg: "bg-accent/10" },
  email: { icon: Mail, color: "text-primary", bg: "bg-primary/10" },
  payment: { icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
  sms: { icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
};

const ActivityHistory = ({ items }: ActivityHistoryProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">
        Historique de l'adjointe
      </h3>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Aucune action récente. L'adjointe commencera dès qu'un dossier sera confié.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const config = iconMap[item.icon];
            const Icon = config.icon;
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-md ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type { ActivityItem };
export default ActivityHistory;
