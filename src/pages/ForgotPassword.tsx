import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell, authButtonClass, authInputClass } from "@/components/auth/AuthShell";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await forgotPassword({ email });

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || "No pudimos enviar el correo. Inténtalo de nuevo.");
    }
    setIsLoading(false);
  };

  // ── Confirmación ────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <AuthShell
        title="Revisa tu correo"
        subtitle="Si esa dirección tiene una cuenta, te enviamos un enlace para crear una contraseña nueva."
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FCCB34]/15 flex items-center justify-center">
              <MailCheck className="w-8 h-8 text-[#FCCB34]" />
            </div>
            <p className="text-sm text-[#666666] dark:text-[#A1A1AA]">
              Enviado a <span className="font-semibold text-[#111111] dark:text-[#F8F8F5]">{email}</span>
            </p>
            <p className="text-xs text-[#666666] dark:text-[#A1A1AA]">
              El enlace vence en 1 hora. Si no lo ves, revisa tu carpeta de spam.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={() => {
              setSent(false);
              setError("");
            }}
          >
            Enviar a otro correo
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

  // ── Formulario ──────────────────────────────────────────────────────────────
  return (
    <AuthShell
      title="Recupera tu acceso"
      subtitle="Escribe tu correo y te enviamos un enlace para crear una contraseña nueva."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-[#111111] dark:text-[#F8F8F5]">
            Correo electrónico
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={isLoading}
            className={authInputClass}
          />
        </div>

        <Button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enviando enlace...
            </>
          ) : (
            "Enviar enlace de recuperación"
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
