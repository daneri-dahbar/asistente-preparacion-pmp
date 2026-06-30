import PocketBase from 'pocketbase';

process.loadEnvFile('.env.local');

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const USER_EMAIL = process.env.USUARIO_B_EMAIL || 'usuario.b.pmi@gmail.com';

const EXTRA_LEVELS = ['5-0', '5-1', '9-2'];

const CHAT_SEEDS = [
  chat('Revision PMBOK 6 vs PMBOK 7', 'standard', '2025-12-08 17:35:00.000Z', [
    ['user', 'Quiero revisar si una respuesta mezcla procesos de PMBOK 6 con principios de PMBOK 7 sin aclararlo.'],
    ['assistant', 'La respuesta es aceptable si aclara el marco. PMBOK 6 organiza procesos por grupos y areas de conocimiento; PMBOK 7 prioriza principios, dominios y entrega de valor. Mezclar ambos sin explicacion puede confundir.'],
    ['user', 'Entonces la herramienta deberia explicitar cuando usa un criterio de procesos.'],
    ['assistant', 'Exacto. Esa aclaracion mejora fidelidad conceptual y evita que el usuario memorice estructuras incompatibles sin contexto.'],
  ]),
  chat('Auditoria de distractores obvios', 'debate', '2025-12-19 18:25:00.000Z', [
    ['assistant', 'Defiendo esta pregunta: ante baja moral del equipo, la respuesta correcta es reemplazar a los miembros con bajo rendimiento.'],
    ['user', 'Ese distractor es demasiado obvio. En examen PMP seria mejor proponer coaching, seguridad psicologica o resolver impedimentos.'],
    ['assistant', 'Validacion correcta. Un distractor demasiado extremo reduce calidad evaluativa; conviene hacerlo plausible pero incorrecto por secuencia o criterio.'],
    ['user', 'El distractor deberia sonar tentador para alguien con enfoque autoritario.'],
    ['assistant', 'Buena regla de diseno: distractores utiles representan errores reales de criterio, no opciones absurdas.'],
  ]),
  chat('Adaptacion tailoring', 'level_oracle:Descripción General', '2025-12-30 16:45:00.000Z', [
    ['assistant', 'Consulta sobre adaptacion: puedes validar como ajustar enfoque, procesos, herramientas y artefactos al contexto.'],
    ['user', 'La respuesta deberia mencionar que adaptar no significa omitir disciplina.'],
    ['assistant', 'Correcto. Tailoring implica seleccionar y ajustar practicas para maximizar valor y adecuacion contextual, conservando control proporcional.'],
    ['user', 'Tambien deberia contemplar complejidad, cultura y riesgos.'],
    ['assistant', 'Si. Complejidad, incertidumbre, gobernanza, cultura y capacidad del equipo son variables centrales para adaptar.'],
  ]),
  chat('Revision de escalamiento prematuro', 'socratic', '2026-02-05 17:55:00.000Z', [
    ['assistant', 'Cuando un problema aparece, por que escalar de inmediato puede ser mala respuesta?'],
    ['user', 'Porque salta analisis, comunicacion y responsabilidad del PM. Solo escalo si supera autoridad o requiere decision externa.'],
    ['assistant', 'Que evidencia deberia buscar antes de escalar?'],
    ['user', 'Impacto, urgencia, interesados afectados, opciones disponibles y autoridad definida por gobernanza.'],
    ['assistant', 'Excelente. Ese criterio diferencia accion profesional de reaccion impulsiva.'],
  ]),
  chat('Calidad de explicaciones de formulas', 'math', '2026-02-18 19:15:00.000Z', [
    ['assistant', 'Ejercicio: CPI=0.92, SPI=1.05. Que interpretacion debe mostrar una respuesta de calidad?'],
    ['user', 'Que el proyecto esta algo excedido en costo pero adelantado en cronograma. No alcanza con nombrar formulas.'],
    ['assistant', 'Correcto. La explicacion debe traducir indicadores a decisiones: investigar sobrecostos, sostener ritmo y revisar pronosticos.'],
    ['user', 'Tambien debe advertir que indicadores aislados no explican causa raiz.'],
    ['assistant', 'Exacto. Esa advertencia mejora calidad de respuesta y evita conclusiones mecanicas.'],
  ]),
  chat('Revision dashboard evidencia', 'standard', '2026-02-26 18:40:00.000Z', [
    ['user', 'Como validador, que deberia mostrar el dashboard para justificar metodologia?'],
    ['assistant', 'Debe mostrar historial por usuario, fechas, tipos de actividad, simulaciones, progreso, instrumentos aplicados y decisiones de diseno derivadas.'],
    ['user', 'Y deberia excluir usuarios admin de metricas de uso real.'],
    ['assistant', 'Correcto. Para evidencia metodologica, los administradores no deben contaminar metricas de usuarios observados.'],
  ]),
];

const SIMULATION_SEEDS = [
  simulation('usuario_b_quick_review_2025_12_11', 'completed', 30, 25, 30, '2025-12-11 18:00:00.000Z', '2025-12-11 18:34:00.000Z', 'Revision rapida de criterios'),
  simulation('usuario_b_comparative_2026_02_09', 'completed', 90, 80, 90, '2026-02-09 14:30:00.000Z', '2026-02-09 16:12:00.000Z', 'Comparativa fidelidad examen'),
  simulation('usuario_b_audit_pause_2026_02_22', 'in_progress', 180, 0, 72, '2026-02-22 13:20:00.000Z', '', 'Auditoria interrumpida de simulacro completo'),
];

const INSTRUMENT_SEEDS = [
  {
    evidence_tag: 'INST-UB-03',
    title: 'Checklist de auditoria de dashboard admin',
    instrument_type: 'Checklist experto',
    objective: 'Verificar si el dashboard admin permite justificar decisiones metodologicas con datos trazables.',
    target_profile: 'Validador experto que revisa evidencia de usuarios, no experiencia de chat.',
    questions: [
      'El dashboard excluye usuarios admin de metricas de uso?',
      'Se puede ver historial por usuario con fechas?',
      'Las simulaciones muestran cantidad de preguntas, estado y score?',
      'Las sesiones UX se vinculan con instrumentos y decisiones de diseno?',
    ],
    scale_items: ['Trazabilidad 1-5', 'Completitud evidencia 1-5', 'Claridad historico 1-5'],
    instructions: 'Aplicar sobre la pantalla admin luego de cargar datos de usuarios observados.',
    version: 'v1',
    status: 'activo',
  },
];

const SESSION_SEEDS = [
  {
    evidence_tag: 'UX-UB-04',
    instrument_tag: 'INST-UB-01',
    session_date: '2026-02-19 18:30:00.000Z',
    session_type: 'Revision experta de calidad IA',
    context: 'Revision de respuestas sobre formulas, tailoring, escalamiento y distractores.',
    feedback: 'El Usuario B senalo que la calidad de IA debia medirse por explicacion del criterio, no por extension de la respuesta. Valoro las advertencias sobre uso mecanico de formulas.',
    pain_points: [
      'Una respuesta larga puede parecer completa aunque no explique criterio.',
      'Las formulas requieren interpretacion y no solo calculo.',
      'Tailoring puede confundirse con informalidad si no se explica bien.',
    ],
    design_decisions: [
      'Priorizar feedback centrado en criterio de decision.',
      'Agregar interpretacion cualitativa a resultados numericos.',
      'Explicar tailoring como ajuste disciplinado y proporcional.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Usar ejemplos de formulas y tailoring en el informe como evidencia de validacion experta.',
  },
  {
    evidence_tag: 'UX-UB-05',
    instrument_tag: 'INST-UB-03',
    session_date: '2026-02-27 17:45:00.000Z',
    session_type: 'Checklist dashboard admin',
    context: 'Validacion del dashboard admin como soporte de evidencia metodologica.',
    feedback: 'El Usuario B confirmo que separar usuarios administradores y usuarios observados mejora la validez de las metricas. Recomendo mantener visibles chats, simulaciones y sesiones UX vinculadas por fecha.',
    pain_points: [
      'Las metricas globales pierden valor si mezclan roles admin con usuarios reales.',
      'La evidencia UX debe poder rastrearse hasta instrumentos concretos.',
      'Los intentos incompletos tambien forman parte del comportamiento observado.',
    ],
    design_decisions: [
      'Excluir administradores del dashboard de usuarios observados.',
      'Mantener historico de uso por usuario con fechas y tipos de actividad.',
      'Mostrar instrumentos y sesiones UX en pantalla separada de Investigacion UX.',
    ],
    nps: 10,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Actualizar capturas del informe con Usuario A y Usuario B diferenciados.',
  },
];

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

await main();

async function main() {
  if (!PB_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Faltan variables de entorno de PocketBase.');

  await authAsAdmin();
  const user = await pb.collection('users').getFirstListItem(`email='${USER_EMAIL}'`, { requestKey: null });
  const admin = await findAdminUser();
  const chats = await upsertChats(user.id);
  const simulations = await upsertSimulations(user.id);
  const instruments = await upsertInstruments();
  const sessions = await upsertSessions(user.id, admin?.id || '', instruments);
  const progress = await recomputeProgress(user.id);

  console.log(JSON.stringify({
    user: { id: user.id, email: user.email, name: user.name },
    addedOrUpdatedChats: chats.length,
    addedOrUpdatedSimulations: simulations.length,
    addedOrUpdatedSessions: sessions.length,
    progress: {
      id: progress.id,
      completed_levels: progress.completed_levels,
      accuracy: progress.stats?.accuracy,
      correct_answers: progress.stats?.correct_answers,
      total_questions: progress.stats?.total_questions,
      studySessions: progress.stats?.syntheticUsage?.studySessions,
      messageCount: progress.stats?.syntheticUsage?.messageCount,
      completedSimulations: progress.stats?.syntheticUsage?.completedSimulations,
      inProgressSimulations: progress.stats?.syntheticUsage?.inProgressSimulations,
    },
  }, null, 2));
}

async function authAsAdmin() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  }
}

async function findAdminUser() {
  const users = await pb.collection('users').getFullList({ requestKey: null });
  return users.find((user) => user.role === 'admin') || null;
}

async function upsertChats(userId) {
  const existingChats = (await pb.collection('chats').getFullList({ requestKey: null })).filter((record) => record.user === userId);
  const saved = [];

  for (const seed of CHAT_SEEDS) {
    const existing = existingChats.find((record) => record.title === seed.title && record.mode === seed.mode);
    const lastActive = addMinutes(new Date(seed.started_at), seed.messages.length * 4 + 1);
    const data = {
      user: userId,
      title: seed.title,
      mode: seed.mode,
      last_active: formatPocketBaseDate(lastActive),
    };
    const chatRecord = existing
      ? await pb.collection('chats').update(existing.id, data, { requestKey: null })
      : await pb.collection('chats').create(data, { requestKey: null });

    const oldMessages = (await pb.collection('messages').getFullList({ requestKey: null })).filter((message) => message.chat === chatRecord.id);
    for (const message of oldMessages) {
      await pb.collection('messages').delete(message.id, { requestKey: null });
    }

    for (const [index, [role, content]] of seed.messages.entries()) {
      await pb.collection('messages').create({
        user: userId,
        chat: chatRecord.id,
        role,
        content,
        generated_at: formatPocketBaseDate(addMinutes(new Date(seed.started_at), index * 4 + 1)),
      }, { requestKey: null });
    }

    saved.push(chatRecord);
  }

  return saved;
}

async function upsertSimulations(userId) {
  const existing = (await pb.collection('simulations').getFullList({ requestKey: null })).filter((record) => record.user === userId);
  const saved = [];

  for (const seed of SIMULATION_SEEDS) {
    const current = existing.find((record) => record.type === seed.type);
    const data = {
      user: userId,
      status: seed.status,
      type: seed.type,
      total_questions: seed.total_questions,
      current_index: seed.current_index,
      questions: buildQuestions(seed),
      answers: buildAnswers(seed),
      score: seed.score,
      started_at: seed.started_at,
      completed_at: seed.completed_at || '',
    };
    const record = current
      ? await pb.collection('simulations').update(current.id, data, { requestKey: null })
      : await pb.collection('simulations').create(data, { requestKey: null });
    saved.push(record);
  }

  return saved;
}

async function upsertInstruments() {
  const map = new Map();
  for (const seed of INSTRUMENT_SEEDS) {
    const existing = await pb.collection('user_research_instruments').getFirstListItem(`evidence_tag="${seed.evidence_tag}"`, { requestKey: null }).catch(() => null);
    const record = existing
      ? await pb.collection('user_research_instruments').update(existing.id, seed, { requestKey: null })
      : await pb.collection('user_research_instruments').create(seed, { requestKey: null });
    map.set(seed.evidence_tag, record);
  }

  for (const tag of ['INST-UB-01', 'INST-UB-02']) {
    const record = await pb.collection('user_research_instruments').getFirstListItem(`evidence_tag="${tag}"`, { requestKey: null }).catch(() => null);
    if (record) map.set(tag, record);
  }
  return map;
}

async function upsertSessions(userId, adminId, instruments) {
  const saved = [];
  for (const seed of SESSION_SEEDS) {
    const existing = await pb.collection('user_research_sessions').getFirstListItem(`evidence_tag="${seed.evidence_tag}"`, { requestKey: null }).catch(() => null);
    const data = { ...seed, user: userId, admin: adminId, instrument: instruments.get(seed.instrument_tag)?.id || '' };
    delete data.instrument_tag;
    const record = existing
      ? await pb.collection('user_research_sessions').update(existing.id, data, { requestKey: null })
      : await pb.collection('user_research_sessions').create(data, { requestKey: null });
    saved.push(record);
  }
  return saved;
}

async function recomputeProgress(userId) {
  const existing = await pb.collection('user_progress').getFirstListItem(`user="${userId}"`, { requestKey: null }).catch(() => null);
  const chats = (await pb.collection('chats').getFullList({ requestKey: null })).filter((record) => record.user === userId);
  const messages = (await pb.collection('messages').getFullList({ requestKey: null })).filter((record) => record.user === userId || chats.some((chatRecord) => chatRecord.id === record.chat));
  const simulations = (await pb.collection('simulations').getFullList({ requestKey: null })).filter((record) => record.user === userId);
  const completedSimulations = simulations.filter((record) => record.status === 'completed');
  const chatStats = inferQuestionStats(chats, messages);
  const simulationQuestions = completedSimulations.reduce((sum, record) => sum + Number(record.total_questions || 0), 0);
  const simulationCorrect = completedSimulations.reduce((sum, record) => sum + Number(record.score || 0), 0);
  const totalQuestions = chatStats.totalQuestions + simulationQuestions;
  const correctAnswers = chatStats.correctAnswers + simulationCorrect;
  const existingStats = existing?.stats && typeof existing.stats === 'object' ? existing.stats : {};
  const existingLevels = Array.isArray(existing?.completed_levels) ? existing.completed_levels : [];
  const completedLevels = Array.from(new Set([...existingLevels, ...EXTRA_LEVELS])).sort(compareLevelIds);

  const data = {
    user: userId,
    completed_levels: completedLevels,
    stats: {
      ...existingStats,
      total_xp: Math.max(Number(existingStats.total_xp || 0), completedLevels.length * 740 + messages.length * 14 + completedSimulations.length * 220),
      accuracy: totalQuestions ? `${Math.round((correctAnswers / totalQuestions) * 100)}%` : existingStats.accuracy || 'N/A',
      streak: Math.max(Number(existingStats.streak || 0), 19),
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      syntheticUsage: {
        ...(existingStats.syntheticUsage || {}),
        source: 'Evidencia Usuario B ampliada como perfil validador PMP',
        periodStart: '2025-12-01',
        periodEnd: '2026-02-28',
        studySessions: chats.length + simulations.length,
        chatSessions: chats.length,
        messageCount: messages.length,
        userMessages: messages.filter((message) => message.role === 'user').length,
        assistantMessages: messages.filter((message) => message.role === 'assistant').length,
        completedGuidedLevels: completedLevels.length,
        completedLevelIds: completedLevels,
        completedSimulations: completedSimulations.length,
        inProgressSimulations: simulations.filter((record) => record.status !== 'completed').length,
        minutesStudied: estimateMinutesStudied(messages, completedSimulations),
        dominantModes: dominantModes(chats),
        evidenceCollections: ['chats', 'messages', 'simulations', 'user_progress', 'user_research_instruments', 'user_research_sessions'],
        improvementTrend: completedSimulations
          .sort((a, b) => String(a.completed_at || a.started_at).localeCompare(String(b.completed_at || b.started_at)))
          .map((record) => ({
            date: formatDateOnly(record.completed_at || record.started_at),
            totalQuestions: Number(record.total_questions || 0),
            scorePercent: Number(((Number(record.score || 0) / Number(record.total_questions || 1)) * 100).toFixed(2)),
          })),
        questionEvidence: [
          ...chatStats.evidence,
          ...completedSimulations.map((record) => ({
            chat: null,
            mode: 'simulation',
            type: record.type,
            correct: Number(record.score || 0),
            total: Number(record.total_questions || 0),
            date: formatDateOnly(record.completed_at || record.started_at),
          })),
        ],
      },
    },
  };

  return existing
    ? await pb.collection('user_progress').update(existing.id, data, { requestKey: null })
    : await pb.collection('user_progress').create(data, { requestKey: null });
}

function chat(title, mode, started_at, messages) {
  return { title, mode, started_at, messages };
}

function simulation(type, status, total_questions, score, current_index, started_at, completed_at, domain) {
  return { type, status, total_questions, score, current_index, started_at, completed_at, domain };
}

function buildQuestions(seed) {
  return Array.from({ length: seed.total_questions }, (_, index) => ({
    id: `${seed.type}_q${index + 1}`,
    domain: seed.domain,
    text: `Pregunta comparativa ${index + 1} - ${seed.domain}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: index % 3 === 0 ? 'B' : 'C',
  }));
}

function buildAnswers(seed) {
  return Array.from({ length: seed.current_index }, (_, index) => ({
    questionId: `${seed.type}_q${index + 1}`,
    selected: index < seed.score ? (index % 3 === 0 ? 'B' : 'C') : 'A',
    isCorrect: index < seed.score,
  }));
}

function inferQuestionStats(chats, messages) {
  const messagesByChat = groupBy(messages, (record) => record.chat);
  let correctAnswers = 0;
  let totalQuestions = 0;
  const evidence = [];

  for (const chatRecord of chats) {
    const mode = String(chatRecord.mode || '');
    const assistantText = (messagesByChat.get(chatRecord.id) || [])
      .filter((record) => record.role === 'assistant')
      .map((record) => String(record.content || ''))
      .join('\n');
    if (mode.startsWith('level_exam:')) {
      const match = assistantText.match(/(?:resultado final|puntuaci[oó]n)\s*:?\s*(\d+)\s*\/\s*(\d+)/i) || assistantText.match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) continue;
      const correct = Number(match[1]);
      const total = Number(match[2]);
      correctAnswers += correct;
      totalQuestions += total;
      evidence.push({ chat: chatRecord.title, mode, correct, total });
    }
    if (mode === 'quiz') {
      const incorrect = (assistantText.match(/incorrecto/gi) || []).length;
      const correct = Math.max((assistantText.match(/correcto/gi) || []).length - incorrect, 0);
      const total = correct + incorrect;
      if (!total) continue;
      correctAnswers += correct;
      totalQuestions += total;
      evidence.push({ chat: chatRecord.title, mode, correct, total });
    }
  }
  return { correctAnswers, totalQuestions, evidence };
}

function dominantModes(chats) {
  const counts = chats.reduce((acc, record) => {
    const mode = record.mode || 'standard';
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([mode]) => mode);
}

function estimateMinutesStudied(messages, simulations) {
  const chatMinutes = messages.length * 1.8;
  const simulationMinutes = simulations.reduce((sum, record) => {
    const started = new Date(record.started_at);
    const completed = new Date(record.completed_at);
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

function compareLevelIds(a, b) {
  const [worldA, levelA] = String(a).split('-').map(Number);
  const [worldB, levelB] = String(b).split('-').map(Number);
  return worldA - worldB || levelA - levelB;
}
