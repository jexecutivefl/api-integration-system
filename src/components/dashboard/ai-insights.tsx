'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';

interface Insight {
  type: 'optimization' | 'warning' | 'success';
  message: string;
  metric?: string;
}

const demoInsights: Insight[] = [
  {
    type: 'success',
    message: 'CRM sync frequency could be increased — 98% success rate over the last 7 days',
    metric: '98%',
  },
  {
    type: 'warning',
    message: 'Support connector showing elevated error rate — consider increasing retry attempts',
    metric: '12%',
  },
  {
    type: 'optimization',
    message: '3 workflows haven\'t triggered in 7+ days — review trigger conditions for relevance',
  },
  {
    type: 'optimization',
    message: 'Payment data sync overlaps with peak API hours — shift to off-peak window for 40% faster processing',
    metric: '40%',
  },
];

const typeStyles = {
  optimization: { icon: 'text-blue-500 bg-blue-50', border: 'border-l-blue-500' },
  warning: { icon: 'text-yellow-500 bg-yellow-50', border: 'border-l-yellow-500' },
  success: { icon: 'text-green-500 bg-green-50', border: 'border-l-green-500' },
};

export function AiInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate AI analysis delay for demo effect
    const timer = setTimeout(() => {
      setInsights(demoInsights);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="border-purple-100">
      <CardHeader
        title="AI Insights"
        description="Automated recommendations based on system patterns"
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
            <SparkleIcon className="w-3.5 h-3.5" />
            AI Powered
          </span>
        }
      />
      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
            Analyzing integration patterns...
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-gray-50/50 animate-slide-up opacity-0 ${typeStyles[insight.type].border}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${typeStyles[insight.type].icon}`}>
                {insight.type === 'success' && <CheckIcon className="w-3.5 h-3.5" />}
                {insight.type === 'warning' && <WarningIcon className="w-3.5 h-3.5" />}
                {insight.type === 'optimization' && <LightbulbIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{insight.message}</p>
              </div>
              {insight.metric && (
                <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border whitespace-nowrap">
                  {insight.metric}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}
