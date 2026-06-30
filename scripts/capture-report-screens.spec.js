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
  await page.waitForSelector(`text=${options.waitText || 'Resumen'}`, { timeout: 20000 });
}

async function screenshot(page, fileName) {
  await page.screenshot({
    path: `${FIGURES_DIR}/${fileName}`,
    fullPage: false,
    animations: 'disabled',
  });
}

test('capture updated report screenshots', async () => {
  test.setTimeout(120000);

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('CAPTURE_ADMIN_EMAIL/CAPTURE_ADMIN_PASSWORD or POCKETBASE_ADMIN_EMAIL/POCKETBASE_ADMIN_PASSWORD are required');
  }

  const auth = await authWithPassword();
  const adminUser = await getUserByEmail(auth.token, 'trabajofinalunca@gmail.com');
  const usuarioAUser = await getUserByEmail(auth.token, process.env.USUARIO_A_EMAIL || 'usuario.a.pmi@gmail.com');
  const usuarioBUser = await getUserByEmail(auth.token, process.env.USUARIO_B_EMAIL || 'usuario.b.pmi@gmail.com');
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
  await page.waitForSelector('text=Histórico de uso por usuario', { timeout: 10000 });
  await page.locator('select').first().selectOption(usuarioBUser.id);
  await page.waitForSelector('text=180 preguntas', { timeout: 10000 });
  await page.waitForSelector('text=158/180', { timeout: 10000 });
  await page.waitForTimeout(600);
  await screenshot(page, 'evidencia_historico_usuario_admin.png');

  await page.getByRole('button', { name: /Investigaci[oó]n UX/ }).click();
  await page.waitForSelector('text=Investigación UX por usuario', { timeout: 10000 });
  await page.locator('select').first().selectOption(usuarioAUser.id);
  await page.waitForSelector('text=UX-UA', { timeout: 10000 });
  await page.waitForTimeout(600);
  await screenshot(page, 'elementos_de_ayuda_y_motivacion.png');

  await adminContext.close();

  const userContext = await browser.newContext({
    viewport: { width: 1920, height: 940 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  });
  const userPage = await userContext.newPage();
  await preparePage(userPage, { token: auth.token, record: usuarioAUser }, {
    onboardingUserId: usuarioAUser.id,
    waitText: 'Usuario A',
  });

  await userPage.getByText('Lección: Propósito del Estándar').first().click();
  await userPage.waitForSelector('text=Lección Magistral', { timeout: 10000 });
  await userPage.evaluate(() => {
    const sidebar = document.querySelector('aside');
    for (const element of Array.from(document.querySelectorAll('*'))) {
      if (sidebar?.contains(element)) continue;
      const style = window.getComputedStyle(element);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && element.scrollHeight > element.clientHeight) {
        element.scrollTop = 0;
      }
    }
  });
  await userPage.waitForTimeout(600);
  await screenshot(userPage, 'el_chat_inteligente.png');

  await userPage.getByText('Entrenamiento: Entorno del Proyecto').first().click();
  await userPage.waitForSelector('text=nueva regulacion', { timeout: 10000 });
  await userPage.waitForTimeout(500);
  await screenshot(userPage, 'eval_escenario1_chat.png');

  await userPage.getByText('Leccion: Enfoques de Desarrollo').first().click();
  await userPage.waitForSelector('text=predictivo', { timeout: 10000 });
  await userPage.waitForTimeout(500);
  await screenshot(userPage, 'eval_escenario2_chat.png');

  await userPage.getByText('Entrenamiento: Enfoques de Desarrollo').first().click();
  await userPage.waitForSelector('text=infraestructura regulada', { timeout: 10000 });
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
