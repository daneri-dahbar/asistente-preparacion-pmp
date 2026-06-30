import PocketBase from 'pocketbase';

process.loadEnvFile('.env.local');

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const USER_EMAIL = process.env.USUARIO_A_EMAIL || 'usuario.a.pmi@gmail.com';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

try {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
} catch {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
}

const user = await pb.collection('users').getFirstListItem(`email='${USER_EMAIL}'`, { requestKey: null });
const chats = (await pb.collection('chats').getFullList({ requestKey: null })).filter((record) => record.user === user.id);
const messages = (await pb.collection('messages').getFullList({ requestKey: null })).filter((record) => record.user === user.id || chats.some((chat) => chat.id === record.chat));
const simulations = (await pb.collection('simulations').getFullList({ requestKey: null })).filter((record) => record.user === user.id);
const sessions = (await pb.collection('user_research_sessions').getFullList({ requestKey: null }).catch(() => [])).filter((record) => record.user === user.id);
const progress = await pb.collection('user_progress').getFirstListItem(`user="${user.id}"`, { requestKey: null }).catch(() => null);

const dateValues = [
  ...chats.map((record) => ({ collection: 'chats', id: record.id, field: 'last_active', value: record.last_active })),
  ...messages.map((record) => ({ collection: 'messages', id: record.id, field: 'generated_at', value: record.generated_at })),
  ...simulations.flatMap((record) => [
    { collection: 'simulations', id: record.id, field: 'started_at', value: record.started_at },
    { collection: 'simulations', id: record.id, field: 'completed_at', value: record.completed_at },
  ]),
  ...sessions.map((record) => ({ collection: 'user_research_sessions', id: record.id, field: 'session_date', value: record.session_date })),
].filter((item) => item.value);

const outsideAllowed = dateValues.filter((item) => !isAllowedDate(new Date(item.value)));
const january = dateValues.filter((item) => {
  const date = new Date(item.value);
  return date.getUTCFullYear() === 2026 && date.getUTCMonth() === 0;
});

console.log(JSON.stringify({
  user: { id: user.id, email: user.email, name: user.name },
  counts: {
    chats: chats.length,
    messages: messages.length,
    simulations: simulations.length,
    completedSimulations: simulations.filter((record) => record.status === 'completed').length,
    researchSessions: sessions.length,
    progressRecords: progress ? 1 : 0,
  },
  progress: progress
    ? {
        id: progress.id,
        completed_levels: progress.completed_levels,
        accuracy: progress.stats?.accuracy,
        correct_answers: progress.stats?.correct_answers,
        total_questions: progress.stats?.total_questions,
        periodStart: progress.stats?.syntheticUsage?.periodStart,
        periodEnd: progress.stats?.syntheticUsage?.periodEnd,
      }
    : null,
  dateCheck: {
    totalDateValues: dateValues.length,
    outsideAllowed: outsideAllowed.length,
    january2026: january.length,
    firstDate: dateValues.map((item) => new Date(item.value)).sort((a, b) => a - b)[0]?.toISOString() || null,
    lastDate: dateValues.map((item) => new Date(item.value)).sort((a, b) => a - b).at(-1)?.toISOString() || null,
  },
}, null, 2));

function isAllowedDate(date) {
  if (Number.isNaN(date.getTime())) return false;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return (year === 2025 && month === 11) || (year === 2026 && month === 1);
}
