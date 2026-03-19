import { ConnectorType } from '@/lib/types';
import { IConnector } from './base';
import { CrmConnector } from './crm';
import { PaymentConnector } from './payment';
import { FormConnector } from './form';
import { SupportConnector } from './support';

const connectors: Record<ConnectorType, IConnector> = {
  crm: new CrmConnector(),
  payment: new PaymentConnector(),
  form: new FormConnector(),
  support: new SupportConnector(),
};

export function getConnector(type: ConnectorType): IConnector {
  return connectors[type];
}

export function getAllConnectors(): IConnector[] {
  return Object.values(connectors);
}
