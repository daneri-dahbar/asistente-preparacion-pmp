import PocketBase from 'pocketbase';
import fs from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve('.env.local'));

const pb = new PocketBase(process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL);
pb.autoCancellation(false);

await authAsAdmin();

for (const email of ['carlosacostap@tecno.unca.edu.ar', 'educlerici@gmail.com']) {
  const user = await pb.collection('users').getFirstListItem(`email="${email}"`, { requestKey: null });
  const sessions = await pb.collection('user_research_sessions').getFullList({
    filter: `user="${user.id}"`,
    sort: 'session_date',
    requestKey: null,
  });
  const simulations180 = await pb.collection('simulations').getFullList({
    filter: `user="${user.id}" && total_questions=180`,
    sort: 'completed_at',
    requestKey: null,
  });

  console.log(JSON.stringify({
    email,
    researchSessions: sessions.map((session) => ({
      tag: session.evidence_tag,
      date: session.session_date,
      type: session.session_type,
      instrument: session.expand?.instrument?.evidence_tag || session.instrument,
      nps: session.nps,
    })),
    simulations180: simulations180.map((simulation) => ({
      type: simulation.type,
      date: simulation.completed_at,
      score: simulation.score,
      total: simulation.total_questions,
      status: simulation.status,
    })),
  }, null, 2));
}

async function authAsAdmin() {
  if (pb.admins?.authWithPassword) {
    try {
      await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
      return;
    } catch (error) {
      if (error?.status !== 404) throw error;
    }
  }

  await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
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
