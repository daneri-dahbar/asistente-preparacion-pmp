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

const TARGET_USERS = [
  {
    email: 'carlosacostap@tecno.unca.edu.ar',
    displayName: 'Carlos',
    scoreOffset: 0,
  },
  {
    email: 'educlerici@gmail.com',
    displayName: 'Eduardo',
    scoreOffset: 4,
  },
];

const RESEARCH_INSTRUMENTS = [
  {
    evidence_tag: 'INST-UX-01',
    title: 'Entrevista semi-estructurada de inicio y cierre',
    instrument_type: 'Entrevista semi-estructurada',
    objective: 'Comprender expectativas, dificultades iniciales y percepcion de utilidad al finalizar el periodo de prueba.',
    target_profile: 'Usuarios en preparacion o validacion de contenidos PMP.',
    questions: [
      'Que esperabas lograr con la herramienta antes de comenzar?',
      'Que parte del flujo te ayudo a sostener el estudio?',
      'Que informacion necesitabas ver para confiar en tu progreso?',
      'Que cambiarias para reducir friccion durante una sesion de estudio?',
    ],
    scale_items: [
      'Claridad percibida 1-5',
      'Confianza generada 1-5',
      'Facilidad de continuidad 1-5',
    ],
    instructions: 'Aplicar al inicio y al cierre del periodo longitudinal. Registrar citas breves y decisiones de diseno derivadas.',
    version: 'v2',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UX-02',
    title: 'Guia de observacion de practica situacional',
    instrument_type: 'Guia de observacion',
    objective: 'Observar como el usuario resuelve preguntas situacionales y si el feedback explica el criterio de decision.',
    target_profile: 'Usuarios que practican dominios ECO y preguntas de siguiente mejor accion.',
    questions: [
      'Resolver una pregunta situacional verbalizando el criterio elegido.',
      'Identificar si el feedback permite distinguir entre experiencia personal y criterio PMI.',
      'Registrar dudas recurrentes, puntos de dolor y necesidad de ejemplos.',
      'Comprobar si el usuario aplica el concepto en una pregunta posterior.',
    ],
    scale_items: [
      'Claridad del feedback 1-5',
      'Transferencia a nuevo escenario 1-5',
      'Carga cognitiva percibida 1-5',
    ],
    instructions: 'Observar una sesion de practica sin intervenir, salvo para pedir verbalizacion del razonamiento.',
    version: 'v2',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UX-03',
    title: 'Encuesta post-prueba de utilidad y satisfaccion',
    instrument_type: 'Encuesta post-prueba',
    objective: 'Medir utilidad percibida, similitud con el examen, confianza y recomendacion luego de simulaciones cortas y completas.',
    target_profile: 'Usuarios que completaron sesiones de chat, practica guiada y al menos una simulacion.',
    questions: [
      'La herramienta facilito organizar el estudio?',
      'Las respuestas fueron tecnicamente claras?',
      'Las simulaciones ayudaron a medir progreso?',
      'Recomendarias la herramienta a otra persona que prepara PMP?',
    ],
    scale_items: [
      'Facilidad de uso 1-5',
      'Calidad de respuestas 1-5',
      'Utilidad de simulaciones 1-5',
      'NPS 0-10',
    ],
    instructions: 'Aplicar al cierre de una etapa. Asociar cada respuesta con historico de uso y simulaciones.',
    version: 'v2',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UX-04',
    title: 'Registro longitudinal de uso intensivo',
    instrument_type: 'Registro de uso',
    objective: 'Medir frecuencia, continuidad, cantidad de chats, cantidad de simulaciones y evolucion del puntaje durante el periodo observado.',
    target_profile: 'Usuarios con uso sostenido entre diciembre de 2025 y febrero de 2026.',
    questions: [
      'Cuantas sesiones de chat y practica se registraron?',
      'Cuantas simulaciones cortas y largas se completaron?',
      'Existe mejora o estabilidad en los puntajes?',
      'El historial evidencia continuidad de uso?',
    ],
    scale_items: [
      'Continuidad de uso 1-5',
      'Evolucion de desempeno 1-5',
      'Cobertura de modos 1-5',
    ],
    instructions: 'Triangular datos persistidos en chats, simulaciones y user_progress. No depender solo de percepcion declarada.',
    version: 'v1',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UX-05',
    title: 'Prueba de usabilidad por tareas',
    instrument_type: 'Prueba de usabilidad',
    objective: 'Evaluar si el usuario puede iniciar una sesion, retomar historial, ejecutar simulaciones y comprender resultados sin asistencia externa.',
    target_profile: 'Usuarios finales y administrador observador.',
    questions: [
      'Iniciar una practica desde el dashboard.',
      'Localizar un chat previo y recuperar contexto.',
      'Ejecutar una simulacion corta y revisar resultado.',
      'Interpretar progreso, historial y evidencias registradas.',
    ],
    scale_items: [
      'Exito de tarea 0-1',
      'Esfuerzo percibido 1-5',
      'Tiempo de tarea en minutos',
    ],
    instructions: 'Registrar tarea, resultado, friccion observada y decision de diseno relacionada.',
    version: 'v1',
    status: 'activo',
  },
];

const RESEARCH_SESSIONS = [
  {
    email: 'carlosacostap@tecno.unca.edu.ar',
    instrument_tag: 'INST-UX-01',
    session_date: '2025-12-12 18:00:00.000Z',
    session_type: 'Entrevista semi-estructurada',
    context: 'Cierre de la segunda semana de uso, con foco en navegacion lateral y continuidad de estudio.',
    feedback: 'El usuario indico que necesitaba ver rapidamente lo reciente y tambien la estructura completa para no perderse entre modos de practica.',
    pain_points: ['Duda inicial sobre por donde continuar', 'Necesidad de recuperar sesiones previas', 'Preferencia por rutas visibles de estudio'],
    design_decisions: ['Organizar navegacion lateral con recientes y vista completa', 'Mantener historial persistido por usuario', 'Mostrar modos de practica diferenciados'],
    nps: 8,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Conservar acceso rapido a sesiones recientes y reforzar estructura completa.',
    evidence_tag: 'UX-CAR-01',
  },
  {
    email: 'carlosacostap@tecno.unca.edu.ar',
    instrument_tag: 'INST-UX-04',
    session_date: '2025-12-30 19:30:00.000Z',
    session_type: 'Registro longitudinal',
    context: 'Revision de continuidad de uso luego de multiples chats y simulaciones cortas de diciembre.',
    feedback: 'El historico mostro uso frecuente en bloques cortos, alternando teoria, formulas y preguntas situacionales.',
    pain_points: ['Sesiones fragmentadas por disponibilidad horaria', 'Necesidad de simulaciones de baja duracion', 'Revision frecuente de errores'],
    design_decisions: ['Priorizar simulaciones cortas', 'Mantener conteo de preguntas por intento', 'Usar historial como evidencia de avance'],
    nps: 8,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Comparar resultados de diciembre con simulaciones largas de febrero.',
    evidence_tag: 'UX-CAR-02A',
  },
  {
    email: 'carlosacostap@tecno.unca.edu.ar',
    instrument_tag: 'INST-UX-03',
    session_date: '2026-02-06 18:00:00.000Z',
    session_type: 'Encuesta post-prueba',
    context: 'Encuesta posterior a simulaciones progresivas de 45, 60 y 90 preguntas.',
    feedback: 'El usuario valoro practicar por tramos antes de enfrentar el simulacro completo porque le permitia sostener concentracion y revisar errores.',
    pain_points: ['El simulacro completo resultaba intimidante sin pasos previos', 'Se necesitaba visualizar evolucion de puntajes', 'Convenia alternar dificultad'],
    design_decisions: ['Incorporar simulaciones cortas y progresivas', 'Registrar puntaje, cantidad de preguntas y fecha', 'Mostrar historico de intentos en dashboard admin'],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Mantener opciones de 15, 30, 45, 60, 90, 135 y 180 preguntas.',
    evidence_tag: 'UX-CAR-02',
  },
  {
    email: 'carlosacostap@tecno.unca.edu.ar',
    instrument_tag: 'INST-UX-05',
    session_date: '2026-02-28 17:30:00.000Z',
    session_type: 'Prueba de usabilidad por tareas',
    context: 'Evaluacion de tareas de administrador y separacion entre usuarios finales y rol admin.',
    feedback: 'El usuario remarco que el administrador debia registrar feedback y observar datos, pero no iniciar chats como un estudiante.',
    pain_points: ['Riesgo de mezclar actividad admin con actividad de usuarios', 'Necesidad de justificar decisiones de diseno', 'Dashboard demasiado cargado en una sola vista'],
    design_decisions: ['Restringir chat para rol admin', 'Dividir dashboard admin en pantallas', 'Crear modulo de instrumentos y sesiones UX'],
    nps: 9,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Separar vistas de resumen, usuarios e investigacion UX.',
    evidence_tag: 'UX-CAR-03',
  },
  {
    email: 'educlerici@gmail.com',
    instrument_tag: 'INST-UX-01',
    session_date: '2025-12-07 14:00:00.000Z',
    session_type: 'Entrevista semi-estructurada',
    context: 'Primer relevamiento posterior a configuracion inicial y exploracion del mapa de niveles.',
    feedback: 'El usuario indico que una ruta de aprendizaje por niveles reducia la ansiedad frente a un temario amplio y ayudaba a sostener habito.',
    pain_points: ['Temario PMP percibido como demasiado amplio', 'Necesidad de objetivos diarios', 'Preferencia por avance visible'],
    design_decisions: ['Priorizar ruta de aprendizaje por niveles', 'Mostrar progreso acumulado', 'Usar dashboard como punto de partida'],
    nps: 8,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Observar si el historial mantiene continuidad durante diciembre.',
    evidence_tag: 'UX-EDU-01',
  },
  {
    email: 'educlerici@gmail.com',
    instrument_tag: 'INST-UX-02',
    session_date: '2025-12-19 15:30:00.000Z',
    session_type: 'Observacion de uso',
    context: 'Observacion de practica situacional sobre interesados, riesgos y criterios de siguiente mejor accion.',
    feedback: 'El usuario necesitaba que el feedback explicara por que una opcion era mejor que otra y no solo si la respuesta era correcta.',
    pain_points: ['Confusion entre experiencia laboral y criterio PMI', 'Necesidad de ejemplos transferibles', 'Dudas sobre distractores plausibles'],
    design_decisions: ['Mantener feedback explicativo', 'Usar tutor socratico para justificar criterios', 'Incluir ejemplos situacionales breves'],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Revisar transferencia en nuevas preguntas durante febrero.',
    evidence_tag: 'UX-EDU-02A',
  },
  {
    email: 'educlerici@gmail.com',
    instrument_tag: 'INST-UX-02',
    session_date: '2026-02-03 15:30:00.000Z',
    session_type: 'Observacion de uso',
    context: 'Practica de simulaciones cortas y analisis de errores con foco en comprension de respuestas incorrectas.',
    feedback: 'El usuario destaco que el feedback inmediato con criterio de decision era clave para corregir razonamiento en preguntas situacionales.',
    pain_points: ['Respuestas incorrectas dificiles de interpretar sin explicacion', 'Necesidad de distinguir palabras clave', 'Conveniencia de repasar por dominio'],
    design_decisions: ['Mantener retroalimentacion inmediata y explicativa', 'Agrupar practica por dominios ECO', 'Conservar historial de interacciones'],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Medir evolucion en simulaciones de mayor duracion.',
    evidence_tag: 'UX-EDU-02',
  },
  {
    email: 'educlerici@gmail.com',
    instrument_tag: 'INST-UX-04',
    session_date: '2026-02-18 16:00:00.000Z',
    session_type: 'Registro longitudinal',
    context: 'Triangulacion de chats, simulaciones y progreso acumulado antes del simulacro largo.',
    feedback: 'El registro mostro alternancia entre chat, formulas, casos y simulaciones, con mejora progresiva en intentos de mayor cantidad de preguntas.',
    pain_points: ['Necesidad de comparar intentos', 'Dificultad para recordar sesiones previas', 'Importancia de fechas visibles'],
    design_decisions: ['Mostrar historico por usuario en dashboard admin', 'Persistir fechas pedagogicas de simulacion', 'Registrar tendencia de mejora'],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Usar el historico como evidencia de validacion longitudinal.',
    evidence_tag: 'UX-EDU-03A',
  },
  {
    email: 'educlerici@gmail.com',
    instrument_tag: 'INST-UX-03',
    session_date: '2026-02-28 13:00:00.000Z',
    session_type: 'Encuesta post-prueba',
    context: 'Encuesta y cierre posterior a simulacion completa de 180 preguntas.',
    feedback: 'El usuario expreso mayor confianza para reconocer distractores y administrar el tiempo; tambien pidio conservar comparacion entre simulaciones cortas y completas.',
    pain_points: ['Sin historico era dificil explicar evolucion', 'El simulacro completo debia verse como parte de un recorrido', 'Interes por comparar resultados por fecha'],
    design_decisions: ['Mostrar historico de simulaciones con fecha, cantidad de preguntas y resultado', 'Agregar vista admin de uso por usuario', 'Consolidar evidencia metodologica en instrumentos y sesiones'],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Incorporar capturas administrativas al informe final.',
    evidence_tag: 'UX-EDU-03',
  },
];

const CHAT_DATES = [
  '2025-12-01', '2025-12-03', '2025-12-05', '2025-12-08', '2025-12-10',
  '2025-12-12', '2025-12-15', '2025-12-17', '2025-12-19', '2025-12-22',
  '2025-12-24', '2025-12-27', '2025-12-30', '2026-02-02', '2026-02-04',
  '2026-02-06', '2026-02-09', '2026-02-11', '2026-02-13', '2026-02-16',
  '2026-02-18', '2026-02-20', '2026-02-23', '2026-02-25', '2026-02-28',
];

const SIMULATION_DATES = [
  ['2025-12-02', 10],
  ['2025-12-04', 15],
  ['2025-12-07', 30],
  ['2025-12-11', 45],
  ['2025-12-14', 60],
  ['2025-12-18', 90],
  ['2025-12-21', 15],
  ['2025-12-26', 30],
  ['2026-02-03', 45],
  ['2026-02-07', 60],
  ['2026-02-10', 90],
  ['2026-02-14', 120],
  ['2026-02-17', 135],
  ['2026-02-21', 45],
  ['2026-02-24', 90],
  ['2026-02-27', 180],
];

const CHAT_TOPICS = [
  ['Diagnostico diario de estudio', 'standard'],
  ['Repaso de principios PMP', 'level_lesson:Principios de Direccion'],
  ['Practica de interesados', 'level_practice:Interesados'],
  ['Tutor socratico de riesgos', 'socratic'],
  ['Quiz ECO - Personas', 'quiz'],
  ['Entrenador de formulas', 'math'],
  ['Debate de enfoque agil', 'debate'],
  ['Caso de recuperacion de proyecto', 'case_study'],
  ['Taller de acta de constitucion', 'workshop'],
  ['Repaso de gestion de cambios', 'standard'],
  ['Practica de comunicaciones', 'level_practice:Comunicaciones'],
  ['Leccion de entrega de valor', 'level_lesson:Entrega de Valor'],
  ['Revision de errores frecuentes', 'standard'],
  ['Plan de simulacro corto', 'standard'],
  ['Practica de riesgos cuantitativos', 'math'],
  ['Caso de conflicto de recursos', 'case_study'],
  ['Quiz ECO - Procesos', 'quiz'],
  ['Debate predictivo vs adaptativo', 'debate'],
  ['Tutor socratico de calidad', 'socratic'],
  ['Practica de adquisiciones', 'level_practice:Adquisiciones'],
  ['Entrenador de valor ganado', 'math'],
  ['Leccion de liderazgo servicial', 'level_lesson:Liderazgo'],
  ['Revision de simulacro', 'standard'],
  ['Plan de cierre del proyecto', 'workshop'],
  ['Repaso final de patrones PMP', 'standard'],
];

const DOMAINS = ['Personas', 'Procesos', 'Entorno Empresarial'];
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function main() {
  await authAsAdmin();
  await ensureSimulationDateFields();

  for (const target of TARGET_USERS) {
    const user = await getFirst('users', `email="${target.email}"`);
    if (!user) {
      console.warn(`No se encontro el usuario ${target.email}.`);
      continue;
    }

    console.log(`Cargando uso intensivo para ${target.email}...`);
    await seedChats(user.id, target);
    await seedSimulations(user.id, target);
    await upsertProgress(user.id, target);
  }

  await seedResearchEvidence();
  console.log('Datos sinteticos intensivos cargados para ambos usuarios.');
}

async function seedChats(userId, target) {
  for (const [index, date] of CHAT_DATES.entries()) {
    const [topic, mode] = CHAT_TOPICS[index % CHAT_TOPICS.length];
    const title = `Uso intensivo ${String(index + 1).padStart(2, '0')} - ${topic}`;
    const lastActive = makeDate(date, 18 + (index % 5), 10 + ((index * 7) % 45));
    const created = addMinutes(lastActive, -22);

    const chatData = {
      user: userId,
      title,
      mode,
      last_active: formatPocketBaseDate(lastActive),
      created: formatPocketBaseDate(created),
      updated: formatPocketBaseDate(lastActive),
    };

    const existing = await getFirst('chats', `user="${userId}" && title="${escapeFilter(title)}"`);
    const chat = existing
      ? await pb.collection('chats').update(existing.id, chatData, { requestKey: null })
      : await pb.collection('chats').create(chatData, { requestKey: null });

    const oldMessages = await pb.collection('messages').getFullList({
      filter: `chat="${chat.id}"`,
      requestKey: null,
    });

    for (const message of oldMessages) {
      await pb.collection('messages').delete(message.id, { requestKey: null });
    }

    const messages = buildMessages(target.displayName, topic, mode, date, index);
    for (const [messageIndex, message] of messages.entries()) {
      const messageDate = addMinutes(created, messageIndex * 5);
      await pb.collection('messages').create({
        user: userId,
        chat: chat.id,
        role: message.role,
        content: `[${date} #${messageIndex + 1}] ${message.content}`,
        created: formatPocketBaseDate(messageDate),
        updated: formatPocketBaseDate(messageDate),
      }, { requestKey: null });
    }
  }
}

async function seedSimulations(userId, target) {
  for (const [index, [date, total]] of SIMULATION_DATES.entries()) {
    const startedAt = makeDate(date, total >= 120 ? 13 : 19, (index * 9) % 50);
    const duration = Math.min(235, Math.max(12, Math.round(total * 1.18)));
    const completedAt = addMinutes(startedAt, duration);
    const type = `intensive_${date.replaceAll('-', '_')}_${total}_questions`;
    const basePercent = Math.min(88, 62 + index * 1.45 + target.scoreOffset);
    const correct = Math.min(total, Math.round((basePercent / 100) * total));
    const questions = buildQuestions(total, type);
    const answers = Object.fromEntries(questions.map((question, questionIndex) => [
      question.id,
      questionIndex < correct ? question.correctAnswer : nextWrongAnswer(question.correctAnswer),
    ]));

    const data = {
      user: userId,
      status: 'completed',
      type,
      total_questions: total,
      current_index: total,
      questions,
      answers,
      score: correct,
      started_at: formatPocketBaseDate(startedAt),
      completed_at: formatPocketBaseDate(completedAt),
      created: formatPocketBaseDate(startedAt),
      updated: formatPocketBaseDate(completedAt),
    };

    const existing = await getFirst('simulations', `user="${userId}" && type="${type}"`);
    if (existing) {
      await pb.collection('simulations').update(existing.id, data, { requestKey: null });
    } else {
      await pb.collection('simulations').create(data, { requestKey: null });
    }
  }
}

async function upsertProgress(userId, target) {
  const existing = await getFirst('user_progress', `user="${userId}"`);
  const allSimulations = await pb.collection('simulations').getFullList({
    filter: `user="${userId}"`,
    sort: 'completed_at',
    requestKey: null,
  });
  const allChats = await pb.collection('chats').getFullList({
    filter: `user="${userId}"`,
    requestKey: null,
  });

  const completed = allSimulations.filter((simulation) => simulation.status === 'completed');
  const totalQuestions = completed.reduce((sum, simulation) => sum + Number(simulation.total_questions || 0), 0);
  const correctAnswers = completed.reduce((sum, simulation) => sum + Number(simulation.score || 0), 0);
  const minutesInSimulations = completed.reduce((sum, simulation) => (
    sum + estimateDurationMinutes(simulation.started_at, simulation.completed_at, simulation.total_questions)
  ), 0);

  const baseStats = existing?.stats && typeof existing.stats === 'object' ? existing.stats : {};
  const baseLevels = Array.isArray(existing?.completed_levels) ? existing.completed_levels : [];
  const completedLevels = Array.from(new Set([
    ...baseLevels,
    ...Array.from({ length: 54 }, (_, index) => `${Math.floor(index / 3) + 1}-${index % 3}`),
  ]));

  const data = {
    user: userId,
    completed_levels: completedLevels,
    stats: {
      ...baseStats,
      total_xp: Math.max(Number(baseStats.total_xp || 0), 9200 + target.scoreOffset * 120),
      accuracy: totalQuestions ? `${Math.round((correctAnswers / totalQuestions) * 100)}%` : baseStats.accuracy || 'N/A',
      streak: Math.max(Number(baseStats.streak || 0), 24),
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      syntheticUsage: {
        ...(baseStats.syntheticUsage || {}),
        source: 'Carga sintetica intensiva para evidenciar uso sostenido de la herramienta',
        periodStart: '2025-12-01',
        periodEnd: '2026-02-28',
        studySessions: Math.max(allChats.length + completed.length, 42),
        chatSessions: allChats.length,
        completedSimulations: completed.length,
        minutesStudied: minutesInSimulations + allChats.length * 18,
        dominantModes: ['standard', 'quiz', 'math', 'case_study', 'socratic'],
        strongestDomains: ['Personas', 'Procesos'],
        improvementTrend: completed.slice(-10).map((simulation) => ({
          date: formatDateOnly(simulation.completed_at || simulation.updated),
          totalQuestions: simulation.total_questions,
          scorePercent: Number(((Number(simulation.score || 0) / Number(simulation.total_questions || 1)) * 100).toFixed(2)),
        })),
      },
    },
    created: existing?.created || '2025-12-01 15:00:00.000Z',
    updated: '2026-02-28 21:00:00.000Z',
  };

  if (existing) {
    await pb.collection('user_progress').update(existing.id, data, { requestKey: null });
  } else {
    await pb.collection('user_progress').create(data, { requestKey: null });
  }
}

async function seedResearchEvidence() {
  const instrumentMap = new Map();

  for (const instrument of RESEARCH_INSTRUMENTS) {
    const saved = await upsertByEvidenceTag('user_research_instruments', instrument.evidence_tag, instrument);
    instrumentMap.set(instrument.evidence_tag, saved);
  }

  const users = await pb.collection('users').getFullList({
    filter: TARGET_USERS.map((user) => `email="${user.email}"`).join(' || '),
    requestKey: null,
  });
  const usersByEmail = new Map(users.map((user) => [user.email, user]));

  for (const session of RESEARCH_SESSIONS) {
    const user = usersByEmail.get(session.email);
    if (!user) continue;

    const instrument = instrumentMap.get(session.instrument_tag);
    const data = {
      user: user.id,
      instrument: instrument?.id || null,
      session_date: session.session_date,
      session_type: session.session_type,
      context: session.context,
      feedback: session.feedback,
      pain_points: session.pain_points,
      design_decisions: session.design_decisions,
      nps: session.nps,
      usefulness_score: session.usefulness_score,
      usability_score: session.usability_score,
      follow_up: session.follow_up,
      evidence_tag: session.evidence_tag,
      created: session.session_date,
      updated: session.session_date,
    };

    await upsertByEvidenceTag('user_research_sessions', session.evidence_tag, data);
  }
}

async function upsertByEvidenceTag(collection, evidenceTag, data) {
  const existing = await getFirst(collection, `evidence_tag="${escapeFilter(evidenceTag)}"`);
  if (existing) {
    return pb.collection(collection).update(existing.id, data, { requestKey: null });
  }

  return pb.collection(collection).create(data, { requestKey: null });
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
}

function buildMessages(displayName, topic, mode, date, index) {
  const prompt = mode.startsWith('level_')
    ? `Necesito practicar ${topic.toLowerCase()} con una explicacion breve y una pregunta.`
    : `Hoy quiero avanzar con ${topic.toLowerCase()} y dejar registro de lo aprendido.`;

  return [
    {
      role: 'user',
      content: `${displayName}: ${prompt}`,
    },
    {
      role: 'assistant',
      content: `Propongo una sesion corta: concepto clave, ejemplo situacional y una pregunta tipo PMP para cerrar el bloque del ${date}.`,
    },
    {
      role: 'user',
      content: `Voy a responder justificando la siguiente mejor accion y marcando dudas para revisar despues.`,
    },
    {
      role: 'assistant',
      content: `Buen criterio. La respuesta se evalua por entrega de valor, colaboracion, transparencia y gestion del riesgo. Registro de practica ${index + 1} completado.`,
    },
  ];
}

function buildQuestions(total, type) {
  return Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    const domain = DOMAINS[index % DOMAINS.length];
    return {
      id: `${type}_q_${String(number).padStart(3, '0')}`,
      text: `Pregunta situacional ${number}/${total}: selecciona la mejor accion para un proyecto hibrido considerando ${domain}.`,
      options: [
        { id: 'A', text: 'Resolver el problema de forma individual para ganar velocidad.' },
        { id: 'B', text: 'Analizar el contexto, involucrar a las partes correctas y decidir con informacion suficiente.' },
        { id: 'C', text: 'Escalar siempre al patrocinador antes de evaluar alternativas.' },
        { id: 'D', text: 'Esperar a tener informacion perfecta antes de actuar.' },
      ],
      correctAnswer: 'B',
      explanation: `La opcion B se alinea con el enfoque PMP porque combina analisis situacional, colaboracion y entrega de valor en el dominio ${domain}.`,
      domain,
    };
  });
}

function nextWrongAnswer(correct) {
  return correct === 'A' ? 'B' : 'A';
}

function makeDate(date, hour, minute) {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function estimateDurationMinutes(startedAt, completedAt, totalQuestions) {
  const started = new Date(startedAt);
  const completed = new Date(completedAt);
  const diff = Math.round((completed.getTime() - started.getTime()) / 60000);
  if (diff > 0 && diff < 300) return diff;
  return Math.max(12, Math.min(240, Math.round(Number(totalQuestions || 30) * 1.18)));
}

function formatPocketBaseDate(date) {
  return date.toISOString().replace('T', ' ').replace('Z', 'Z');
}

function formatDateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function escapeFilter(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"');
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
  console.error('No se pudo cargar el uso sintetico intensivo.');
  console.error(JSON.stringify(error?.response?.data || error?.data || error, null, 2));
  console.error(error?.message || error);
  process.exit(1);
});
