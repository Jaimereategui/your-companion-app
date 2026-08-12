import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell, authButtonClass, authInputClass } from "@/components/auth/AuthShell";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MIN_LENGTH = 8;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  // ── Enlace sin token ────────────────────────────────────────────────────────
  if (!token) {
    return (
      <AuthShell
        title="Enlace no válido"
        subtitle="Este enlace está incompleto o ya se usó. Pide uno nuevo para continuar."
      >
        <div className="space-y-4">
          <Button className={authButtonClass} onClick={() => navigate("/forgot-password")}>
            Pedir un enlace nuevo
          </Button>
          <p className="text-sm text-center text-[#666666] dark:text-[#A1A1AA]">
            <Link
              to="/login"
              className="text-[#111111] dark:text-white hover:text-[#FCCB34] dark:hover:text-[#FCCB34] font-semibold transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  // ── Éxito ───────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <AuthShell title="Contraseña actualizada" subtitle="Ya puedes entrar con tu contraseña nueva.">
        <div className="space-y-6">
          <div className="flex justify-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <Button className={authButtonClass} onClick={() => navigate("/login")}>
            Ir a iniciar sesión
          </Button>
        </div>
      </AuthShell>
    );
  }

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= MIN_LENGTH && password === confirm && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await resetPassword({ token, newPassword: password });

    if (result.success) {
      setDone(true);
      toast.success("Contraseña actualizada");
    } else {
      setError(
        result.error ||
          "No pudimos actualizar tu contraseña. El enlace pudo haber vencido — pide uno nuevo."
      );
    }
    setIsLoading(false);
  };

  return (
    <AuthShell
      title="Crea tu contraseña nueva"
      subtitle={`Debe tener al menos ${MIN_LENGTH} caracteres.`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-[#111111] dark:text-[#F8F8F5]">
            Nueva contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-white transition-colors"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {tooShort && (
            <p className="text-xs text-red-500">Te faltan {MIN_LENGTH - password.length} caracteres.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-sm font-medium text-[#111111] dark:text-[#F8F8F5]">
            Repite la contraseña
          </Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={isLoading}
            className={authInputClass}
          />
          {mismatch && <p className="text-xs text-red-500">Las contraseñas no coinciden.</p>}
        </div>

        <Button type="submit" disabled={!canSubmit} className={authButtonClass}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar contraseña"
          )}
        </Button>

        <p className="text-sm text-center text-[#666666] dark:text-[#A1A1AA] pt-2">
          <Link
            to="/login"
            className="text-[#111111] dark:text-white hover:text-[#FCCB34] dark:hover:text-[#FCCB34] font-semibold transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
