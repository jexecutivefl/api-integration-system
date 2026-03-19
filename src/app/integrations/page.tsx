import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';

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

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Manage your API connections and monitor sync status"
      />

      {integrations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No integrations configured yet.</p>
            <p className="text-sm text-gray-400 mt-1">Run the seed script to populate demo data.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <Link key={integration.id} href={`/integrations/${integration.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${typeIcons[integration.type] || 'bg-gray-100 text-gray-600'}`}>
                      {integration.type.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-500">{typeLabels[integration.type] || integration.type}</p>
                    </div>
                  </div>
                  <StatusBadge status={integration.status} />
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                  <span>{integration._count.syncRuns} syncs</span>
                  <span>{integration._count.normalizedRecords} records</span>
                  {integration.lastSyncAt && (
                    <span>Last sync: {new Date(integration.lastSyncAt).toLocaleDateString()}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
