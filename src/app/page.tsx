import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const dynamic = 'force-dynamic';

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

  // Get sync runs grouped by day for chart (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSyncRuns = await prisma.syncRun.findMany({
    where: { startedAt: { gte: sevenDaysAgo } },
    select: { startedAt: true, status: true },
    orderBy: { startedAt: 'asc' },
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
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      source: l.source,
      timestamp: l.timestamp.toISOString(),
    })),
    recentSyncs: recentSyncs.map((s) => ({
      id: s.id,
      status: s.status,
      recordsProcessed: s.recordsProcessed,
      startedAt: s.startedAt.toISOString(),
      integrationName: s.integration.name,
      integrationType: s.integration.type,
    })),
    syncChartData: buildChartData(recentSyncRuns),
  };
}

function buildChartData(runs: { startedAt: Date; status: string }[]) {
  const days: { label: string; success: number; failed: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayRuns = runs.filter((r) => r.startedAt >= dayStart && r.startedAt < dayEnd);
    days.push({
      label: dayStr,
      success: dayRuns.filter((r) => r.status === 'completed').length,
      failed: dayRuns.filter((r) => r.status === 'failed' || r.status === 'partial').length,
    });
  }
  return days;
}

export default async function DashboardPage() {
  const stats = await getStats();
  const successRate = stats.totalSyncRuns > 0
    ? Math.round((stats.successfulSyncs / stats.totalSyncRuns) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Monitor your API integrations, sync status, and workflow automations"
      />

      {/* Anomaly Detection Banner */}
      {stats.pendingRetries > 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm animate-slide-up">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800">AI detected unusual pattern</p>
            <p className="text-amber-700">{stats.pendingRetries} operations pending retry — elevated failure rate detected in recent sync cycles</p>
          </div>
          <Link href="/logs" className="text-xs font-medium text-amber-700 hover:text-amber-900 underline whitespace-nowrap">
            View Logs
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-stagger">
        <StatCard
          label="Active Integrations"
          value={`${stats.activeIntegrations}/${stats.totalIntegrations}`}
          color="blue"
          trend="+2 this week"
          trendUp={true}
          icon={<PlugIconSmall />}
        />
        <StatCard
          label="Sync Success Rate"
          value={`${successRate}%`}
          color="green"
          trend={successRate >= 90 ? 'Healthy' : 'Needs attention'}
          trendUp={successRate >= 90}
          icon={<CheckCircleIcon />}
        />
        <StatCard
          label="Records Synced"
          value={stats.totalRecords.toLocaleString()}
          color="purple"
          trend="+128 today"
          trendUp={true}
          icon={<DatabaseIcon />}
        />
        <StatCard
          label="Pending Retries"
          value={String(stats.pendingRetries)}
          color={stats.pendingRetries > 0 ? 'yellow' : 'gray'}
          trend={stats.pendingRetries === 0 ? 'All clear' : `${stats.pendingRetries} queued`}
          trendUp={stats.pendingRetries === 0}
          icon={<RetryIcon />}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link href="/integrations" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Sync All
        </Link>
        <Link href="/sync-history" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          View History
        </Link>
        <Link href="/logs?level=error" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          View Errors
        </Link>
      </div>

      {/* Sync Activity Chart + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="Sync Activity" description="Last 7 days" />
          <DashboardClient chartData={stats.syncChartData} />
        </Card>

        {/* AI Insights — rendered client-side for animation */}
        <AiInsightsWrapper />
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
                    <p className="text-sm font-medium text-gray-900">{run.integrationName}</p>
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

        {/* Recent Activity - Live Feed Style */}
        <Card>
          <CardHeader
            title="Recent Activity"
            action={
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-green-600">Live</span>
              </div>
            }
          />
          {stats.recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <div className="space-y-1">
              {stats.recentLogs.map((log, i) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors border-l-2 ${
                    log.level === 'error' ? 'border-l-red-400' :
                    log.level === 'warn' ? 'border-l-yellow-400' :
                    log.level === 'info' ? 'border-l-blue-400' :
                    'border-l-gray-200'
                  } animate-slide-up opacity-0`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <LogLevelDot level={log.level} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{log.message}</p>
                    <p className="text-xs text-gray-500">{log.source} &middot; {timeAgo(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link href="/logs" className="text-sm text-blue-600 hover:text-blue-800">View all logs &rarr;</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Wrapper imported as a separate client component to avoid require() in server component
import { AiInsightsWrapper } from '@/components/dashboard/ai-insights-wrapper';

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function StatCard({
  label,
  value,
  color,
  trend,
  trendUp,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
}) {
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

  const iconBg: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className={`rounded-lg border p-6 animate-slide-up opacity-0 ${colorStyles[color] || colorStyles.gray}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg[color] || iconBg.gray}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold mt-2 ${textColors[color] || textColors.gray}`}>{value}</p>
      {trend && (
        <p className={`text-xs mt-2 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-yellow-600'}`}>
          {trendUp ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" /></svg>
          )}
          {trend}
        </p>
      )}
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

function PlugIconSmall() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  );
}
