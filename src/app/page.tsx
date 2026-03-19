import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';

async function getStats() {
  const [
    totalIntegrations,
    activeIntegrations,
    totalSyncRuns,
    successfulSyncs,
    failedSyncs,
    totalRecords,
    totalWorkflows,
    pendingRetries,
    recentLogs,
  ] = await Promise.all([
    prisma.integration.count(),
    prisma.integration.count({ where: { status: 'active' } }),
    prisma.syncRun.count(),
    prisma.syncRun.count({ where: { status: 'completed' } }),
    prisma.syncRun.count({ where: { status: 'failed' } }),
    prisma.normalizedRecord.count(),
    prisma.workflowDefinition.count({ where: { enabled: true } }),
    prisma.retryQueue.count({ where: { status: 'pending' } }),
    prisma.logEntry.findMany({ take: 10, orderBy: { timestamp: 'desc' } }),
  ]);

  const recentSyncs = await prisma.syncRun.findMany({
    take: 5,
    orderBy: { startedAt: 'desc' },
    include: { integration: { select: { name: true, type: true } } },
  });

  return {
    totalIntegrations,
    activeIntegrations,
    totalSyncRuns,
    successfulSyncs,
    failedSyncs,
    totalRecords,
    totalWorkflows,
    pendingRetries,
    recentLogs,
    recentSyncs,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();
  const successRate = stats.totalSyncRuns > 0
    ? Math.round((stats.successfulSyncs / stats.totalSyncRuns) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Monitor your API integrations, sync status, and workflow automations"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Active Integrations" value={`${stats.activeIntegrations}/${stats.totalIntegrations}`} color="blue" />
        <StatCard label="Sync Success Rate" value={`${successRate}%`} color="green" />
        <StatCard label="Records Synced" value={stats.totalRecords.toLocaleString()} color="purple" />
        <StatCard label="Pending Retries" value={String(stats.pendingRetries)} color={stats.pendingRetries > 0 ? 'yellow' : 'gray'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sync Runs */}
        <Card>
          <CardHeader title="Recent Sync Runs" action={<Link href="/sync-history" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>} />
          {stats.recentSyncs.length === 0 ? (
            <p className="text-sm text-gray-500">No sync runs yet. Trigger a sync from the Integrations page.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSyncs.map((run) => (
                <div key={run.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{run.integration.name}</p>
                    <p className="text-xs text-gray-500">{new Date(run.startedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{run.recordsProcessed} records</span>
                    <StatusBadge status={run.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader title="Recent Activity" action={<Link href="/logs" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>} />
          {stats.recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <LogLevelDot level={log.level} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{log.message}</p>
                    <p className="text-xs text-gray-500">{log.source} &middot; {new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    gray: 'bg-gray-50 border-gray-200',
  };

  const textColors: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    yellow: 'text-yellow-700',
    gray: 'text-gray-700',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorStyles[color] || colorStyles.gray}`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${textColors[color] || textColors.gray}`}>{value}</p>
    </div>
  );
}

function LogLevelDot({ level }: { level: string }) {
  const colors: Record<string, string> = {
    debug: 'bg-gray-400',
    info: 'bg-blue-400',
    warn: 'bg-yellow-400',
    error: 'bg-red-400',
  };
  return <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors[level] || colors.info}`} />;
}
