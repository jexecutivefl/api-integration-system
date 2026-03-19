import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { WorkflowTriggerConfig, WorkflowAction, WorkflowExecutionResult, TriggerType } from '@/lib/types';
import { evaluateTrigger, type TriggerEvent } from './triggers';
import { getActionExecutor } from './actions';

export async function evaluateWorkflows(event: TriggerEvent, syncRunId?: string): Promise<void> {
  // Fetch all enabled workflow definitions
  const workflows = await prisma.workflowDefinition.findMany({
    where: { enabled: true },
  });

  for (const workflow of workflows) {
    const triggerConfig: WorkflowTriggerConfig = JSON.parse(workflow.triggerConfig);

    if (evaluateTrigger(event, workflow.triggerType as TriggerType, triggerConfig)) {
      await executeWorkflow(workflow.id, event, syncRunId);
    }
  }
}

async function executeWorkflow(
  workflowId: string,
  event: TriggerEvent,
  syncRunId?: string
): Promise<void> {
  const workflow = await prisma.workflowDefinition.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) return;

  // Create execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      syncRunId: syncRunId || null,
      status: 'running',
      startedAt: new Date(),
    },
  });

  await logger.info('workflow', `Executing workflow: ${workflow.name}`, {
    workflowId,
    executionId: execution.id,
    triggerType: event.type,
  });

  const actions: WorkflowAction[] = JSON.parse(workflow.actions);
  const actionResults: WorkflowExecutionResult['actionResults'] = [];
  let allSucceeded = true;

  const context: Record<string, unknown> = {
    workflowId,
    workflowName: workflow.name,
    executionId: execution.id,
    syncRunId,
    integrationId: event.integrationId,
    connectorType: event.connectorType,
    entityType: event.entityType,
    triggerType: event.type,
  };

  for (const action of actions) {
    const executor = getActionExecutor(action.type);
    if (!executor) {
      actionResults.push({
        type: action.type,
        success: false,
        error: `Unknown action type: ${action.type}`,
      });
      allSucceeded = false;
      continue;
    }

    const result = await executor(action.config as Record<string, unknown>, context);
    actionResults.push({ type: action.type, ...result });

    if (!result.success) {
      allSucceeded = false;
      await logger.warn('workflow', `Action failed in workflow ${workflow.name}: ${action.type}`, {
        workflowId,
        executionId: execution.id,
        actionType: action.type,
        error: result.error,
      });
    }
  }

  const executionResult: WorkflowExecutionResult = {
    actionsExecuted: actionResults.length,
    actionResults,
  };

  await prisma.workflowExecution.update({
    where: { id: execution.id },
    data: {
      status: allSucceeded ? 'completed' : 'failed',
      result: JSON.stringify(executionResult),
      completedAt: new Date(),
    },
  });

  await logger.info('workflow', `Workflow ${workflow.name} ${allSucceeded ? 'completed' : 'failed'}`, {
    workflowId,
    executionId: execution.id,
    actionsExecuted: actionResults.length,
    allSucceeded,
  });
}

export async function executeWorkflowManually(workflowId: string): Promise<{
  executionId: string;
  status: string;
  result: WorkflowExecutionResult;
}> {
  const workflow = await prisma.workflowDefinition.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      status: 'running',
      startedAt: new Date(),
    },
  });

  const actions: WorkflowAction[] = JSON.parse(workflow.actions);
  const actionResults: WorkflowExecutionResult['actionResults'] = [];

  const context: Record<string, unknown> = {
    workflowId,
    workflowName: workflow.name,
    executionId: execution.id,
    triggerType: 'manual',
  };

  for (const action of actions) {
    const executor = getActionExecutor(action.type);
    if (!executor) {
      actionResults.push({ type: action.type, success: false, error: 'Unknown action' });
      continue;
    }
    const result = await executor(action.config as Record<string, unknown>, context);
    actionResults.push({ type: action.type, ...result });
  }

  const allSucceeded = actionResults.every((r) => r.success);
  const executionResult: WorkflowExecutionResult = {
    actionsExecuted: actionResults.length,
    actionResults,
  };

  await prisma.workflowExecution.update({
    where: { id: execution.id },
    data: {
      status: allSucceeded ? 'completed' : 'failed',
      result: JSON.stringify(executionResult),
      completedAt: new Date(),
    },
  });

  return {
    executionId: execution.id,
    status: allSucceeded ? 'completed' : 'failed',
    result: executionResult,
  };
}
