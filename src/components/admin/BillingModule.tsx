import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { billingApi, BILLING_STATUS, BillingRow } from "@/lib/billing-api";
import { BillingDialog } from "./BillingDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, FileText, Percent, Receipt, Wallet } from "lucide-react";

const money = (n: number) =>
  `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusMeta = (id: string) => BILLING_STATUS.find((s) => s.id === id);

const currentPeriod = () => new Date().toISOString().slice(0, 7);

const shiftPeriod = (period: string, months: number) => {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const periodLabel = (period: string) => {
  const [y, m] = period.split("-");
  const names = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${names[Number(m) - 1]} ${y}`;
};

export function BillingModule() {
  const { user } = useAuth();
  const isAccountant = user?.role === "contador";

  const [period, setPeriod] = useState(currentPeriod());
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<BillingRow | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["billing-period", period],
    queryFn: () => billingApi.getPeriod(period),
    staleTime: 20_000,
  });

  const data = res?.data;
  const term = search.trim().toLowerCase();
  const rows = (data?.rows ?? []).filter((r) =>
    term
      ? [r.clientName, r.email, r.ruc].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
      : true
  );

  // Al contador le interesa primero lo que falta facturar
  const sorted = [...rows].sort((a, b) => {
    const rank = (r: BillingRow) =>
      !r.billing ? 0 : r.billing.status === "pendiente" ? 1 : r.billing.status === "facturado" ? 2 : 3;
    return rank(a) - rank(b);
  });

  return (
    <div className="space-y-6">
      {/* Selector de periodo */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setPeriod(shiftPeriod(period, -1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 rounded-xl border border-border min-w-[160px] text-center">
            <p className="font-semibold text-sm">{periodLabel(period)}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPeriod(shiftPeriod(period, 1))}
            disabled={period >= currentPeriod()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {period !== currentPeriod() && (
            <Button variant="ghost" size="sm" onClick={() => setPeriod(currentPeriod())}>
              Mes actual
            </Button>
          )}
        </div>

        <Input
          className="w-full sm:max-w-xs"
          placeholder="Buscar cliente o RUC…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Totales */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl border border-border dark:border-white/10 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#FCCB34]/15 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#FCCB34]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ventas del mes
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{money(data?.totals.totalSales ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.totals.loaded ?? 0} de {data?.totals.clients ?? 0} clientes cargados
            </p>
          </div>

          <div className="glass rounded-2xl border border-border dark:border-white/10 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#FCCB34]/15 flex items-center justify-center">
                <Percent className="w-4 h-4 text-[#FCCB34]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Comisiones
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{money(data?.totals.totalCommission ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Lo que te corresponde este mes</p>
          </div>

          <div className="glass rounded-2xl border border-border dark:border-white/10 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Por cobrar
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-yellow-500">
              {money(data?.totals.pendingCommission ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.totals.pending ?? 0} por facturar · {data?.totals.invoiced ?? 0} facturados
            </p>
          </div>
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className="glass rounded-2xl divide-y divide-border/50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
          <p className="font-semibold">Sin clientes en este periodo</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cuando registres clientes aparecerán aquí para liquidar su comisión.
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  {["Cliente", "Ventas del mes", "%", "A facturar", "Estado", "Comprobante", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sorted.map((r) => {
                  const meta = r.billing ? statusMeta(r.billing.status) : null;
                  return (
                    <tr key={r.clientId} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{r.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.ruc ? `RUC ${r.ruc}` : "sin RUC"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        {r.billing ? money(r.billing.totalSales) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        {r.billing ? `${r.billing.commissionRate}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums">
                        {r.billing ? money(r.billing.commissionAmount) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {meta ? (
                          <Badge className={cn("text-[10px]", meta.color)}>{meta.label}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Sin cargar</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {r.billing?.invoiceRef || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setTarget(r)}>
                          {r.billing ? "Editar" : "Cargar"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Móvil */}
          <div className="md:hidden divide-y divide-border/50">
            {sorted.map((r) => {
              const meta = r.billing ? statusMeta(r.billing.status) : null;
              return (
                <div key={r.clientId} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{r.clientName}</p>
                      <p className="text-xs text-muted-foreground">{r.ruc ? `RUC ${r.ruc}` : "sin RUC"}</p>
                    </div>
                    {meta ? (
                      <Badge className={cn("text-[10px] shrink-0", meta.color)}>{meta.label}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] shrink-0">Sin cargar</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {r.billing ? (
                        <>
                          <span className="font-semibold tabular-nums">{money(r.billing.commissionAmount)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {r.billing.commissionRate}% de {money(r.billing.totalSales)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sin liquidación</span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setTarget(r)}>
                      {r.billing ? "Editar" : "Cargar"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BillingDialog
        row={target}
        period={period}
        onClose={() => setTarget(null)}
        readOnlyAmounts={isAccountant}
      />
    </div>
  );
}
