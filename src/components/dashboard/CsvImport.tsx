import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedRow {
  clientName: string;
  amount: string;
  email: string;
  phone: string;
  invoiceNumber: string;
  dueDate: string;
}

interface ColumnMapping {
  clientName: string;
  amount: string;
  email: string;
  phone: string;
  invoiceNumber: string;
  dueDate: string;
}

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  clientName: "Nom du client *",
  amount: "Montant ($) *",
  email: "Courriel",
  phone: "Téléphone",
  invoiceNumber: "# Facture",
  dueDate: "Date d'échéance",
};

// Auto-detect column mapping from headers
const autoDetect = (headers: string[]): Partial<ColumnMapping> => {
  const mapping: Partial<ColumnMapping> = {};
  const lower = headers.map((h) => h.toLowerCase().trim());

  const patterns: Record<keyof ColumnMapping, RegExp[]> = {
    clientName: [/client/i, /nom/i, /name/i, /customer/i, /contact/i],
    amount: [/montant/i, /amount/i, /total/i, /solde/i, /balance/i, /prix/i, /price/i],
    email: [/email/i, /courriel/i, /mail/i, /e-mail/i],
    phone: [/phone/i, /tel/i, /téléphone/i, /cellulaire/i, /mobile/i],
    invoiceNumber: [/facture/i, /invoice/i, /numéro/i, /number/i, /no\./i, /#/i],
    dueDate: [/date/i, /échéance/i, /due/i, /expir/i],
  };

  for (const [field, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const idx = lower.findIndex((h) => regex.test(h));
      if (idx !== -1 && !Object.values(mapping).includes(headers[idx])) {
        mapping[field as keyof ColumnMapping] = headers[idx];
        break;
      }
    }
  }

  return mapping;
};

const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter
  const delimiter = lines[0].includes(";") ? ";" : ",";

  const headers = lines[0].split(delimiter).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) =>
    line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, "").trim())
  );

  return { headers, rows };
};

interface CsvImportProps {
  onComplete: () => void;
}

const CsvImport = ({ onComplete }: CsvImportProps) => {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    clientName: "",
    amount: "",
    email: "",
    phone: "",
    invoiceNumber: "",
    dueDate: "",
  });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const processData = (h: string[], r: string[][], name: string) => {
    if (h.length === 0) {
      toast.error("Fichier vide ou format invalide.");
      return;
    }
    setHeaders(h);
    setRawRows(r);
    const detected = autoDetect(h);
    setMapping((prev) => ({ ...prev, ...detected }));
    setStep("mapping");
    toast.success(`${r.length} lignes détectées dans ${name}`);
  };

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.match(/\.(xlsx|xls)$/i);
    const isCsv = file.name.match(/\.(csv|txt)$/i);

    if (!isExcel && !isCsv) {
      toast.error("Format non supporté. Utilise un fichier .csv ou .xlsx");
      return;
    }

    setFileName(file.name);

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (json.length < 2) {
          toast.error("Fichier vide ou format invalide.");
          return;
        }
        const h = json[0].map((cell) => String(cell).trim());
        const r = json.slice(1).map((row) => row.map((cell) => String(cell).trim()));
        processData(h, r, file.name);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const { headers: h, rows: r } = parseCSV(text);
        processData(h, r, file.name);
      };
      reader.readAsText(file);
    }
  }, []);

  const applyMapping = () => {
    if (!mapping.clientName || !mapping.amount) {
      toast.error("Les colonnes « Nom du client » et « Montant » sont obligatoires.");
      return;
    }

    const mapped: ParsedRow[] = [];
    const errs: string[] = [];

    rawRows.forEach((row, i) => {
      const colIdx = (col: string) => headers.indexOf(col);

      const clientName = col(mapping.clientName) >= 0 ? row[colIdx(mapping.clientName)] || "" : "";
      const amountRaw = col(mapping.amount) >= 0 ? row[colIdx(mapping.amount)] || "" : "";
      const email = mapping.email && colIdx(mapping.email) >= 0 ? row[colIdx(mapping.email)] || "" : "";
      const phone = mapping.phone && colIdx(mapping.phone) >= 0 ? row[colIdx(mapping.phone)] || "" : "";
      const invoiceNumber = mapping.invoiceNumber && colIdx(mapping.invoiceNumber) >= 0 ? row[colIdx(mapping.invoiceNumber)] || "" : "";
      const dueDate = mapping.dueDate && colIdx(mapping.dueDate) >= 0 ? row[colIdx(mapping.dueDate)] || "" : "";

      // Clean amount
      const amount = amountRaw.replace(/[^0-9.,]/g, "").replace(",", ".");

      if (!clientName.trim()) {
        errs.push(`Ligne ${i + 2}: nom du client manquant`);
        return;
      }

      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        errs.push(`Ligne ${i + 2}: montant invalide "${amountRaw}"`);
        return;
      }

      mapped.push({ clientName: clientName.trim(), amount, email: email.trim(), phone: phone.trim(), invoiceNumber: invoiceNumber.trim(), dueDate: dueDate.trim() });

      function col(name: string) {
        return headers.indexOf(name);
      }
    });

    setParsedRows(mapped);
    setErrors(errs);
    setStep("preview");
  };

  const startImport = async () => {
    setStep("importing");
    setProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Tu dois être connecté(e).");
      setStep("preview");
      return;
    }

    let imported = 0;
    const importErrors: string[] = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      try {
        // Find or create client
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .eq("name", row.clientName)
          .eq("user_id", user.id)
          .limit(1);

        let clientId: string;

        if (existing && existing.length > 0) {
          clientId = existing[0].id;
          const updates: Record<string, string> = {};
          if (row.email) updates.email = row.email;
          if (row.phone) updates.phone = row.phone;
          if (Object.keys(updates).length > 0) {
            await supabase.from("clients").update(updates).eq("id", clientId);
          }
        } else {
          const { data: newClient, error } = await supabase
            .from("clients")
            .insert({
              user_id: user.id,
              name: row.clientName,
              email: row.email || null,
              phone: row.phone || null,
            })
            .select("id")
            .single();

          if (error || !newClient) throw new Error(error?.message || "Erreur client");
          clientId = newClient.id;
        }

        // Create invoice
        const { error: invError } = await supabase.from("invoices").insert({
          user_id: user.id,
          client_id: clientId,
          amount: parseFloat(row.amount),
          invoice_number: row.invoiceNumber || null,
          due_date: row.dueDate || null,
          status: "pending",
        });

        if (invError) throw new Error(invError.message);
        imported++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur";
        importErrors.push(`${row.clientName}: ${msg}`);
      }

      setProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }

    if (importErrors.length > 0) {
      toast.error(`${importErrors.length} erreur(s) lors de l'import.`);
      setErrors(importErrors);
    }

    if (imported > 0) {
      toast.success(`${imported} dossier${imported > 1 ? "s" : ""} importé${imported > 1 ? "s" : ""} avec succès !`);
    }

    setTimeout(() => onComplete(), 1500);
  };

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setParsedRows([]);
    setErrors([]);
    setFileName("");
    setProgress(0);
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFile} className="hidden" />
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Glisse ton fichier CSV ou Excel ici</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique pour sélectionner</p>
              <p className="text-xs text-muted-foreground mt-3">
                Formats acceptés : .csv, .xlsx, .xls
              </p>
            </div>
          </motion.div>
        )}

        {step === "mapping" && (
          <motion.div
            key="mapping"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Correspondance des colonnes</h3>
                <p className="text-xs text-muted-foreground">{fileName} — {rawRows.length} lignes</p>
              </div>
              <Button size="sm" variant="ghost" onClick={reset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid gap-3">
              {(Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[]).map((field) => (
                <div key={field} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-36 flex-shrink-0">{FIELD_LABELS[field]}</span>
                  <Select
                    value={mapping[field] || "__none__"}
                    onValueChange={(v) => setMapping((prev) => ({ ...prev, [field]: v === "__none__" ? "" : v }))}
                  >
                    <SelectTrigger className="bg-secondary text-sm h-9">
                      <SelectValue placeholder="— Ignorer —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Ignorer —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <Button onClick={applyMapping} className="w-full bg-primary text-primary-foreground font-display">
              Prévisualiser l'import
            </Button>
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{parsedRows.length} dossiers prêts à importer</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setStep("mapping")}>
                Modifier
              </Button>
            </div>

            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-destructive text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.length} ligne(s) ignorée(s)
                </div>
                {errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-destructive/80">{e}</p>
                ))}
                {errors.length > 5 && (
                  <p className="text-xs text-destructive/60">… et {errors.length - 5} autre(s)</p>
                )}
              </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Client</th>
                    <th className="px-3 py-2 text-right font-medium">Montant</th>
                    <th className="px-3 py-2 text-left font-medium">Courriel</th>
                    <th className="px-3 py-2 text-left font-medium">Tél.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-secondary/50">
                      <td className="px-3 py-1.5">{row.clientName}</td>
                      <td className="px-3 py-1.5 text-right">{parseFloat(row.amount).toLocaleString("fr-CA")} $</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.email || "—"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.phone || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  … et {parsedRows.length - 20} autre(s) dossier(s)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-shrink-0">
                Annuler
              </Button>
              <Button onClick={startImport} className="flex-1 bg-primary text-primary-foreground font-display">
                <Upload className="w-4 h-4 mr-2" />
                Importer {parsedRows.length} dossier{parsedRows.length > 1 ? "s" : ""}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "importing" && (
          <motion.div
            key="importing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 space-y-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <div>
              <p className="text-sm font-medium">Import en cours…</p>
              <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CsvImport;
