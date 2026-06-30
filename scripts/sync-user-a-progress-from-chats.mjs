import PocketBase from 'pocketbase';

process.loadEnvFile('.env.local');

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const USER_EMAIL = process.env.USUARIO_A_EMAIL || 'usuario.a.pmi@gmail.com';

const LEVEL_IDS_BY_TOPIC = new Map([
  ['propósito del estándar', '1-0'],
  ['proposito del estandar', '1-0'],
  ['términos y conceptos clave', '1-1'],
  ['terminos y conceptos clave', '1-1'],
  ['audiencia del estándar', '1-2'],
  ['audiencia del estandar', '1-2'],
  ['creación de valor', '2-0'],
  ['creacion de valor', '2-0'],
  ['sistemas de gobernanza', '2-1'],
  ['funciones del proyecto', '2-2'],
]);

if (!PB_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Faltan variables de entorno de PocketBase.');
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

try {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
} catch {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
}

const user = await pb.collection('users').getFirstListItem(`email='${USER_EMAIL}'`, { requestKey: null });
const chats = await pb.collection('chats').getFullList({ requestKey: null });
const userChats = chats.filter((chat) => chat.user === user.id);
const messages = await pb.collection('messages').getFullList({ requestKey: null });
const userMessages = messages.filter((message) => message.user === user.id || userChats.some((chat) => chat.id === message.chat));

const completedLevels = inferCompletedLevels(userChats, userMessages);
const questionStats = inferQuestionStats(userChats, userMessages);
const dateStats = inferDateStats(userMessages);
const modeCounts = userChats.reduce((acc, chat) => {
  const mode = chat.mode || 'standard';
  acc[mode] = (acc[mode] || 0) + 1;
  return acc;
}, {});
const dominantModes = Object.entries(modeCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([mode]) => mode);

const existing = await pb.collection('user_progress').getFirstListItem(`user="${user.id}"`, { requestKey: null }).catch(() => null);
const existingStats = existing?.stats && typeof existing.stats === 'object' ? existing.stats : {};
const existingLevels = Array.isArray(existing?.completed_levels) ? existing.completed_levels : [];
const mergedCompletedLevels = Array.from(new Set([...existingLevels, ...completedLevels])).sort(compareLevelIds);
const totalQuestions = questionStats.totalQuestions;
const correctAnswers = questionStats.correctAnswers;
const accuracy = totalQuestions > 0 ? `${Math.round((correctAnswers / totalQuestions) * 100)}%` : existingStats.accuracy || 'N/A';

const progressData = {
  user: user.id,
  completed_levels: mergedCompletedLevels,
  stats: {
    ...existingStats,
    total_xp: Math.max(Number(existingStats.total_xp || 0), mergedCompletedLevels.length * 500 + userMessages.length * 12 + userChats.length * 40),
    accuracy,
    streak: Math.max(Number(existingStats.streak || 0), dateStats.studyDays),
    correct_answers: correctAnswers,
    total_questions: totalQuestions,
    syntheticUsage: {
      ...(existingStats.syntheticUsage || {}),
      source: 'Sincronizado desde chats y mensajes persistidos del Usuario A',
      periodStart: dateStats.firstDate,
      periodEnd: dateStats.lastDate,
      studySessions: userChats.length,
      chatSessions: userChats.length,
      messageCount: userMessages.length,
      userMessages: userMessages.filter((message) => message.role === 'user').length,
      assistantMessages: userMessages.filter((message) => message.role === 'assistant').length,
      completedGuidedLevels: mergedCompletedLevels.length,
      completedLevelIds: mergedCompletedLevels,
      completedLevelTopics: Array.from(new Set(userChats
        .filter((chat) => String(chat.mode || '').startsWith('level_exam:'))
        .map((chat) => String(chat.mode).split(':').slice(1).join(':'))
        .filter(Boolean))),
      dominantModes,
      minutesStudied: estimateMinutesStudied(userMessages),
      evidenceCollections: ['chats', 'messages', 'user_progress'],
      questionEvidence: questionStats.evidence,
    },
  },
};

const saved = existing
  ? await pb.collection('user_progress').update(existing.id, progressData, { requestKey: null })
  : await pb.collection('user_progress').create(progressData, { requestKey: null });

console.log(JSON.stringify({
  user: { id: user.id, email: user.email, name: user.name },
  progressId: saved.id,
  action: existing ? 'updated' : 'created',
  chatCount: userChats.length,
  messageCount: userMessages.length,
  completedLevels: mergedCompletedLevels,
  stats: progressData.stats,
}, null, 2));

function inferCompletedLevels(userChats, userMessages) {
  const completed = new Set();
  const messagesByChat = groupBy(userMessages, (message) => message.chat);

  for (const chat of userChats) {
    const mode = String(chat.mode || '');
    if (!mode.startsWith('level_exam:')) continue;

    const topic = normalize(mode.split(':').slice(1).join(':'));
    const levelId = LEVEL_IDS_BY_TOPIC.get(topic);
    if (!levelId) continue;

    const chatMessages = messagesByChat.get(chat.id) || [];
    const assistantText = chatMessages
      .filter((message) => message.role === 'assistant')
      .map((message) => String(message.content || ''))
      .join('\n');

    if (/3\s*\/\s*3|puntuaci[oó]n\s*:\s*3\s*\/\s*3|resultado final\s*:\s*3\s*\/\s*3/i.test(assistantText)) {
      completed.add(levelId);
    }
  }

  return Array.from(completed);
}

function inferQuestionStats(userChats, userMessages) {
  const messagesByChat = groupBy(userMessages, (message) => message.chat);
  let correctAnswers = 0;
  let totalQuestions = 0;
  const evidence = [];

  for (const chat of userChats) {
    const mode = String(chat.mode || '');
    const chatMessages = messagesByChat.get(chat.id) || [];
    const assistantText = chatMessages
      .filter((message) => message.role === 'assistant')
      .map((message) => String(message.content || ''))
      .join('\n');

    if (mode.startsWith('level_exam:')) {
      const match = assistantText.match(/(?:resultado final|puntuaci[oó]n)\s*:?\s*(\d+)\s*\/\s*(\d+)/i) || assistantText.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        const correct = Number(match[1]);
        const total = Number(match[2]);
        correctAnswers += correct;
        totalQuestions += total;
        evidence.push({ chat: chat.title, mode, correct, total });
      }
      continue;
    }

    if (mode === 'quiz') {
      const correct = (assistantText.match(/correcto/gi) || []).length - (assistantText.match(/incorrecto/gi) || []).length;
      const incorrect = (assistantText.match(/incorrecto/gi) || []).length;
      const safeCorrect = Math.max(correct, 0);
      const total = safeCorrect + incorrect;
      if (total > 0) {
        correctAnswers += safeCorrect;
        totalQuestions += total;
        evidence.push({ chat: chat.title, mode, correct: safeCorrect, total });
      }
    }
  }

  return { correctAnswers, totalQuestions, evidence };
}

function inferDateStats(userMessages) {
  const dates = userMessages
    .map((message) => new Date(message.generated_at))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);
  const daySet = new Set(dates.map((date) => date.toISOString().slice(0, 10)));

  return {
    firstDate: dates[0]?.toISOString().slice(0, 10) || null,
    lastDate: dates[dates.length - 1]?.toISOString().slice(0, 10) || null,
    studyDays: daySet.size,
  };
}

function estimateMinutesStudied(userMessages) {
  const dates = userMessages
    .map((message) => new Date(message.generated_at))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);

  if (dates.length < 2) return Math.max(5, userMessages.length * 2);

  const spanMinutes = Math.round((dates[dates.length - 1] - dates[0]) / 60000);
  return Math.max(spanMinutes, Math.round(userMessages.length * 1.5));
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function compareLevelIds(a, b) {
  const [worldA, levelA] = String(a).split('-').map(Number);
  const [worldB, levelB] = String(b).split('-').map(Number);
  return worldA - worldB || levelA - levelB;
}
