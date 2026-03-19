import { prisma } from './db';
import type { LogLevel } from './types';

export async function log(
  level: LogLevel,
  source: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.logEntry.create({
      data: {
        level,
        source,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Fallback to console if DB logging fails
    console.error(`[Logger Error] Failed to persist log:`, error);
    console.log(`[${level.toUpperCase()}] [${source}] ${message}`);
  }
}

export const logger = {
  debug: (source: string, message: string, metadata?: Record<string, unknown>) =>
    log('debug', source, message, metadata),
  info: (source: string, message: string, metadata?: Record<string, unknown>) =>
    log('info', source, message, metadata),
  warn: (source: string, message: string, metadata?: Record<string, unknown>) =>
    log('warn', source, message, metadata),
  error: (source: string, message: string, metadata?: Record<string, unknown>) =>
    log('error', source, message, metadata),
};
