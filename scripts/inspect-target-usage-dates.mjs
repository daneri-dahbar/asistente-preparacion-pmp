import PocketBase from 'pocketbase';
import fs from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve('.env.local'));

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const TARGET_EMAILS = ['carlosacostap@tecno.unca.edu.ar', 'educlerici@gmail.com'];
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

await authAsAdmin();

for (const email of TARGET_EMAILS) {
  const user = await pb.collection('users').getFirstListItem(`email="${email}"`, { requestKey: null });
  console.log(`\n${email}`);
  await inspect('chats', `user="${user.id}"`, ['last_active']);
  await inspect('messages', `user="${user.id}"`, ['generated_at', 'created', 'updated']);
  await inspect('simulations', `user="${user.id}"`, ['started_at', 'completed_at']);
  await inspect('user_research_sessions', `user="${user.id}"`, ['session_date']);
}

async function inspect(collection, filter, fields) {
  const records = await pb.collection(collection).getFullList({ filter, requestKey: null }).catch(() => []);
  const values = [];
  for (const record of records) {
    for (const field of fields) {
      if (record[field]) values.push({ id: record.id, field, value: record[field] });
    }
  }
  values.sort((a, b) => new Date(a.value) - new Date(b.value));
  console.log(collection, {
    count: records.length,
    first: values[0] || null,
    last: values[values.length - 1] || null,
    december: values.filter((item) => item.value.startsWith('2025-12')).length,
    february: values.filter((item) => item.value.startsWith('2026-02')).length,
  });
}

async function authAsAdmin() {
  if (pb.admins?.authWithPassword) {
    try {
      await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
      return;
    } catch (error) {
      if (error?.status !== 404) throw error;
    }
  }

  await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
