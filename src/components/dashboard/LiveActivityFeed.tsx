import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MessageSquare, CheckCircle, AlertTriangle, Sparkles, Clock, SlidersHorizontal } from "lucide-react";
import LyssAvatar from "@/components/LyssAvatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface FeedItem {
  id: string;
  icon: "phone" | "email" | "sms" | "payment" | "alert" | "ai";
  text: string;
  time: string;
  isNew?: boolean;
}

interface LiveActivityFeedProps {
  items: FeedItem[];
  onToneAdjust?: () => void;
}

const iconMap = {
  phone: { icon: Phone, color: "text-accent", bg: "bg-accent/10", ring: "ring-accent/20" },
  email: { icon: Mail, color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/20" },
  sms: { icon: MessageSquare, color: "text-accent", bg: "bg-accent/10", ring: "ring-accent/20" },
  payment: { icon: CheckCircle, color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/20" },
  alert: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", ring: "ring-destructive/20" },
  ai: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/20" },
};

const toneOptions = [
  { label: "Plus doux", value: "douce", emoji: "🕊️" },
  { label: "Plus direct", value: "directe", emoji: "🎯" },
  { label: "Plus formel", value: "formelle", emoji: "👔" },
];

const LiveActivityFeed = ({ items, onToneAdjust }: LiveActivityFeedProps) => {
  const [toneMenuId, setToneMenuId] = useState<string | null>(null);

  const handleToneClick = (itemId: string, tone: string) => {
    toast.success(`Ton ajusté → ${tone}. Les prochains messages seront adaptés.`);
    setToneMenuId(null);
    onToneAdjust?.();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3.5 sm:p-5 h-full flex flex-col">
       <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LyssAvatar size="xs" />
          <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Journal de Lyss
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[10px] text-primary font-medium">En direct</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
           <LyssAvatar size="md" />
          <p className="text-xs text-muted-foreground text-center">
            Lyss est prête à travailler.<br />
            Les actions apparaîtront ici en temps réel.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const config = iconMap[item.icon];
              const Icon = config.icon;
              const isMessage = item.icon === "sms" || item.icon === "email";
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  transition={{ delay: i * 0.03 }}
                  className="relative"
                >
                  <div className="flex items-start gap-2.5 py-2">
                    {/* Timeline line */}
                    {i < items.length - 1 && (
                      <div className="absolute left-[13px] top-9 bottom-0 w-px bg-border" />
                    )}
                    <div className={`w-7 h-7 rounded-md ${config.bg} flex items-center justify-center flex-shrink-0 ring-1 ${config.ring}`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">{item.text}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {item.time}
                        </p>
                        {isMessage && (
                          <button
                            onClick={() => setToneMenuId(toneMenuId === item.id ? null : item.id)}
                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                            title="Ajuster le ton"
                          >
                            <SlidersHorizontal className="w-2.5 h-2.5" />
                            <span className="hidden sm:inline">Ajuster</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {item.isNew && (
                      <span className="text-[9px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 flex-shrink-0">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Inline tone adjustment menu */}
                  <AnimatePresence>
                    {toneMenuId === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden ml-9 mb-1"
                      >
                        <div className="flex gap-1.5 py-1.5">
                          {toneOptions.map((opt) => (
                            <Button
                              key={opt.value}
                              size="sm"
                              variant="outline"
                              onClick={() => handleToneClick(item.id, opt.label.toLowerCase())}
                              className="h-6 text-[10px] px-2 gap-1"
                            >
                              {opt.emoji} {opt.label}
                            </Button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default LiveActivityFeed;
