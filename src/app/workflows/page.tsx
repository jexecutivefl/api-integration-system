import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatusBadge, Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const triggerLabels: Record<string, string> = {
  sync_completed: 'On Sync Complete',
  sync_failed: 'On Sync Failed',
  new_record: 'On New Record',
  error_threshold: 'On Error Threshold',
};

export default async function WorkflowsPage() {
  const workflows = await prisma.workflowDefinition.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { executions: true } },
      executions: {
        take: 5,
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  const totalExecutions = await prisma.workflowExecution.count();
  const successfulExecutions = await prisma.workflowExecution.count({ where: { status: 'completed' } });
  const failedExecutions = await prisma.workflowExecution.count({ where: { status: 'failed' } });

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Automation rules triggered by integration events"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Total Executions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalExecutions}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Successful</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{successfulExecutions}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{failedExecutions}</p>
        </Card>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No workflows configured yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Link key={workflow.id} href={`/workflows/${workflow.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-4">
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
                      <span>{workflow._count.executions} executions</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {workflow.executions.slice(0, 3).map((exec) => (
                      <StatusBadge key={exec.id} status={exec.status} />
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
