import type { RawRecord } from '@/lib/types';

export function normalizeFormRecord(raw: RawRecord): Record<string, unknown> {
  return {
    formTitle: raw.formTitle || raw.form_name || raw.formName || 'Unknown Form',
    submitterName: raw.name || raw.submitterName || raw.full_name || null,
    submitterEmail: raw.email || raw.submitterEmail || null,
    message: raw.message || raw.body || raw.content || null,
    submittedAt: raw.submittedAt || raw.created_at || raw.timestamp || null,
    source: 'form',
    originalId: raw.id,
  };
}
