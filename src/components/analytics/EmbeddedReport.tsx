import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface EmbeddedReportProps {
  url: string;
  title: string;
}

/**
 * Muestra el reporte externo del cliente (AppScript, Looker Studio…)
 * dentro de la app. Si el sitio bloquea los iframes, el recuadro se
 * quedaría en blanco, así que tras unos segundos ofrecemos abrirlo en
 * una pestaña nueva en vez de dejar al usuario mirando el vacío.
 */
export function EmbeddedReport({ url, title }: EmbeddedReportProps) {
  const [loaded, setLoaded] = useState(false);
  const [maybeBlocked, setMaybeBlocked] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const timer = useRef<number>();

  useEffect(() => {
    setLoaded(false);
    setMaybeBlocked(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setMaybeBlocked((wasLoaded) => !loaded || wasLoaded);
    }, 8000);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((k) => k + 1)}
            title="Recargar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Abrir aparte <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </a>
          </Button>
        </div>
      </div>

      <div className="relative glass rounded-2xl border border-border dark:border-white/10 overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#FCCB34]" />
            <p className="text-sm text-muted-foreground">Cargando tu reporte…</p>
          </div>
        )}

        <iframe
          key={reloadKey}
          src={url}
          title={title}
          onLoad={() => {
            setLoaded(true);
            setMaybeBlocked(false);
          }}
          className="w-full h-[70vh] min-h-[500px] bg-white"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {maybeBlocked && !loaded && (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">El reporte está tardando o no permite mostrarse aquí</p>
            <p className="text-muted-foreground">
              Puedes{" "}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FCCB34] hover:underline font-medium"
              >
                abrirlo en una pestaña nueva
              </a>
              . Si el problema persiste, avísale a tu ejecutivo de cuenta.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
