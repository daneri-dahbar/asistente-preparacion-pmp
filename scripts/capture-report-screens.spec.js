const { test, chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

loadEnvFile(path.resolve(__dirname, '..', '.env.local'));

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase-asistente-pmp.acostaparra.com/';
const ADMIN_EMAIL = process.env.CAPTURE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.CAPTURE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;
const AUTH_COLLECTION = process.env.CAPTURE_AUTH_COLLECTION || 'users';
const FIGURES_DIR = process.env.FIGURES_DIR || 'C:/Daneri-Dahbar/informe-final-asistente-preparacion-pmp/figuras';

async function authWithPassword() {
  for (const collection of [AUTH_COLLECTION, '_superusers']) {
    const response = await fetch(`${PB_URL.replace(/\/$/, '')}/api/collections/${collection}/auth-with-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (response.ok) return response.json();
  }

  throw new Error('PocketBase auth failed for users and _superusers collections');
}

async function getUserByEmail(token, email) {
  const params = new URLSearchParams({
    page: '1',
    perPage: '1',
    filter: `email = "${email}"`,
  });
  const response = await fetch(`${PB_URL.replace(/\/$/, '')}/api/collections/users/records?${params}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`PocketBase user lookup failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const user = result.items?.[0];
  if (!user) throw new Error(`User not found: ${email}`);
  return user;
}

async function preparePage(page, auth, options = {}) {
  await page.addInitScript(({ authPayload, onboardingUserId }) => {
    localStorage.setItem('pocketbase_auth', JSON.stringify(authPayload));
    if (onboardingUserId) {
      localStorage.setItem(`onboarding_seen_${onboardingUserId}`, 'true');
    }
  }, {
    authPayload: auth,
    onboardingUserId: options.onboardingUserId,
  });

  await page.goto(`${APP_URL}/welcome`, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `
      [aria-label="Open Next.js Dev Tools"],
      nextjs-portal {
        display: none !important;
      }
      body {
        background: #f9fafb !important;
      }
    `,
  });
  await page.waitForSelector(`text=${options.waitText || 'Datos de la plataforma'}`, { timeout: 20000 });
}

async function screenshot(page, fileName) {
  await page.screenshot({
    path: `${FIGURES_DIR}/${fileName}`,
    fullPage: false,
    animations: 'disabled',
  });
}

test('capture updated report screenshots', async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('CAPTURE_ADMIN_EMAIL/CAPTURE_ADMIN_PASSWORD or POCKETBASE_ADMIN_EMAIL/POCKETBASE_ADMIN_PASSWORD are required');
  }

  const auth = await authWithPassword();
  const adminUser = await getUserByEmail(auth.token, 'trabajofinalunca@gmail.com');
  const carlosUser = await getUserByEmail(auth.token, 'carlosacostap@tecno.unca.edu.ar');
  const eduardoUser = await getUserByEmail(auth.token, 'educlerici@gmail.com');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const adminContext = await browser.newContext({
    viewport: { width: 1920, height: 940 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  });

  const page = await adminContext.newPage();
  await preparePage(page, { token: auth.token, record: adminUser });

  await screenshot(page, 'navegacion_y_panel_de_control.png');

  await page.getByRole('button', { name: /^Usuarios/ }).click();
  await page.waitForSelector('text=Historico de uso por usuario', { timeout: 10000 });
  await page.locator('select').first().selectOption(carlosUser.id);
  await page.waitForSelector('text=180 preguntas', { timeout: 10000 });
  await page.waitForSelector('text=151/180', { timeout: 10000 });
  await page.waitForTimeout(600);
  await screenshot(page, 'evidencia_historico_usuario_admin.png');

  await page.getByRole('button', { name: /Investigacion UX/ }).click();
  await page.waitForSelector('text=Investigacion UX por usuario', { timeout: 10000 });
  await page.locator('select').first().selectOption(eduardoUser.id);
  await page.waitForTimeout(600);
  await screenshot(page, 'elementos_de_ayuda_y_motivacion.png');

  await adminContext.close();

  const userContext = await browser.newContext({
    viewport: { width: 1920, height: 940 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  });
  const userPage = await userContext.newPage();
  await preparePage(userPage, { token: auth.token, record: eduardoUser }, {
    onboardingUserId: eduardoUser.id,
    waitText: 'Hola, Eduardo',
  });

  await userPage.getByText('Repaso final - Estrategia de simulacro').first().click();
  await userPage.waitForSelector('text=Estoy listo para el simulacro largo', { timeout: 10000 });
  await userPage.waitForTimeout(600);
  await screenshot(userPage, 'el_chat_inteligente.png');

  await userPage.getByText('Tutor socratico - Riesgos e incertidumbre').first().click();
  await userPage.waitForSelector('text=Si no puedes eliminar la incertidumbre', { timeout: 10000 });
  await userPage.waitForTimeout(500);
  await screenshot(userPage, 'eval_escenario1_chat.png');

  await userPage.getByText('Debate - Agile vs predictivo').first().click();
  await userPage.waitForSelector('text=Postura provocadora', { timeout: 10000 });
  await userPage.waitForTimeout(500);
  await screenshot(userPage, 'eval_escenario2_chat.png');

  await userPage.getByText('Entrenador formulas - Valor ganado').first().click();
  await userPage.waitForSelector('text=TCPI=', { timeout: 10000 });
  await userPage.waitForTimeout(500);
  await screenshot(userPage, 'eval_escenario3_chat.png');

  await userPage.getByRole('button', { name: 'Inicio' }).click();
  await userPage.getByRole('button', { name: /Simulaci[oó]n Examen/ }).click();
  await userPage.waitForSelector('text=Reporte de Progreso', { timeout: 10000 });
  await userPage.waitForTimeout(600);
  await screenshot(userPage, 'simulador_de_examen.png');

  await userContext.close();
  await browser.close();
});

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
