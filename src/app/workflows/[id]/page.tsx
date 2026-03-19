'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { WorkflowDefinition, WorkflowExecution, ApiResponse } from '@/lib/types';

const triggerLabels: Record<string, string> = {
  sync_completed: 'On Sync Complete',
  sync_failed: 'On Sync Failed',
  new_record: 'On New Record',
  error_threshold: 'On Error Threshold',
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [executing, setExecuting] = useState(false);

  const fetchData = useCallback(async () => {
    const [wfRes, execRes] = await Promise.all([
      fetch(`/api/workflows/${params.id}`),
      fetch(`/api/workflow-executions?workflowId=${params.id}`),
    ]);
    const wfData: ApiResponse<WorkflowDefinition> = await wfRes.json();
    const execData: ApiResponse<WorkflowExecution[]> = await execRes.json();
    if (wfData.data) setWorkflow(wfData.data);
    if (execData.data) setExecutions(execData.data);
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function manualExecute() {
    setExecuting(true);
    try {
      await fetch(`/api/workflows/${params.id}/execute`, { method: 'POST' });
      await fetchData();
    } finally {
      setExecuting(false);
    }
  }

  if (!workflow) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  const actions = (() => { try { return JSON.parse(workflow.actions); } catch { return []; } })();
  const triggerConfig = (() => { try { return JSON.parse(workflow.triggerConfig); } catch { return {}; } })();

  return (
    <div>
      <PageHeader
        title={workflow.name}
        description={workflow.description}
        action={
          <Button onClick={manualExecute} loading={executing} size="sm">
            Execute Manually
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Status</p>
          <div className="mt-2">
            <Badge variant={workflow.enabled ? 'success' : 'default'} size="md">
              {workflow.enabled ? 'Active' : 'Disabled'}
            </Badge>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Trigger</p>
          <p className="mt-2 text-lg font-semibold">{triggerLabels[workflow.triggerType] || workflow.triggerType}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Executions</p>
          <p className="mt-2 text-lg font-semibold">{executions.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="Trigger Configuration" />
          <pre className="text-sm bg-gray-50 rounded-lg p-4 overflow-auto">
            {JSON.stringify(triggerConfig, null, 2)}
          </pre>
        </Card>
        <Card>
          <CardHeader title="Actions" />
          <div className="space-y-3">
            {actions.map((action: { type: string; config: Record<string, unknown> }, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{action.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">{JSON.stringify(action.config)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-6 pb-0">
          <CardHeader title="Execution History" />
        </div>
        <DataTable
          keyField="id"
          columns={[
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as Record<string, unknown>).status as string} /> },
            { key: 'startedAt', header: 'Started', render: (r) => <span className="text-sm">{new Date((r as Record<string, unknown>).startedAt as string).toLocaleString()}</span> },
            { key: 'completedAt', header: 'Completed', render: (r) => {
              const val = (r as Record<string, unknown>).completedAt;
              return <span className="text-sm">{val ? new Date(val as string).toLocaleString() : '—'}</span>;
            }},
            { key: 'result', header: 'Result', render: (r) => {
              const result = (r as Record<string, unknown>).result as string;
              try {
                const parsed = JSON.parse(result);
                return <span className="text-sm text-gray-600">{parsed.actionsExecuted || 0} actions</span>;
              } catch { return <span className="text-sm text-gray-400">—</span>; }
            }},
          ]}
          data={executions as unknown as Record<string, unknown>[]}
          emptyMessage="No executions yet"
        />
      </Card>
    </div>
  );
}
