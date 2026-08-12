import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, CreateLeadDto, Lead, LEAD_STAGES } from "@/lib/crm-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Save, Trash2, UserPlus } from "lucide-react";

interface LeadDialogProps {
  /** null = cerrado · "new" = alta · Lead = edición */
  lead: Lead | "new" | null;
  onClose: () => void;
}

const EMPTY: CreateLeadDto = {
  name: "",
  company: "",
  email: "",
  phone: "",
  source: "",
  stage: "nuevo",
  notes: "",
};

export function LeadDialog({ lead, onClose }: LeadDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = lead !== null && lead !== "new";
  const [form, setForm] = useState<CreateLeadDto>(EMPTY);

  useEffect(() => {
    if (!lead) return;
    if (lead === "new") {
      setForm(EMPTY);
      return;
    }
    setForm({
      name: lead.name,
      company: lead.company ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      source: lead.source ?? "",
      stage: lead.stage,
      estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : undefined,
      notes: lead.notes ?? "",
      lastContactAt: lead.lastContactAt ?? undefined,
    });
  }, [lead]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    queryClient.invalidateQueries({ queryKey: ["crm-summary"] });
  };

  const save = useMutation({
    mutationFn: () => {
      // Los vacíos no se envían: el correo vacío rompería la validación
      const payload: CreateLeadDto = { name: form.name.trim(), stage: form.stage };
      (["company", "email", "phone", "source", "notes", "lastContactAt"] as const).forEach((k) => {
        const v = (form as any)[k];
        if (v) (payload as any)[k] = v;
      });
      if (form.estimatedValue) payload.estimatedValue = Number(form.estimatedValue);

      return isEditing
        ? crmApi.update((lead as Lead).id, payload)
        : crmApi.create(payload);
    },
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(isEditing ? "Prospecto actualizado" : "Prospecto creado");
      invalidate();
      onClose();
    },
    onError: () => toast.error("Error al guardar"),
  });

  const remove = useMutation({
    mutationFn: () => crmApi.remove((lead as Lead).id),
    onSuccess: () => {
      toast.success("Prospecto eliminado");
      invalidate();
      onClose();
    },
    onError: () => toast.error("Error al eliminar"),
  });

  return (
    <Dialog open={lead !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#FCCB34]" />
            {isEditing ? "Editar prospecto" : "Nuevo prospecto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza sus datos o muévelo de etapa en el embudo."
              : "Registra un interesado para darle seguimiento."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ana Torres"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Rivesi SAC"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ana@rivesi.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono / WhatsApp</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+51 999 999 999"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Origen</Label>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Instagram, referido, web…"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor estimado (S/)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.estimatedValue ?? ""}
                onChange={(e) =>
                  setForm({ ...form, estimatedValue: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="3500"
              />
            </div>
            <div className="space-y-2">
              <Label>Último contacto</Label>
              <Input
                type="date"
                value={form.lastContactAt ?? ""}
                onChange={(e) => setForm({ ...form, lastContactAt: e.target.value || undefined })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Qué necesita, acuerdos, próximos pasos…"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEditing && (
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive sm:mr-auto"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={!form.name.trim() || save.isPending}>
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
