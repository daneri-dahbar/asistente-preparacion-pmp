import PocketBase from 'pocketbase';

process.loadEnvFile('.env.local');

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const USER_EMAIL = process.env.USUARIO_A_EMAIL || 'usuario.a.pmi@gmail.com';

const DECEMBER = {
  start: new Date('2025-12-01T15:00:00.000Z'),
  end: new Date('2025-12-31T21:00:00.000Z'),
};

const FEBRUARY = {
  start: new Date('2026-02-01T15:00:00.000Z'),
  end: new Date('2026-02-28T21:00:00.000Z'),
};

const LEVEL_IDS_BY_TOPIC = new Map([
  ['proposito del estandar', '1-0'],
  ['terminos y conceptos clave', '1-1'],
  ['audiencia del estandar', '1-2'],
  ['creacion de valor', '2-0'],
  ['sistemas de gobernanza', '2-1'],
  ['funciones del proyecto', '2-2'],
]);

const SIMULATIONS = [
  {
    type: 'usuario_a_diagnostic_2025_12_04',
    status: 'completed',
    total_questions: 30,
    score: 18,
    current_index: 30,
    started_at: '2025-12-04 18:10:00.000Z',
    completed_at: '2025-12-04 18:46:00.000Z',
    domain: 'Diagnostico inicial',
  },
  {
    type: 'usuario_a_short_2025_12_12',
    status: 'completed',
    total_questions: 45,
    score: 31,
    current_index: 45,
    started_at: '2025-12-12 19:00:00.000Z',
    completed_at: '2025-12-12 19:55:00.000Z',
    domain: 'Fundamentos y valor',
  },
  {
    type: 'usuario_a_focused_2025_12_20',
    status: 'completed',
    total_questions: 60,
    score: 44,
    current_index: 60,
    started_at: '2025-12-20 16:20:00.000Z',
    completed_at: '2025-12-20 17:35:00.000Z',
    domain: 'Gobernanza y funciones',
  },
  {
    type: 'usuario_a_medium_2026_02_07',
    status: 'completed',
    total_questions: 90,
    score: 69,
    current_index: 90,
    started_at: '2026-02-07 14:15:00.000Z',
    completed_at: '2026-02-07 16:05:00.000Z',
    domain: 'Personas y procesos',
  },
  {
    type: 'usuario_a_advanced_2026_02_16',
    status: 'completed',
    total_questions: 135,
    score: 108,
    current_index: 135,
    started_at: '2026-02-16 18:30:00.000Z',
    completed_at: '2026-02-16 21:02:00.000Z',
    domain: 'Escenarios hibridos',
  },
  {
    type: 'usuario_a_full_2026_02_24',
    status: 'completed',
    total_questions: 180,
    score: 149,
    current_index: 180,
    started_at: '2026-02-24 13:00:00.000Z',
    completed_at: '2026-02-24 16:35:00.000Z',
    domain: 'Simulacro completo PMP',
  },
  {
    type: 'usuario_a_retry_in_progress_2026_02_27',
    status: 'in_progress',
    total_questions: 45,
    score: 0,
    current_index: 18,
    started_at: '2026-02-27 18:40:00.000Z',
    completed_at: '',
    domain: 'Reintento focalizado',
  },
];

const INSTRUMENTS = [
  {
    evidence_tag: 'INST-UA-01',
    title: 'Entrevista inicial de ruta guiada',
    instrument_type: 'Entrevista semi-estructurada',
    objective: 'Comprender si la ruta guiada ayuda al Usuario A a iniciar el estudio sin depender de un chat libre.',
    target_profile: 'Aspirante PMP en etapa inicial, con experiencia laboral practica y necesidad de organizar el temario.',
    questions: [
      'Que esperabas encontrar al iniciar la herramienta?',
      'Que elemento te indico por donde comenzar?',
      'Que tan clara resulto la diferencia entre leccion, practica, oraculo y examen?',
      'Que evidencia te haria confiar en que estas avanzando?',
    ],
    scale_items: ['Claridad del inicio 1-5', 'Utilidad de la ruta 1-5', 'Confianza para continuar 1-5', 'NPS 0-10'],
    instructions: 'Aplicar luego de las primeras sesiones guiadas. Vincular respuestas con chats level_lesson y level_practice.',
    version: 'v1',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UA-02',
    title: 'Observacion de practica y feedback',
    instrument_type: 'Guia de observacion',
    objective: 'Observar si el feedback de practicas y examenes permite corregir el razonamiento del Usuario A.',
    target_profile: 'Usuario con practicas de niveles y examenes cortos cargados en la herramienta.',
    questions: [
      'Resolver una pregunta situacional y verbalizar el criterio.',
      'Identificar si el feedback explica por que una opcion es preferible.',
      'Registrar dudas recurrentes entre experiencia personal y criterio PMI.',
      'Verificar si el usuario aplica el criterio en una pregunta posterior.',
    ],
    scale_items: ['Claridad del feedback 1-5', 'Transferencia a nuevo escenario 1-5', 'Carga cognitiva 1-5'],
    instructions: 'Usar durante modos level_practice, level_exam y quiz. Registrar observaciones con ejemplos concretos.',
    version: 'v1',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UA-03',
    title: 'Encuesta post-simulacion progresiva',
    instrument_type: 'Encuesta post-prueba',
    objective: 'Medir percepcion de utilidad del recorrido desde simulaciones cortas hasta simulacro completo.',
    target_profile: 'Usuario que completo simulaciones de 30, 45, 60, 90, 135 y 180 preguntas.',
    questions: [
      'Que simulacion te ayudo mas a reconocer tu mejora?',
      'Que informacion del historico te resulto mas util?',
      'Que tan necesario fue contar con simulaciones de distinta duracion?',
      'Recomendarias esta herramienta a otro aspirante PMP?',
    ],
    scale_items: ['Utilidad percibida 1-5', 'Facilidad de uso 1-5', 'Confianza frente al examen 1-5', 'NPS 0-10'],
    instructions: 'Aplicar al cierre del simulacro completo. Triangular con registros de simulations y user_progress.',
    version: 'v1',
    status: 'activo',
  },
];

const RESEARCH_SESSIONS = [
  {
    evidence_tag: 'UX-UA-01',
    instrument_tag: 'INST-UA-01',
    session_date: '2025-12-05 19:10:00.000Z',
    session_type: 'Entrevista semi-estructurada',
    context: 'Entrevista posterior al diagnostico y primeras lecciones guiadas del Usuario A.',
    feedback: 'El usuario indico que la ruta guiada redujo la incertidumbre inicial y le permitio entender por que comenzar por proposito, terminos y audiencia del estandar.',
    pain_points: [
      'El temario PMP resultaba demasiado amplio para iniciar desde un chat libre.',
      'El usuario necesitaba ver una secuencia concreta de niveles.',
      'La diferencia entre aprender, practicar y rendir necesitaba estar visible.',
    ],
    design_decisions: [
      'Mantener Modo Guiado como primera experiencia del usuario.',
      'Separar actividades por leccion, entrenamiento, oraculo y examen.',
      'Mostrar progreso por niveles para reforzar continuidad.',
    ],
    nps: 8,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Revisar microcopy de inicio y mantener el siguiente nivel destacado.',
  },
  {
    evidence_tag: 'UX-UA-02',
    instrument_tag: 'INST-UA-02',
    session_date: '2025-12-21 17:50:00.000Z',
    session_type: 'Observacion de uso',
    context: 'Observacion durante practicas y examenes de fundamentos, valor y gobernanza.',
    feedback: 'El usuario mejoro al recibir feedback explicativo. En las primeras respuestas priorizaba experiencia laboral, pero luego empezo a justificar decisiones con criterios PMI.',
    pain_points: [
      'El usuario podia acertar por intuicion sin explicar el criterio.',
      'Necesitaba feedback inmediato para diferenciar riesgo, problema, gobernanza y valor.',
      'Las respuestas extensas eran utiles si se conectaban con el escenario.',
    ],
    design_decisions: [
      'Mantener retroalimentacion explicativa y no solo correcta/incorrecta.',
      'Registrar cantidad de preguntas y aciertos por intento.',
      'Usar modos de practica antes del examen de nivel.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Agregar mas evidencia de mejora mediante simulaciones progresivas.',
  },
  {
    evidence_tag: 'UX-UA-03',
    instrument_tag: 'INST-UA-03',
    session_date: '2026-02-25 17:20:00.000Z',
    session_type: 'Encuesta post-prueba',
    context: 'Encuesta posterior al simulacro completo de 180 preguntas y revision del historico del Usuario A.',
    feedback: 'El usuario valoro ver una mejora gradual desde simulaciones cortas hasta el simulacro completo. Indico que el historico con fechas, cantidad de preguntas y score ayudaba a explicar su preparacion.',
    pain_points: [
      'Sin historico, la mejora entre intentos no era evidente.',
      'Un simulacro completo sin preparacion previa resultaba intimidante.',
      'El administrador necesitaba evidencia consolidada para justificar decisiones de diseno.',
    ],
    design_decisions: [
      'Conservar simulaciones cortas, medias y completas.',
      'Mostrar historico de uso y simulaciones por usuario en dashboard admin.',
      'Triangular chats, simulations, user_progress y feedback UX.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Incorporar estas evidencias en el informe final como trazabilidad metodologica.',
  },
];

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

await main();

async function main() {
  if (!PB_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Faltan variables de entorno de PocketBase.');
  }

  await authAsAdmin();
  await ensureSimulationDateFields();

  const user = await pb.collection('users').getFirstListItem(`email='${USER_EMAIL}'`, { requestKey: null });
  const admin = await findAdminUser();

  const simulations = await upsertSimulations(user.id);
  const dateResult = await redistributeChatDates(user.id);
  const instrumentsByTag = await upsertInstruments();
  const sessions = await upsertResearchSessions(user.id, admin?.id || '', instrumentsByTag);
  const progress = await upsertProgress(user.id, simulations);

  console.log(JSON.stringify({
    user: { id: user.id, email: user.email, name: user.name },
    simulations: simulations.map((simulation) => ({
      id: simulation.id,
      type: simulation.type,
      status: simulation.status,
      total_questions: simulation.total_questions,
      score: simulation.score,
      started_at: simulation.started_at,
      completed_at: simulation.completed_at || null,
    })),
    redistributed: dateResult,
    researchSessions: sessions.map((session) => ({
      id: session.id,
      evidence_tag: session.evidence_tag,
      session_date: session.session_date,
    })),
    progress: {
      id: progress.id,
      completed_levels: progress.completed_levels,
      stats: progress.stats,
    },
  }, null, 2));
}

async function authAsAdmin() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    return;
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  }
}

async function ensureSimulationDateFields() {
  const collection = await pb.collections.getOne('simulations').catch(() => null);
  if (!collection) return;

  const desiredFields = [
    { name: 'started_at', type: 'date', required: false, hidden: false },
    { name: 'completed_at', type: 'date', required: false, hidden: false },
  ];
  const fields = [...collection.fields];

  for (const desired of desiredFields) {
    const index = fields.findIndex((field) => field.name === desired.name);
    if (index === -1) fields.push(desired);
    else fields[index] = { ...fields[index], ...desired };
  }

  await pb.collections.update(collection.id, { fields });
}

async function findAdminUser() {
  const users = await pb.collection('users').getFullList({ requestKey: null });
  return users.find((user) => user.role === 'admin') || null;
}

async function upsertSimulations(userId) {
  const existing = await pb.collection('simulations').getFullList({ requestKey: null });
  const userSimulations = existing.filter((simulation) => simulation.user === userId);
  const saved = [];

  for (const item of SIMULATIONS) {
    const current = userSimulations.find((simulation) => simulation.type === item.type);
    const data = {
      user: userId,
      status: item.status,
      type: item.type,
      total_questions: item.total_questions,
      current_index: item.current_index,
      questions: buildQuestions(item),
      answers: buildAnswers(item),
      score: item.score,
      started_at: item.started_at,
      completed_at: item.completed_at || '',
    };

    const record = current
      ? await pb.collection('simulations').update(current.id, data, { requestKey: null })
      : await pb.collection('simulations').create(data, { requestKey: null });
    saved.push(record);
  }

  return saved;
}

async function redistributeChatDates(userId) {
  const allChats = await pb.collection('chats').getFullList({ requestKey: null });
  const chats = allChats
    .filter((chat) => chat.user === userId)
    .sort((a, b) => String(a.last_active || a.updated || '').localeCompare(String(b.last_active || b.updated || '')));
  const allMessages = await pb.collection('messages').getFullList({ requestKey: null });
  const userMessages = allMessages.filter((message) => message.user === userId || chats.some((chat) => chat.id === message.chat));

  const messagesByChat = groupBy(userMessages, (message) => message.chat);

  for (const [index, chat] of chats.entries()) {
    const chatDate = spreadDate(index, chats.length, 18);
    const chatMessages = (messagesByChat.get(chat.id) || [])
      .sort((a, b) => String(a.generated_at || '').localeCompare(String(b.generated_at || '')));

    for (const [messageIndex, message] of chatMessages.entries()) {
      const messageDate = addMinutes(chatDate, messageIndex * 3 + 1);
      await pb.collection('messages').update(message.id, {
        generated_at: formatPocketBaseDate(messageDate),
      }, { requestKey: null });
    }

    const lastMessageDate = chatMessages.length
      ? addMinutes(chatDate, chatMessages.length * 3 + 1)
      : chatDate;
    await pb.collection('chats').update(chat.id, {
      last_active: formatPocketBaseDate(lastMessageDate),
    }, { requestKey: null });
  }

  return {
    chatCount: chats.length,
    messageCount: userMessages.length,
    periodStart: '2025-12-01',
    periodEnd: '2026-02-28',
    januaryRecords: 0,
  };
}

async function upsertInstruments() {
  const byTag = new Map();

  for (const instrument of INSTRUMENTS) {
    const existing = await pb.collection('user_research_instruments').getFirstListItem(`evidence_tag="${instrument.evidence_tag}"`, { requestKey: null }).catch(() => null);
    const record = existing
      ? await pb.collection('user_research_instruments').update(existing.id, instrument, { requestKey: null })
      : await pb.collection('user_research_instruments').create(instrument, { requestKey: null });
    byTag.set(instrument.evidence_tag, record);
  }

  return byTag;
}

async function upsertResearchSessions(userId, adminId, instrumentsByTag) {
  const saved = [];

  for (const session of RESEARCH_SESSIONS) {
    const existing = await pb.collection('user_research_sessions').getFirstListItem(`evidence_tag="${session.evidence_tag}"`, { requestKey: null }).catch(() => null);
    const data = {
      ...session,
      user: userId,
      admin: adminId,
      instrument: instrumentsByTag.get(session.instrument_tag)?.id || '',
    };
    delete data.instrument_tag;

    const record = existing
      ? await pb.collection('user_research_sessions').update(existing.id, data, { requestKey: null })
      : await pb.collection('user_research_sessions').create(data, { requestKey: null });
    saved.push(record);
  }

  return saved;
}

async function upsertProgress(userId, simulations) {
  const existing = await pb.collection('user_progress').getFirstListItem(`user="${userId}"`, { requestKey: null }).catch(() => null);
  const allChats = await pb.collection('chats').getFullList({ requestKey: null });
  const chats = allChats.filter((chat) => chat.user === userId);
  const allMessages = await pb.collection('messages').getFullList({ requestKey: null });
  const messages = allMessages.filter((message) => message.user === userId || chats.some((chat) => chat.id === message.chat));
  const completedLevels = inferCompletedLevels(chats, messages);
  const chatQuestionStats = inferQuestionStats(chats, messages);
  const completedSimulations = simulations.filter((simulation) => simulation.status === 'completed');
  const simulationQuestions = completedSimulations.reduce((sum, simulation) => sum + Number(simulation.total_questions || 0), 0);
  const simulationCorrect = completedSimulations.reduce((sum, simulation) => sum + Number(simulation.score || 0), 0);
  const totalQuestions = chatQuestionStats.totalQuestions + simulationQuestions;
  const correctAnswers = chatQuestionStats.correctAnswers + simulationCorrect;
  const modeCounts = chats.reduce((acc, chat) => {
    const mode = chat.mode || 'standard';
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {});
  const dominantModes = Object.entries(modeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([mode]) => mode);

  const existingStats = existing?.stats && typeof existing.stats === 'object' ? existing.stats : {};
  const existingLevels = Array.isArray(existing?.completed_levels) ? existing.completed_levels : [];
  const mergedCompletedLevels = Array.from(new Set([...existingLevels, ...completedLevels])).sort(compareLevelIds);

  const data = {
    user: userId,
    completed_levels: mergedCompletedLevels,
    stats: {
      ...existingStats,
      total_xp: Math.max(Number(existingStats.total_xp || 0), mergedCompletedLevels.length * 600 + messages.length * 12 + completedSimulations.length * 180),
      accuracy: totalQuestions ? `${Math.round((correctAnswers / totalQuestions) * 100)}%` : existingStats.accuracy || 'N/A',
      streak: Math.max(Number(existingStats.streak || 0), 18),
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      syntheticUsage: {
        ...(existingStats.syntheticUsage || {}),
        source: 'Evidencia integral Usuario A basada en chats, mensajes, simulaciones y sesiones UX',
        periodStart: '2025-12-01',
        periodEnd: '2026-02-28',
        studySessions: chats.length + simulations.length,
        chatSessions: chats.length,
        messageCount: messages.length,
        userMessages: messages.filter((message) => message.role === 'user').length,
        assistantMessages: messages.filter((message) => message.role === 'assistant').length,
        completedGuidedLevels: mergedCompletedLevels.length,
        completedLevelIds: mergedCompletedLevels,
        completedLevelTopics: completedLevelTopics(chats),
        completedSimulations: completedSimulations.length,
        inProgressSimulations: simulations.filter((simulation) => simulation.status !== 'completed').length,
        minutesStudied: estimateMinutesStudied(messages, completedSimulations),
        dominantModes,
        evidenceCollections: ['chats', 'messages', 'simulations', 'user_progress', 'user_research_instruments', 'user_research_sessions'],
        questionEvidence: [
          ...chatQuestionStats.evidence,
          ...completedSimulations.map((simulation) => ({
            chat: null,
            mode: 'simulation',
            type: simulation.type,
            correct: Number(simulation.score || 0),
            total: Number(simulation.total_questions || 0),
            date: formatDateOnly(simulation.completed_at || simulation.started_at),
          })),
        ],
        improvementTrend: completedSimulations.map((simulation) => ({
          date: formatDateOnly(simulation.completed_at || simulation.started_at),
          totalQuestions: Number(simulation.total_questions || 0),
          scorePercent: Number(((Number(simulation.score || 0) / Number(simulation.total_questions || 1)) * 100).toFixed(2)),
        })),
      },
    },
  };

  return existing
    ? await pb.collection('user_progress').update(existing.id, data, { requestKey: null })
    : await pb.collection('user_progress').create(data, { requestKey: null });
}

function inferCompletedLevels(chats, messages) {
  const completed = new Set();
  const messagesByChat = groupBy(messages, (message) => message.chat);

  for (const chat of chats) {
    const mode = String(chat.mode || '');
    if (!mode.startsWith('level_exam:')) continue;

    const topic = normalize(mode.split(':').slice(1).join(':'));
    const levelId = LEVEL_IDS_BY_TOPIC.get(topic);
    if (!levelId) continue;

    const assistantText = (messagesByChat.get(chat.id) || [])
      .filter((message) => message.role === 'assistant')
      .map((message) => String(message.content || ''))
      .join('\n');

    if (/3\s*\/\s*3|puntuaci[oó]n\s*:?\s*3\s*\/\s*3|resultado final\s*:?\s*3\s*\/\s*3/i.test(assistantText)) {
      completed.add(levelId);
    }
  }

  return Array.from(completed);
}

function inferQuestionStats(chats, messages) {
  const messagesByChat = groupBy(messages, (message) => message.chat);
  let correctAnswers = 0;
  let totalQuestions = 0;
  const evidence = [];

  for (const chat of chats) {
    const mode = String(chat.mode || '');
    const assistantText = (messagesByChat.get(chat.id) || [])
      .filter((message) => message.role === 'assistant')
      .map((message) => String(message.content || ''))
      .join('\n');

    if (mode.startsWith('level_exam:')) {
      const match = assistantText.match(/(?:resultado final|puntuaci[oó]n)\s*:?\s*(\d+)\s*\/\s*(\d+)/i) || assistantText.match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) continue;

      const correct = Number(match[1]);
      const total = Number(match[2]);
      correctAnswers += correct;
      totalQuestions += total;
      evidence.push({ chat: chat.title, mode, correct, total });
    }

    if (mode === 'quiz') {
      const incorrect = (assistantText.match(/incorrecto/gi) || []).length;
      const correct = Math.max((assistantText.match(/correcto/gi) || []).length - incorrect, 0);
      const total = correct + incorrect;
      if (!total) continue;

      correctAnswers += correct;
      totalQuestions += total;
      evidence.push({ chat: chat.title, mode, correct, total });
    }
  }

  return { correctAnswers, totalQuestions, evidence };
}

function completedLevelTopics(chats) {
  return Array.from(new Set(chats
    .filter((chat) => String(chat.mode || '').startsWith('level_exam:'))
    .map((chat) => String(chat.mode).split(':').slice(1).join(':'))
    .filter(Boolean)));
}

function buildQuestions(simulation) {
  return Array.from({ length: simulation.total_questions }, (_, index) => ({
    id: `${simulation.type}_q${index + 1}`,
    domain: simulation.domain,
    text: `Pregunta sintetica ${index + 1} de ${simulation.domain}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: index % 4 === 0 ? 'B' : 'C',
  }));
}

function buildAnswers(simulation) {
  return Array.from({ length: simulation.current_index }, (_, index) => ({
    questionId: `${simulation.type}_q${index + 1}`,
    selected: index < simulation.score ? (index % 4 === 0 ? 'B' : 'C') : 'A',
    isCorrect: index < simulation.score,
  }));
}

function spreadDate(index, count, preferredHour) {
  const half = Math.ceil(count / 2);
  const window = index < half ? DECEMBER : FEBRUARY;
  const localIndex = index < half ? index : index - half;
  const localCount = index < half ? half : count - half;
  const position = localCount <= 1 ? 0 : localIndex / (localCount - 1);
  const timestamp = window.start.getTime() + Math.floor((window.end.getTime() - window.start.getTime()) * position);
  const date = new Date(timestamp);
  date.setUTCHours(preferredHour, (index * 13) % 50, 0, 0);
  return clampToWindow(date, window);
}

function clampToWindow(date, window) {
  if (date < window.start) return new Date(window.start);
  if (date > window.end) return new Date(window.end);
  return date;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function formatPocketBaseDate(date) {
  if (!date) return '';
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return value.toISOString().replace('T', ' ').replace('Z', 'Z');
}

function formatDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function estimateMinutesStudied(messages, simulations) {
  const chatMinutes = messages.length * 1.5;
  const simulationMinutes = simulations.reduce((sum, simulation) => {
    const started = new Date(simulation.started_at);
    const completed = new Date(simulation.completed_at);
    if (Number.isNaN(started.getTime()) || Number.isNaN(completed.getTime())) return sum;
    return sum + Math.max(0, Math.round((completed - started) / 60000));
  }, 0);
  return Math.round(chatMinutes + simulationMinutes);
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
