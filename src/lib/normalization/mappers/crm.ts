import type { RawRecord } from '@/lib/types';

export function normalizeCrmRecord(raw: RawRecord): Record<string, unknown> {
  return {
    name: raw.name || raw.full_name || raw.firstName
      ? `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || raw.name || raw.full_name
      : 'Unknown',
    email: raw.email || raw.emailAddress || null,
    company: raw.company || raw.organization || raw.companyName || null,
    phone: raw.phone || raw.phoneNumber || raw.mobile || null,
    title: raw.title || raw.jobTitle || null,
    source: 'crm',
    originalId: raw.id,
  };
}
