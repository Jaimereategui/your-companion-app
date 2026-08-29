import { apiRequest } from './api';

export interface DashboardChannel {
  marketplace: string;
  nickname: string;
  status: 'active' | 'revoked' | 'error';
}

export interface DashboardSummary {
  canales: DashboardChannel[];
  catalogo: {
    total: number;
    borradores: number;
    publicados: number;
    conError: number;
    pendientes: number;
  };
  ventas: {
    mes: { pedidos: number; importe: number };
    mesAnterior: { pedidos: number; importe: number };
    variacion: number | null;
    porCanal: { marketplace: string; pedidos: number; importe: number }[];
  };
  stockBajo: { id: string; name: string; sku: string; stock: number }[];
  avisos: { sinLeer: number; problemas: number };
}

export interface DashboardAccount {
  id: string;
  nombre: string;
  email: string;
  empresa: string | null;
  estado: string;
  canales: { marketplace: string; status: string }[];
  canalesCaidos: number;
  ventas: { pedidos: number; importe: number };
  publicaciones: { publicados: number; conError: number };
  problemasSinLeer: number;
}

export interface DashboardAccounts {
  cuentas: DashboardAccount[];
  totales: { clientes: number; pedidos: number; importe: number };
}

export const dashboardApi = {
  getSummary: () => apiRequest<DashboardSummary>('/dashboard/summary', { method: 'GET' }),
  getAccounts: () => apiRequest<DashboardAccounts>('/dashboard/accounts', { method: 'GET' }),
};

/** Importes en soles, sin decimales cuando no hacen falta. */
export function money(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export const MARKETPLACE_LABEL: Record<string, string> = {
  mercadolibre: 'Mercado Libre',
  falabella: 'Falabella',
  yavendio: 'Yavendió',
  shopify: 'Shopify',
  amazon: 'Amazon',
};
