import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileBarChart, Download, Loader2, Calendar, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const MonthlyReports = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  const goBack = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goForward = () => {
    const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
    if (isCurrentMonth) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  const downloadReport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: { month: selectedMonth, year: selectedYear },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Open HTML in new window and trigger print (save as PDF)
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        // Small delay to let styles load
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        // Fallback: download as HTML
        const blob = new Blob([data.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rapport-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success("Rapport généré ✓");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  // Generate preview months
  const previewMonths = [];
  for (let i = -2; i <= 0; i++) {
    let m = now.getMonth() + 1 + i;
    let y = now.getFullYear();
    if (m <= 0) { m += 12; y -= 1; }
    previewMonths.push({ month: m, year: y });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Rapports mensuels</h2>
            <p className="text-xs text-muted-foreground">Statistiques de recouvrement, DSO et activité de l'adjointe</p>
          </div>
        </div>

        {/* Month selector */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={goBack} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="text-center">
              <p className="font-display font-bold text-lg">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </p>
              <p className="text-xs text-muted-foreground">
                {isCurrentMonth ? "Mois en cours (données partielles)" : "Données complètes"}
              </p>
            </div>
            <button
              onClick={goForward}
              disabled={isCurrentMonth}
              className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <Button
            onClick={downloadReport}
            disabled={generating}
            className="w-full bg-primary text-primary-foreground font-display h-10"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {generating ? "Génération en cours..." : "Télécharger le rapport PDF"}
          </Button>
        </div>

        {/* Quick month cards */}
        <div className="grid grid-cols-3 gap-3">
          {previewMonths.map(({ month, year }) => {
            const isSelected = month === selectedMonth && year === selectedYear;
            return (
              <button
                key={`${year}-${month}`}
                onClick={() => { setSelectedMonth(month); setSelectedYear(year); }}
                className={`rounded-xl border p-3 text-center transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <Calendar className={`w-4 h-4 mx-auto mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-xs font-medium">{monthNames[month - 1]}</p>
                <p className="text-[10px] text-muted-foreground">{year}</p>
              </button>
            );
          })}
        </div>

        {/* Report contents preview */}
        <div className="mt-6 bg-card border border-border rounded-xl p-5">
          <h3 className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">
            Contenu du rapport
          </h3>
          <div className="space-y-2">
            {[
              "💰 Montants récupérés et encours restant",
              "📊 DSO moyen (délai de paiement)",
              "📈 Taux de succès global",
              "📱 Détail des SMS, courriels et appels envoyés",
              "🏆 Top 5 des récupérations du mois",
              "⏱️ Temps administratif économisé",
              "📋 Indicateurs financiers clés",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-secondary-foreground">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MonthlyReports;
