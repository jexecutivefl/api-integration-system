'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { Integration, SyncRun, ApiResponse } from '@/lib/types';

export default function IntegrationDetailPage() {
  const params = useParams();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [intRes, syncRes] = await Promise.all([
      fetch(`/api/integrations/${params.id}`),
      fetch(`/api/sync-runs?integrationId=${params.id}`),
    ]);
    const intData: ApiResponse<Integration> = await intRes.json();
    const syncData: ApiResponse<SyncRun[]> = await syncRes.json();
    if (intData.data) setIntegration(intData.data);
    if (syncData.data) setSyncRuns(syncData.data);
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function triggerSync() {
    setSyncing(true);
    try {
      await fetch(`/api/integrations/${params.id}/sync`, { method: 'POST' });
      await fetchData();
    } finally {
      setSyncing(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/${params.id}/test`, { method: 'POST' });
      const data: ApiResponse<{ connected: boolean }> = await res.json();
      setTestResult(data.data?.connected ? 'Connection successful' : 'Connection failed');
    } catch {
      setTestResult('Connection test error');
    } finally {
      setTesting(false);
    }
  }

  if (!integration) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  const config = (() => { try { return JSON.parse(integration.config); } catch { return {}; } })();

  return (
    <div>
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

      {testResult && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${testResult.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {testResult}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Status</p>
          <div className="mt-2"><StatusBadge status={integration.status} /></div>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Last Sync</p>
          <p className="mt-2 text-lg font-semibold">
            {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
          </p>
        </Card>
        <Card>
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
