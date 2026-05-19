import PocketBase from 'pocketbase';
import fs from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve('.env.local'));

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error('Faltan credenciales admin en .env.local.');
  process.exit(1);
}

const USER_ID = '6cruj45y3sul5kz';
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const domains = ['Personas', 'Procesos', 'Entorno Empresarial'];
const starts = [
  { total: 15, correct: 9, type: '15_questions', created: '2026-02-02 00:10:00.000Z', updated: '2026-02-02 00:32:00.000Z' },
  { total: 30, correct: 21, type: '30_questions', created: '2026-02-03 22:05:00.000Z', updated: '2026-02-03 22:48:00.000Z' },
  { total: 45, correct: 34, type: '45_questions', created: '2026-02-05 00:15:00.000Z', updated: '2026-02-05 01:25:00.000Z' },
  { total: 90, correct: 70, type: '90_questions', created: '2026-02-06 21:10:00.000Z', updated: '2026-02-06 23:18:00.000Z' },
  { total: 135, correct: 103, type: '135_questions', created: '2026-02-07 17:00:00.000Z', updated: '2026-02-07 20:05:00.000Z' },
];

async function main() {
  await authAsAdmin();
  await ensureSimulationDateFields();

  for (const item of starts) {
    console.log(`Procesando simulación ${item.type}...`);
    const existing = await getFirst('simulations', `user="${USER_ID}" && type="${item.type}"`);
    const questions = buildQuestions(item.total, item.type);
    const answers = Object.fromEntries(questions.map((question, index) => [
      question.id,
      index < item.correct ? question.correctAnswer : nextWrongAnswer(question.correctAnswer),
    ]));

    const data = {
      user: USER_ID,
      status: 'completed',
      type: item.type,
      total_questions: item.total,
      current_index: item.total,
      questions,
      answers,
      score: item.correct,
      started_at: item.created,
      completed_at: item.updated,
      created: item.created,
      updated: item.updated,
    };

    if (existing) {
      await pb.collection('simulations').update(existing.id, data, { requestKey: null });
    } else {
      await pb.collection('simulations').create(data, { requestKey: null });
    }
  }

  const completedLevels = [
    '1-0', '1-1', '1-2',
    '2-0', '2-1', '2-2', '2-3', '2-4',
    '4-0', '4-1', '4-2',
    '7-0', '7-1', '7-2',
    '8-0', '8-1', '8-2',
    '10-0', '10-1', '10-2', '10-3',
    '16-0', '16-1', '16-2',
    '17-0', '17-1', '17-2',
  ];

  const progressData = {
    user: USER_ID,
    completed_levels: completedLevels,
    stats: {
      total_xp: 4820,
      accuracy: '76%',
      streak: 7,
      correct_answers: 372,
      total_questions: 495,
      syntheticUsage: {
        source: 'Carga sintética solicitada para simular uso intensivo previo al simulacro completo',
        periodStart: '2026-02-01',
        periodEnd: '2026-02-08',
        studySessions: 14,
        chatSessions: 8,
        completedSimulations: 6,
        minutesStudied: 1065,
        strongestDomains: ['Personas', 'Procesos'],
        improvementTrend: [
          { date: '2026-02-02', totalQuestions: 15, scorePercent: 60 },
          { date: '2026-02-03', totalQuestions: 30, scorePercent: 70 },
          { date: '2026-02-05', totalQuestions: 45, scorePercent: 75.56 },
          { date: '2026-02-06', totalQuestions: 90, scorePercent: 77.78 },
          { date: '2026-02-07', totalQuestions: 135, scorePercent: 76.3 },
          { date: '2026-02-08', totalQuestions: 180, scorePercent: 75 },
        ],
      },
    },
    created: '2026-02-01 21:00:00.000Z',
    updated: '2026-02-08 15:50:00.000Z',
  };

  const progress = await getFirst('user_progress', `user="${USER_ID}"`);
  if (progress) {
    await pb.collection('user_progress').update(progress.id, progressData, { requestKey: null });
  } else {
    await pb.collection('user_progress').create(progressData, { requestKey: null });
  }

  console.log('Actividad sintética intensiva cargada para Carlos Acosta Parra.');
}

async function ensureSimulationDateFields() {
  const collection = await pb.collections.getOne('simulations');
  const fields = [...collection.fields];
  let changed = false;

  for (const name of ['started_at', 'completed_at']) {
    if (!fields.some((field) => field.name === name)) {
      fields.push({
        name,
        type: 'date',
        required: false,
        hidden: false,
      });
      changed = true;
    }
  }

  if (changed) {
    await pb.collections.update(collection.id, { fields });
  }

  const fullSimulation = await getFirst('simulations', `user="${USER_ID}" && type="180_questions"`);
  if (fullSimulation) {
    await pb.collection('simulations').update(fullSimulation.id, {
      started_at: '2026-02-08 12:00:00.000Z',
      completed_at: '2026-02-08 15:50:00.000Z',
    }, { requestKey: null });
  }
}

function buildQuestions(total, type) {
  return Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    const domain = domains[index % domains.length];
    return {
      id: `${type}_q_${String(number).padStart(3, '0')}`,
      text: `Pregunta situacional ${number}/${total}: como director de proyecto, debes elegir la siguiente mejor acción considerando ${domain.toLowerCase()} en un entorno híbrido.`,
      options: [
        { id: 'A', text: 'Tomar una decisión unilateral para ahorrar tiempo.' },
        { id: 'B', text: 'Analizar el contexto, involucrar a los interesados adecuados y actuar según el plan vigente.' },
        { id: 'C', text: 'Escalar inmediatamente toda decisión al patrocinador.' },
        { id: 'D', text: 'Detener el trabajo hasta tener información perfecta.' },
      ],
      correctAnswer: 'B',
      explanation: `La opción B es la más alineada con PMP porque integra juicio situacional, colaboración y adaptación al contexto del dominio ${domain}.`,
      domain,
    };
  });
}

function nextWrongAnswer(correct) {
  return correct === 'A' ? 'B' : 'A';
}

async function authAsAdmin() {
  if (pb.admins?.authWithPassword) {
    try {
      await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
      return;
    } catch {
      // PocketBase 0.23+ uses _superusers; fall through for newer deployments.
    }
  }

  await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
}

async function getFirst(collection, filter) {
  try {
    return await pb.collection(collection).getFirstListItem(filter, { requestKey: null });
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
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
  console.error('No se pudo cargar la actividad sintética.');
  console.error(JSON.stringify(error?.response?.data || error?.data || error, null, 2));
  console.error(error?.message || error);
  console.error('status:', error?.status);
  console.error('url:', error?.url);
  console.error('originalError:', error?.originalError?.message || error?.originalError);
  process.exit(1);
});
