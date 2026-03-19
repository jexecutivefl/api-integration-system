import type { RawRecord } from '@/lib/types';

export function normalizeSupportRecord(raw: RawRecord): Record<string, unknown> {
  return {
    subject: raw.subject || raw.title || 'No Subject',
    description: raw.description || raw.body || raw.content || null,
    priority: raw.priority || 'normal',
    status: raw.status || raw.ticketStatus || 'open',
    customerEmail: raw.customerEmail || raw.email || raw.requester || null,
    assignee: raw.assignee || raw.assignedTo || null,
    source: 'support',
    originalId: raw.id,
  };
}
