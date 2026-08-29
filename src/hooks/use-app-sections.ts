import { useQuery } from "@tanstack/react-query";
import { adminApi, AppSectionDef } from "@/lib/admin-api";

/**
 * Secciones que el superadmin puede conceder o restringir.
 *
 * Vienen del servidor, que tiene la única definición: así, cuando se añade
 * un módulo nuevo, aparece solo en las pantallas de permisos sin tocar nada
 * aquí. Solo se devuelven las restringibles — Dashboard y Configuración
 * están siempre disponibles y no tiene sentido mostrarlas como casillas.
 */
export function useRestrictableSections(enabled = true) {
    const { data, isLoading } = useQuery({
        queryKey: ["app-sections"],
        queryFn: () => adminApi.getSections(),
        staleTime: 30 * 60_000,
        enabled,
    });

    const todas: AppSectionDef[] = data?.data ?? [];
    return { secciones: todas.filter(s => !s.always), isLoading };
}
