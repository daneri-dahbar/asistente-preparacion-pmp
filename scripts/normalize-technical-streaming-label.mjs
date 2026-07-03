import fs from 'node:fs';
import path from 'node:path';
import PocketBase from 'pocketbase';

const TARGET_LABEL = 'Streaming correcto';
const OLD_LABELS = new Set(['Respuesta unica', 'Respuesta única', 'Streaming activo']);

function loadDotEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function shouldNormalize(value) {
  return typeof value === 'string' && (OLD_LABELS.has(value) || value.startsWith('Activo ('));
}

async function authAsSuperuser(pb, email, password) {
  const maybeLegacyAdmin = pb;
  if (maybeLegacyAdmin.admins?.authWithPassword) {
    try {
      await maybeLegacyAdmin.admins.authWithPassword(email, password);
      return;
    } catch {
      // PocketBase newer versions use _superusers.
    }
  }

  await pb.collection('_superusers').authWithPassword(email, password);
}

loadDotEnvLocal();

const pbUrl = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const email = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error('Faltan credenciales PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD o POCKETBASE_ADMIN_EMAIL/POCKETBASE_ADMIN_PASSWORD.');
}

const pb = new PocketBase(pbUrl);
await authAsSuperuser(pb, email, password);

const records = await pb.collection('technical_metric_snapshots').getFullList({
  fields: 'id,streaming_label,metrics',
  requestKey: null,
});

let updated = 0;
let alreadyOk = 0;

for (const record of records) {
  const metrics = record.metrics && typeof record.metrics === 'object' ? structuredClone(record.metrics) : {};
  const currentLabel = record.streaming_label;
  const currentMetricValue = metrics.streaming?.value;
  const needsUpdate = currentLabel !== TARGET_LABEL || currentMetricValue !== TARGET_LABEL;

  if (!needsUpdate) {
    alreadyOk += 1;
    continue;
  }

  if (!metrics.streaming || typeof metrics.streaming !== 'object') {
    metrics.streaming = { value: TARGET_LABEL, status: 'ok' };
  } else if (shouldNormalize(currentMetricValue) || currentMetricValue !== TARGET_LABEL) {
    metrics.streaming = {
      ...metrics.streaming,
      value: TARGET_LABEL,
    };
  }

  await pb.collection('technical_metric_snapshots').update(record.id, {
    streaming_label: TARGET_LABEL,
    metrics,
  }, { requestKey: null });

  updated += 1;
}

console.log(`Registros revisados: ${records.length}`);
console.log(`Registros actualizados: ${updated}`);
console.log(`Registros ya correctos: ${alreadyOk}`);
