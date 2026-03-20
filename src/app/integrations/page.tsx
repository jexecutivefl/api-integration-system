import { prisma } from '@/lib/db';
import { IntegrationsClient } from '@/components/integrations/integrations-client';

export const dynamic = 'force-dynamic';

const typeLabels: Record<string, string> = {
  crm: 'CRM',
  payment: 'Payment',
  form: 'Form / Webhook',
  support: 'Support',
};

const typeIcons: Record<string, string> = {
  crm: 'bg-blue-100 text-blue-600',
  payment: 'bg-green-100 text-green-600',
  form: 'bg-purple-100 text-purple-600',
  support: 'bg-orange-100 text-orange-600',
};

export default async function IntegrationsPage() {
  const integrations = await prisma.integration.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { syncRuns: true, normalizedRecords: true } },
    },
  });

  const serialized = integrations.map((i) => ({
    id: i.id,
    name: i.name,
    type: i.type,
    status: i.status,
    lastSyncAt: i.lastSyncAt?.toISOString() || null,
    syncCount: i._count.syncRuns,
    recordCount: i._count.normalizedRecords,
    typeLabel: typeLabels[i.type] || i.type,
    typeIcon: typeIcons[i.type] || 'bg-gray-100 text-gray-600',
  }));

  return (
    <div className="animate-fade-in">
      <IntegrationsClient integrations={serialized} />
    </div>
  );
}
