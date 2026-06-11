import { getMissingSchemaMessage, isMissingSchemaError } from '@/lib/supabase/errors';

export type AppErrorKind = 'network' | 'schema' | 'auth' | 'validation' | 'unknown';

export type ParsedAppError = {
  kind: AppErrorKind;
  message: string;
  raw: unknown;
};

const NETWORK_PATTERNS = [
  /network request failed/i,
  /failed to fetch/i,
  /network error/i,
  /internet connection appears to be offline/i,
  /timeout/i,
  /aborted/i,
];

function messageFromUnknown(error: unknown): string | null {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  return null;
}

export function isNetworkError(error: unknown): boolean {
  const message = messageFromUnknown(error);
  if (!message) return false;
  return NETWORK_PATTERNS.some((pattern) => pattern.test(message));
}

export function parseAppError(error: unknown, fallback = 'Something went wrong. Please try again.'): ParsedAppError {
  if (isMissingSchemaError(error)) {
    return {
      kind: 'schema',
      message: getMissingSchemaMessage(error),
      raw: error,
    };
  }

  const message = messageFromUnknown(error);

  if (message && isNetworkError(error)) {
    return {
      kind: 'network',
      message: 'Network connection failed. Check your internet and try again.',
      raw: error,
    };
  }

  if (message) {
    return { kind: 'unknown', message, raw: error };
  }

  return { kind: 'unknown', message: fallback, raw: error };
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return parseAppError(error, fallback).message;
}

export function logAppError(scope: string, error: unknown) {
  const parsed = parseAppError(error);
  console.error(`[${scope}]`, parsed.message, parsed.raw);
}

/** Wrap async work and rethrow with a user-friendly message when fetch fails offline. */
export async function withAppError<T>(
  scope: string,
  work: () => Promise<T>,
  fallback = 'Something went wrong. Please try again.',
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    logAppError(scope, error);
    throw new Error(getErrorMessage(error, fallback));
  }
}
