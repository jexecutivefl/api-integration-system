import type { RawRecord, EntityType } from '@/lib/types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const entityValidators: Record<EntityType, (record: RawRecord) => ValidationResult> = {
  contact: (record) => {
    const errors: string[] = [];
    if (!record.id) errors.push('Missing required field: id');
    if (!record.email && !record.name) errors.push('Contact must have either email or name');
    return { valid: errors.length === 0, errors };
  },

  transaction: (record) => {
    const errors: string[] = [];
    if (!record.id) errors.push('Missing required field: id');
    if (record.amount === undefined) errors.push('Missing required field: amount');
    if (typeof record.amount === 'number' && record.amount < 0) errors.push('Amount must be non-negative');
    return { valid: errors.length === 0, errors };
  },

  submission: (record) => {
    const errors: string[] = [];
    if (!record.id) errors.push('Missing required field: id');
    return { valid: errors.length === 0, errors };
  },

  ticket: (record) => {
    const errors: string[] = [];
    if (!record.id) errors.push('Missing required field: id');
    if (!record.subject && !record.title) errors.push('Ticket must have a subject or title');
    return { valid: errors.length === 0, errors };
  },
};

export function validateRecord(record: RawRecord, entityType: EntityType): ValidationResult {
  const validator = entityValidators[entityType];
  if (!validator) {
    return { valid: false, errors: [`Unknown entity type: ${entityType}`] };
  }
  return validator(record);
}

export function validateBatch(
  records: RawRecord[],
  entityType: EntityType
): { valid: RawRecord[]; invalid: Array<{ record: RawRecord; errors: string[] }> } {
  const valid: RawRecord[] = [];
  const invalid: Array<{ record: RawRecord; errors: string[] }> = [];

  for (const record of records) {
    const result = validateRecord(record, entityType);
    if (result.valid) {
      valid.push(record);
    } else {
      invalid.push({ record, errors: result.errors });
    }
  }

  return { valid, invalid };
}
