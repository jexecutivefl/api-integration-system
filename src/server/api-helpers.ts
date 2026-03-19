import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/lib/types';

export function successResponse<T>(data: T, meta?: ApiResponse['meta']): NextResponse {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body);
}

export function errorResponse(message: string, status: number = 500): NextResponse {
  const body: ApiResponse = { success: false, error: message };
  return NextResponse.json(body, { status });
}

export function withErrorHandler(
  handler: (req: Request, context?: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: Request, context?: { params: Record<string, string> }) => {
    try {
      return await handler(req, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      console.error(`[API Error] ${req.method} ${req.url}:`, error);
      return errorResponse(message, 500);
    }
  };
}

export function parseSearchParams(url: string) {
  const { searchParams } = new URL(url);
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    pageSize: Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))),
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    type: searchParams.get('type') || undefined,
    level: searchParams.get('level') || undefined,
    source: searchParams.get('source') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
  };
}
