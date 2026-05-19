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

const USER_EMAIL = 'educlerici@gmail.com';
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const chats = [
  {
    title: 'Diagnostico inicial - plan de estudio PMP',
    mode: 'standard',
    last_active: '2026-03-04 22:15:00.000Z',
    messages: [
      ['user', 'Necesito organizar una preparacion PMP desde cero. Quiero un plan realista de 10 semanas.'],
      ['assistant', 'Propongo una ruta en tres bloques: fundamentos PMBOK, practica por dominios ECO y simulacros progresivos. La clave sera alternar teoria, casos situacionales y revision de errores.'],
      ['user', 'Tengo 45 a 60 minutos por dia y mas tiempo los sabados.'],
      ['assistant', 'Entonces conviene usar sesiones cortas para conceptos y reservar sabados para simulaciones. Empezaremos con principios, entrega de valor e interesados.'],
    ],
  },
  {
    title: 'Leccion - Principios de direccion',
    mode: 'level_lesson:Principios de Dirección',
    last_active: '2026-03-08 20:40:00.000Z',
    messages: [
      ['user', 'Explicame los principios de direccion y como se usan en preguntas situacionales.'],
      ['assistant', 'Los principios funcionan como criterios de decision. En preguntas PMP ayudan a elegir respuestas que preservan valor, colaboracion, adaptacion, calidad y transparencia.'],
    ],
  },
  {
    title: 'Practica - Interesados dificiles',
    mode: 'level_practice:Interesados',
    last_active: '2026-03-13 23:05:00.000Z',
    messages: [
      ['user', 'Dame un escenario dificil de interesados y evaluame como PM.'],
      ['assistant', 'Un sponsor exige recortar pruebas para llegar antes a mercado, mientras calidad advierte defectos criticos. Decide como balancear valor, riesgos, comunicacion y gobernanza.'],
      ['user', 'Primero revisaria impacto y convocaria a sponsor, calidad y equipo tecnico con alternativas.'],
      ['assistant', 'Correcto. Evitas decidir solo y habilitas una conversacion basada en datos, riesgos y criterios de aceptacion.'],
    ],
  },
  {
    title: 'Tutor socratico - Riesgos e incertidumbre',
    mode: 'socratic',
    last_active: '2026-03-18 21:30:00.000Z',
    messages: [
      ['user', 'Quiero revisar riesgos, pero no me des definiciones directas.'],
      ['assistant', 'Si no puedes eliminar la incertidumbre, ¿que informacion minima necesitarias para decidir una respuesta adecuada?'],
      ['user', 'Probabilidad, impacto, proximidad y responsables.'],
      ['assistant', 'Bien. Ahora piensa: ¿cuando conviene escalar un riesgo y cuando gestionarlo dentro del equipo?'],
    ],
  },
  {
    title: 'Entrenador formulas - Valor ganado',
    mode: 'math',
    last_active: '2026-03-24 22:55:00.000Z',
    messages: [
      ['user', 'Practiquemos CPI, SPI, EAC y TCPI con un caso.'],
      ['assistant', 'Caso: EV=58.000, AC=64.000, PV=70.000 y BAC=140.000. CPI=0,91 y SPI=0,83. El proyecto esta sobre presupuesto y atrasado.'],
      ['user', '¿Como interpreto TCPI?'],
      ['assistant', 'TCPI=(BAC-EV)/(BAC-AC)=82.000/76.000=1,08. Necesitas mejorar la eficiencia del trabajo restante para terminar dentro del presupuesto.'],
    ],
  },
  {
    title: 'Debate - Agile vs predictivo',
    mode: 'debate',
    last_active: '2026-04-01 23:10:00.000Z',
    messages: [
      ['user', 'Defiende una postura extrema: en agile no hace falta documentar nada.'],
      ['assistant', 'Postura provocadora: si el equipo entrega software funcionando, cualquier documento es desperdicio. Refutalo usando criterios PMP de trazabilidad, cumplimiento y transferencia de conocimiento.'],
      ['user', 'No toda documentacion es burocracia; depende del valor y del contexto regulatorio.'],
      ['assistant', 'Muy bien. La respuesta PMP suele favorecer documentacion suficiente, util y adaptada, no ausencia total ni exceso.'],
    ],
  },
  {
    title: 'Caso de estudio - Recuperacion de proyecto atrasado',
    mode: 'case_study',
    last_active: '2026-04-09 20:50:00.000Z',
    messages: [
      ['user', 'Planteame un caso de proyecto atrasado con conflicto de recursos.'],
      ['assistant', 'Proyecto ERP: dos modulos criticos dependen del mismo equipo senior, el CPI es 0,94 y el SPI 0,78. Finanzas exige reducir costo, pero operaciones necesita mantener alcance. Diagnostica causa raiz.'],
      ['user', 'Veo cuello de botella de recursos y priorizacion poco clara entre modulos.'],
      ['assistant', 'Exacto. La respuesta fuerte incluye replanificacion, negociacion de prioridades, analisis de ruta critica y comunicacion con interesados clave.'],
    ],
  },
  {
    title: 'Taller - Acta de constitucion',
    mode: 'workshop',
    last_active: '2026-04-16 22:20:00.000Z',
    messages: [
      ['user', 'Ayudame a redactar un project charter para un sistema de turnos hospitalarios.'],
      ['assistant', 'Empecemos por proposito y necesidad de negocio: reducir tiempos de espera, mejorar asignacion de recursos y aumentar trazabilidad de atencion.'],
      ['user', 'Tambien debe cumplir requisitos de privacidad de pacientes.'],
      ['assistant', 'Perfecto. Eso incorpora restricciones regulatorias y criterios de exito no funcionales, especialmente seguridad y confidencialidad.'],
    ],
  },
  {
    title: 'Quiz ECO - Personas',
    mode: 'quiz',
    last_active: '2026-04-24 19:45:00.000Z',
    messages: [
      ['user', 'Tomame preguntas rapidas del dominio Personas.'],
      ['assistant', 'Pregunta: un conflicto entre dos especialistas bloquea una entrega. ¿Que haces primero? A) Escalar B) Facilitar dialogo C) Cambiar recursos D) Sancionar. Mejor respuesta: B.'],
      ['user', 'B, porque primero debo abordar el conflicto y buscar colaboracion.'],
      ['assistant', 'Correcto. PMP favorece resolver colaborativamente antes de escalar, salvo riesgo urgente o imposibilidad de acuerdo.'],
    ],
  },
  {
    title: 'Repaso final - Estrategia de simulacro',
    mode: 'standard',
    last_active: '2026-05-10 21:05:00.000Z',
    messages: [
      ['user', 'Estoy listo para el simulacro largo. Dame estrategia de tiempo y revision.'],
      ['assistant', 'Divide en bloques de 60 preguntas. Marca mentalmente dudas, no te estanques mas de 90 segundos y revisa patrones: cambio, conflicto, riesgo, valor y siguiente mejor accion.'],
    ],
  },
];

const simulations = [
  { total: 10, correct: 6, type: 'synthetic_2026_03_06_10_questions', started_at: '2026-03-06 21:00:00.000Z', completed_at: '2026-03-06 21:14:00.000Z' },
  { total: 15, correct: 10, type: 'synthetic_2026_03_12_15_questions', started_at: '2026-03-12 22:05:00.000Z', completed_at: '2026-03-12 22:28:00.000Z' },
  { total: 30, correct: 22, type: 'synthetic_2026_03_22_30_questions', started_at: '2026-03-22 18:10:00.000Z', completed_at: '2026-03-22 18:56:00.000Z' },
  { total: 45, correct: 34, type: 'synthetic_2026_04_05_45_questions', started_at: '2026-04-05 19:00:00.000Z', completed_at: '2026-04-05 20:08:00.000Z' },
  { total: 60, correct: 47, type: 'synthetic_2026_04_18_60_questions', started_at: '2026-04-18 16:30:00.000Z', completed_at: '2026-04-18 17:58:00.000Z' },
  { total: 90, correct: 72, type: 'synthetic_2026_04_26_90_questions', started_at: '2026-04-26 15:00:00.000Z', completed_at: '2026-04-26 17:05:00.000Z' },
  { total: 135, correct: 108, type: 'synthetic_2026_05_03_135_questions', started_at: '2026-05-03 14:10:00.000Z', completed_at: '2026-05-03 17:08:00.000Z' },
  { total: 180, correct: 147, type: 'synthetic_2026_05_11_180_questions', started_at: '2026-05-11 13:00:00.000Z', completed_at: '2026-05-11 16:42:00.000Z' },
];

async function main() {
  await authAsAdmin();
  await ensureSimulationDateFields();

  const user = await getFirst('users', `email="${USER_EMAIL}"`);
  if (!user) {
    throw new Error(`No existe el usuario ${USER_EMAIL}`);
  }

  for (const chatSeed of chats) {
    await upsertChatWithMessages(user.id, chatSeed);
  }

  for (const simulation of simulations) {
    await upsertSimulation(user.id, simulation);
  }

  await upsertProgress(user.id);

  console.log(`Histórico completo sintético cargado para ${USER_EMAIL}.`);
}

async function upsertChatWithMessages(userId, chatSeed) {
  const existing = await getFirst('chats', `user="${userId}" && title="${chatSeed.title}"`);
  const data = {
    user: userId,
    title: chatSeed.title,
    mode: chatSeed.mode,
    last_active: chatSeed.last_active,
  };

  const chat = existing
    ? await pb.collection('chats').update(existing.id, data, { requestKey: null })
    : await pb.collection('chats').create(data, { requestKey: null });

  const oldMessages = await pb.collection('messages').getFullList({
    filter: `chat="${chat.id}"`,
    requestKey: null,
  });

  for (const message of oldMessages) {
    await pb.collection('messages').delete(message.id, { requestKey: null });
  }

  for (const [index, [role, content]] of chatSeed.messages.entries()) {
    await pb.collection('messages').create({
      user: userId,
      chat: chat.id,
      role,
      content: `[${chatSeed.last_active.slice(0, 10)} #${index + 1}] ${content}`,
    }, { requestKey: null });
  }
}

async function upsertSimulation(userId, simulation) {
  const existing = await getFirst('simulations', `user="${userId}" && type="${simulation.type}"`);
  const questions = buildQuestions(simulation.total, simulation.type);
  const answers = Object.fromEntries(questions.map((question, index) => [
    question.id,
    index < simulation.correct ? question.correctAnswer : nextWrongAnswer(question.correctAnswer),
  ]));

  const data = {
    user: userId,
    status: 'completed',
    type: simulation.type,
    total_questions: simulation.total,
    current_index: simulation.total,
    questions,
    answers,
    score: simulation.correct,
    started_at: simulation.started_at,
    completed_at: simulation.completed_at,
  };

  if (existing) {
    return pb.collection('simulations').update(existing.id, data, { requestKey: null });
  }

  return pb.collection('simulations').create(data, { requestKey: null });
}

async function upsertProgress(userId) {
  const totalQuestions = simulations.reduce((sum, item) => sum + item.total, 0);
  const correctAnswers = simulations.reduce((sum, item) => sum + item.correct, 0);
  const existing = await getFirst('user_progress', `user="${userId}"`);
  const data = {
    user: userId,
    completed_levels: [
      '1-0', '1-1', '1-2',
      '2-0', '2-1', '2-2', '2-3', '2-4',
      '4-0', '4-1', '4-2', '4-3',
      '5-0', '5-1', '5-2', '5-3', '5-4',
      '7-0', '7-1', '7-2',
      '8-0', '8-1', '8-2', '8-3',
      '10-0', '10-1', '10-2', '10-3', '10-4',
      '14-0', '14-1', '14-2',
      '16-0', '16-1', '16-2', '16-3', '16-4',
      '17-0', '17-1', '17-2', '17-3', '17-4',
      '18-0', '18-1', '18-2',
    ],
    stats: {
      total_xp: 7350,
      accuracy: `${Math.round((correctAnswers / totalQuestions) * 100)}%`,
      streak: 18,
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      syntheticUsage: {
        source: 'Carga sintética solicitada para simular histórico completo de uso',
        periodStart: '2026-03-04',
        periodEnd: '2026-05-11',
        studySessions: 38,
        chatSessions: chats.length,
        completedSimulations: simulations.length,
        minutesStudied: 2840,
        dominantModes: ['standard', 'level_practice', 'math', 'quiz', 'case_study'],
        strongestDomains: ['Personas', 'Procesos'],
        improvementTrend: simulations.map((item) => ({
          date: item.completed_at.slice(0, 10),
          totalQuestions: item.total,
          scorePercent: Number(((item.correct / item.total) * 100).toFixed(2)),
        })),
      },
    },
  };

  if (existing) {
    return pb.collection('user_progress').update(existing.id, data, { requestKey: null });
  }

  return pb.collection('user_progress').create(data, { requestKey: null });
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

function buildQuestions(total, type) {
  const domains = ['Personas', 'Procesos', 'Entorno Empresarial'];
  return Array.from({ length: total }, (_, index) => {
    const domain = domains[index % domains.length];
    const number = index + 1;
    return {
      id: `${type}_q_${String(number).padStart(3, '0')}`,
      text: `Pregunta situacional ${number}/${total}: selecciona la mejor accion considerando el dominio ${domain}.`,
      options: [
        { id: 'A', text: 'Actuar de inmediato sin consultar para proteger el cronograma.' },
        { id: 'B', text: 'Analizar el contexto, involucrar a las partes adecuadas y decidir con informacion suficiente.' },
        { id: 'C', text: 'Escalar siempre al patrocinador antes de actuar.' },
        { id: 'D', text: 'Esperar a que el problema se resuelva naturalmente.' },
      ],
      correctAnswer: 'B',
      explanation: `La opcion B prioriza juicio situacional, colaboracion y entrega de valor dentro del dominio ${domain}.`,
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
      // PocketBase nuevo usa _superusers.
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
  console.error('No se pudo cargar el historico sintético.');
  console.error(JSON.stringify(error?.response?.data || error?.data || error, null, 2));
  console.error(error?.message || error);
  process.exit(1);
});
