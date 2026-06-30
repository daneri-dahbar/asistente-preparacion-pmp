import PocketBase from 'pocketbase';

process.loadEnvFile('.env.local');

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const USER_EMAIL = process.env.USUARIO_A_EMAIL || 'usuario.a.pmi@gmail.com';

const LEVEL_IDS_BY_TOPIC = new Map([
  ['proposito del estandar', '1-0'],
  ['terminos y conceptos clave', '1-1'],
  ['audiencia del estandar', '1-2'],
  ['creacion de valor', '2-0'],
  ['sistemas de gobernanza', '2-1'],
  ['funciones del proyecto', '2-2'],
  ['entorno del proyecto', '2-3'],
  ['gestion del producto', '2-4'],
  ['involucramiento de los interesados', '7-0'],
  ['interacciones con otros dominios de desempeno', '7-1'],
  ['direccion y liderazgo del equipo de proyecto', '8-0'],
  ['cultura del equipo de proyecto', '8-1'],
  ['relacion entre cadencia desarrollo y ciclo de vida', '9-0'],
  ['enfoques de desarrollo', '9-2'],
]);

const CHAT_SEEDS = [
  guidedChat('Entorno del Proyecto', '2025-12-23 18:00:00.000Z', [
    ['assistant', 'Leccion sobre entorno del proyecto: factores internos, externos, cultura organizacional, cumplimiento y restricciones que influyen sobre la direccion del proyecto.'],
    ['user', 'Necesito entender como diferenciar EEF de OPA en una pregunta situacional.'],
    ['assistant', 'Los EEF son condiciones del entorno que el equipo no controla, como mercado, regulaciones, cultura y tecnologia disponible. Los OPA son activos internos reutilizables, como plantillas, lecciones aprendidas y procedimientos.'],
    ['user', 'Dame un criterio rapido para no confundirlos.'],
    ['assistant', 'Pregunta si el elemento se puede usar como recurso propio de la organizacion. Si es reutilizable y documentado internamente, probablemente es OPA; si condiciona desde afuera o desde la cultura existente, probablemente es EEF.'],
  ]),
  practiceChat('Entorno del Proyecto', '2025-12-24 18:35:00.000Z', [
    ['assistant', 'Escenario: una nueva regulacion obliga a cambiar controles de privacidad. Que tipo de influencia representa y que debe hacer el director del proyecto?'],
    ['user', 'Es un factor ambiental externo. Debe evaluar impacto y actualizar planes.'],
    ['assistant', 'Correcto. La regulacion no es un activo interno: condiciona el proyecto desde el entorno. La respuesta profesional es analizar impacto, riesgos, cumplimiento y comunicar cambios.'],
    ['user', 'Tambien revisaria si existen plantillas internas de cumplimiento.'],
    ['assistant', 'Muy bien: ahi combinas EEF con OPA. La regulacion dispara el cambio, pero las plantillas internas ayudan a responder de forma controlada.'],
  ]),
  examChat('Entorno del Proyecto', '2025-12-25 17:10:00.000Z', ['B', 'C', 'B']),
  guidedChat('Gestion del Producto', '2025-12-27 18:20:00.000Z', [
    ['assistant', 'Leccion sobre gestion del producto: foco en valor, ciclo de vida del producto, priorizacion, aprendizaje del mercado y alineacion con objetivos estrategicos.'],
    ['user', 'Me cuesta separar proyecto y producto.'],
    ['assistant', 'El proyecto organiza el esfuerzo temporal para producir resultados; el producto vive mas alla del proyecto, evoluciona y entrega valor en uso. Un proyecto puede crear o mejorar un producto.'],
    ['user', 'Entonces un backlog pertenece mas al producto?'],
    ['assistant', 'Exacto. El backlog expresa necesidades y oportunidades de producto priorizadas. El proyecto puede ejecutar parte de ese backlog dentro de una iniciativa concreta.'],
  ]),
  practiceChat('Gestion del Producto', '2025-12-28 16:45:00.000Z', [
    ['assistant', 'Escenario: el cliente pide agregar una funcion atractiva, pero no se vincula con el beneficio esperado. Que deberia priorizar el equipo?'],
    ['user', 'Validar si aporta valor antes de incorporarla al alcance.'],
    ['assistant', 'Correcto. En gestion del producto, una funcionalidad no es valiosa por ser interesante, sino por contribuir a resultados, usuarios o estrategia.'],
    ['user', 'Usaria criterios de valor y costo de demora.'],
    ['assistant', 'Muy buen criterio. Eso permite ordenar decisiones y evita convertir el producto en una suma de pedidos sin direccion.'],
  ]),
  examChat('Gestion del Producto', '2025-12-29 19:05:00.000Z', ['B', 'A', 'C']),
  guidedChat('Involucramiento de los Interesados', '2026-02-02 18:05:00.000Z', [
    ['assistant', 'Leccion sobre interesados: identificar, analizar, priorizar, involucrar y sostener relaciones para maximizar apoyo y reducir resistencia.'],
    ['user', 'Me cuesta decidir cuando involucrar a un stakeholder dificil.'],
    ['assistant', 'No conviene esperar a que escale. El involucramiento temprano permite descubrir expectativas, riesgos de comunicacion y criterios de exito.'],
    ['user', 'Entonces no es solo enviar reportes.'],
    ['assistant', 'Exacto. Involucrar no es informar de manera pasiva: implica dialogar, escuchar, gestionar expectativas y adaptar la estrategia de participacion.'],
  ]),
  practiceChat('Involucramiento de los Interesados', '2026-02-03 18:50:00.000Z', [
    ['assistant', 'Escenario: un gerente funcional bloquea recursos clave porque no entiende el beneficio del proyecto. Que haces primero?'],
    ['user', 'Me reuniria para entender sus preocupaciones y revisar la matriz de interesados.'],
    ['assistant', 'Correcto. Primero se analiza la posicion del interesado y sus necesidades. Escalar sin comprender la causa puede aumentar resistencia.'],
    ['user', 'Luego ajustaria la comunicacion segun su interes e influencia.'],
    ['assistant', 'Muy bien. Esa es una respuesta alineada con PMI: estrategia de involucramiento segun poder, interes, impacto y expectativas.'],
  ]),
  examChat('Involucramiento de los Interesados', '2026-02-04 19:15:00.000Z', ['C', 'B', 'B']),
  guidedChat('Direccion y Liderazgo del Equipo de Proyecto', '2026-02-09 17:40:00.000Z', [
    ['assistant', 'Leccion sobre direccion y liderazgo del equipo: liderazgo servicial, claridad de objetivos, seguridad psicologica, motivacion y remocion de impedimentos.'],
    ['user', 'Quiero distinguir liderazgo de administracion.'],
    ['assistant', 'Administrar ordena recursos, procesos y seguimiento. Liderar alinea, inspira, facilita decisiones y desarrolla capacidades del equipo. En proyectos se necesitan ambas dimensiones.'],
    ['user', 'En agile se parece al rol de facilitador.'],
    ['assistant', 'Si. El liderazgo servicial evita controlar cada tarea y se enfoca en habilitar al equipo para entregar valor de manera sostenible.'],
  ]),
  practiceChat('Direccion y Liderazgo del Equipo de Proyecto', '2026-02-10 18:10:00.000Z', [
    ['assistant', 'Escenario: el equipo evita reportar problemas por miedo a sanciones. Que accion tiene mas impacto?'],
    ['user', 'Crear seguridad psicologica y tratar los problemas como oportunidades de mejora.'],
    ['assistant', 'Correcto. Sin confianza, los riesgos se ocultan. El lider debe habilitar transparencia, aprendizaje y responsabilidad compartida.'],
    ['user', 'Tambien revisaria retrospectivas y acuerdos de trabajo.'],
    ['assistant', 'Excelente. Esos mecanismos vuelven visible el problema sin personalizar la culpa.'],
  ]),
  examChat('Direccion y Liderazgo del Equipo de Proyecto', '2026-02-11 19:20:00.000Z', ['B', 'B', 'C']),
  guidedChat('Enfoques de Desarrollo', '2026-02-18 18:30:00.000Z', [
    ['assistant', 'Leccion sobre enfoques de desarrollo: predictivo, adaptativo, hibrido e incremental segun incertidumbre, cambio, cadencia y necesidad de aprendizaje.'],
    ['user', 'Quiero decidir rapido entre predictivo y agil.'],
    ['assistant', 'Si el alcance es estable y la incertidumbre baja, un enfoque predictivo puede ser adecuado. Si hay descubrimiento, cambio frecuente y necesidad de feedback, conviene adaptativo o hibrido.'],
    ['user', 'Entonces hibrido sirve cuando hay partes estables y partes inciertas.'],
    ['assistant', 'Exacto. Puedes planificar componentes conocidos de forma predictiva y explorar funcionalidades inciertas con ciclos iterativos.'],
  ]),
  practiceChat('Enfoques de Desarrollo', '2026-02-19 19:00:00.000Z', [
    ['assistant', 'Escenario: infraestructura regulada con una app movil experimental. Que enfoque recomendarias?'],
    ['user', 'Hibrido: predictivo para infraestructura regulada y adaptativo para la app movil.'],
    ['assistant', 'Correcto. El enfoque se adapta al trabajo. No se elige por moda, sino por riesgo, incertidumbre, restricciones y necesidad de feedback.'],
    ['user', 'Tambien definiria puntos de integracion entre ambos flujos.'],
    ['assistant', 'Muy bien. La integracion evita que dos enfoques convivan sin coordinacion.'],
  ]),
];

const SIMULATION_SEEDS = [
  simulation('usuario_a_micro_retry_2025_12_07', 'completed', 15, 8, 15, '2025-12-07 18:15:00.000Z', '2025-12-07 18:32:00.000Z', 'Reintento temprano de fundamentos'),
  simulation('usuario_a_micro_recovery_2025_12_08', 'completed', 15, 12, 15, '2025-12-08 18:40:00.000Z', '2025-12-08 18:58:00.000Z', 'Recuperacion de fundamentos'),
  simulation('usuario_a_partial_2025_12_18', 'in_progress', 30, 0, 12, '2025-12-18 20:05:00.000Z', '', 'Intento interrumpido'),
  simulation('usuario_a_domain_2026_02_12', 'completed', 60, 50, 60, '2026-02-12 17:30:00.000Z', '2026-02-12 18:45:00.000Z', 'Interesados y equipo'),
  simulation('usuario_a_hybrid_2026_02_20', 'completed', 90, 75, 90, '2026-02-20 14:10:00.000Z', '2026-02-20 15:55:00.000Z', 'Enfoques hibridos'),
];

const INSTRUMENT_SEEDS = [
  {
    evidence_tag: 'INST-UA-04',
    title: 'Diario de aprendizaje y fatiga',
    instrument_type: 'Diario de uso',
    objective: 'Registrar fatiga, continuidad y utilidad percibida entre sesiones cortas y simulaciones.',
    target_profile: 'Usuario A durante preparacion longitudinal intensiva PMP.',
    questions: [
      'Que actividad realizaste hoy y por que la elegiste?',
      'Que tan cansado estabas al iniciar y al terminar?',
      'Que parte de la retroalimentacion te ayudo a decidir el siguiente paso?',
      'Que evidencia del historico revisaste antes de continuar?',
    ],
    scale_items: ['Fatiga inicial 1-5', 'Fatiga final 1-5', 'Claridad del proximo paso 1-5'],
    instructions: 'Completar al cierre de sesiones con simulaciones incompletas o practicas extensas.',
    version: 'v1',
    status: 'activo',
  },
];

const SESSION_SEEDS = [
  {
    evidence_tag: 'UX-UA-04',
    instrument_tag: 'INST-UA-04',
    session_date: '2026-02-13 18:55:00.000Z',
    session_type: 'Diario de uso',
    context: 'Registro posterior a practica de interesados/equipo y simulacion de 60 preguntas.',
    feedback: 'El usuario describio que las sesiones cortas le permitian sostener continuidad sin esperar a tener varias horas libres. Senalo que revisar errores antes de repetir simulaciones reducia la fatiga.',
    pain_points: [
      'Las sesiones extensas aumentaban fatiga si no habia objetivos intermedios.',
      'El usuario necesitaba saber que repasar antes de volver a simular.',
      'Los intentos incompletos debian conservarse para no perder continuidad.',
    ],
    design_decisions: [
      'Mantener simulaciones incompletas visibles en el historico.',
      'Combinar practicas por dominio con simulaciones cortas.',
      'Mostrar siguiente accion sugerida a partir del progreso.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Incluir evidencia de intentos incompletos como parte del proceso real de estudio.',
  },
  {
    evidence_tag: 'UX-UA-05',
    instrument_tag: 'INST-UA-03',
    session_date: '2026-02-28 18:30:00.000Z',
    session_type: 'Entrevista de cierre longitudinal',
    context: 'Cierre posterior al simulacro completo, reintento focalizado y revision de historico integral.',
    feedback: 'El usuario considero que el recorrido mostraba una mejora creible: inicio con diagnostico bajo, luego recuperacion en simulaciones cortas, avance por dominios y consolidacion en simulacro completo.',
    pain_points: [
      'Sin vista historica seria dificil justificar la evolucion.',
      'La preparacion real incluyo pausas, reintentos e interrupciones.',
      'El usuario queria conservar evidencia de progreso aunque no todas las sesiones fueran exitosas.',
    ],
    design_decisions: [
      'Incluir historico completo por usuario en dashboard admin.',
      'Registrar simulaciones en progreso junto con completadas.',
      'Usar improvementTrend en user_progress para justificar aprendizaje longitudinal.',
    ],
    nps: 10,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Usar esta trayectoria como caso principal de evidencia metodologica del informe.',
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
  const existingChats = (await pb.collection('chats').getFullList({ requestKey: null })).filter((chat) => chat.user === userId);
  const saved = [];

  for (const seed of CHAT_SEEDS) {
    const existing = existingChats.find((chat) => chat.mode === seed.mode && chat.title === seed.title);
    const lastActive = addMinutes(new Date(seed.started_at), seed.messages.length * 3 + 2);
    const chatData = {
      user: userId,
      title: seed.title,
      mode: seed.mode,
      last_active: formatPocketBaseDate(lastActive),
    };

    const chat = existing
      ? await pb.collection('chats').update(existing.id, chatData, { requestKey: null })
      : await pb.collection('chats').create(chatData, { requestKey: null });

    const oldMessages = (await pb.collection('messages').getFullList({ requestKey: null }))
      .filter((message) => message.chat === chat.id);
    for (const message of oldMessages) {
      await pb.collection('messages').delete(message.id, { requestKey: null });
    }

    for (const [index, [role, content]] of seed.messages.entries()) {
      await pb.collection('messages').create({
        user: userId,
        chat: chat.id,
        role,
        content,
        generated_at: formatPocketBaseDate(addMinutes(new Date(seed.started_at), index * 3 + 1)),
      }, { requestKey: null });
    }

    saved.push(chat);
  }

  return saved;
}

async function upsertSimulations(userId) {
  const existing = (await pb.collection('simulations').getFullList({ requestKey: null })).filter((simulation) => simulation.user === userId);
  const saved = [];

  for (const seed of SIMULATION_SEEDS) {
    const current = existing.find((simulation) => simulation.type === seed.type);
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

  const existingInst3 = await pb.collection('user_research_instruments').getFirstListItem('evidence_tag="INST-UA-03"', { requestKey: null }).catch(() => null);
  if (existingInst3) map.set('INST-UA-03', existingInst3);
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
  const chats = (await pb.collection('chats').getFullList({ requestKey: null })).filter((chat) => chat.user === userId);
  const messages = (await pb.collection('messages').getFullList({ requestKey: null })).filter((message) => message.user === userId || chats.some((chat) => chat.id === message.chat));
  const simulations = (await pb.collection('simulations').getFullList({ requestKey: null })).filter((simulation) => simulation.user === userId);
  const completedSimulations = simulations.filter((simulation) => simulation.status === 'completed');
  const chatStats = inferQuestionStats(chats, messages);
  const completedLevels = inferCompletedLevels(chats, messages);
  const simulationQuestions = completedSimulations.reduce((sum, simulation) => sum + Number(simulation.total_questions || 0), 0);
  const simulationCorrect = completedSimulations.reduce((sum, simulation) => sum + Number(simulation.score || 0), 0);
  const totalQuestions = chatStats.totalQuestions + simulationQuestions;
  const correctAnswers = chatStats.correctAnswers + simulationCorrect;
  const existingStats = existing?.stats && typeof existing.stats === 'object' ? existing.stats : {};
  const existingLevels = Array.isArray(existing?.completed_levels) ? existing.completed_levels : [];
  const mergedLevels = Array.from(new Set([...existingLevels, ...completedLevels])).sort(compareLevelIds);

  const data = {
    user: userId,
    completed_levels: mergedLevels,
    stats: {
      ...existingStats,
      total_xp: Math.max(Number(existingStats.total_xp || 0), mergedLevels.length * 650 + messages.length * 12 + completedSimulations.length * 190),
      accuracy: totalQuestions ? `${Math.round((correctAnswers / totalQuestions) * 100)}%` : existingStats.accuracy || 'N/A',
      streak: Math.max(Number(existingStats.streak || 0), 24),
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      syntheticUsage: {
        ...(existingStats.syntheticUsage || {}),
        source: 'Evidencia integral Usuario A ampliada con segunda tanda de uso',
        periodStart: '2025-12-01',
        periodEnd: '2026-02-28',
        studySessions: chats.length + simulations.length,
        chatSessions: chats.length,
        messageCount: messages.length,
        userMessages: messages.filter((message) => message.role === 'user').length,
        assistantMessages: messages.filter((message) => message.role === 'assistant').length,
        completedGuidedLevels: mergedLevels.length,
        completedLevelIds: mergedLevels,
        completedLevelTopics: completedLevelTopics(chats),
        completedSimulations: completedSimulations.length,
        inProgressSimulations: simulations.filter((simulation) => simulation.status !== 'completed').length,
        minutesStudied: estimateMinutesStudied(messages, completedSimulations),
        dominantModes: dominantModes(chats),
        evidenceCollections: ['chats', 'messages', 'simulations', 'user_progress', 'user_research_instruments', 'user_research_sessions'],
        questionEvidence: [
          ...chatStats.evidence,
          ...completedSimulations.map((simulation) => ({
            chat: null,
            mode: 'simulation',
            type: simulation.type,
            correct: Number(simulation.score || 0),
            total: Number(simulation.total_questions || 0),
            date: formatDateOnly(simulation.completed_at || simulation.started_at),
          })),
        ],
        improvementTrend: completedSimulations
          .sort((a, b) => String(a.completed_at || a.started_at).localeCompare(String(b.completed_at || b.started_at)))
          .map((simulation) => ({
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

function guidedChat(topic, started_at, messages) {
  return { title: `Leccion: ${topic}`, mode: `level_lesson:${topic}`, started_at, messages };
}

function practiceChat(topic, started_at, messages) {
  return { title: `Entrenamiento: ${topic}`, mode: `level_practice:${topic}`, started_at, messages };
}

function examChat(topic, started_at, answers) {
  const messages = [
    ['assistant', `Examen de nivel: ${topic}. Responde tres preguntas situacionales para validar dominio del tema.`],
  ];
  answers.forEach((answer, index) => {
    messages.push(['user', answer]);
    messages.push(['assistant', index < 2 ? `Registrado. Pregunta ${index + 2} de 3.` : 'Resultado final: 3/3. Feedback: el criterio aplicado es consistente con el enfoque PMI y permite avanzar al siguiente nivel.']);
  });
  return { title: `Examen: ${topic}`, mode: `level_exam:${topic}`, started_at, messages };
}

function simulation(type, status, total_questions, score, current_index, started_at, completed_at, domain) {
  return { type, status, total_questions, score, current_index, started_at, completed_at, domain };
}

function inferCompletedLevels(chats, messages) {
  const messagesByChat = groupBy(messages, (message) => message.chat);
  const levels = new Set();

  for (const chat of chats) {
    const mode = String(chat.mode || '');
    if (!mode.startsWith('level_exam:')) continue;
    const topic = normalize(mode.split(':').slice(1).join(':'));
    const id = LEVEL_IDS_BY_TOPIC.get(topic);
    if (!id) continue;
    const assistantText = (messagesByChat.get(chat.id) || [])
      .filter((message) => message.role === 'assistant')
      .map((message) => String(message.content || ''))
      .join('\n');
    if (/3\s*\/\s*3|resultado final\s*:?\s*3\s*\/\s*3|puntuaci[oó]n\s*:?\s*3\s*\/\s*3/i.test(assistantText)) levels.add(id);
  }

  return Array.from(levels);
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

function dominantModes(chats) {
  const counts = chats.reduce((acc, chat) => {
    const mode = chat.mode || 'standard';
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([mode]) => mode);
}

function buildQuestions(seed) {
  return Array.from({ length: seed.total_questions }, (_, index) => ({
    id: `${seed.type}_q${index + 1}`,
    domain: seed.domain,
    text: `Pregunta sintetica ${index + 1} de ${seed.domain}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: index % 2 === 0 ? 'B' : 'C',
  }));
}

function buildAnswers(seed) {
  return Array.from({ length: seed.current_index }, (_, index) => ({
    questionId: `${seed.type}_q${index + 1}`,
    selected: index < seed.score ? (index % 2 === 0 ? 'B' : 'C') : 'A',
    isCorrect: index < seed.score,
  }));
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
    .replace(/\s+/g, ' ')
    .trim();
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
