import { prisma } from '@/lib/db';
import { WorkflowsClient } from '@/components/workflows/workflows-client';

export const dynamic = 'force-dynamic';

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

  const serialized = workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    triggerType: w.triggerType,
    enabled: w.enabled,
    executionCount: w._count.executions,
    recentExecutions: w.executions.map((e) => ({
      id: e.id,
      status: e.status,
    })),
  }));

  return (
    <div className="animate-fade-in">
      <WorkflowsClient
        workflows={serialized}
        stats={{ total: totalExecutions, successful: successfulExecutions, failed: failedExecutions }}
      />
    </div>
  );
}
