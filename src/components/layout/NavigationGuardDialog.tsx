import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileWarning } from "lucide-react";

interface NavigationGuardDialogProps {
  open: boolean;
  sectionName: string;
  /** User chooses to leave despite unsaved changes */
  onLeave: () => void;
  /** User chooses to stay and continue editing */
  onStay: () => void;
}

export function NavigationGuardDialog({
  open,
  sectionName,
  onLeave,
  onStay,
}: NavigationGuardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onStay()}>
      {/* w-[calc(100%-2rem)] keeps a safe margin on mobile; max-w-sm caps desktop */}
      <AlertDialogContent className="glass w-[calc(100%-2rem)] max-w-sm p-6">
        <AlertDialogHeader className="space-y-3">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <FileWarning className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-base leading-snug">
              ¿Salir sin guardar?
            </AlertDialogTitle>
          </div>

          {/* Description */}
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Tienes cambios sin guardar en{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{sectionName}&rdquo;
            </span>
            .
          </AlertDialogDescription>

          {/* Tip box */}
          <div className="flex gap-2 items-start rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
            <span className="shrink-0 text-sm leading-none mt-0.5">💡</span>
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              Tranquilo — tus datos se mantienen en memoria mientras no recargues la página.
              Puedes regresar cuando quieras.
            </p>
          </div>
        </AlertDialogHeader>

        {/* Stacked buttons — evitan que el footer ensanche el dialog */}
        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={onStay}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            Quedarme aquí
          </Button>
          <Button
            variant="ghost"
            onClick={onLeave}
            className="w-full text-muted-foreground"
          >
            Continuar de todas formas
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
