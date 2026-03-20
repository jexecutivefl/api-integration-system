import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.retryQueue.deleteMany();
  await prisma.logEntry.deleteMany();
  await prisma.workflowExecution.deleteMany();
  await prisma.workflowDefinition.deleteMany();
  await prisma.normalizedRecord.deleteMany();
  await prisma.syncRun.deleteMany();
  await prisma.integration.deleteMany();

  console.log('Seeding database...');

  // --- Integrations ---
  const crm = await prisma.integration.create({
    data: {
      name: 'Salesforce CRM',
      type: 'crm',
      status: 'active',
      config: JSON.stringify({ apiKey: 'sf_xxx', baseUrl: 'https://api.salesforce-mock.com/v2', syncInterval: '15m' }),
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  });

  const payment = await prisma.integration.create({
    data: {
      name: 'Stripe Payments',
      type: 'payment',
      status: 'active',
      config: JSON.stringify({ apiKey: 'sk_xxx', baseUrl: 'https://api.stripe-mock.com/v1', webhookEnabled: true }),
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 60),
    },
  });

  const form = await prisma.integration.create({
    data: {
      name: 'Typeform Submissions',
      type: 'form',
      status: 'active',
      config: JSON.stringify({ webhookSecret: 'whsec_xxx', formId: 'form_abc123' }),
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 120),
    },
  });

  const support = await prisma.integration.create({
    data: {
      name: 'Zendesk Support',
      type: 'support',
      status: 'error',
      config: JSON.stringify({ apiKey: 'zd_xxx', baseUrl: 'https://api.zendesk-mock.com/v2', subdomain: 'company' }),
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    },
  });

  console.log('  Created 4 integrations');

  // --- Sync Runs ---
  const now = Date.now();

  // CRM - successful sync
  const crmSync1 = await prisma.syncRun.create({
    data: {
      integrationId: crm.id,
      status: 'completed',
      recordsProcessed: 24,
      recordsFailed: 0,
      startedAt: new Date(now - 1000 * 60 * 30),
      completedAt: new Date(now - 1000 * 60 * 29),
    },
  });

  // CRM - older successful sync
  await prisma.syncRun.create({
    data: {
      integrationId: crm.id,
      status: 'completed',
      recordsProcessed: 18,
      recordsFailed: 1,
      startedAt: new Date(now - 1000 * 60 * 60 * 3),
      completedAt: new Date(now - 1000 * 60 * 60 * 3 + 45000),
    },
  });

  // Payment - successful sync
  const paymentSync1 = await prisma.syncRun.create({
    data: {
      integrationId: payment.id,
      status: 'completed',
      recordsProcessed: 156,
      recordsFailed: 0,
      startedAt: new Date(now - 1000 * 60 * 60),
      completedAt: new Date(now - 1000 * 60 * 59),
    },
  });

  // Payment - partial sync
  await prisma.syncRun.create({
    data: {
      integrationId: payment.id,
      status: 'partial',
      recordsProcessed: 89,
      recordsFailed: 12,
      errorMessage: 'Rate limit exceeded after 89 records. Retrying remaining records.',
      startedAt: new Date(now - 1000 * 60 * 60 * 6),
      completedAt: new Date(now - 1000 * 60 * 60 * 6 + 120000),
    },
  });

  // Form - successful
  const formSync1 = await prisma.syncRun.create({
    data: {
      integrationId: form.id,
      status: 'completed',
      recordsProcessed: 8,
      recordsFailed: 0,
      startedAt: new Date(now - 1000 * 60 * 120),
      completedAt: new Date(now - 1000 * 60 * 119),
    },
  });

  // Support - failed
  const supportSync1 = await prisma.syncRun.create({
    data: {
      integrationId: support.id,
      status: 'failed',
      recordsProcessed: 0,
      recordsFailed: 0,
      errorMessage: 'Authentication failed: Invalid API key. Please check your Zendesk credentials.',
      startedAt: new Date(now - 1000 * 60 * 60 * 4),
      completedAt: new Date(now - 1000 * 60 * 60 * 4 + 5000),
    },
  });

  console.log('  Created 6 sync runs');

  // --- Normalized Records ---
  const contacts = [
    { name: 'Alice Johnson', email: 'alice@example.com', company: 'TechCorp', phone: '+1-555-0101' },
    { name: 'Bob Smith', email: 'bob@example.com', company: 'DataFlow Inc', phone: '+1-555-0102' },
    { name: 'Carol Williams', email: 'carol@example.com', company: 'CloudSync Ltd', phone: '+1-555-0103' },
    { name: 'David Brown', email: 'david@acme.com', company: 'Acme Systems', phone: '+1-555-0104' },
    { name: 'Eva Martinez', email: 'eva@startup.io', company: 'StartupIO', phone: '+1-555-0105' },
  ];

  for (let i = 0; i < contacts.length; i++) {
    await prisma.normalizedRecord.create({
      data: {
        integrationId: crm.id,
        syncRunId: crmSync1.id,
        entityType: 'contact',
        externalId: `sf_contact_${1000 + i}`,
        data: JSON.stringify(contacts[i]),
      },
    });
  }

  const transactions = [
    { amount: 299.99, currency: 'USD', customer: 'alice@example.com', status: 'succeeded', description: 'Pro Plan - Monthly' },
    { amount: 49.99, currency: 'USD', customer: 'bob@example.com', status: 'succeeded', description: 'Starter Plan - Monthly' },
    { amount: 599.99, currency: 'USD', customer: 'carol@example.com', status: 'succeeded', description: 'Enterprise Plan - Monthly' },
    { amount: 299.99, currency: 'USD', customer: 'david@acme.com', status: 'refunded', description: 'Pro Plan - Monthly (Refunded)' },
  ];

  for (let i = 0; i < transactions.length; i++) {
    await prisma.normalizedRecord.create({
      data: {
        integrationId: payment.id,
        syncRunId: paymentSync1.id,
        entityType: 'transaction',
        externalId: `txn_${2000 + i}`,
        data: JSON.stringify(transactions[i]),
      },
    });
  }

  const submissions = [
    { formTitle: 'Contact Us', name: 'Frank Lee', email: 'frank@gmail.com', message: 'Interested in enterprise pricing' },
    { formTitle: 'Demo Request', name: 'Grace Park', email: 'grace@company.com', message: 'Would like a demo for our team of 50' },
  ];

  for (let i = 0; i < submissions.length; i++) {
    await prisma.normalizedRecord.create({
      data: {
        integrationId: form.id,
        syncRunId: formSync1.id,
        entityType: 'submission',
        externalId: `sub_${3000 + i}`,
        data: JSON.stringify(submissions[i]),
      },
    });
  }

  console.log('  Created 11 normalized records');

  // --- Workflow Definitions ---
  const wf1 = await prisma.workflowDefinition.create({
    data: {
      name: 'Log Successful Syncs',
      description: 'Create an audit log entry whenever a sync run completes successfully',
      triggerType: 'sync_completed',
      triggerConfig: JSON.stringify({}),
      actions: JSON.stringify([
        { type: 'create_log', config: { level: 'info', message: 'Sync completed successfully' } },
      ]),
      enabled: true,
    },
  });

  const wf2 = await prisma.workflowDefinition.create({
    data: {
      name: 'Alert on Sync Failure',
      description: 'Send a notification and create error log when a sync fails',
      triggerType: 'sync_failed',
      triggerConfig: JSON.stringify({}),
      actions: JSON.stringify([
        { type: 'create_log', config: { level: 'error', message: 'Sync failed - immediate attention required' } },
        { type: 'send_notification', config: { channel: 'email', recipient: 'ops@company.com', subject: 'Sync Failure Alert' } },
      ]),
      enabled: true,
    },
  });

  const wf3 = await prisma.workflowDefinition.create({
    data: {
      name: 'New Contact Processing',
      description: 'When a new CRM contact is synced, create an internal record and log the event',
      triggerType: 'new_record',
      triggerConfig: JSON.stringify({ connectorType: 'crm', entityType: 'contact' }),
      actions: JSON.stringify([
        { type: 'create_log', config: { level: 'info', message: 'New contact synced from CRM' } },
        { type: 'create_record', config: { type: 'internal_contact', copyFields: ['name', 'email', 'company'] } },
      ]),
      enabled: true,
    },
  });

  await prisma.workflowDefinition.create({
    data: {
      name: 'Error Threshold Monitor',
      description: 'Update integration status to error when failure count exceeds threshold',
      triggerType: 'error_threshold',
      triggerConfig: JSON.stringify({ threshold: 5, window: '1h' }),
      actions: JSON.stringify([
        { type: 'update_status', config: { status: 'error' } },
        { type: 'send_notification', config: { channel: 'slack', message: 'Integration error threshold exceeded' } },
      ]),
      enabled: true,
    },
  });

  console.log('  Created 4 workflow definitions');

  // --- Workflow Executions ---
  await prisma.workflowExecution.create({
    data: {
      workflowId: wf1.id,
      syncRunId: crmSync1.id,
      status: 'completed',
      result: JSON.stringify({ actionsExecuted: 1, actionResults: [{ type: 'create_log', success: true }] }),
      startedAt: new Date(now - 1000 * 60 * 29),
      completedAt: new Date(now - 1000 * 60 * 29 + 200),
    },
  });

  await prisma.workflowExecution.create({
    data: {
      workflowId: wf1.id,
      syncRunId: paymentSync1.id,
      status: 'completed',
      result: JSON.stringify({ actionsExecuted: 1, actionResults: [{ type: 'create_log', success: true }] }),
      startedAt: new Date(now - 1000 * 60 * 59),
      completedAt: new Date(now - 1000 * 60 * 59 + 150),
    },
  });

  await prisma.workflowExecution.create({
    data: {
      workflowId: wf2.id,
      syncRunId: supportSync1.id,
      status: 'completed',
      result: JSON.stringify({
        actionsExecuted: 2,
        actionResults: [
          { type: 'create_log', success: true },
          { type: 'send_notification', success: true },
        ],
      }),
      startedAt: new Date(now - 1000 * 60 * 60 * 4 + 6000),
      completedAt: new Date(now - 1000 * 60 * 60 * 4 + 6500),
    },
  });

  await prisma.workflowExecution.create({
    data: {
      workflowId: wf3.id,
      syncRunId: crmSync1.id,
      status: 'completed',
      result: JSON.stringify({
        actionsExecuted: 2,
        actionResults: [
          { type: 'create_log', success: true },
          { type: 'create_record', success: true },
        ],
      }),
      startedAt: new Date(now - 1000 * 60 * 29 + 300),
      completedAt: new Date(now - 1000 * 60 * 29 + 800),
    },
  });

  console.log('  Created 4 workflow executions');

  // --- Log Entries ---
  const logEntries = [
    { level: 'info', source: 'system', message: 'API Integration System started', metadata: JSON.stringify({ version: '1.0.0' }) },
    { level: 'info', source: 'connector', message: 'Salesforce CRM connector initialized', metadata: JSON.stringify({ type: 'crm' }) },
    { level: 'info', source: 'connector', message: 'Stripe Payments connector initialized', metadata: JSON.stringify({ type: 'payment' }) },
    { level: 'info', source: 'connector', message: 'Typeform connector initialized', metadata: JSON.stringify({ type: 'form' }) },
    { level: 'info', source: 'connector', message: 'Zendesk Support connector initialized', metadata: JSON.stringify({ type: 'support' }) },
    { level: 'info', source: 'pipeline', message: 'CRM sync started - fetching contacts', metadata: JSON.stringify({ integrationId: crm.id }) },
    { level: 'info', source: 'pipeline', message: 'CRM sync completed: 24 records processed', metadata: JSON.stringify({ integrationId: crm.id, recordsProcessed: 24 }) },
    { level: 'info', source: 'workflow', message: 'Workflow "Log Successful Syncs" triggered for CRM sync', metadata: JSON.stringify({ workflowId: wf1.id }) },
    { level: 'info', source: 'pipeline', message: 'Payment sync started - fetching transactions', metadata: JSON.stringify({ integrationId: payment.id }) },
    { level: 'info', source: 'pipeline', message: 'Payment sync completed: 156 records processed', metadata: JSON.stringify({ integrationId: payment.id, recordsProcessed: 156 }) },
    { level: 'info', source: 'workflow', message: 'Workflow "New Contact Processing" executed for 5 new contacts', metadata: JSON.stringify({ workflowId: wf3.id, contactCount: 5 }) },
    { level: 'warn', source: 'pipeline', message: 'Payment sync rate limited - partial results returned', metadata: JSON.stringify({ integrationId: payment.id, processed: 89, failed: 12 }) },
    { level: 'error', source: 'connector', message: 'Zendesk authentication failed: Invalid API key', metadata: JSON.stringify({ integrationId: support.id, error: 'AUTH_FAILED' }) },
    { level: 'error', source: 'pipeline', message: 'Support sync failed: Unable to authenticate', metadata: JSON.stringify({ integrationId: support.id }) },
    { level: 'info', source: 'workflow', message: 'Workflow "Alert on Sync Failure" triggered for Zendesk failure', metadata: JSON.stringify({ workflowId: wf2.id }) },
    { level: 'info', source: 'retry', message: 'Added Zendesk sync to retry queue (attempt 1/3)', metadata: JSON.stringify({ entityType: 'sync_run', retryAt: new Date(now + 30000).toISOString() }) },
    { level: 'info', source: 'pipeline', message: 'Form sync completed: 8 submissions processed', metadata: JSON.stringify({ integrationId: form.id }) },
    { level: 'debug', source: 'system', message: 'Retry queue processor ran - 1 pending items', metadata: JSON.stringify({ pending: 1 }) },
  ];

  for (let i = 0; i < logEntries.length; i++) {
    await prisma.logEntry.create({
      data: {
        ...logEntries[i],
        timestamp: new Date(now - 1000 * 60 * 60 * 5 + i * 1000 * 60 * 15),
      },
    });
  }

  console.log(`  Created ${logEntries.length} log entries`);

  // --- Retry Queue ---
  await prisma.retryQueue.create({
    data: {
      entityType: 'sync_run',
      entityId: supportSync1.id,
      action: 'Re-sync Zendesk Support integration',
      attempts: 1,
      maxAttempts: 3,
      nextRetryAt: new Date(now + 1000 * 60 * 2),
      lastError: 'Authentication failed: Invalid API key',
      status: 'pending',
    },
  });

  console.log('  Created 1 retry queue item');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
