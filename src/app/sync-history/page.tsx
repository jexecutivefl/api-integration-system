import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function SyncHistoryPage() {
  const syncRuns = await prisma.syncRun.findMany({
    take: 50,
    orderBy: { startedAt: 'desc' },
    include: {
      integration: { select: { name: true, type: true } },
      _count: { select: { normalizedRecords: true } },
    },
  });

  const stats = {
    total: syncRuns.length,
    completed: syncRuns.filter((r) => r.status === 'completed').length,
    failed: syncRuns.filter((r) => r.status === 'failed').length,
    partial: syncRuns.filter((r) => r.status === 'partial').length,
  };

  return (
    <div>
      <PageHeader
        title="Sync History"
        description="Timeline of all data synchronization runs"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Total Runs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Partial</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.partial}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-6 pb-0">
          <CardHeader title="Sync Run Timeline" />
        </div>
        {syncRuns.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No sync runs yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {syncRuns.map((run) => {
              const duration = run.completedAt
                ? Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
                : null;

              return (
                <div key={run.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <StatusBadge status={run.status} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{run.integration.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(run.startedAt).toLocaleString()}
                          {duration !== null && ` · ${duration}s`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-gray-900 font-medium">{run.recordsProcessed} processed</p>
                        {run.recordsFailed > 0 && (
                          <p className="text-red-500 text-xs">{run.recordsFailed} failed</p>
                        )}
                      </div>
                      <div className="text-right text-gray-500">
                        {run._count.normalizedRecords} records stored
                      </div>
                    </div>
                  </div>
                  {run.errorMessage && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 rounded p-2">
                      {run.errorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
