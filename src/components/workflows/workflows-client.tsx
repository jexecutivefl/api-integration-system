'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState } from '@/components/ui/empty-state';

const triggerLabels: Record<string, string> = {
  sync_completed: 'On Sync Complete',
  sync_failed: 'On Sync Failed',
  new_record: 'On New Record',
  error_threshold: 'On Error Threshold',
};

interface WorkflowItem {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  enabled: boolean;
  executionCount: number;
  recentExecutions: { id: string; status: string }[];
}

interface WorkflowStats {
  total: number;
  successful: number;
  failed: number;
}

export function WorkflowsClient({ workflows, stats }: { workflows: WorkflowItem[]; stats: WorkflowStats }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Disabled'>('All');

  const filtered = workflows.filter((w) => {
    const matchesSearch = !search || w.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && w.enabled) ||
      (statusFilter === 'Disabled' && !w.enabled);
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PageHeader
        title="Workflows"
        description="Automation rules triggered by integration events"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-stagger">
        <Card className="animate-slide-up opacity-0">
          <p className="text-sm text-gray-500">Total Executions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </Card>
        <Card className="animate-slide-up opacity-0">
          <p className="text-sm text-gray-500">Successful</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.successful}</p>
        </Card>
        <Card className="animate-slide-up opacity-0">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search workflows..." />
        </div>
        <div className="flex gap-1">
          {(['All', 'Active', 'Disabled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        workflows.length === 0 ? (
          <EmptyState
            title="No workflows configured"
            description="Create automation rules to respond to integration events automatically."
          />
        ) : (
          <EmptyState
            title="No matching workflows"
            description="Try adjusting your search or filters."
          />
        )
      ) : (
        <div className="space-y-4 animate-stagger">
          {filtered.map((workflow) => (
            <Link key={workflow.id} href={`/workflows/${workflow.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-4 animate-slide-up opacity-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      <Badge variant={workflow.enabled ? 'success' : 'default'}>
                        {workflow.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>Trigger: {triggerLabels[workflow.triggerType] || workflow.triggerType}</span>
                      <span>{workflow.executionCount} executions</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {workflow.recentExecutions.slice(0, 3).map((exec) => (
                      <StatusBadge key={exec.id} status={exec.status} />
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
