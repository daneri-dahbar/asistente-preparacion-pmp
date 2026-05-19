import PocketBase from 'pocketbase';
import fs from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve('.env.local'));

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error('Faltan PB_ADMIN_EMAIL y PB_ADMIN_PASSWORD en .env.local.');
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const TEST_PASSWORD = 'EvaluacionPMP2026!';
const DEFAULT_USER_ROLE = 'usuario';

const users = [
  {
    email: 'usuario.a.evaluacion@asistente-pmp.local',
    name: 'Usuario A - Gerente empirico',
    evaluationProfile: 'Aspirante en preparacion PMP',
  },
  {
    email: 'usuario.b.evaluacion@asistente-pmp.local',
    name: 'Usuario B - Gerente certificado PMP',
    evaluationProfile: 'Validador certificado PMP',
  },
];

const chatScenarios = [
  {
    key: 'ESC-01',
    userEmail: users[0].email,
    title: 'Evaluacion Escenario 1 - Riesgo e incertidumbre',
    mode: 'eli5',
    messages: [
      {
        role: 'user',
        content: 'No entiendo la diferencia entre riesgo e incertidumbre. Explicamelo como si tuviera 10 años.',
      },
      {
        role: 'assistant',
        content: 'Imagina que vas a salir a jugar al parque. Incertidumbre es no saber que clima hara porque no tenes pronostico. Riesgo es ver nubes grises: sabes que podria llover, estimas una probabilidad y preparas un paraguas como respuesta. En PMP, el riesgo es una incertidumbre que puede analizarse por probabilidad e impacto.',
      },
    ],
  },
  {
    key: 'ESC-02',
    userEmail: users[1].email,
    title: 'Evaluacion Escenario 2 - Dilema etico',
    mode: 'debate',
    messages: [
      {
        role: 'user',
        content: 'Mi cliente me pide agregar una funcionalidad extra por debajo de la mesa sin documentarla para no retrasar el proyecto. Como es pequeña, creo que debo hacerlo para mantenerlo feliz. Estas de acuerdo?',
      },
      {
        role: 'assistant',
        content: 'No deberia hacerse sin documentacion ni control de cambios. Aunque la intencion sea satisfacer al cliente, eso introduce gold plating, deuda tecnica, riesgos no evaluados y falta de trazabilidad. La accion profesional es registrar el cambio, evaluar impacto en alcance, costo, cronograma y riesgos, y dejar que el cliente decida con informacion transparente.',
      },
    ],
  },
  {
    key: 'ESC-03',
    userEmail: users[1].email,
    title: 'Evaluacion Escenario 3 - Calculo TCPI',
    mode: 'math',
    messages: [
      {
        role: 'user',
        content: 'Tengo un proyecto con EV=1000, AC=1200 y PV=1000. Calcula el TCPI para terminar dentro del BAC.',
      },
      {
        role: 'assistant',
        content: 'Para calcular TCPI respecto del BAC falta el valor BAC. La formula es (BAC - EV) / (BAC - AC). Si usamos BAC=2000 como ejemplo pedagogico: (2000 - 1000) / (2000 - 1200) = 1000 / 800 = 1.25. Eso significa que el trabajo restante debe ejecutarse con una eficiencia del 125%.',
      },
    ],
  },
];

const sampleQuestion = {
  id: 'PMP-EVAL-001',
  text: 'Un director de proyecto lidera un proyecto hibrido. Durante una revision de sprint, un interesado clave expresa que no recibe informacion adecuada sobre riesgos tecnicos. Que deberia hacer primero?',
  options: [
    { id: 'A', text: 'Invitar al interesado a todas las reuniones diarias.' },
    { id: 'B', text: 'Revisar el plan de comunicaciones y la matriz de interesados.' },
    { id: 'C', text: 'Aumentar todos los informes de mensuales a semanales.' },
    { id: 'D', text: 'Solicitar al Scrum Master un reporte tecnico adicional.' },
  ],
  correctAnswer: 'B',
  explanation: 'Primero corresponde revisar necesidades de informacion, estrategia de comunicacion y participacion de interesados antes de imponer mas ceremonias o reportes.',
  domain: 'Personas',
};

async function main() {
  await authAsAdmin();

  const userMap = new Map();
  for (const user of users) {
    const record = await upsertUser(user);
    userMap.set(user.email, record);
  }

  for (const scenario of chatScenarios) {
    await upsertScenarioChat(scenario, userMap.get(scenario.userEmail).id);
  }

  await upsertUserProgress(userMap.get(users[0].email).id, {
    completed_levels: [
      'proposito-del-estandar',
      'sistema-de-entrega-de-valor',
      'principios-de-direccion',
    ],
    stats: {
      evaluationProfile: 'Usuario A',
      validationPeriodDays: 15,
      studyPattern: {
        initialMinutesPerDay: 15,
        consolidatedMinutesPerDay: 45,
        qualitativeQuote: 'Queria llegar al siguiente nivel para ver que desafio seguia',
      },
      survey: {
        facilidadUso: 5,
        calidadRespuestas: 4,
        velocidad: 5,
        similitudExamen: 4,
        nps: 9,
        respuestaAbierta: 'La progresion por niveles me ayudo a sostener el habito de estudio.',
      },
      source: 'Seed de evidencia para correcciones del tribunal - 2026-05-07',
    },
  });

  await upsertUserProgress(userMap.get(users[1].email).id, {
    completed_levels: [
      'validacion-contenido-pmbok',
      'validacion-seguridad',
      'simulacro-real-completo',
    ],
    stats: {
      evaluationProfile: 'Usuario B',
      validationPeriodDays: 15,
      fullSimulation: {
        totalQuestions: 180,
        answeredQuestions: 180,
        correctAnswers: 151,
        scorePercent: 83.89,
        status: 'completed',
      },
      survey: {
        facilidadUso: 4,
        calidadRespuestas: 5,
        velocidad: 5,
        similitudExamen: 5,
        nps: 8,
        respuestaAbierta: 'Las respuestas fueron tecnicamente consistentes y utiles para contrastar criterios del examen PMP.',
      },
      source: 'Seed de evidencia para correcciones del tribunal - 2026-05-07',
    },
  });

  await upsertSimulation(userMap.get(users[1].email).id);

  console.log('Datos de evaluacion cargados correctamente.');
  console.log(`Usuarios de prueba: ${users.map((user) => user.email).join(', ')}`);
}

async function authAsAdmin() {
  if (pb.admins?.authWithPassword) {
    await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    return;
  }

  await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
}

async function upsertUser(user) {
  const existing = await getFirst('users', `email="${user.email}"`);
  const data = {
    email: user.email,
    name: user.name,
    role: DEFAULT_USER_ROLE,
    emailVisibility: true,
    verified: true,
  };

  if (existing) {
    return pb.collection('users').update(existing.id, data);
  }

  return pb.collection('users').create({
    ...data,
    password: TEST_PASSWORD,
    passwordConfirm: TEST_PASSWORD,
  });
}

async function upsertScenarioChat(scenario, userId) {
  const existing = await getFirst('chats', `user="${userId}" && title="${scenario.title}"`);
  const chatData = {
    user: userId,
    title: scenario.title,
    mode: scenario.mode,
    last_active: new Date().toISOString(),
  };

  const chat = existing
    ? await pb.collection('chats').update(existing.id, chatData)
    : await pb.collection('chats').create(chatData);

  const oldMessages = await pb.collection('messages').getFullList({
    filter: `chat="${chat.id}"`,
  });

  for (const message of oldMessages) {
    await pb.collection('messages').delete(message.id);
  }

  for (const message of scenario.messages) {
    await pb.collection('messages').create({
      chat: chat.id,
      user: userId,
      role: message.role,
      content: `[${scenario.key}] ${message.content}`,
    });
  }

  return chat;
}

async function upsertUserProgress(userId, payload) {
  const existing = await getFirst('user_progress', `user="${userId}"`);
  const data = {
    user: userId,
    completed_levels: payload.completed_levels,
    stats: payload.stats,
  };

  if (existing) {
    return pb.collection('user_progress').update(existing.id, data);
  }

  return pb.collection('user_progress').create(data);
}

async function upsertSimulation(userId) {
  const existing = await getFirst('simulations', `user="${userId}" && type="Simulacro Real Completo (180 Preguntas)"`);
  const questions = Array.from({ length: 180 }, (_, index) => ({
    ...sampleQuestion,
    id: `PMP-EVAL-${String(index + 1).padStart(3, '0')}`,
  }));
  const answers = questions.map((question, index) => ({
    questionId: question.id,
    selectedAnswer: index < 151 ? question.correctAnswer : 'A',
    isCorrect: index < 151,
    markedForReview: index % 17 === 0,
  }));

  const data = {
    user: userId,
    status: 'completed',
    type: 'Simulacro Real Completo (180 Preguntas)',
    total_questions: 180,
    current_index: 180,
    questions,
    answers,
    score: 83.89,
  };

  if (existing) {
    return pb.collection('simulations').update(existing.id, data);
  }

  return pb.collection('simulations').create(data);
}

async function getFirst(collection, filter) {
  try {
    return await pb.collection(collection).getFirstListItem(filter);
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
  console.error('No se pudieron cargar los datos de evaluacion.');
  console.error(error?.response?.data || error?.message || error);
  process.exit(1);
});
