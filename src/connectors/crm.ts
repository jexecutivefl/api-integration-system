import { ConnectorType, ConnectorResult, ConnectorConfig, RawRecord } from '@/lib/types';
import { BaseConnector } from './base';

const FIRST_NAMES = ['Alice', 'Marcus', 'Priya', 'James', 'Sofia', 'Liam', 'Mei', 'Carlos', 'Fatima', 'Noah', 'Olivia', 'Ethan'];
const LAST_NAMES = ['Johnson', 'Chen', 'Patel', 'Williams', 'Garcia', 'Kim', 'Mueller', 'Santos', 'Nakamura', 'O\'Brien', 'Larsson', 'Ahmed'];
const COMPANIES = ['Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Ltd', 'Stark Industries', 'Wayne Enterprises', 'Cyberdyne Systems', 'Soylent Corp', 'Tyrell Corp', 'Massive Dynamic'];
const DEAL_STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateContact(index: number): RawRecord {
  const first = randomItem(FIRST_NAMES);
  const last = randomItem(LAST_NAMES);
  const company = randomItem(COMPANIES);
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

  return {
    id: `crm-contact-${1000 + index}`,
    firstName: first,
    lastName: last,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
    company,
    phone: `+1-${Math.floor(200 + Math.random() * 800)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
    title: randomItem(['CEO', 'CTO', 'VP of Sales', 'Marketing Director', 'Product Manager', 'Engineering Lead', 'Account Executive']),
    dealAmount: Math.floor(5000 + Math.random() * 195000),
    dealStage: randomItem(DEAL_STAGES),
    lastContactedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
  };
}

export class CrmConnector extends BaseConnector {
  type: ConnectorType = 'crm';

  async fetchData(_config: ConnectorConfig): Promise<ConnectorResult> {
    await this.simulateLatency(300, 900);
    this.lastChecked = new Date();

    if (this.shouldSimulateFailure()) {
      this.healthy = false;
      return {
        success: false,
        data: [],
        error: 'CRM API request failed: 503 Service Unavailable — upstream CRM service is temporarily down',
        metadata: {
          fetchedAt: new Date(),
          recordCount: 0,
          source: 'crm',
        },
      };
    }

    const count = 5 + Math.floor(Math.random() * 6); // 5-10
    const contacts: RawRecord[] = Array.from({ length: count }, (_, i) => generateContact(i));

    this.healthy = true;
    return {
      success: true,
      data: contacts,
      metadata: {
        fetchedAt: new Date(),
        recordCount: contacts.length,
        source: 'crm',
      },
    };
  }
}
