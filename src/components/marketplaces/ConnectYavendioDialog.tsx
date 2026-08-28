import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncApi } from "@/lib/sync-api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Yavendió no usa OAuth: el usuario genera una API key en su panel y la pega
 * aquí. La clave viaja al backend, que la valida contra Yavendió antes de
 * guardarla cifrada. Nunca se queda en el navegador ni vuelve en ninguna
 * respuesta.
 */
export function ConnectYavendioDialog({ open, onOpenChange }: Props) {
  const [apiKey, setApiKey] = useState("");
  const queryClient = useQueryClient();

  const connect = useMutation({
    mutationFn: () => syncApi.connectYavendio(apiKey.trim()),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Cuenta de Yavendió conectada: ${res.data?.nickname ?? ""}`);
      queryClient.invalidateQueries({ queryKey: ["sync-connections"] });
      setApiKey("");
      onOpenChange(false);
    },
    onError: () => toast.error("Error al conectar con el servidor"),
  });

  const close = (next: boolean) => {
    if (!next) setApiKey("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Conectar Yavendió
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Para obtener tu clave:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Entra a tu panel de Yavendió.</li>
                <li>Ve a <span className="font-medium">Configuración → Claves API</span>.</li>
                <li>Crea una clave y cópiala completa.</li>
              </ol>
              <p className="text-xs">
                Yavendió solo la muestra una vez. Se guarda cifrada y nunca vuelve a salir
                de tu servidor.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="yavendio-api-key">API Key</Label>
          <Input
            id="yavendio-api-key"
            type="password"
            autoComplete="off"
            placeholder="yv_live_v1_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && apiKey.trim() && !connect.isPending) connect.mutate();
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={connect.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => connect.mutate()} disabled={!apiKey.trim() || connect.isPending}>
            {connect.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
            {connect.isPending ? "Comprobando…" : "Conectar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
