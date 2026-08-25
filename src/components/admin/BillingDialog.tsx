import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billingApi, BILLING_STATUS, BillingRow, BillingStatus } from "@/lib/billing-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Download, Loader2, Save } from "lucide-react";

interface BillingDialogProps {
  row: BillingRow | null;
  period: string;
  onClose: () => void;
  /** El contador puede facturar pero no cambiar montos ni % */
  readOnlyAmounts?: boolean;
}

const money = (n: number, currency = "PEN") =>
  `${currency === "USD" ? "$" : "S/"} ${Number(n || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function BillingDialog({ row, period, onClose, readOnlyAmounts }: BillingDialogProps) {
  const queryClient = useQueryClient();
  const [totalSales, setTotalSales] = useState(0);
  const [commissionRate, setCommissionRate] = useState(0);
  const [status, setStatus] = useState<BillingStatus>("pendiente");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [fetched, setFetched] = useState<{ total: number; warning: string | null } | null>(null);

  useEffect(() => {
    if (!row) return;
    setTotalSales(row.billing?.totalSales ?? 0);
    setCommissionRate(row.billing?.commissionRate ?? 0);
    setStatus(row.billing?.status ?? "pendiente");
    setInvoiceRef(row.billing?.invoiceRef ?? "");
    setNotes(row.billing?.notes ?? "");
    setFetched(null);
  }, [row]);

  const commission = Math.round(((totalSales * commissionRate) / 100 + Number.EPSILON) * 100) / 100;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["billing-period"] });
    queryClient.invalidateQueries({ queryKey: ["billing-trend"] });
  };

  const pullSales = useMutation({
    mutationFn: () => billingApi.fetchSales(row!.clientId, period),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      const d = res.data!;
      setTotalSales(d.totalSales);
      setFetched({ total: d.totalSales, warning: d.warning ?? d.sheetError });
      if (d.totalSales > 0) toast.success(`Ventas del periodo: ${money(d.totalSales)}`);
    },
    onError: () => toast.error("No se pudieron traer las ventas"),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!readOnlyAmounts) {
        const res = await billingApi.upsert({
          clientId: row!.clientId,
          period,
          totalSales,
          commissionRate,
          salesSource: fetched ? "sheets" : "manual",
          notes: notes || undefined,
        });
        if (res.error) throw new Error(res.error);
      }

      // El estado y el comprobante se guardan sobre el registro ya creado
      const id = row!.billing?.id;
      if (id) {
        const res = await billingApi.updateStatus(id, {
          status,
          invoiceRef: invoiceRef || undefined,
          notes: notes || undefined,
        });
        if (res.error) throw new Error(res.error);
      }
      return true;
    },
    onSuccess: () => {
      toast.success("Liquidación guardada");
      invalidate();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Error al guardar"),
  });

  const needsSaveFirst = !row?.billing && (status !== "pendiente" || invoiceRef);

  return (
    <Dialog open={row !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row?.clientName}</DialogTitle>
          <DialogDescription>
            Liquidación de {period}
            {row?.ruc ? ` · RUC ${row.ruc}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Ventas del periodo</Label>
              {!readOnlyAmounts && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => pullSales.mutate()}
                  disabled={pullSales.isPending}
                >
                  {pullSales.isPending ? (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3 mr-1.5" />
                  )}
                  Traer del reporte
                </Button>
              )}
            </div>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={totalSales || ""}
              onChange={(e) => setTotalSales(Number(e.target.value))}
              disabled={readOnlyAmounts}
              placeholder="45000.00"
            />
            {fetched?.warning && (
              <p className="text-xs text-yellow-500 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {fetched.warning}
              </p>
            )}
            {!row?.hasSheet && !readOnlyAmounts && (
              <p className="text-xs text-muted-foreground">
                Este cliente no tiene hoja de ventas vinculada. Puedes cargarla en su ficha para
                traer el monto automáticamente.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Comisión pactada (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={commissionRate || ""}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              disabled={readOnlyAmounts}
              placeholder="8.5"
            />
          </div>

          <div className="p-4 rounded-xl border border-[#FCCB34]/40 bg-[#FCCB34]/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                A facturar
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {money(totalSales)} × {commissionRate || 0}%
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{money(commission)}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BillingStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BILLING_STATUS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>N° de comprobante</Label>
              <Input
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="F001-00000123"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Acuerdos, ajustes del periodo…"
            />
          </div>

          {needsSaveFirst && (
            <p className="text-xs text-muted-foreground">
              Se guardará la liquidación y luego su estado.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || (!readOnlyAmounts && (!totalSales || !commissionRate))}
          >
            {save.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
