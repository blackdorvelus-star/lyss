import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Mail, Phone, Plus, Trash2, GripVertical,
  Loader2, Save, Power, PowerOff, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { safeSupabase as supabase } from "@/lib/supabase-safe";
import { toast } from "sonner";

interface SequenceStep {
  day: number;
  channel: string;
  label: string;
}

const channelOptions = [
  { value: "sms", label: "SMS", icon: MessageSquare, color: "text-accent" },
  { value: "email", label: "Courriel", icon: Mail, color: "text-primary" },
  { value: "phone", label: "Appel vocal", icon: Phone, color: "text-accent" },
];

const defaultSteps: SequenceStep[] = [
  { day: 3, channel: "sms", label: "SMS de courtoisie" },
  { day: 7, channel: "email", label: "Courriel de suivi" },
  { day: 14, channel: "phone", label: "Appel vocal" },
];

const SequenceConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [steps, setSteps] = useState<SequenceStep[]>(defaultSteps);
  const [maxAttempts, setMaxAttempts] = useState<Record<string, number>>({
    sms: 5, email: 3, phone: 2,
  });
  const [sequenceId, setSequenceId] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reminder_sequences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setSequenceId(data.id);
      setEnabled(data.enabled);
      setSteps(data.steps as unknown as SequenceStep[]);
      setMaxAttempts(data.max_attempts_per_channel as unknown as Record<string, number>);
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Sort steps by day
    const sortedSteps = [...steps].sort((a, b) => a.day - b.day);

    if (sequenceId) {
      const { error } = await supabase
        .from("reminder_sequences")
        .update({
          enabled,
          steps: sortedSteps as unknown as any,
          max_attempts_per_channel: maxAttempts as unknown as any,
        })
        .eq("id", sequenceId);

      if (error) {
        toast.error("Erreur lors de la sauvegarde");
      } else {
        toast.success("Séquence sauvegardée ✓");
        setSteps(sortedSteps);
      }
    } else {
      const { data, error } = await supabase
        .from("reminder_sequences")
        .insert({
          user_id: user.id,
          enabled,
          steps: sortedSteps as unknown as any,
          max_attempts_per_channel: maxAttempts as unknown as any,
        })
        .select()
        .single();

      if (error) {
        toast.error("Erreur lors de la création");
      } else {
        setSequenceId(data.id);
        setSteps(sortedSteps);
        toast.success("Séquence créée ✓");
      }
    }
    setSaving(false);
  };

  const addStep = () => {
    const maxDay = steps.length > 0 ? Math.max(...steps.map(s => s.day)) : 0;
    setSteps([...steps, { day: maxDay + 7, channel: "sms", label: "Nouvelle étape" }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-update label based on channel
    if (field === "channel") {
      const ch = channelOptions.find(c => c.value === value);
      updated[index].label = ch ? `${ch.label} de suivi` : updated[index].label;
    }
    setSteps(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">Séquence automatique</h3>
            <p className="text-[11px] text-muted-foreground">Relances envoyées automatiquement après l'échéance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enabled ? (
            <Power className="w-3.5 h-3.5 text-primary" />
          ) : (
            <PowerOff className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          {/* Timeline of steps */}
          <div className="space-y-3">
            {steps.map((step, i) => {
              const chConfig = channelOptions.find(c => c.value === step.channel);
              const Icon = chConfig?.icon || MessageSquare;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3 border border-border/50"
                >
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Day indicator */}
                  <div className="flex items-center gap-1.5 min-w-[80px]">
                    <span className="text-xs text-muted-foreground">J +</span>
                    <Input
                      type="number"
                      value={step.day}
                      onChange={(e) => updateStep(i, "day", parseInt(e.target.value) || 0)}
                      className="w-14 h-7 text-xs text-center bg-card"
                      min={1}
                      max={90}
                    />
                  </div>

                  {/* Channel selector */}
                  <Select value={step.channel} onValueChange={(v) => updateStep(i, "channel", v)}>
                    <SelectTrigger className="w-[130px] h-7 text-xs bg-card">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3 h-3 ${chConfig?.color}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {channelOptions.map((ch) => (
                        <SelectItem key={ch.value} value={ch.value}>
                          <div className="flex items-center gap-1.5">
                            <ch.icon className={`w-3 h-3 ${ch.color}`} />
                            {ch.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Label */}
                  <Input
                    value={step.label}
                    onChange={(e) => updateStep(i, "label", e.target.value)}
                    className="flex-1 h-7 text-xs bg-card"
                    placeholder="Description de l'étape"
                  />

                  {/* Remove button */}
                  <button
                    onClick={() => removeStep(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>

          <button
            onClick={addStep}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une étape
          </button>

          {/* Max attempts per channel */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-foreground mb-3">Limite de tentatives par canal</p>
            <div className="grid grid-cols-3 gap-3">
              {channelOptions.map((ch) => (
                <div key={ch.value} className="flex items-center gap-2">
                  <ch.icon className={`w-3.5 h-3.5 ${ch.color}`} />
                  <span className="text-xs text-muted-foreground">{ch.label}</span>
                  <Input
                    type="number"
                    value={maxAttempts[ch.value] || 0}
                    onChange={(e) => setMaxAttempts({ ...maxAttempts, [ch.value]: parseInt(e.target.value) || 0 })}
                    className="w-14 h-7 text-xs text-center bg-card ml-auto"
                    min={0}
                    max={10}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={saveConfig}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground font-display text-xs h-9"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Sauvegarder la séquence
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default SequenceConfig;
