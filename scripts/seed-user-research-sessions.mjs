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

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const ADMIN_ROLE_RULE = '@request.auth.role = "admin"';

const USER_EMAILS = {
  eduardo: 'educlerici@gmail.com',
  carlos: 'carlosacostap@tecno.unca.edu.ar',
  admin: 'trabajofinalunca@gmail.com',
};

const instruments = [
  {
    evidence_tag: 'INST-UX-01',
    title: 'Entrevista de adopcion inicial',
    instrument_type: 'Entrevista semi-estructurada',
    objective: 'Comprender si el usuario puede iniciar un plan de preparacion PMP sin depender de instrucciones externas.',
    target_profile: 'Aspirante PMP con experiencia practica, pero sin formacion formal previa en PMI.',
    questions: [
      'Que esperabas encontrar al iniciar la herramienta?',
      'Que parte de la pantalla inicial te indico por donde comenzar?',
      'Que conceptos o terminos te generaron mayor ansiedad?',
      'Que informacion necesitarias ver para confiar en la ruta propuesta?',
    ],
    scale_items: [
      'Claridad del inicio 1-5',
      'Utilidad percibida 1-5',
      'Confianza para continuar 1-5',
      'NPS 0-10',
    ],
    instructions: 'Aplicar luego de una primera sesion de 20 a 30 minutos. Registrar frases textuales y vincularlas con decisiones de onboarding, mapa de niveles y lenguaje utilizado.',
    version: 'v1',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UX-02',
    title: 'Guia de observacion de practica situacional',
    instrument_type: 'Guia de observacion',
    objective: 'Observar como el usuario interpreta preguntas situacionales y si la retroalimentacion explica el criterio de decision.',
    target_profile: 'Usuario en practica activa de dominios PMP, con dudas sobre criterios PMI versus experiencia laboral propia.',
    questions: [
      'Resolver una pregunta situacional y verbalizar el criterio elegido.',
      'Identificar si el feedback explica por que una alternativa es mejor que otra.',
      'Registrar donde aparece confusion entre experiencia personal y criterio PMI.',
      'Indicar si el usuario puede aplicar el concepto en una pregunta posterior.',
    ],
    scale_items: [
      'Claridad del feedback 1-5',
      'Transferencia a nuevo escenario 1-5',
      'Carga cognitiva percibida 1-5',
    ],
    instructions: 'Observar una sesion de practica o tutor socratico. No intervenir salvo para pedir verbalizacion del razonamiento.',
    version: 'v1',
    status: 'activo',
  },
  {
    evidence_tag: 'INST-UX-03',
    title: 'Encuesta post-simulacro y cierre longitudinal',
    instrument_type: 'Encuesta post-prueba',
    objective: 'Medir percepcion de utilidad, confianza y necesidad de trazabilidad luego de simulaciones cortas y completas.',
    target_profile: 'Usuario que completo al menos una simulacion corta y una simulacion completa o avanzada.',
    questions: [
      'Que evidencia te ayuda a reconocer tu mejora entre intentos?',
      'Que tan util fue ver simulaciones de distinta duracion?',
      'Que informacion deberia conservar el administrador para justificar mejoras de producto?',
      'Recomendarias la herramienta a otro aspirante PMP?',
    ],
    scale_items: [
      'Utilidad percibida 1-5',
      'Facilidad de uso 1-5',
      'Confianza frente al examen 1-5',
      'NPS 0-10',
    ],
    instructions: 'Aplicar al cierre de una prueba longitudinal. Asociar cada respuesta con el historico de uso y simulaciones del usuario.',
    version: 'v1',
    status: 'activo',
  },
];

const sessions = [
  {
    email: USER_EMAILS.eduardo,
    instrument_tag: 'INST-UX-01',
    session_date: '2026-03-07 14:00:00.000Z',
    session_type: 'Entrevista semi-estructurada',
    context: 'Entrevista posterior a la primera semana de uso, enfocada en onboarding, comprension del mapa de niveles y motivacion inicial.',
    feedback: 'El usuario indico que necesitaba una ruta concreta de estudio porque el temario PMP le resultaba demasiado amplio. Valoro que la aplicacion mostrara progreso por niveles y que las explicaciones no asumieran conocimiento previo.',
    pain_points: [
      'El usuario no sabia por donde comenzar si solo se le presentaba un chat libre.',
      'La terminologia PMP generaba ansiedad cuando aparecia sin ejemplos situacionales.',
      'El progreso debia ser visible para sostener sesiones cortas entre semana.',
    ],
    design_decisions: [
      'Priorizar dashboard con ruta de aprendizaje por niveles antes que una experiencia exclusivamente conversacional.',
      'Mantener modos guiados para leccion, practica y examen por tema.',
      'Mostrar metricas de progreso, racha y niveles completados.',
    ],
    nps: 8,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Reforzar microcopy de bienvenida y relacionar niveles con objetivos de estudio.',
    evidence_tag: 'UX-EDU-01',
  },
  {
    email: USER_EMAILS.eduardo,
    instrument_tag: 'INST-UX-02',
    session_date: '2026-04-06 15:30:00.000Z',
    session_type: 'Observacion de uso',
    context: 'Observacion durante practica de interesados y riesgos, con foco en comprension de respuestas incorrectas.',
    feedback: 'El usuario destaco que la retroalimentacion explicativa era mas util que saber solo si una respuesta estaba bien o mal. Pidio que las respuestas incluyeran el criterio de decision y no solo la opcion correcta.',
    pain_points: [
      'Las respuestas tipo test sin explicacion no ayudaban a corregir el razonamiento.',
      'El usuario confundia experiencia laboral previa con criterio esperado por PMI.',
      'Necesitaba ejemplos cortos para transferir conceptos a situaciones nuevas.',
    ],
    design_decisions: [
      'Mantener feedback inmediato con explicacion de alternativas.',
      'Usar tutor socratico para obligar a justificar criterios antes de revelar la respuesta.',
      'Incluir ejemplos situacionales en modos de practica.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Agregar mas preguntas situacionales por dominio y preservar feedback detallado.',
    evidence_tag: 'UX-EDU-02',
  },
  {
    email: USER_EMAILS.eduardo,
    instrument_tag: 'INST-UX-03',
    session_date: '2026-05-12 13:00:00.000Z',
    session_type: 'Encuesta post-prueba',
    context: 'Encuesta y cierre posterior al simulacro completo de 180 preguntas.',
    feedback: 'El usuario expreso mayor confianza para reconocer distractores y administrar el tiempo del simulacro. Tambien sugirio conservar el historial de intentos para ver evolucion entre simulaciones cortas y completas.',
    pain_points: [
      'Sin historico, era dificil explicar la mejora entre intentos.',
      'El simulacro completo necesitaba verse como parte de un recorrido y no como un evento aislado.',
      'El usuario queria comparar resultados de simulaciones de distinta duracion.',
    ],
    design_decisions: [
      'Mostrar historico de simulaciones con fecha, cantidad de preguntas y score.',
      'Agregar vista admin de historico de uso para consolidar evidencia longitudinal.',
      'Persistir fechas pedagogicas de simulacion mediante started_at y completed_at.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Usar historico para justificar decisiones de diseno en el informe final.',
    evidence_tag: 'UX-EDU-03',
  },
  {
    email: USER_EMAILS.carlos,
    instrument_tag: 'INST-UX-01',
    session_date: '2026-02-03 18:00:00.000Z',
    session_type: 'Revision de prototipo',
    context: 'Revision temprana del prototipo con foco en claridad de navegacion, modos de estudio y acceso desde escritorio.',
    feedback: 'El usuario valoro poder alternar entre chat general, practicas por tema y simulaciones. Señalo que la herramienta debia reducir la carga de decidir que estudiar cada dia.',
    pain_points: [
      'Demasiadas opciones sin jerarquia podian dispersar el estudio.',
      'El usuario necesitaba retomar rapidamente la ultima actividad.',
      'La diferencia entre modos de estudio debia ser evidente desde la interfaz.',
    ],
    design_decisions: [
      'Organizar la navegacion lateral con recientes y estructura completa.',
      'Diferenciar modos de practica, leccion, debate, formulas y simulacion.',
      'Conservar ultima actividad para continuidad entre sesiones.',
    ],
    nps: 8,
    usefulness_score: 4,
    usability_score: 4,
    follow_up: 'Mantener navegacion lateral compacta y accesos rapidos a modos principales.',
    evidence_tag: 'UX-CAR-01',
  },
  {
    email: USER_EMAILS.carlos,
    instrument_tag: 'INST-UX-03',
    session_date: '2026-02-06 19:30:00.000Z',
    session_type: 'Prueba de usabilidad',
    context: 'Prueba con simulaciones cortas de 30, 45 y 90 preguntas antes de ejecutar el simulacro completo.',
    feedback: 'El usuario indico que las simulaciones cortas eran necesarias para practicar sin bloquear dos o tres horas. Considero util aumentar gradualmente la cantidad de preguntas antes del simulacro real.',
    pain_points: [
      'Un examen completo como primer paso resultaba intimidante.',
      'El usuario queria medir progreso sin comprometer una sesion extensa.',
      'La carga cognitiva aumentaba cuando la practica no tenia pausas naturales.',
    ],
    design_decisions: [
      'Ofrecer simulaciones de 15, 30, 45, 90, 135 y 180 preguntas.',
      'Usar progresion gradual antes del simulacro completo.',
      'Mostrar resultados comparables entre intentos cortos y extensos.',
    ],
    nps: 9,
    usefulness_score: 5,
    usability_score: 4,
    follow_up: 'Mantener variantes de simulacion corta en el panel de practica.',
    evidence_tag: 'UX-CAR-02',
  },
  {
    email: USER_EMAILS.carlos,
    instrument_tag: 'INST-UX-03',
    session_date: '2026-02-09 12:30:00.000Z',
    session_type: 'Entrevista semi-estructurada',
    context: 'Entrevista posterior al simulacro completo, orientada a percepcion de confianza, trazabilidad y utilidad para el informe.',
    feedback: 'El usuario remarco que la herramienta ayudaba a detectar patrones de error y que el administrador necesitaba una vista separada para documentar hallazgos sin interferir con la experiencia del estudiante.',
    pain_points: [
      'El feedback cualitativo quedaba disperso fuera de la aplicacion.',
      'El rol admin no debia iniciar chats porque su objetivo era seguimiento y analisis.',
      'Las decisiones de diseno necesitaban trazabilidad hacia evidencia de usuarios.',
    ],
    design_decisions: [
      'Restringir usuarios admin al dashboard.',
      'Crear modulo admin para registrar sesiones de feedback y decisiones derivadas.',
      'Relacionar evidencia UX con usuarios, fechas y etiquetas citables en el informe.',
    ],
    nps: 10,
    usefulness_score: 5,
    usability_score: 5,
    follow_up: 'Incorporar tabla de evidencia UX en el Capitulo 6 del informe final.',
    evidence_tag: 'UX-CAR-03',
  },
];

async function main() {
  await authAsAdmin();
  await ensureCollection();
  const instrumentsByTag = await seedInstruments();

  const users = await pb.collection('users').getFullList({
    filter: Object.values(USER_EMAILS).map((email) => `email="${email}"`).join(' || '),
    fields: 'id,email,name,role',
  });
  const usersByEmail = new Map(users.map((user) => [user.email, user]));
  const admin = usersByEmail.get(USER_EMAILS.admin);

  for (const session of sessions) {
    const user = usersByEmail.get(session.email);
    if (!user) {
      console.warn(`No existe el usuario ${session.email}; se omite ${session.evidence_tag}.`);
      continue;
    }

    const existing = await pb.collection('user_research_sessions').getFirstListItem(`evidence_tag="${session.evidence_tag}"`).catch(() => null);
    const data = {
      user: user.id,
      admin: admin?.id || '',
      instrument: instrumentsByTag.get(session.instrument_tag)?.id || '',
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
    };

    if (existing) {
      await pb.collection('user_research_sessions').update(existing.id, data);
      console.log(`Actualizada ${session.evidence_tag}`);
    } else {
      await pb.collection('user_research_sessions').create(data);
      console.log(`Creada ${session.evidence_tag}`);
    }
  }

  console.log('Sesiones sinteticas de investigacion de usuarios cargadas.');
}

async function seedInstruments() {
  const instrumentsByTag = new Map();

  for (const instrument of instruments) {
    const existing = await pb.collection('user_research_instruments').getFirstListItem(`evidence_tag="${instrument.evidence_tag}"`).catch(() => null);
    const data = {
      title: instrument.title,
      instrument_type: instrument.instrument_type,
      objective: instrument.objective,
      target_profile: instrument.target_profile,
      questions: instrument.questions,
      scale_items: instrument.scale_items,
      instructions: instrument.instructions,
      evidence_tag: instrument.evidence_tag,
      version: instrument.version,
      status: instrument.status,
    };

    const record = existing
      ? await pb.collection('user_research_instruments').update(existing.id, data)
      : await pb.collection('user_research_instruments').create(data);

    instrumentsByTag.set(instrument.evidence_tag, record);
    console.log(`${existing ? 'Actualizado' : 'Creado'} instrumento ${instrument.evidence_tag}`);
  }

  return instrumentsByTag;
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

async function ensureCollection() {
  const usersCollection = await pb.collections.getOne('users');
  const instrumentsCollection = await ensureInstrumentCollection();
  const existing = await pb.collections.getOne('user_research_sessions').catch(() => null);
  const fields = [
    { name: 'user', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: true },
    { name: 'admin', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: false },
    { name: 'instrument', type: 'relation', collectionId: instrumentsCollection.id, maxSelect: 1, required: false },
    { name: 'session_date', type: 'date', required: true },
    { name: 'session_type', type: 'text', required: true },
    { name: 'context', type: 'text', required: false },
    { name: 'feedback', type: 'text', required: true },
    { name: 'pain_points', type: 'json', required: false },
    { name: 'design_decisions', type: 'json', required: false },
    { name: 'nps', type: 'number', required: false },
    { name: 'usefulness_score', type: 'number', required: false },
    { name: 'usability_score', type: 'number', required: false },
    { name: 'follow_up', type: 'text', required: false },
    { name: 'evidence_tag', type: 'text', required: false },
  ];
  const rules = {
    listRule: ADMIN_ROLE_RULE,
    viewRule: ADMIN_ROLE_RULE,
    createRule: ADMIN_ROLE_RULE,
    updateRule: ADMIN_ROLE_RULE,
    deleteRule: ADMIN_ROLE_RULE,
  };

  if (!existing) {
    await pb.collections.create({
      name: 'user_research_sessions',
      type: 'base',
      fields,
      ...rules,
    });
    return;
  }

  const mergedFields = [...existing.fields];
  for (const field of fields) {
    const index = mergedFields.findIndex((current) => current.name === field.name);
    if (index === -1) {
      mergedFields.push(field);
    } else {
      mergedFields[index] = { ...mergedFields[index], ...field };
    }
  }

  await pb.collections.update(existing.id, {
    fields: mergedFields,
    ...rules,
  });
}

async function ensureInstrumentCollection() {
  const existing = await pb.collections.getOne('user_research_instruments').catch(() => null);
  const fields = [
    { name: 'title', type: 'text', required: true },
    { name: 'instrument_type', type: 'text', required: true },
    { name: 'objective', type: 'text', required: false },
    { name: 'target_profile', type: 'text', required: false },
    { name: 'questions', type: 'json', required: false },
    { name: 'scale_items', type: 'json', required: false },
    { name: 'instructions', type: 'text', required: false },
    { name: 'evidence_tag', type: 'text', required: false },
    { name: 'version', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ];
  const rules = {
    listRule: ADMIN_ROLE_RULE,
    viewRule: ADMIN_ROLE_RULE,
    createRule: ADMIN_ROLE_RULE,
    updateRule: ADMIN_ROLE_RULE,
    deleteRule: ADMIN_ROLE_RULE,
  };

  if (!existing) {
    return await pb.collections.create({
      name: 'user_research_instruments',
      type: 'base',
      fields,
      ...rules,
    });
  }

  const mergedFields = [...existing.fields];
  for (const field of fields) {
    const index = mergedFields.findIndex((current) => current.name === field.name);
    if (index === -1) {
      mergedFields.push(field);
    } else {
      mergedFields[index] = { ...mergedFields[index], ...field };
    }
  }

  await pb.collections.update(existing.id, {
    fields: mergedFields,
    ...rules,
  });

  return await pb.collections.getOne('user_research_instruments');
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
  console.error('No se pudieron cargar sesiones de investigacion de usuarios.');
  console.error(error);
  process.exit(1);
});
