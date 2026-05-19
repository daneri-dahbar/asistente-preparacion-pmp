import PocketBase from 'pocketbase';
import fs from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve('.env.local'));

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const TARGET_EMAILS = ['carlosacostap@tecno.unca.edu.ar', 'educlerici@gmail.com'];

const DECEMBER = {
  start: new Date('2025-12-01T15:00:00.000Z'),
  end: new Date('2025-12-31T21:00:00.000Z'),
};

const FEBRUARY = {
  start: new Date('2026-02-01T15:00:00.000Z'),
  end: new Date('2026-02-28T21:00:00.000Z'),
};

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

await authAsAdmin();

for (const email of TARGET_EMAILS) {
  const user = await pb.collection('users').getFirstListItem(`email="${email}"`, { requestKey: null });

  const chats = await pb.collection('chats').getFullList({
    filter: `user="${user.id}"`,
    sort: 'last_active',
    requestKey: null,
  });
  const chatDates = new Map();
  for (const [index, chat] of chats.entries()) {
    const date = spreadDate(index, chats.length, 24);
    chatDates.set(chat.id, date);
    await pb.collection('chats').update(chat.id, {
      last_active: formatPocketBaseDate(date),
    }, { requestKey: null });
  }

  const messages = await pb.collection('messages').getFullList({
    filter: `user="${user.id}"`,
    requestKey: null,
  }).catch(() => []);
  const countersByChat = new Map();
  for (const message of messages) {
    const chatDate = chatDates.get(message.chat);
    if (!chatDate || typeof message.content !== 'string') continue;

    const count = (countersByChat.get(message.chat) || 0) + 1;
    countersByChat.set(message.chat, count);
    const messageDate = addMinutes(chatDate, count * 3);
    const prefix = `[${formatDateOnly(chatDate)} #${count}] `;
    const content = `${prefix}${message.content.replace(/^\[\d{4}-\d{2}-\d{2}\s+#\d+\]\s*/, '')}`;

    await pb.collection('messages').update(message.id, {
      content,
      created: formatPocketBaseDate(messageDate),
      updated: formatPocketBaseDate(messageDate),
    }, { requestKey: null }).catch(async () => {
      await pb.collection('messages').update(message.id, { content }, { requestKey: null });
    });
  }

  const simulations = await pb.collection('simulations').getFullList({
    filter: `user="${user.id}"`,
    sort: 'completed_at',
    requestKey: null,
  });
  for (const [index, simulation] of simulations.entries()) {
    const started = spreadDate(index, simulations.length, Number(simulation.total_questions || 30) >= 120 ? 13 : 18);
    const completed = clampToWindow(addMinutes(started, estimateSimulationDuration(simulation)), index, simulations.length);
    const type = normalizeSimulationType(simulation.type, completed);
    await pb.collection('simulations').update(simulation.id, {
      started_at: formatPocketBaseDate(started),
      completed_at: formatPocketBaseDate(completed),
      type,
    }, { requestKey: null });
  }

  const sessions = await pb.collection('user_research_sessions').getFullList({
    filter: `user="${user.id}"`,
    sort: 'session_date',
    requestKey: null,
  }).catch(() => []);
  for (const [index, session] of sessions.entries()) {
    const date = spreadDate(index, sessions.length, 16);
    await pb.collection('user_research_sessions').update(session.id, {
      session_date: formatPocketBaseDate(date),
    }, { requestKey: null });
  }

  const progress = await pb.collection('user_progress').getFirstListItem(`user="${user.id}"`, { requestKey: null }).catch(() => null);
  if (progress) {
    const stats = { ...(progress.stats || {}) };
    const syntheticUsage = { ...(stats.syntheticUsage || {}) };
    syntheticUsage.periodStart = '2025-12-01';
    syntheticUsage.periodEnd = '2026-02-28';
    if (Array.isArray(syntheticUsage.improvementTrend)) {
      const updatedSimulations = await pb.collection('simulations').getFullList({
        filter: `user="${user.id}"`,
        sort: 'completed_at',
        requestKey: null,
      });
      syntheticUsage.improvementTrend = syntheticUsage.improvementTrend.map((entry, index) => {
        const simulation = updatedSimulations[index] || updatedSimulations[updatedSimulations.length - 1];
        return {
          ...entry,
          date: formatDateOnly(simulation?.completed_at || FEBRUARY.end),
        };
      });
    }
    stats.syntheticUsage = syntheticUsage;
    await pb.collection('user_progress').update(progress.id, { stats }, { requestKey: null });
  }

  console.log(`${email}: fechas redistribuidas entre diciembre de 2025 y febrero de 2026.`);
}

function spreadDate(index, count, preferredHour) {
  const half = Math.ceil(count / 2);
  const window = index < half ? DECEMBER : FEBRUARY;
  const localIndex = index < half ? index : index - half;
  const localCount = index < half ? half : count - half;
  const position = localCount <= 1 ? 0 : localIndex / (localCount - 1);
  const timestamp = window.start.getTime() + Math.floor((window.end.getTime() - window.start.getTime()) * position);
  const date = new Date(timestamp);
  date.setUTCHours(preferredHour, (index * 11) % 50, 0, 0);
  return clampToExplicitWindow(date, window);
}

function clampToWindow(date, index, count) {
  return clampToExplicitWindow(date, index < Math.ceil(count / 2) ? DECEMBER : FEBRUARY);
}

function clampToExplicitWindow(date, window) {
  if (date < window.start) return new Date(window.start);
  if (date > window.end) return new Date(window.end);
  return date;
}

function estimateSimulationDuration(record) {
  const total = Number(record.total_questions || 30);
  return Math.max(12, Math.min(235, Math.round(total * 1.18)));
}

function normalizeSimulationType(type, date) {
  if (!type) return type;
  const datePart = formatDateOnly(date).replaceAll('-', '_');
  if (/^(synthetic|intensive)_\d{4}_\d{2}_\d{2}_/.test(type)) {
    return type.replace(/^(synthetic|intensive)_\d{4}_\d{2}_\d{2}_/, (match) => `${match.split('_')[0]}_${datePart}_`);
  }
  return type;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function formatPocketBaseDate(date) {
  return date.toISOString().replace('T', ' ').replace('Z', 'Z');
}

function formatDateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
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
