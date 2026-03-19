-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "config" TEXT NOT NULL DEFAULT '{}',
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "SyncRun_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NormalizedRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "normalizedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NormalizedRecord_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NormalizedRecord_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "SyncRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "triggerType" TEXT NOT NULL,
    "triggerConfig" TEXT NOT NULL DEFAULT '{}',
    "actions" TEXT NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "syncRunId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "result" TEXT NOT NULL DEFAULT '{}',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowExecution_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "SyncRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RetryQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" DATETIME NOT NULL,
    "lastError" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SyncRun_integrationId_idx" ON "SyncRun"("integrationId");

-- CreateIndex
CREATE INDEX "SyncRun_status_idx" ON "SyncRun"("status");

-- CreateIndex
CREATE INDEX "NormalizedRecord_integrationId_idx" ON "NormalizedRecord"("integrationId");

-- CreateIndex
CREATE INDEX "NormalizedRecord_syncRunId_idx" ON "NormalizedRecord"("syncRunId");

-- CreateIndex
CREATE INDEX "NormalizedRecord_entityType_idx" ON "NormalizedRecord"("entityType");

-- CreateIndex
CREATE INDEX "NormalizedRecord_externalId_idx" ON "NormalizedRecord"("externalId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_syncRunId_idx" ON "WorkflowExecution"("syncRunId");

-- CreateIndex
CREATE INDEX "LogEntry_level_idx" ON "LogEntry"("level");

-- CreateIndex
CREATE INDEX "LogEntry_source_idx" ON "LogEntry"("source");

-- CreateIndex
CREATE INDEX "LogEntry_timestamp_idx" ON "LogEntry"("timestamp");

-- CreateIndex
CREATE INDEX "RetryQueue_status_idx" ON "RetryQueue"("status");

-- CreateIndex
CREATE INDEX "RetryQueue_nextRetryAt_idx" ON "RetryQueue"("nextRetryAt");
