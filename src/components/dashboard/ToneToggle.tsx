import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Heart } from "lucide-react";

export type ToneSetting = "gentle" | "professional";

interface ToneToggleProps {
  value: ToneSetting;
  onChange: (tone: ToneSetting) => void;
}

const ToneToggle = ({ value, onChange }: ToneToggleProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-3 font-medium">Ton des messages</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {value === "gentle" ? (
            <Heart className="w-4 h-4 text-primary" />
          ) : (
            <MessageSquare className="w-4 h-4 text-accent" />
          )}
          <span className="text-sm font-medium">
            {value === "gentle" ? "Rappel amical" : "Suivi professionnel"}
          </span>
        </div>
        <Switch
          checked={value === "professional"}
          onCheckedChange={(checked) => onChange(checked ? "professional" : "gentle")}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {value === "gentle"
          ? "Messages chaleureux et empathiques. Idéal pour les clients réguliers."
          : "Messages structurés et formels. Idéal pour les cas plus formels."}
      </p>
    </div>
  );
};

export default ToneToggle;
