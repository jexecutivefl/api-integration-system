'use client';

import { BarChart } from '@/components/ui/mini-chart';

interface ChartData {
  label: string;
  success: number;
  failed: number;
}

export function DashboardClient({ chartData }: { chartData: ChartData[] }) {
  const totalSuccess = chartData.reduce((sum, d) => sum + d.success, 0);
  const totalFailed = chartData.reduce((sum, d) => sum + d.failed, 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
          <span className="text-gray-500">Successful ({totalSuccess})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
          <span className="text-gray-500">Failed ({totalFailed})</span>
        </div>
      </div>
      <BarChart
        data={chartData.map((d) => ({
          label: d.label,
          value: d.success + d.failed,
          color: d.failed > d.success ? 'bg-red-400' : 'bg-blue-500',
        }))}
        height={140}
      />
    </div>
  );
}
