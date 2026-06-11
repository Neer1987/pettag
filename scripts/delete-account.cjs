/**
 * Delete a PetTag account via Supabase API (includes storage).
 * Usage: node scripts/delete-account.cjs your@email.com
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'pet-media';

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env — set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function deleteOwnerStorage(supabase, ownerId) {
  const paths = [];
  const { data: petFolders, error: listError } = await supabase.storage.from(BUCKET).list(ownerId, {
    limit: 1000,
  });
  if (listError) throw listError;

  for (const folder of petFolders ?? []) {
    const folderPath = `${ownerId}/${folder.name}`;
    const { data: files, error: filesError } = await supabase.storage.from(BUCKET).list(folderPath, {
      limit: 1000,
    });
    if (filesError) throw filesError;
    for (const file of files ?? []) {
      paths.push(`${folderPath}/${file.name}`);
    }
  }

  if (paths.length === 0) return 0;

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
  if (removeError) throw removeError;
  return paths.length;
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: node scripts/delete-account.cjs your@email.com');
    process.exit(1);
  }

  const env = loadEnv();
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY required in .env');
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .select('id, email, full_name')
    .eq('email', email)
    .maybeSingle();

  if (ownerError) throw ownerError;
  if (!owner) {
    console.log(`No owner found for ${email}`);
    process.exit(0);
  }

  console.log(`Deleting account: ${owner.full_name} (${owner.email})`);

  const fileCount = await deleteOwnerStorage(supabase, owner.id);
  console.log(`Removed ${fileCount} storage file(s)`);

  const { error: msgError } = await supabase.from('messages').delete().eq('recipient_email', email);
  if (msgError) throw msgError;

  const { error: otpError } = await supabase.from('otp_codes').delete().eq('email', email);
  if (otpError) throw otpError;

  const { error: deleteError } = await supabase.from('owners').delete().eq('id', owner.id);
  if (deleteError) throw deleteError;

  console.log('Done — owner, pets, messages, OTP codes, and media deleted.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
