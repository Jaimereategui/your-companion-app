import { apiRequest } from './api';

export type BillingStatus = 'pendiente' | 'facturado' | 'cobrado';

export const BILLING_STATUS = [
  { id: 'pendiente', label: 'Por facturar', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' },
  { id: 'facturado', label: 'Facturado', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { id: 'cobrado', label: 'Cobrado', color: 'bg-green-500/15 text-green-500 border-green-500/30' },
] as const;

export interface BillingRecord {
  id: string;
  totalSales: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  status: BillingStatus;
  invoiceRef?: string;
  invoicedAt?: string;
  salesSource: string;
  notes?: string;
}

export interface BillingRow {
  clientId: string;
  clientName: string;
  email: string;
  ruc: string | null;
  clientType: string;
  hasSheet: boolean;
  billing: BillingRecord | null;
}

export interface BillingPeriod {
  period: string;
  totals: {
    clients: number;
    loaded: number;
    pending: number;
    invoiced: number;
    collected: number;
    totalSales: number;
    totalCommission: number;
    pendingCommission: number;
  };
  rows: BillingRow[];
}

export interface FetchedSales {
  period: string;
  totalSales: number;
  orders: number;
  byChannel: { channel: string; sales: number; orders: number; source: string }[];
  source: string;
  sheetError: string | null;
  warning: string | null;
}

export interface UpsertBillingDto {
  clientId: string;
  period: string;
  totalSales: number;
  commissionRate: number;
  currency?: string;
  salesSource?: string;
  notes?: string;
}

export const billingApi = {
  getPeriod: (period: string) =>
    apiRequest<BillingPeriod>(`/admin/billing?period=${period}`, { method: 'GET' }),

  getTrend: () =>
    apiRequest<{ period: string; commission: number; sales: number }[]>('/admin/billing/trend', {
      method: 'GET',
    }),

  /** Trae las ventas reales del cliente en el periodo (hoja + marketplaces) */
  fetchSales: (clientId: string, period: string) =>
    apiRequest<FetchedSales>(`/admin/billing/fetch-sales?clientId=${clientId}&period=${period}`, {
      method: 'GET',
    }),

  getClientHistory: (clientId: string) =>
    apiRequest<BillingRecord[] & { period: string }[]>(`/admin/billing/client/${clientId}`, {
      method: 'GET',
    }),

  upsert: (dto: UpsertBillingDto) =>
    apiRequest<BillingRecord>('/admin/billing', { method: 'POST', body: JSON.stringify(dto) }),

  updateStatus: (
    id: string,
    dto: { status?: BillingStatus; invoiceRef?: string; invoicedAt?: string; notes?: string },
  ) => apiRequest<BillingRecord>(`/admin/billing/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  remove: (id: string) =>
    apiRequest<{ message: string }>(`/admin/billing/${id}`, { method: 'DELETE' }),
};
