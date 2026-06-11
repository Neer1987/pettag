/** PostgREST error when a column/table is missing from the database (migration not applied). */
export function isMissingSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const row = error as { code?: string; message?: string };
  return row.code === 'PGRST204' || Boolean(row.message?.includes('schema cache'));
}

export function getMissingSchemaMessage(error: unknown): string {
  if (isMissingSchemaError(error)) {
    return 'Database schema is out of date. Run supabase/migrations/004_nearby_alerts.sql in the Supabase SQL Editor, then reload the app.';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong talking to Supabase.';
}

export const REQUIRED_MIGRATIONS = [
  '001_initial_schema.sql',
  '002_storage.sql',
  '003_delete_policies.sql',
  '004_nearby_alerts.sql',
] as const;
