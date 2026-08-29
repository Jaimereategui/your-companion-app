import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, CreateClientDto } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Eye, EyeOff, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRestrictableSections } from "@/hooks/use-app-sections";

interface CreateClientDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Contraseña inicial legible pero difícil de adivinar */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${out}!`;
}

const EMPTY: CreateClientDto = {
  role: "user",
  name: "",
  lastName: "",
  email: "",
  password: "",
  nameCompany: "",
  cellPhone: "",
  clientType: "saas",
  allowedSections: [],
};

export function CreateClientDialog({ open, onClose }: CreateClientDialogProps) {
  const { secciones: RESTRICTABLE } = useRestrictableSections();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateClientDto>({ ...EMPTY, password: generatePassword() });
  const [showPassword, setShowPassword] = useState(true);
  // "full" = ve todo; "custom" = solo las secciones marcadas
  const [accessMode, setAccessMode] = useState<"full" | "custom">("full");

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: CreateClientDto = {
        ...form,
        email: form.email.trim().toLowerCase(),
        nameCompany: form.nameCompany || undefined,
        cellPhone: form.cellPhone || undefined,
        allowedSections: accessMode === "custom" ? form.allowedSections : [],
      };
      return adminApi.createClient(payload);
    },
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Cuenta creada para ${form.email}`);
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
      handleClose();
    },
    onError: () => toast.error("Error al crear la cuenta"),
  });

  const handleClose = () => {
    setForm({ ...EMPTY, password: generatePassword() });
    setAccessMode("full");
    onClose();
  };

  const toggleSection = (id: string) => {
    const current = form.allowedSections ?? [];
    setForm({
      ...form,
      allowedSections: current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id],
    });
  };

  const canSubmit =
    form.name.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    !createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#FCCB34]" />
            Nueva cuenta
          </DialogTitle>
          <DialogDescription>
            Crea el acceso de un cliente o de alguien de tu equipo, y decide qué podrá ver.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ana"
              />
            </div>
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Torres"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ana@cliente.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Contraseña inicial</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setForm({ ...form, password: generatePassword() })}
                title="Generar otra"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cópiala y compártela con la persona: tendrá que usarla para entrar la primera vez.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tipo de cuenta</Label>
            <Select
              value={form.role ?? "user"}
              onValueChange={(v) => setForm({ ...form, role: v as "user" | "contador" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Cliente</SelectItem>
                <SelectItem value="contador">Contador (solo finanzas y facturación)</SelectItem>
              </SelectContent>
            </Select>
            {form.role === "contador" && (
              <p className="text-xs text-muted-foreground">
                Verá los ingresos y a qué clientes facturar. No puede gestionar cuentas, productos
                ni el CRM.
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa (opcional)</Label>
              <Input
                value={form.nameCompany}
                onChange={(e) => setForm({ ...form, nameCompany: e.target.value })}
                placeholder="Rivesi SAC"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.clientType}
                onValueChange={(v) => setForm({ ...form, clientType: v as "agency" | "saas" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency">Agencia (retainer)</SelectItem>
                  <SelectItem value="saas">Software (licencia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permisos (no aplican al contador: su rol ya los define) */}
          <div className={cn("space-y-3 pt-2 border-t border-border", form.role === "contador" && "hidden")}>
            <Label>¿Qué podrá ver?</Label>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={accessMode === "full" ? "default" : "outline"}
                size="sm"
                onClick={() => setAccessMode("full")}
              >
                Acceso completo
              </Button>
              <Button
                type="button"
                variant={accessMode === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setAccessMode("custom")}
              >
                Acceso limitado
              </Button>
            </div>

            {accessMode === "custom" && (
              <div className="space-y-2 p-3 rounded-xl border border-border bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-2">
                  Dashboard y Configuración siempre están disponibles. Marca lo demás que quieras
                  habilitar.
                </p>
                {RESTRICTABLE.map((section) => (
                  <label
                    key={section.id}
                    className="flex items-center gap-3 py-1.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={(form.allowedSections ?? []).includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <span className="text-sm">{section.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={!canSubmit}>
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Crear cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
