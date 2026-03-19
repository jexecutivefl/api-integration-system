import { ConnectorType, ConnectorResult, ConnectorConfig, RawRecord } from '@/lib/types';
import { BaseConnector } from './base';

const SUBJECTS = [
  'Unable to log in after password reset',
  'Data export failing with timeout error',
  'Billing discrepancy on latest invoice',
  'API rate limiting is too aggressive',
  'Integration with Slack stopped working',
  'Dashboard charts not loading in Firefox',
  'Need help configuring SSO with Okta',
  'Webhook payloads arriving out of order',
  'Account locked after failed MFA attempts',
  'CSV import rejecting valid records',
  'Performance degradation during peak hours',
  'Missing data in sync run report',
];
const DESCRIPTIONS = [
  'I reset my password using the forgot password flow but now I get a 401 error every time I try to log in. I have cleared cookies and tried incognito mode.',
  'When I try to export more than 10,000 records the job runs for about 5 minutes and then fails silently. No error message is shown in the UI.',
  'Our latest invoice shows a charge for 150 seats but we only have 120 active users. Please review and issue a credit if applicable.',
  'We are hitting 429 errors after only 50 requests per minute. Our contract states a limit of 200 req/min. Can you check our tier?',
  'The Slack integration was working fine until yesterday. Now no notifications are being sent. We have verified the webhook URL is correct.',
  'All charts on the main dashboard render as blank white boxes in Firefox 121. Everything works fine in Chrome and Safari.',
  'We are trying to set up SAML SSO with Okta but keep getting a metadata parsing error. Attached our IdP metadata XML for reference.',
  'Webhook events for new records are arriving 10-15 minutes after the record is created. They also seem to arrive in random order.',
  'My account was locked after 3 failed MFA attempts but I no longer have access to my authenticator app. Need a manual unlock.',
  'Importing a CSV with 5,000 rows fails at row 2,341. The error says invalid date format but the dates are in ISO 8601.',
  'Response times have jumped from ~200ms to ~2s between 9am and 11am EST every weekday for the past two weeks.',
  'The sync completed successfully according to the status but the report shows 0 records processed. The source definitely has data.',
];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const TICKET_STATUSES = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'] as const;
const CUSTOMER_EMAILS = [
  'support@acmecorp.com',
  'help@globex.io',
  'admin@initech.com',
  'it@umbrella.co',
  'ops@starkindustries.com',
  'tech@wayneent.com',
  'systems@cyberdyne.net',
  'infra@soylent.org',
  'devops@tyrell.com',
  'engineering@massivedynamic.io',
];
const ASSIGNEES = ['Agent Smith', 'Dana Scully', 'Jim Hopper', 'Rosa Diaz', 'Unassigned'];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTicket(index: number): RawRecord {
  const subjectIndex = index % SUBJECTS.length;

  return {
    id: `ticket-${4000 + index}`,
    subject: SUBJECTS[subjectIndex],
    description: DESCRIPTIONS[subjectIndex],
    priority: randomItem(PRIORITIES),
    status: randomItem(TICKET_STATUSES),
    customerEmail: randomItem(CUSTOMER_EMAILS),
    assignee: randomItem(ASSIGNEES),
    channel: randomItem(['email', 'chat', 'phone', 'web_form']),
    tags: [randomItem(['bug', 'billing', 'feature', 'access', 'performance']), randomItem(['tier-1', 'tier-2', 'tier-3'])],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString(),
    updatedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
  };
}

export class SupportConnector extends BaseConnector {
  type: ConnectorType = 'support';

  async fetchData(_config: ConnectorConfig): Promise<ConnectorResult> {
    await this.simulateLatency(200, 700);
    this.lastChecked = new Date();

    if (this.shouldSimulateFailure()) {
      this.healthy = false;
      return {
        success: false,
        data: [],
        error: 'Support platform API error: 502 Bad Gateway — the ticketing service returned an invalid response',
        metadata: {
          fetchedAt: new Date(),
          recordCount: 0,
          source: 'support',
        },
      };
    }

    const count = 3 + Math.floor(Math.random() * 8); // 3-10
    const tickets: RawRecord[] = Array.from({ length: count }, (_, i) => generateTicket(i));

    this.healthy = true;
    return {
      success: true,
      data: tickets,
      metadata: {
        fetchedAt: new Date(),
        recordCount: tickets.length,
        source: 'support',
      },
    };
  }
}
