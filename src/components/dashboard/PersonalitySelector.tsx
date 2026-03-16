import { Smile, Briefcase, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export type Personality = "chaleureuse" | "professionnelle" | "perseverante";

interface PersonalitySelectorProps {
  value: Personality;
  onChange: (p: Personality) => void;
}

const personalities: { id: Personality; label: string; desc: string; icon: typeof Smile }[] = [
  {
    id: "chaleureuse",
    label: "Chaleureuse",
    desc: "Ton amical et empathique. Idéal pour les clients réguliers.",
    icon: Smile,
  },
  {
    id: "professionnelle",
    label: "Professionnelle",
    desc: "Ton formel et structuré. Idéal pour les gros montants.",
    icon: Briefcase,
  },
  {
    id: "perseverante",
    label: "Persévérante",
    desc: "Suivi rapproché mais respectueux. Pour les cas récurrents.",
    icon: Target,
  },
];

const PersonalitySelector = ({ value, onChange }: PersonalitySelectorProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">
        Personnalité de l'adjointe
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {personalities.map((p) => {
          const isActive = value === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              className={cn(
                "flex flex-col items-center text-center p-3 rounded-lg border transition-all",
                isActive
                  ? "border-primary/40 bg-primary/8 text-primary"
                  : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <p.icon className={cn("w-5 h-5 mb-2", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-semibold">{p.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        {personalities.find((p) => p.id === value)?.desc}
      </p>
    </div>
  );
};

export default PersonalitySelector;
