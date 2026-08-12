import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, ImportResult, LEAD_STAGES } from "@/lib/crm-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Download, Loader2, Table2 } from "lucide-react";

interface ImportLeadsDialogProps {
  open: boolean;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  company: "Empresa",
  email: "Correo",
  phone: "Teléfono",
  source: "Origen",
  stage: "Estado",
  estimatedValue: "Valor",
  notes: "Notas",
  lastContactAt: "Fecha de contacto",
};

const stageLabel = (id: string) => LEAD_STAGES.find((s) => s.id === id)?.label ?? id;

export function ImportLeadsDialog({ open, onClose }: ImportLeadsDialogProps) {
  const queryClient = useQueryClient();
  const [csvUrl, setCsvUrl] = useState("");
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const analyze = useMutation({
    mutationFn: () => crmApi.import(csvUrl.trim(), true),
    onSuccess: (res) => {
      if (res.error) {
        setError(res.error);
        setPreview(null);
        return;
      }
      setError("");
      setPreview(res.data!);
    },
    onError: () => setError("No se pudo conectar con el servidor"),
  });

  const confirmImport = useMutation({
    mutationFn: () => crmApi.import(csvUrl.trim(), false),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      const d = res.data!;
      toast.success(`Importados: ${d.created} nuevos, ${d.updated} actualizados`);
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-summary"] });
      handleClose();
    },
    onError: () => toast.error("Error al importar"),
  });

  const handleClose = () => {
    setCsvUrl("");
    setPreview(null);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table2 className="w-5 h-5 text-[#FCCB34]" />
            Importar desde Google Sheets
          </DialogTitle>
          <DialogDescription>
            Pega el enlace de tu hoja publicada como CSV. Reconocemos las columnas solas y te
            mostramos una vista previa antes de guardar nada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Enlace del CSV</Label>
            <Input
              value={csvUrl}
              onChange={(e) => setCsvUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
            />
            <p className="text-xs text-muted-foreground">
              En tu hoja: <strong>Archivo → Compartir → Publicar en la web</strong> → elige la hoja
              y el formato <strong>CSV</strong> → copia el enlace.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-border bg-secondary/20 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Columnas reconocidas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.detectedColumns.map((c) => (
                    <Badge key={c.field} variant="secondary" className="text-[10px]">
                      {FIELD_LABELS[c.field] ?? c.field} ← {c.header}
                    </Badge>
                  ))}
                </div>
                {preview.ignoredHeaders.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Columnas que se ignorarán: {preview.ignoredHeaders.join(", ")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl border border-border">
                  <p className="text-2xl font-bold tabular-nums">{preview.totalRows}</p>
                  <p className="text-xs text-muted-foreground">filas</p>
                </div>
                <div className="p-3 rounded-xl border border-green-500/30">
                  <p className="text-2xl font-bold tabular-nums text-green-500">{preview.created}</p>
                  <p className="text-xs text-muted-foreground">nuevos</p>
                </div>
                <div className="p-3 rounded-xl border border-blue-500/30">
                  <p className="text-2xl font-bold tabular-nums text-blue-400">{preview.updated}</p>
                  <p className="text-xs text-muted-foreground">se actualizan</p>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/30 sticky top-0">
                      <tr>
                        {["Nombre", "Empresa", "Contacto", "Etapa", ""].map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {preview.preview.map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-medium">{row.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.company || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">
                            {row.email || row.phone || "—"}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {stageLabel(row.stage)}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className={
                                row.action === "nuevo"
                                  ? "text-[11px] text-green-500"
                                  : "text-[11px] text-blue-400"
                              }
                            >
                              {row.action}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.totalRows > preview.preview.length && (
                  <p className="text-xs text-muted-foreground p-2 text-center border-t border-border">
                    Mostrando las primeras {preview.preview.length} de {preview.totalRows} filas
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Los prospectos que ya existen (mismo correo o teléfono) se actualizan en lugar de
                duplicarse, así puedes reimportar tu hoja cuando quieras.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {!preview ? (
            <Button
              onClick={() => analyze.mutate()}
              disabled={!csvUrl.trim() || analyze.isPending}
            >
              {analyze.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Table2 className="w-4 h-4 mr-2" />
              )}
              Analizar hoja
            </Button>
          ) : (
            <Button onClick={() => confirmImport.mutate()} disabled={confirmImport.isPending}>
              {confirmImport.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Importar {preview.created + preview.updated} prospectos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
