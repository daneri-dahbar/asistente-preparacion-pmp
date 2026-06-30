import PocketBase from 'pocketbase';

process.loadEnvFile('.env.local');

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const USER_EMAIL = process.env.USUARIO_B_EMAIL || 'usuario.b.pmi@gmail.com';

const COMPLETED_LEVELS = ['1-0', '1-1', '1-2', '2-0', '2-1', '2-2', '2-3', '2-4', '7-0', '8-0', '9-0'];

const CHAT_SEEDS = [
  chat('Validacion tecnica - Riesgo vs problema', 'standard', '2025-12-03 17:45:00.000Z', [
    ['user', 'Necesito validar si la respuesta distingue bien riesgo, problema e issue en criterio PMP.'],
    ['assistant', 'La distincion es correcta si riesgo se trata como evento incierto futuro, problema como evento ya ocurrido y issue como condicion activa que requiere gestion inmediata.'],
    ['user', 'Agrega tambien impacto positivo y negativo para riesgo.'],
    ['assistant', 'Correcto. Un riesgo puede representar amenaza u oportunidad. Si la respuesta solo lo plantea como amenaza, queda incompleta para PMBOK.'],
  ]),
  chat('Revision de distractores situacionales', 'debate', '2025-12-06 18:30:00.000Z', [
    ['assistant', 'Defendere una opcion discutible para probar si identificas distractores de examen. En un conflicto con stakeholders, la mejor salida es escalar de inmediato al sponsor.'],
    ['user', 'No necesariamente. Primero deberia analizar intereses, impacto y estrategia de involucramiento. Escalar puede ser prematuro.'],
    ['assistant', 'Validacion aceptada. El distractor suena resolutivo, pero omite gestion del involucramiento y comunicacion adaptada.'],
    ['user', 'Ese tipo de distractor deberia marcarse como accion reactiva.'],
    ['assistant', 'Buena observacion para el diseno pedagogico: etiquetar distractores por patron ayuda a explicar el razonamiento.'],
  ]),
  chat('Calculo EVM y TCPI', 'math', '2025-12-10 19:10:00.000Z', [
    ['assistant', 'Ejercicio: EV=80.000, AC=90.000, PV=100.000 y BAC=200.000. Calcula CPI, SPI y TCPI respecto de BAC.'],
    ['user', 'CPI 0.89, SPI 0.80 y TCPI seria (200000-80000)/(200000-90000)=1.09.'],
    ['assistant', 'Correcto. CPI=0.89 indica sobrecosto, SPI=0.80 atraso y TCPI=1.09 exige eficiencia superior a la actual para cumplir BAC.'],
    ['user', 'La explicacion deberia advertir que el proyecto esta atrasado y excedido en costo.'],
    ['assistant', 'De acuerdo. La respuesta debe interpretar, no solo calcular.'],
  ]),
  chat('Oraculo de gobernanza', 'level_oracle:Sistemas de Gobernanza', '2025-12-14 16:20:00.000Z', [
    ['assistant', 'Consulta sobre sistemas de gobernanza: puedes validar criterios de decision, escalamiento y control.'],
    ['user', 'Como diferenciar gobernanza de gestion diaria del proyecto?'],
    ['assistant', 'La gobernanza define estructuras, autoridad, reglas de decision y supervisiones. La gestion diaria ejecuta, coordina y controla el trabajo dentro de ese marco.'],
    ['user', 'Entonces una pregunta sobre quien aprueba cambios mayores apunta a gobernanza.'],
    ['assistant', 'Correcto. La aprobacion formal, criterios de escalamiento y autoridad decisoria suelen depender del sistema de gobernanza.'],
  ]),
  chat('Caso de estudio - Proyecto regulado', 'case_study', '2025-12-18 17:30:00.000Z', [
    ['assistant', 'Caso: implementacion de plataforma de salud con requisitos regulatorios, integracion con sistemas heredados y usuarios clinicos resistentes al cambio.'],
    ['user', 'Evaluaria enfoque hibrido: predictivo para cumplimiento e integraciones criticas, adaptativo para experiencia de usuario.'],
    ['assistant', 'Criterio solido. La regulacion requiere control y trazabilidad; la UX necesita iteracion con usuarios finales.'],
    ['user', 'Tambien revisaria riesgos de adopcion y plan de capacitacion.'],
    ['assistant', 'Correcto. Para un proyecto regulado no basta con entregar software: se debe asegurar adopcion, cumplimiento y continuidad operativa.'],
  ]),
  chat('Quiz ECO - Personas', 'quiz', '2025-12-22 18:15:00.000Z', [
    ['assistant', 'Pregunta 1: un conflicto entre miembros clave afecta la entrega. Que hace primero el PM? A Escalar. B Facilitar conversacion. C Cambiar recursos. D Ignorar.'],
    ['user', 'B'],
    ['assistant', 'CORRECTO. Facilitar la conversacion aborda la causa y protege colaboracion.'],
    ['user', 'Siguiente'],
    ['assistant', 'Pregunta 2: un stakeholder cambia expectativas cada semana. Mejor respuesta? A bloquear cambios. B revisar estrategia de involucramiento y comunicacion.'],
    ['user', 'B'],
    ['assistant', 'CORRECTO. La respuesta profesional adapta comunicacion e involucramiento antes de endurecer controles.'],
  ]),
  chat('Validacion de feedback explicativo', 'socratic', '2026-02-03 18:00:00.000Z', [
    ['assistant', 'Que deberia demostrar una explicacion para que sea util en preparacion PMP?'],
    ['user', 'Debe explicar por que una opcion es mejor, no solo decir correcta.'],
    ['assistant', 'Y que riesgo aparece si solo se muestra la opcion correcta?'],
    ['user', 'El usuario memoriza respuestas y no aprende criterio situacional.'],
    ['assistant', 'Exacto. Ese hallazgo justifica mantener feedback argumentado en practicas y examenes.'],
  ]),
  chat('Validacion enfoque hibrido', 'level_practice:Enfoques de Desarrollo', '2026-02-06 19:05:00.000Z', [
    ['assistant', 'Escenario: hardware con fecha contractual fija y software exploratorio para usuarios internos. Que enfoque seleccionarias?'],
    ['user', 'Hibrido. Predictivo para hardware y adaptativo para software exploratorio.'],
    ['assistant', 'Correcto. La respuesta muestra adaptacion por componente y no eleccion unica por preferencia metodologica.'],
    ['user', 'La justificacion deberia mencionar incertidumbre y cadencia de feedback.'],
    ['assistant', 'Validacion incorporada: incertidumbre y feedback son criterios centrales para seleccionar enfoque.'],
  ]),
  examChat('Enfoques de Desarrollo', '2026-02-08 17:40:00.000Z', ['B', 'C', 'B']),
  chat('Revision de simulacro largo', 'standard', '2026-02-15 18:20:00.000Z', [
    ['user', 'Revisa estrategia de tiempo para un simulacro de 180 preguntas.'],
    ['assistant', 'Divide en bloques, controla ritmo por pregunta, reserva revision y marca mentalmente dudas. Si una pregunta supera 90 segundos sin avance, decide y continua.'],
    ['user', 'Incluye criterio para preguntas situacionales largas.'],
    ['assistant', 'Identifica rol, problema central, etapa del proyecto y accion primero. Evita opciones extremas como escalar, reemplazar o ignorar sin analisis previo.'],
  ]),
  chat('Auditoria de respuestas IA', 'standard', '2026-02-21 16:25:00.000Z', [
    ['user', 'Quiero auditar si las respuestas de la IA son consistentes con PMBOK y no inventan procesos.'],
    ['assistant', 'La auditoria debe revisar trazabilidad conceptual, ausencia de procesos inexistentes, correspondencia con dominios y coherencia entre pregunta, respuesta y explicacion.'],
    ['user', 'Tambien conviene revisar si distingue PMBOK 6 y PMBOK 7.'],
    ['assistant', 'Si. La distincion entre procesos tradicionales y principios/dominios de PMBOK 7 evita mezclar marcos sin aclaracion.'],
  ]),
  chat('Encuesta cierre validador', 'standard', '2026-02-27 18:10:00.000Z', [
    ['user', 'Como resumirias la utilidad de la herramienta desde un perfil validador PMP?'],
    ['assistant', 'La utilidad principal es contrastar criterios de decision, revisar feedback y observar si la progresion prepara para preguntas situacionales sin depender solo de memorizacion.'],
    ['user', 'Entonces el dashboard admin deberia mostrar evidencia y no solo conteos.'],
    ['assistant', 'Exacto. Conteos, fechas, simulaciones, progreso y feedback UX juntos permiten justificar decisiones de diseno centradas en usuarios.'],
  ]),
];

const SIMULATION_SEEDS = [
  simulation('usuario_b_baseline_2025_12_05', 'completed', 45, 36, 45, '2025-12-05 17:20:00.000Z', '2025-12-05 18:10:00.000Z', 'Baseline validador'),
  simulation('usuario_b_quality_check_2025_12_16', 'completed', 60, 51, 60, '2025-12-16 19:00:00.000Z', '2025-12-16 20:10:00.000Z', 'Calidad de distractores'),
  simulation('usuario_b_domain_2025_12_27', 'completed', 90, 78, 90, '2025-12-27 15:00:00.000Z', '2025-12-27 16:45:00.000Z', 'Personas y enfoque hibrido'),
  simulation('usuario_b_interrupted_2026_02_04', 'in_progress', 90, 0, 34, '2026-02-04 20:15:00.000Z', '', 'Sesion interrumpida por revision tecnica'),
  simulation('usuario_b_advanced_2026_02_13', 'completed', 135, 116, 135, '2026-02-13 14:30:00.000Z', '2026-02-13 17:05:00.000Z', 'Simulacion avanzada'),
  simulation('usuario_b_full_2026_02_23', 'completed', 180, 158, 180, '2026-02-23 13:10:00.000Z', '2026-02-23 16:42:00.000Z', 'Simulacro completo validador'),
];

const INSTRUMENT_SEEDS = [
  {
    evidence_tag: 'INST-UB-01',
    title: 'Rubrica de validacion tecnica PMP',
    instrument_type: 'Rubrica experta',
    objective: 'Evaluar consistencia tecnica de respuestas, feedback y distractores desde un perfil PMP avanzado.',
    target_profile: 'Usuario validador con conocimiento PMP y experiencia en direccion de proyectos.',
    questions: [
      'La respuesta distingue correctamente concepto, criterio y accion recomendada?',
      'El feedback explica por que las alternativas no son preferibles?',
      'Se evitan procesos o terminos no alineados con PMBOK?',
      'La respuesta reconoce contexto predictivo, adaptativo o hibrido?',
    ],
    scale_items: ['Consistencia tecnica 1-5', 'Claridad del feedback 1-5', 'Fidelidad al examen 1-5', 'Riesgo de alucinacion 1-5 invertido'],
    instructions: 'Aplicar sobre chats de validacion, quiz, math y case_study. Registrar decisiones derivadas.',
    version: 'v1',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UB-02',
    title: 'Encuesta de fidelidad al simulacro PMP',
    instrument_type: 'Encuesta post-simulacro',
    objective: 'Medir si las simulaciones se perciben cercanas al examen PMP en dificultad, redaccion y criterio situacional.',
    target_profile: 'Usuario con simulaciones medias, avanzadas y completas.',
    questions: [
      'Que tan similar fue la redaccion al estilo del examen PMP?',
      'Los distractores reflejaron errores frecuentes de criterio?',
      'El tiempo requerido fue razonable para el tipo de simulacion?',
      'Que deberia registrar el dashboard para evaluar calidad longitudinal?',
    ],
    scale_items: ['Similitud examen 1-5', 'Calidad distractores 1-5', 'Utilidad historico 1-5', 'NPS 0-10'],
    instructions: 'Aplicar luego de simulacro de 135 o 180 preguntas y contrastar con registros de simulations.',
    version: 'v1',
    status: 'activo',
  },
];

const SESSION_SEEDS = [
  {
    evidence_tag: 'UX-UB-01',
    instrument_tag: 'INST-UB-01',
    session_date: '2025-12-17 18:40:00.000Z',
    session_type: 'Revision experta',
    context: 'Revision de respuestas sobre riesgo, EVM, gobernanza y distractores situacionales.',
    feedback: 'El Usuario B valido que la herramienta explicaba criterios y no solo resultados. Sugirio reforzar la diferencia entre amenaza y oportunidad dentro de riesgo.',
    pain_points: [
      'Algunas respuestas podian quedar incompletas si riesgo se trataba solo como amenaza.',
      'El usuario experto esperaba trazabilidad conceptual y no respuestas genericas.',
      'Los distractores necesitaban explicacion para justificar por que no eran preferibles.',
    ],
    design_decisions: [
      'Mantener feedback argumentado por alternativa.',
      'Explicitar riesgo como amenaza u oportunidad.',
      'Usar patrones de distractores para mejorar preguntas situacionales.',
    ],
    nps: 8,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Revisar prompts de feedback para incluir criterio y descarte de distractores.',
  },
  {
    evidence_tag: 'UX-UB-02',
    instrument_tag: 'INST-UB-02',
    session_date: '2026-02-14 18:10:00.000Z',
    session_type: 'Encuesta post-simulacro',
    context: 'Encuesta posterior a simulacion avanzada de 135 preguntas.',
    feedback: 'El usuario destaco que la dificultad era adecuada para validar criterios de examen y que el historico permitia analizar consistencia del rendimiento.',
    pain_points: [
      'Un score aislado no permite evaluar calidad de preparacion.',
      'Se necesita ver tendencia por cantidad de preguntas y fecha.',
      'Las simulaciones interrumpidas tambien deben quedar registradas.',
    ],
    design_decisions: [
      'Mostrar tendencias de mejora por simulacion.',
      'Conservar simulaciones interrumpidas en dashboard.',
      'Separar evidencia de uso conversacional y evaluativa.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Usar improvementTrend y simulations para fundamentar evaluacion longitudinal.',
  },
  {
    evidence_tag: 'UX-UB-03',
    instrument_tag: 'INST-UB-01',
    session_date: '2026-02-24 17:20:00.000Z',
    session_type: 'Entrevista de cierre validador',
    context: 'Entrevista posterior al simulacro completo de 180 preguntas y auditoria del dashboard admin.',
    feedback: 'El Usuario B considero que el dashboard admin debia priorizar evidencia verificable: chats, mensajes con fecha, simulaciones, progreso e instrumentos UX vinculados.',
    pain_points: [
      'La validacion metodologica pierde fuerza si los datos no estan vinculados por usuario y fecha.',
      'El administrador necesita ver evidencia sin iniciar chat.',
      'La calidad de IA debe justificarse con casos revisados y no con afirmaciones generales.',
    ],
    design_decisions: [
      'Restringir administradores al dashboard.',
      'Mostrar historico de uso al seleccionar usuarios con rol usuario.',
      'Vincular instrumentos, sesiones y decisiones de diseno en Investigacion UX.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Incluir al Usuario B como perfil de validacion experta en el informe.',
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
    chats: chats.length,
    simulations: simulations.length,
    sessions: sessions.length,
    progress: {
      id: progress.id,
      completed_levels: progress.completed_levels,
      accuracy: progress.stats?.accuracy,
      correct_answers: progress.stats?.correct_answers,
      total_questions: progress.stats?.total_questions,
      studySessions: progress.stats?.syntheticUsage?.studySessions,
      messageCount: progress.stats?.syntheticUsage?.messageCount,
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

  return map;
}

async function upsertSessions(userId, adminId, instruments) {
  const saved = [];

  for (const seed of SESSION_SEEDS) {
    const existing = await pb.collection('user_research_sessions').getFirstListItem(`evidence_tag="${seed.evidence_tag}"`, { requestKey: null }).catch(() => null);
    const data = {
      ...seed,
      user: userId,
      admin: adminId,
      instrument: instruments.get(seed.instrument_tag)?.id || '',
    };
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
  const completedLevels = Array.from(new Set([...existingLevels, ...COMPLETED_LEVELS])).sort(compareLevelIds);

  const data = {
    user: userId,
    completed_levels: completedLevels,
    stats: {
      ...existingStats,
      total_xp: Math.max(Number(existingStats.total_xp || 0), completedLevels.length * 720 + messages.length * 14 + completedSimulations.length * 220),
      accuracy: totalQuestions ? `${Math.round((correctAnswers / totalQuestions) * 100)}%` : existingStats.accuracy || 'N/A',
      streak: Math.max(Number(existingStats.streak || 0), 16),
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      syntheticUsage: {
        ...(existingStats.syntheticUsage || {}),
        source: 'Evidencia Usuario B como perfil validador PMP',
        profile: 'Validador experto enfocado en consistencia tecnica y fidelidad al examen',
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

function examChat(topic, started_at, answers) {
  const messages = [['assistant', `Examen de validacion: ${topic}. Responde tres casos para comprobar criterio.`]];
  answers.forEach((answer, index) => {
    messages.push(['user', answer]);
    messages.push(['assistant', index < 2 ? `Registrado. Caso ${index + 2} de 3.` : 'Resultado final: 3/3. El criterio de seleccion es consistente con PMBOK y con escenarios hibridos.']);
  });
  return chat(`Examen: ${topic}`, `level_exam:${topic}`, started_at, messages);
}

function simulation(type, status, total_questions, score, current_index, started_at, completed_at, domain) {
  return { type, status, total_questions, score, current_index, started_at, completed_at, domain };
}

function buildQuestions(seed) {
  return Array.from({ length: seed.total_questions }, (_, index) => ({
    id: `${seed.type}_q${index + 1}`,
    domain: seed.domain,
    text: `Pregunta de validacion ${index + 1} - ${seed.domain}`,
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
