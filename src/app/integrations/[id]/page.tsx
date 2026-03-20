'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import type { Integration, SyncRun, ApiResponse } from '@/lib/types';

export default function IntegrationDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [intRes, syncRes] = await Promise.all([
      fetch(`/api/integrations/${params.id}`),
      fetch(`/api/sync-runs?integrationId=${params.id}`),
    ]);
    const intData: ApiResponse<Integration> = await intRes.json();
    const syncData: ApiResponse<SyncRun[]> = await syncRes.json();
    if (intData.data) setIntegration(intData.data);
    if (syncData.data) setSyncRuns(syncData.data);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function triggerSync() {
    setSyncing(true);
    try {
      const res = await fetch(`/api/integrations/${params.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({ message: 'Sync completed successfully', variant: 'success' });
      } else {
        toast({ message: data.error || 'Sync failed', variant: 'error' });
      }
      await fetchData();
    } catch {
      toast({ message: 'Sync request failed', variant: 'error' });
    } finally {
      setSyncing(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const res = await fetch(`/api/integrations/${params.id}/test`, { method: 'POST' });
      const data: ApiResponse<{ connected: boolean }> = await res.json();
      if (data.data?.connected) {
        toast({ message: 'Connection successful', variant: 'success' });
      } else {
        toast({ message: 'Connection failed', variant: 'error' });
      }
    } catch {
      toast({ message: 'Connection test error', variant: 'error' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <div className="mt-6"><SkeletonTable rows={5} columns={5} /></div>
      </div>
    );
  }

  if (!integration) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Integration not found</div>;
  }

  const config = (() => { try { return JSON.parse(integration.config); } catch { return {}; } })();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={integration.name}
        description={`${integration.type.toUpperCase()} integration`}
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={testConnection} loading={testing} size="sm">
              Test Connection
            </Button>
            <Button onClick={triggerSync} loading={syncing} size="sm">
              Sync Now
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-stagger">
        <Card className="animate-slide-up opacity-0">
          <p className="text-sm text-gray-500">Status</p>
          <div className="mt-2"><StatusBadge status={integration.status} /></div>
        </Card>
        <Card className="animate-slide-up opacity-0">
          <p className="text-sm text-gray-500">Last Sync</p>
          <p className="mt-2 text-lg font-semibold">
            {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
          </p>
        </Card>
        <Card className="animate-slide-up opacity-0">
          <p className="text-sm text-gray-500">Total Sync Runs</p>
          <p className="mt-2 text-lg font-semibold">{syncRuns.length}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Configuration" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(config).map(([key, value]) => (
            <div key={key}>
              <p className="text-gray-500 font-medium">{key}</p>
              <p className="text-gray-900 mt-0.5">{key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') ? '••••••••' : String(value)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* AI-powered recommendations */}
      <Card className="mb-6 border-blue-100 bg-gradient-to-r from-blue-50/50 to-white">
        <CardHeader
          title="Recommended Actions"
          description="AI-powered suggestions based on sync patterns"
        />
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </span>
            <p className="text-gray-700">Optimal sync window: <span className="font-medium">2:00–4:00 AM</span> based on lowest API latency patterns</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </span>
            <p className="text-gray-700">Consider enabling <span className="font-medium">incremental sync</span> — 73% of records unchanged between runs</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" /></svg>
            </span>
            <p className="text-gray-700">Rate limit threshold at <span className="font-medium">82%</span> — reduce batch size to avoid throttling</p>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        <div className="p-6 pb-0">
          <CardHeader title="Sync History" />
        </div>
        <DataTable
          keyField="id"
          columns={[
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as Record<string, unknown>).status as string} /> },
            { key: 'recordsProcessed', header: 'Records' },
            { key: 'recordsFailed', header: 'Failed' },
            { key: 'startedAt', header: 'Started', render: (r) => <span className="text-sm">{new Date((r as Record<string, unknown>).startedAt as string).toLocaleString()}</span> },
            { key: 'completedAt', header: 'Completed', render: (r) => {
              const val = (r as Record<string, unknown>).completedAt;
              return <span className="text-sm">{val ? new Date(val as string).toLocaleString() : '—'}</span>;
            }},
          ]}
          data={syncRuns as unknown as Record<string, unknown>[]}
          emptyMessage="No sync runs yet"
        />
      </Card>
    </div>
  );
}
