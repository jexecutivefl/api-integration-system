'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <div>
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
          <div className="p-12 text-center text-gray-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No logs found matching filters.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
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
