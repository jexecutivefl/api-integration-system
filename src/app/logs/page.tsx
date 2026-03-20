'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import type { LogEntry, ApiResponse } from '@/lib/types';

const levels = ['all', 'debug', 'info', 'warn', 'error'] as const;
const sources = ['all', 'connector', 'pipeline', 'workflow', 'system', 'retry'] as const;

const levelColors: Record<string, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
  debug: 'default',
  info: 'info',
  warn: 'warning',
  error: 'error',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [level, setLevel] = useState<string>('all');
  const [source, setSource] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (level !== 'all') params.set('level', level);
    if (source !== 'all') params.set('source', source);
    params.set('pageSize', '50');
    const res = await fetch(`/api/logs?${params}`);
    const data: ApiResponse<LogEntry[]> = await res.json();
    if (data.data) setLogs(data.data);
    setLoading(false);
  }, [level, source]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Logs"
        description="Structured log viewer with filtering"
        action={<Button variant="secondary" size="sm" onClick={fetchLogs}>Refresh</Button>}
      />

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Level:</span>
          <div className="flex gap-1">
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  level === l ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Source:</span>
          <div className="flex gap-1">
            {sources.map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  source === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={8} columns={4} />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No logs found"
              description={level !== 'all' || source !== 'all' ? 'Try adjusting your filters.' : 'Logs will appear here as the system runs.'}
              icon={
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, i) => (
              <div
                key={log.id}
                className={`px-6 py-3 hover:bg-gray-50 transition-colors border-l-2 ${
                  log.level === 'error' ? 'border-l-red-400' :
                  log.level === 'warn' ? 'border-l-yellow-400' :
                  log.level === 'info' ? 'border-l-blue-400' :
                  'border-l-gray-200'
                } animate-slide-up opacity-0`}
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-xs text-gray-400 font-mono whitespace-nowrap mt-0.5">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <Badge variant={levelColors[log.level] || 'default'}>{log.level.toUpperCase()}</Badge>
                  <Badge variant="default">{log.source}</Badge>
                  <span className="text-sm text-gray-900 flex-1">{log.message}</span>
                </div>
                {log.metadata && (
                  <pre className="mt-2 ml-44 text-xs text-gray-500 bg-gray-50 rounded p-2 overflow-auto">
                    {(() => { try { return JSON.stringify(JSON.parse(log.metadata), null, 2); } catch { return log.metadata; } })()}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
