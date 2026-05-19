import PocketBase from 'pocketbase';
import fs from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve('.env.local'));

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

const TARGET_EMAILS = [
  'carlosacostap@tecno.unca.edu.ar',
  'educlerici@gmail.com',
];

const ALLOWED_WINDOWS = [
  {
    start: new Date('2025-12-01T15:00:00.000Z'),
    end: new Date('2025-12-31T21:00:00.000Z'),
  },
  {
    start: new Date('2026-02-01T15:00:00.000Z'),
    end: new Date('2026-02-28T21:00:00.000Z'),
  },
];

const COLLECTIONS = [
  {
    name: 'chats',
    userField: 'user',
    dateFields: ['last_active'],
  },
  {
    name: 'messages',
    userField: 'user',
    dateFields: ['created', 'updated'],
    offsetMinutes: 3,
  },
  {
    name: 'simulations',
    userField: 'user',
    dateFields: ['started_at', 'completed_at'],
    durationMinutes: (record) => estimateSimulationDuration(record),
  },
  {
    name: 'user_research_sessions',
    userField: 'user',
    dateFields: ['session_date'],
  },
];

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error('Faltan credenciales admin en .env.local.');
  process.exit(1);
}

async function main() {
  await authAsAdmin();

  const users = await pb.collection('users').getFullList({
    filter: TARGET_EMAILS.map((email) => `email="${email}"`).join(' || '),
    requestKey: null,
  });
  const usersByEmail = new Map(users.map((user) => [user.email, user]));

  for (const email of TARGET_EMAILS) {
    const user = usersByEmail.get(email);
    if (!user) {
      console.warn(`No se encontro el usuario ${email}.`);
      continue;
    }

    const records = await collectUserRecords(user.id);
    const orderedRecords = records.sort((a, b) => originalTime(a) - originalTime(b));
    const schedule = buildSchedule(orderedRecords.length);
    const chatDates = new Map();

    for (const [index, item] of orderedRecords.entries()) {
      const baseDate = schedule[index];
      const data = buildUpdateData(item, baseDate, chatDates);

      if (Object.keys(data).length === 0) continue;
      await pb.collection(item.collection).update(item.record.id, data, { requestKey: null });
    }

    await normalizeProgressStats(user.id, orderedRecords);
    await normalizeMessagePrefixes(user.id);
    await normalizeSimulationTypes(user.id);
    await verifyUser(email, user.id);
  }
}

async function collectUserRecords(userId) {
  const result = [];

  for (const config of COLLECTIONS) {
    const collection = await pb.collections.getOne(config.name).catch(() => null);
    if (!collection) continue;

    const fields = new Set(collection.fields.map((field) => field.name));
    const dateFields = config.dateFields.filter((field) => field === 'created' || field === 'updated' || fields.has(field));
    if (!dateFields.length) continue;

    const records = await pb.collection(config.name).getFullList({
      filter: `${config.userField}="${userId}"`,
      requestKey: null,
    });

    for (const record of records) {
      result.push({
        collection: config.name,
        config,
        dateFields,
        record,
      });
    }
  }

  return result;
}

function buildUpdateData(item, baseDate, chatDates) {
  const data = {};
  const record = item.record;

  if (item.collection === 'messages' && record.chat && chatDates.has(record.chat)) {
    const siblingCount = chatDates.get(record.chat).count;
    const chatBase = chatDates.get(record.chat).date;
    const date = clampToAllowedDate(addMinutes(chatBase, (siblingCount + 1) * (item.config.offsetMinutes || 2)));
    chatDates.set(record.chat, { date: chatBase, count: siblingCount + 1 });
    setDateFields(data, item.dateFields, date, date);
    return data;
  }

  if (item.collection === 'simulations') {
    const duration = item.config.durationMinutes(record);
    const started = baseDate;
    const completed = clampToAllowedDate(addMinutes(baseDate, duration));
    for (const field of item.dateFields) {
      if (field === 'completed_at') data[field] = formatPocketBaseDate(completed);
      else data[field] = formatPocketBaseDate(started);
    }
    return data;
  }

  if (item.collection === 'chats') {
    const created = baseDate;
    const lastActive = clampToAllowedDate(addMinutes(baseDate, 24));
    setDateFields(data, item.dateFields, created, lastActive);
    chatDates.set(record.id, { date: created, count: 0 });
    return data;
  }

  if (item.collection === 'user_research_sessions') {
    const sessionDate = clampToAllowedDate(addMinutes(baseDate, 35));
    for (const field of item.dateFields) {
      data[field] = formatPocketBaseDate(sessionDate);
    }
    return data;
  }

  setDateFields(data, item.dateFields, baseDate, addMinutes(baseDate, 20));
  return data;
}

function setDateFields(data, fields, createdDate, updatedDate) {
  for (const field of fields) {
    data[field] = formatPocketBaseDate(field === 'updated' || field === 'last_active' ? updatedDate : createdDate);
  }
}

async function normalizeProgressStats(userId, records) {
  const progress = await pb.collection('user_progress').getFirstListItem(`user="${userId}"`, { requestKey: null }).catch(() => null);
  if (!progress) return;

  const datedRecords = await collectVisibleUsageDates(userId);

  const stats = { ...(progress.stats || {}) };
  const syntheticUsage = { ...(stats.syntheticUsage || {}) };
  syntheticUsage.periodStart = formatDateOnly(datedRecords[0] || ALLOWED_WINDOWS[0].start);
  syntheticUsage.periodEnd = formatDateOnly(datedRecords[datedRecords.length - 1] || ALLOWED_WINDOWS[1].end);

  if (Array.isArray(syntheticUsage.improvementTrend)) {
    const simulations = await pb.collection('simulations').getFullList({
      filter: `user="${userId}"`,
      sort: 'completed_at',
      requestKey: null,
    }).catch(() => []);

    syntheticUsage.improvementTrend = syntheticUsage.improvementTrend.map((entry, index) => {
      const simulation = simulations[index] || simulations[simulations.length - 1];
      return {
        ...entry,
        date: formatDateOnly(simulation?.completed_at || simulation?.updated || ALLOWED_WINDOWS[0].start),
      };
    });
  }

  stats.syntheticUsage = syntheticUsage;

  await pb.collection('user_progress').update(progress.id, {
    stats,
  }, { requestKey: null });
}

async function normalizeMessagePrefixes(userId) {
  const chats = await pb.collection('chats').getFullList({
    filter: `user="${userId}"`,
    requestKey: null,
  }).catch(() => []);
  const chatsById = new Map(chats.map((chat) => [chat.id, chat]));

  const messages = await pb.collection('messages').getFullList({
    filter: `user="${userId}"`,
    requestKey: null,
  }).catch(() => []);

  const countersByChat = new Map();

  for (const message of messages) {
    const chat = chatsById.get(message.chat);
    if (!chat?.last_active || typeof message.content !== 'string') continue;

    const nextCount = (countersByChat.get(message.chat) || 0) + 1;
    countersByChat.set(message.chat, nextCount);

    const newPrefix = `[${formatDateOnly(chat.last_active)} #${nextCount}] `;
    const contentWithoutOldPrefix = message.content.replace(/^\[\d{4}-\d{2}-\d{2}\s+#\d+\]\s*/, '');
    const nextContent = `${newPrefix}${contentWithoutOldPrefix}`;

    if (nextContent !== message.content) {
      await pb.collection('messages').update(message.id, {
        content: nextContent,
      }, { requestKey: null });
    }
  }
}

async function normalizeSimulationTypes(userId) {
  const simulations = await pb.collection('simulations').getFullList({
    filter: `user="${userId}"`,
    requestKey: null,
  }).catch(() => []);

  for (const simulation of simulations) {
    if (!simulation.type || !/^synthetic_\d{4}_\d{2}_\d{2}_/.test(simulation.type)) continue;

    const date = formatDateOnly(simulation.completed_at || simulation.started_at || ALLOWED_WINDOWS[0].start)
      .replaceAll('-', '_');
    const suffix = simulation.type.replace(/^synthetic_\d{4}_\d{2}_\d{2}_/, '');
    const nextType = `synthetic_${date}_${suffix}`;

    if (nextType !== simulation.type) {
      await pb.collection('simulations').update(simulation.id, {
        type: nextType,
      }, { requestKey: null });
    }
  }
}

async function collectVisibleUsageDates(userId) {
  const dates = [];

  const chats = await pb.collection('chats').getFullList({ filter: `user="${userId}"`, requestKey: null }).catch(() => []);
  dates.push(...chats.map((record) => record.last_active).filter(Boolean));

  const messages = await pb.collection('messages').getFullList({ filter: `user="${userId}"`, requestKey: null }).catch(() => []);
  dates.push(...messages.map((record) => record.created).filter(Boolean));

  const simulations = await pb.collection('simulations').getFullList({ filter: `user="${userId}"`, requestKey: null }).catch(() => []);
  dates.push(...simulations.map((record) => record.completed_at || record.started_at).filter(Boolean));

  const researchSessions = await pb.collection('user_research_sessions').getFullList({ filter: `user="${userId}"`, requestKey: null }).catch(() => []);
  dates.push(...researchSessions.map((record) => record.session_date).filter(Boolean));

  return dates
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
}

async function verifyUser(email, userId) {
  const allDates = [];
  const summary = {};

  for (const config of COLLECTIONS) {
    const collection = await pb.collections.getOne(config.name).catch(() => null);
    if (!collection) continue;

    const fields = new Set(collection.fields.map((field) => field.name));
    const dateFields = config.dateFields.filter((field) => field === 'created' || field === 'updated' || fields.has(field));
    const records = await pb.collection(config.name).getFullList({
      filter: `${config.userField}="${userId}"`,
      requestKey: null,
    });

    summary[config.name] = records.length;
    for (const record of records) {
      for (const field of dateFields) {
        if (!record[field]) continue;
        allDates.push({ collection: config.name, id: record.id, field, value: record[field] });
      }
    }
  }

  const progress = await pb.collection('user_progress').getFirstListItem(`user="${userId}"`, { requestKey: null }).catch(() => null);
  if (progress?.stats?.syntheticUsage?.periodStart) {
    allDates.push({
      collection: 'user_progress',
      id: progress.id,
      field: 'stats.syntheticUsage.periodStart',
      value: `${progress.stats.syntheticUsage.periodStart} 15:00:00.000Z`,
    });
  }
  if (progress?.stats?.syntheticUsage?.periodEnd) {
    allDates.push({
      collection: 'user_progress',
      id: progress.id,
      field: 'stats.syntheticUsage.periodEnd',
      value: `${progress.stats.syntheticUsage.periodEnd} 15:00:00.000Z`,
    });
  }

  const outside = allDates.filter((item) => !isAllowedDate(new Date(item.value)));
  const january = allDates.filter((item) => {
    const date = new Date(item.value);
    return date.getUTCFullYear() === 2026 && date.getUTCMonth() === 0;
  });

  const sorted = allDates
    .map((item) => new Date(item.value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  console.log(JSON.stringify({
    email,
    summary,
    firstDate: sorted[0]?.toISOString() || null,
    lastDate: sorted[sorted.length - 1]?.toISOString() || null,
    outsideAllowedRange: outside.length,
    january2026Dates: january.length,
  }, null, 2));

  if (outside.length || january.length) {
    console.error('Quedaron fechas fuera del rango solicitado:', [...outside, ...january].slice(0, 10));
    process.exitCode = 1;
  }
}

function buildSchedule(count) {
  if (count <= 0) return [];

  const totalMs = ALLOWED_WINDOWS.reduce((sum, window) => sum + (window.end.getTime() - window.start.getTime()), 0);
  const dates = [];

  for (let index = 0; index < count; index += 1) {
    const position = count === 1 ? 0 : index / count;
    let offsetMs = Math.floor(totalMs * position);

    for (const window of ALLOWED_WINDOWS) {
      const windowMs = window.end.getTime() - window.start.getTime();
      if (offsetMs < windowMs) {
        const date = new Date(window.start.getTime() + offsetMs);
        date.setUTCMinutes(date.getUTCMinutes() + ((index * 11) % 47));
        dates.push(clampToAllowedWindow(date, window));
        break;
      }
      offsetMs -= windowMs;
    }
  }

  return dates;
}

function clampToAllowedWindow(date, window) {
  if (date < window.start) return new Date(window.start);
  if (date > window.end) return new Date(window.end);
  return date;
}

function clampToAllowedDate(date) {
  for (const window of ALLOWED_WINDOWS) {
    if (date >= window.start && date <= window.end) return date;
    if (date < window.start) return new Date(window.start);
  }

  return new Date(ALLOWED_WINDOWS[ALLOWED_WINDOWS.length - 1].end);
}

function originalTime(item) {
  const values = buildCurrentDateSnapshot(item.record);
  const candidates = [
    values.completed_at,
    values.session_date,
    values.last_active,
    values.updated,
    values.created,
    values.started_at,
  ].filter(Boolean);
  const first = candidates.find((value) => !Number.isNaN(new Date(value).getTime()));
  return first ? new Date(first).getTime() : 0;
}

function buildCurrentDateSnapshot(record) {
  return {
    created: record.created,
    updated: record.updated,
    last_active: record.last_active,
    started_at: record.started_at,
    completed_at: record.completed_at,
    session_date: record.session_date,
  };
}

function estimateSimulationDuration(record) {
  if (record.started_at && record.completed_at) {
    const started = new Date(record.started_at);
    const completed = new Date(record.completed_at);
    const diff = Math.round((completed.getTime() - started.getTime()) / 60000);
    if (diff > 0 && diff < 300) return diff;
  }

  const total = Number(record.total_questions || 30);
  return Math.max(12, Math.min(240, Math.round(total * 1.25)));
}

function isAllowedDate(date) {
  if (Number.isNaN(date.getTime())) return false;
  return ALLOWED_WINDOWS.some((window) => date >= window.start && date <= window.end);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function formatPocketBaseDate(date) {
  return date.toISOString().replace('T', ' ').replace('Z', 'Z');
}

function formatDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
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

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

main().catch((error) => {
  console.error('No se pudieron ajustar las fechas de uso.');
  console.error(JSON.stringify({
    status: error?.status,
    url: error?.url,
    data: error?.response?.data || error?.data,
    originalError: error?.originalError?.message,
  }, null, 2));
  console.error(error?.message || error);
  process.exit(1);
});
