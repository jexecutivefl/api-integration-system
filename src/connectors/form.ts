import { ConnectorType, ConnectorResult, ConnectorConfig, RawRecord } from '@/lib/types';
import { BaseConnector } from './base';

const FORM_TITLES = [
  'Contact Us',
  'Request a Demo',
  'Newsletter Signup',
  'Partnership Inquiry',
  'Bug Report',
  'Feature Request',
  'Job Application — Engineering',
  'Event Registration — Webinar',
];
const FIRST_NAMES = ['Emma', 'Raj', 'Sarah', 'Tomasz', 'Yuki', 'Daniel', 'Amara', 'Lucas', 'Chloe', 'Hassan'];
const LAST_NAMES = ['Thompson', 'Gupta', 'Mitchell', 'Kowalski', 'Tanaka', 'Rivera', 'Osei', 'Bergman', 'Dupont', 'Al-Farsi'];
const MESSAGES = [
  'I would love to learn more about your enterprise pricing and what kind of volume discounts are available for teams over 50 people.',
  'We are evaluating tools for our Q2 migration project. Can someone walk us through the onboarding process?',
  'Just saw your talk at the DevOps conference — very impressed. Would love to explore a partnership.',
  'Having trouble with the OAuth flow on the sandbox environment. Attached screenshots of the error.',
  'It would be great if you could add support for Salesforce bi-directional sync. Happy to beta test.',
  'Sign me up for the monthly product updates newsletter!',
  'Interested in the senior backend engineer role. My resume is attached.',
  'Please register me for the upcoming webinar on API best practices scheduled for next Thursday.',
  'Our team has been using the free tier for 3 months and we are ready to upgrade. What are the next steps?',
  'Can you provide SOC 2 compliance documentation? Our security team needs it before we can proceed.',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSubmission(index: number): RawRecord {
  const first = randomItem(FIRST_NAMES);
  const last = randomItem(LAST_NAMES);

  return {
    id: `form-sub-${3000 + index}`,
    formTitle: randomItem(FORM_TITLES),
    submitterName: `${first} ${last}`,
    submitterEmail: `${first.toLowerCase()}.${last.toLowerCase()}@${randomItem(['gmail.com', 'outlook.com', 'company.io', 'fastmail.com', 'proton.me'])}`,
    message: randomItem(MESSAGES),
    source: randomItem(['website', 'landing_page', 'embedded_widget', 'email_campaign']),
    referrer: randomItem(['https://google.com', 'https://twitter.com', 'https://linkedin.com', 'direct', 'https://producthunt.com']),
    submittedAt: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString(),
    ipAddress: `${Math.floor(1 + Math.random() * 254)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(1 + Math.random() * 254)}`,
    userAgent: randomItem([
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Mozilla/5.0 (Linux; Android 13)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    ]),
  };
}

export class FormConnector extends BaseConnector {
  type: ConnectorType = 'form';

  async fetchData(_config: ConnectorConfig): Promise<ConnectorResult> {
    await this.simulateLatency(150, 500);
    this.lastChecked = new Date();

    if (this.shouldSimulateFailure()) {
      this.healthy = false;
      return {
        success: false,
        data: [],
        error: 'Webhook endpoint unreachable: ECONNREFUSED — form service is not responding on port 8443',
        metadata: {
          fetchedAt: new Date(),
          recordCount: 0,
          source: 'form',
        },
      };
    }

    const count = 3 + Math.floor(Math.random() * 6); // 3-8
    const submissions: RawRecord[] = Array.from({ length: count }, (_, i) => generateSubmission(i));

    this.healthy = true;
    return {
      success: true,
      data: submissions,
      metadata: {
        fetchedAt: new Date(),
        recordCount: submissions.length,
        source: 'form',
      },
    };
  }
}
