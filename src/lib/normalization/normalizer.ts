import type { ConnectorType, EntityType, RawRecord } from '@/lib/types';
import { normalizeCrmRecord } from './mappers/crm';
import { normalizePaymentRecord } from './mappers/payment';
import { normalizeFormRecord } from './mappers/form';
import { normalizeSupportRecord } from './mappers/support';

const entityTypeMap: Record<ConnectorType, EntityType> = {
  crm: 'contact',
  payment: 'transaction',
  form: 'submission',
  support: 'ticket',
};

const normalizerMap: Record<ConnectorType, (raw: RawRecord) => Record<string, unknown>> = {
  crm: normalizeCrmRecord,
  payment: normalizePaymentRecord,
  form: normalizeFormRecord,
  support: normalizeSupportRecord,
};

export function getEntityType(connectorType: ConnectorType): EntityType {
  return entityTypeMap[connectorType];
}

export function normalizeRecord(
  raw: RawRecord,
  connectorType: ConnectorType
): Record<string, unknown> {
  const normalizer = normalizerMap[connectorType];
  if (!normalizer) {
    throw new Error(`No normalizer found for connector type: ${connectorType}`);
  }
  return normalizer(raw);
}

export function normalizeBatch(
  records: RawRecord[],
  connectorType: ConnectorType
): Array<{ externalId: string; data: Record<string, unknown> }> {
  return records.map((record) => ({
    externalId: String(record.id),
    data: normalizeRecord(record, connectorType),
  }));
}
