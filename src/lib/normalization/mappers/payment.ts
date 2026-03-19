import type { RawRecord } from '@/lib/types';

export function normalizePaymentRecord(raw: RawRecord): Record<string, unknown> {
  return {
    amount: raw.amount || raw.total || 0,
    currency: raw.currency || 'USD',
    status: raw.status || raw.paymentStatus || 'unknown',
    customer: raw.customer || raw.customerEmail || raw.email || null,
    description: raw.description || raw.memo || raw.note || null,
    paymentMethod: raw.paymentMethod || raw.method || null,
    source: 'payment',
    originalId: raw.id,
  };
}
