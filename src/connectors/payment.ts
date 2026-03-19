import { ConnectorType, ConnectorResult, ConnectorConfig, RawRecord } from '@/lib/types';
import { BaseConnector } from './base';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const STATUSES = ['completed', 'pending', 'refunded', 'failed', 'disputed'];
const DESCRIPTIONS = [
  'Monthly subscription — Pro plan',
  'Annual license renewal',
  'One-time setup fee',
  'Consulting services — Q1',
  'Enterprise add-on pack',
  'Overage charges — API calls',
  'Custom integration development',
  'Premium support tier upgrade',
  'Data migration service',
  'Training workshop — 2 day',
  'Hardware procurement',
  'Cloud hosting — monthly',
  'Security audit engagement',
  'Design sprint facilitation',
  'White-label licensing fee',
];
const CUSTOMER_EMAILS = [
  'billing@acmecorp.com',
  'accounts@globex.io',
  'finance@initech.com',
  'ap@umbrella.co',
  'payments@starkindustries.com',
  'invoices@wayneent.com',
  'treasury@cyberdyne.net',
  'accounting@soylent.org',
  'procurement@tyrell.com',
  'ar@massivedynamic.io',
  'ops@hooli.com',
  'admin@piedpiper.com',
  'billing@raviga.vc',
  'finance@endframe.io',
  'accounts@nucleus.tech',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTransaction(index: number): RawRecord {
  const status = randomItem(STATUSES);
  const amount = Math.floor(100 + Math.random() * 49900); // 1.00 to 499.99 in cents-like integers, or bigger
  const amountDecimal = (amount + Math.random()).toFixed(2);

  return {
    id: `txn-${2000 + index}`,
    amount: parseFloat(amountDecimal),
    currency: randomItem(CURRENCIES),
    status,
    customerEmail: randomItem(CUSTOMER_EMAILS),
    description: randomItem(DESCRIPTIONS),
    invoiceNumber: `INV-${2024}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    paymentMethod: randomItem(['credit_card', 'bank_transfer', 'ach', 'wire', 'paypal']),
    transactionDate: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
    settledAt: status === 'completed'
      ? new Date(Date.now() - Math.floor(Math.random() * 85 * 24 * 60 * 60 * 1000)).toISOString()
      : null,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
  };
}

export class PaymentConnector extends BaseConnector {
  type: ConnectorType = 'payment';

  async fetchData(_config: ConnectorConfig): Promise<ConnectorResult> {
    await this.simulateLatency(250, 750);
    this.lastChecked = new Date();

    if (this.shouldSimulateFailure()) {
      this.healthy = false;
      return {
        success: false,
        data: [],
        error: 'Payment gateway error: 429 Too Many Requests — rate limit exceeded, retry after 60s',
        metadata: {
          fetchedAt: new Date(),
          recordCount: 0,
          source: 'payment',
        },
      };
    }

    const count = 5 + Math.floor(Math.random() * 11); // 5-15
    const transactions: RawRecord[] = Array.from({ length: count }, (_, i) => generateTransaction(i));

    this.healthy = true;
    return {
      success: true,
      data: transactions,
      metadata: {
        fetchedAt: new Date(),
        recordCount: transactions.length,
        source: 'payment',
      },
    };
  }
}
