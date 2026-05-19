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

const expectedUsers = [
  'usuario.a.evaluacion@asistente-pmp.local',
  'usuario.b.evaluacion@asistente-pmp.local',
];
const DEFAULT_USER_ROLE = 'usuario';

const expectedChats = [
  'Evaluacion Escenario 1 - Riesgo e incertidumbre',
  'Evaluacion Escenario 2 - Dilema etico',
  'Evaluacion Escenario 3 - Calculo TCPI',
];

const results = [];

async function main() {
  await authAsAdmin();

  const users = await pb.collection('users').getFullList({
    filter: expectedUsers.map((email) => `email="${email}"`).join(' || '),
    sort: 'email',
  });
  record('Usuarios de evaluación creados', users.length === 2, `${users.length}/2 usuarios encontrados`);
  const usersWithDefaultRole = users.filter((user) => user.role === DEFAULT_USER_ROLE);
  record('Usuarios de evaluacion con rol usuario', usersWithDefaultRole.length === 2, `${usersWithDefaultRole.length}/2 usuarios con rol ${DEFAULT_USER_ROLE}`);

  const userB = users.find((user) => user.email === expectedUsers[1]);

  const chats = await pb.collection('chats').getFullList({
    filter: expectedChats.map((title) => `title="${title}"`).join(' || '),
    sort: 'title',
  });
  record('Chats de escenarios creados', chats.length === 3, `${chats.length}/3 chats encontrados`);

  let messageCount = 0;
  for (const chat of chats) {
    const messages = await pb.collection('messages').getFullList({
      filter: `chat="${chat.id}"`,
    });
    messageCount += messages.length;
  }
  record('Mensajes de escenarios cargados', messageCount >= 6, `${messageCount} mensajes encontrados`);

  const simulations = await pb.collection('simulations').getFullList({
    filter: 'type="Simulacro Real Completo (180 Preguntas)" && status="completed"',
    sort: '-updated',
  });
  const fullSimulation = simulations.find((simulation) => !userB || simulation.user === userB.id) || simulations[0];
  const fullSimulationOk = Boolean(fullSimulation)
    && fullSimulation.total_questions === 180
    && fullSimulation.current_index === 180
    && Number(fullSimulation.score) === 83.89;
  record(
    'Simulacro completo Usuario B',
    fullSimulationOk,
    fullSimulation
      ? `status=${fullSimulation.status}; preguntas=${fullSimulation.total_questions}; indice=${fullSimulation.current_index}; score=${fullSimulation.score}`
      : 'sin simulacro'
  );

  const progress = await pb.collection('user_progress').getFullList({
    filter: users.map((user) => `user="${user.id}"`).join(' || '),
  });
  const progressWithSurvey = progress.filter((item) => item.stats?.survey?.nps !== undefined);
  record('Resultados de encuesta en progreso', progressWithSurvey.length === 2, `${progressWithSurvey.length}/2 registros con survey`);

  for (const result of results) {
    console.log(`${result.ok ? 'OK' : 'FAIL'} - ${result.name}: ${result.detail}`);
  }

  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

async function authAsAdmin() {
  if (pb.admins?.authWithPassword) {
    await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    return;
  }

  await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
}

function record(name, ok, detail) {
  results.push({ name, ok, detail });
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
  console.error(error?.response?.data || error?.message || error);
  process.exit(1);
});
