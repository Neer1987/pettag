import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { isMissingSchemaError } from '@/lib/supabase/errors';

export async function verifyDatabaseSchema(): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const supabase = getSupabase();

    const ownersCheck = await supabase
      .from('owners')
      .select('latitude, longitude, push_token, alerts_enabled')
      .limit(1);

    if (isMissingSchemaError(ownersCheck.error)) return false;

    const petsCheck = await supabase.from('pets').select('lost_latitude, lost_longitude').limit(1);

    if (isMissingSchemaError(petsCheck.error)) return false;

    const alertsCheck = await supabase.from('alert_notifications').select('id').limit(1);

    if (isMissingSchemaError(alertsCheck.error)) return false;

    return true;
  } catch {
    return false;
  }
}
