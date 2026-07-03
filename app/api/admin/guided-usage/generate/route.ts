import PocketBase from 'pocketbase';
import { NextResponse } from 'next/server';
import { PHASE1_WORLDS, PHASE2_WORLDS, PHASE3_WORLDS, PHASE4_WORLDS, PHASE_ECO_WORLDS } from '@/lib/gameData';

export const maxDuration = 300;

interface PlatformUser {
    id: string;
    role?: string;
}

interface GuidedLevel {
    id: string;
    topic: string;
    worldName: string;
}

interface GuidedActivity {
    key: 'lesson' | 'practice' | 'oracle' | 'exam';
    label: string;
    modePrefix: 'level_lesson' | 'level_practice' | 'level_oracle' | 'level_exam';
    titlePrefix: string;
    startPrefix: 'START_LEVEL_LESSON' | 'START_LEVEL_PRACTICE' | 'START_LEVEL_ORACLE' | 'START_LEVEL_EXAM';
}

interface ChatResponse {
    content: string;
    chunkCount: number;
    firstChunkMs: number;
}

interface GuidedGeneratedMessage {
    role: 'assistant' | 'user';
    content: string;
}

interface ExistingGuidedContext {
    progressRecord: { id: string; completed_levels?: string[]; stats?: Record<string, unknown> } | null;
    completedLevelIds: string[];
    nextLevelIndex: number;
    lastActivity: Date | null;
}

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const GUIDED_WORLDS = [...PHASE1_WORLDS, ...PHASE2_WORLDS, ...PHASE3_WORLDS, ...PHASE4_WORLDS, ...PHASE_ECO_WORLDS];
const GUIDED_ACTIVITIES: GuidedActivity[] = [
    {
        key: 'lesson',
        label: 'Leccion Magistral',
        modePrefix: 'level_lesson',
        titlePrefix: 'Leccion',
        startPrefix: 'START_LEVEL_LESSON',
    },
    {
        key: 'practice',
        label: 'Entrenamiento Practico',
        modePrefix: 'level_practice',
        titlePrefix: 'Entrenamiento',
        startPrefix: 'START_LEVEL_PRACTICE',
    },
    {
        key: 'oracle',
        label: 'Oraculo',
        modePrefix: 'level_oracle',
        titlePrefix: 'Oraculo',
        startPrefix: 'START_LEVEL_ORACLE',
    },
    {
        key: 'exam',
        label: 'Prueba de Fuego',
        modePrefix: 'level_exam',
        titlePrefix: 'Examen',
        startPrefix: 'START_LEVEL_EXAM',
    },
];

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientPocketBaseError(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const maybeError = error as { status?: number; message?: string; originalError?: unknown };
    const message = String(maybeError.message || maybeError.originalError || '');

    return maybeError.status === 0
        || message.includes('fetch failed')
        || message.includes('ConnectTimeoutError')
        || message.includes('UND_ERR_CONNECT_TIMEOUT');
}

async function withPocketBaseRetry<T>(label: string, operation: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!isTransientPocketBaseError(error) || attempt === attempts) break;
            console.warn(`Reintentando operacion PocketBase (${label}) ${attempt + 1}/${attempts}`);
            await wait(750 * attempt);
        }
    }

    throw lastError;
}

function formatPocketBaseDate(date: Date) {
    return date.toISOString().replace('T', ' ');
}

function parseDate(value: unknown, fallback: Date) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T12:00:00.000Z`);
    }

    return fallback;
}

function buildGuidedLevels(): GuidedLevel[] {
    return GUIDED_WORLDS.flatMap((world) => (
        world.levels.map((topic, index) => ({
            id: `${world.id}-${index}`,
            topic,
            worldName: world.name,
        }))
    ));
}

function pseudoRandom(seed: number) {
    const value = Math.sin(seed * 9301 + 49297) * 233280;
    return value - Math.floor(value);
}

function minutesBetween(min: number, max: number, seed: number) {
    return Math.round(min + pseudoRandom(seed) * (max - min));
}

function buildGuidedActivitySchedule(levelCount: number, activitiesPerLevel: number, startDate: Date, endDate: Date) {
    const schedule: Date[] = [];
    const minimumActivityGapMs = 24 * 60 * 1000;
    const levelStartGapMs = 150 * 60 * 1000;
    const totalLevels = Math.max(1, levelCount);
    const rangeStart = startDate.getTime();
    const rangeEnd = endDate.getTime();
    const hasUsableRange = rangeEnd > rangeStart + levelStartGapMs * Math.max(1, totalLevels - 1);

    let cursor = new Date(startDate);

    for (let levelIndex = 0; levelIndex < levelCount; levelIndex += 1) {
        const distributedLevelStart = hasUsableRange
            ? new Date(rangeStart + ((rangeEnd - rangeStart) * levelIndex) / Math.max(1, totalLevels - 1))
            : cursor;
        const levelJitterMinutes = hasUsableRange ? minutesBetween(0, 65, levelIndex + 11) : 0;
        const levelStart = new Date(Math.max(cursor.getTime(), distributedLevelStart.getTime() + levelJitterMinutes * 60 * 1000));
        let activityCursor = new Date(levelStart);

        for (let activityIndex = 0; activityIndex < activitiesPerLevel; activityIndex += 1) {
            if (activityIndex > 0) {
                const activityGapMinutes = minutesBetween(32, 74, levelIndex * 17 + activityIndex * 23);
                activityCursor = new Date(activityCursor.getTime() + activityGapMinutes * 60 * 1000);
            }

            schedule.push(new Date(activityCursor));
        }

        const levelGapMinutes = minutesBetween(115, 310, levelIndex * 29 + 7);
        const minimumNextLevel = activityCursor.getTime() + minimumActivityGapMs + levelGapMinutes * 60 * 1000;
        cursor = new Date(minimumNextLevel);
    }

    return schedule;
}

function getLevelIndexById(levels: GuidedLevel[], levelId: string) {
    return levels.findIndex((level) => level.id === levelId);
}

function getLevelIndexByMode(levels: GuidedLevel[], mode?: string) {
    const [modePrefix, ...topicParts] = (mode || '').split(':');
    if (!GUIDED_ACTIVITIES.some((activity) => activity.modePrefix === modePrefix)) return -1;

    const topic = topicParts.join(':').trim();
    if (!topic) return -1;

    return levels.findIndex((level) => level.topic === topic);
}

function maxDateFromValues(values: Array<string | undefined | null>) {
    return values.reduce<Date | null>((latest, value) => {
        if (!value) return latest;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return latest;
        if (!latest || date.getTime() > latest.getTime()) return date;
        return latest;
    }, null);
}

async function getExistingGuidedContext(pb: PocketBase, userId: string, levels: GuidedLevel[]): Promise<ExistingGuidedContext> {
    const progressRecords = await withPocketBaseRetry('list existing guided progress', () => (
        pb.collection('user_progress').getFullList<{ id: string; completed_levels?: string[]; stats?: Record<string, unknown>; updated?: string; created?: string }>({
            filter: `user="${userId}"`,
            sort: '-updated',
            requestKey: null,
        })
    )).catch(() => []);
    const progressRecord = progressRecords[0] || null;
    const completedLevelIds = Array.from(new Set(
        progressRecords.flatMap((record) => Array.isArray(record.completed_levels) ? record.completed_levels : [])
    ));
    const progressMaxIndex = completedLevelIds.reduce((maxIndex, levelId) => (
        Math.max(maxIndex, getLevelIndexById(levels, levelId))
    ), -1);

    const guidedChats = await withPocketBaseRetry('list existing guided chats', () => (
        pb.collection('chats').getFullList<{ mode?: string; last_active?: string; updated?: string; created?: string }>({
            filter: `user="${userId}"`,
            fields: 'mode,last_active,updated,created',
            requestKey: null,
        })
    )).catch(() => []);
    const chatMaxIndex = guidedChats.reduce((maxIndex, chat) => (
        Math.max(maxIndex, getLevelIndexByMode(levels, chat.mode))
    ), -1);
    const lastActivity = maxDateFromValues(guidedChats.flatMap((chat) => [chat.last_active, chat.updated, chat.created]));

    return {
        progressRecord,
        completedLevelIds,
        nextLevelIndex: Math.max(progressMaxIndex, chatMaxIndex) + 1,
        lastActivity,
    };
}

function buildStartMessage(activity: GuidedActivity, topic: string) {
    return `${activity.startPrefix}: ${topic}`;
}

function buildUserPrompt(activity: GuidedActivity, topic: string, turnIndex: number) {
    const promptSets: Record<GuidedActivity['key'], string[]> = {
        lesson: [
            `Entiendo la idea general de ${topic}, pero quiero conectarla con una situacion real de examen PMP.`,
            `Dame un ejemplo situacional donde un project manager aplique ${topic} correctamente.`,
            `Cuales son los errores mas comunes que deberia evitar al estudiar ${topic}?`,
            `Podrias cerrarlo con un resumen accionable y una mini lista para repasar antes del examen?`,
            `Quiero profundizar un poco mas: como se relaciona ${topic} con los principios del PMBOK 7?`,
            `Ahora dame una analogia breve para recordar ${topic} con facilidad.`,
            `Si aparece una pregunta ambigua sobre ${topic}, que senales deberia buscar?`,
            `Dejame una pregunta final para verificar si comprendi el concepto.`,
        ],
        practice: [
            `Ante el escenario que planteaste, yo priorizaria analizar a los interesados y definir el siguiente paso con el equipo.`,
            `Creo que tambien revisaria restricciones, riesgos y supuestos antes de tomar una decision definitiva.`,
            `Si el patrocinador presiona por una solucion rapida, intentaria explicar el impacto y proponer alternativas.`,
            `Dame retroalimentacion concreta sobre mi respuesta y que cambiarias para que sea mas alineada al PMP.`,
            `Planteame una variante mas dificil del caso para practicar ${topic}.`,
            `Mi nueva respuesta seria ordenar la informacion, comunicar opciones y registrar la decision.`,
            `Como podria justificar esa decision usando lenguaje del PMBOK 7?`,
            `Cerrame la practica con tres aprendizajes clave y una recomendacion de estudio.`,
        ],
        oracle: [
            `Tengo una duda puntual: como distingo ${topic} de conceptos parecidos cuando la pregunta del examen esta redactada con matices?`,
            `Que pista del enunciado suele indicar que debo aplicar ${topic}?`,
            `Puedes compararlo con un caso agil o hibrido para no quedarme solo con un enfoque predictivo?`,
            `Que respuesta seria tentadora pero incorrecta en una pregunta sobre ${topic}?`,
            `Dame una regla practica para decidir rapido si ${topic} es relevante en el escenario.`,
            `Como se conectaria esto con liderazgo, entrega de valor o gestion de stakeholders?`,
            `Que debo memorizar y que debo razonar respecto de ${topic}?`,
            `Me gustaria cerrar con una explicacion breve como si fuera una ficha de estudio.`,
        ],
        exam: [
            'A',
            'B',
            'C',
            'Gracias. Antes de pasar al siguiente nivel, explicame por que la respuesta correcta era la mejor y confirma si pase el nivel.',
            'Quiero una ultima recomendacion para no fallar preguntas similares.',
            'Dame otra pregunta corta de refuerzo.',
            'B',
            'Cerramos este nivel. Resume mi desempeno y declara PASASTE EL NIVEL si corresponde.',
        ],
    };

    const prompts = promptSets[activity.key];
    return prompts[turnIndex] || prompts[prompts.length - 1];
}

function buildFullConversationPrompt(activity: GuidedActivity, topic: string, turnsPerActivity: number) {
    const plannedUserMessages = Array.from({ length: turnsPerActivity }, (_, index) => (
        `${index + 1}. ${buildUserPrompt(activity, topic, index)}`
    )).join('\n');
    const totalMessages = 1 + turnsPerActivity * 2;

    return [
        `Genera una conversacion historica simulada para la actividad "${activity.label}" sobre "${topic}" en una app de preparacion PMP.`,
        `El asistente debe iniciar la conversacion como si respondiera al evento ${buildStartMessage(activity, topic)}.`,
        `Luego deben alternarse exactamente ${turnsPerActivity} mensajes del usuario aspirante y ${turnsPerActivity} respuestas del asistente.`,
        `La conversacion completa debe tener exactamente ${totalMessages} mensajes: assistant, user, assistant, user, assistant...`,
        'Usa respuestas utiles, contextualizadas y suficientemente desarrolladas, pero sin extenderte de mas.',
        'Respeta estos mensajes o intenciones del usuario aspirante, en este orden:',
        plannedUserMessages,
        'Devuelve solamente JSON valido, sin markdown ni texto adicional, con esta forma exacta:',
        '{"messages":[{"role":"assistant","content":"..."},{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}',
    ].join('\n\n');
}

function getJsonCandidate(content: string) {
    const trimmed = content.trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    try {
        JSON.parse(trimmed);
        return trimmed;
    } catch {
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.slice(firstBrace, lastBrace + 1);
        }
    }

    return trimmed;
}

function fallbackAssistantMessage(activity: GuidedActivity, topic: string, turnIndex: number) {
    const closings: Record<GuidedActivity['key'], string> = {
        lesson: `Para estudiar ${topic}, conserva la idea central, un ejemplo situacional y una senal del enunciado que te indique cuando aplicarlo.`,
        practice: `Tu respuesta mejora si explicitas el criterio de decision, el impacto en los interesados y el siguiente paso verificable.`,
        oracle: `La clave para distinguir ${topic} es leer el contexto, identificar la necesidad dominante y descartar opciones que resuelven otro problema.`,
        exam: `En una pregunta de examen, prioriza la opcion que preserve valor, comunicacion clara y alineacion con el enfoque del escenario.`,
    };

    return [
        `Buen avance. En ${topic}, lo importante es razonar la situacion antes de elegir una herramienta o respuesta.`,
        `Sobre tu intervencion ${turnIndex + 1}, la respuesta esperada debe conectar el concepto con una accion concreta del director del proyecto.`,
        closings[activity.key],
    ].join(' ');
}

function buildFallbackConversation(activity: GuidedActivity, topic: string, turnsPerActivity: number): GuidedGeneratedMessage[] {
    const messages: GuidedGeneratedMessage[] = [{
        role: 'assistant',
        content: `${activity.label} iniciada para ${topic}. Vamos a trabajar el concepto con una conversacion guiada, ejemplos y retroalimentacion aplicada al examen PMP.`,
    }];

    for (let index = 0; index < turnsPerActivity; index += 1) {
        messages.push({ role: 'user', content: buildUserPrompt(activity, topic, index) });
        messages.push({ role: 'assistant', content: fallbackAssistantMessage(activity, topic, index) });
    }

    return messages;
}

function parseGeneratedConversation(content: string, activity: GuidedActivity, topic: string, turnsPerActivity: number): GuidedGeneratedMessage[] {
    const expectedLength = 1 + turnsPerActivity * 2;

    try {
        const parsed = JSON.parse(getJsonCandidate(content)) as { messages?: Array<{ role?: unknown; content?: unknown }> };
        const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
        const normalized = messages.map((message): GuidedGeneratedMessage | null => {
            const role = message.role === 'assistant' || message.role === 'user' ? message.role : null;
            const messageContent = typeof message.content === 'string' ? message.content.trim() : '';
            if (!role || !messageContent) return null;
            return { role, content: messageContent };
        }).filter((message): message is GuidedGeneratedMessage => Boolean(message));

        if (normalized.length !== expectedLength) {
            throw new Error(`La conversacion generada tiene ${normalized.length} mensajes y se esperaban ${expectedLength}.`);
        }

        for (let index = 0; index < normalized.length; index += 1) {
            const expectedRole = index % 2 === 0 ? 'assistant' : 'user';
            if (normalized[index].role !== expectedRole) {
                throw new Error(`Rol invalido en el mensaje ${index + 1}.`);
            }
        }

        return normalized;
    } catch (error) {
        console.warn('No se pudo interpretar la conversacion guiada generada; se usa fallback local.', error);
        return buildFallbackConversation(activity, topic, turnsPerActivity);
    }
}

function getGuidedMessageTimestamp(activityDate: Date, messageIndex: number, firstChunkMs: number) {
    if (messageIndex === 0) return new Date(activityDate);

    const turnIndex = Math.floor((messageIndex - 1) / 2);
    const turnBase = activityDate.getTime() + turnIndex * 7 * 60 * 1000;
    const userTime = turnBase + 2 * 60 * 1000;

    if (messageIndex % 2 === 1) {
        return new Date(userTime);
    }

    return new Date(userTime + Math.max(45000, Math.round(firstChunkMs)));
}

async function authAsSuperuser(pb: PocketBase) {
    if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
        throw new Error('Faltan credenciales PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD en el entorno del servidor.');
    }

    const maybeLegacyAdmin = pb as unknown as {
        admins?: { authWithPassword: (email: string, password: string) => Promise<unknown> };
    };

    if (maybeLegacyAdmin.admins?.authWithPassword) {
        await withPocketBaseRetry('auth legacy admin', () => maybeLegacyAdmin.admins!.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD));
        return;
    }

    await withPocketBaseRetry('auth superuser', () => pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD));
}

async function getAuthenticatedAdmin(token: string) {
    const authPb = new PocketBase(PB_URL);
    authPb.autoCancellation(false);
    authPb.authStore.save(token, null);

    const authData = await withPocketBaseRetry('refresh admin auth', () => authPb.collection('users').authRefresh());
    const admin = authData.record as unknown as PlatformUser;

    if (admin.role !== 'admin') {
        throw new Error('El usuario autenticado no tiene rol admin.');
    }

    return admin;
}

async function deleteUserRecords(pb: PocketBase, collectionName: string, userId: string) {
    const records = await withPocketBaseRetry(`list ${collectionName}`, () => pb.collection(collectionName).getFullList<{ id: string }>({
        filter: `user="${userId}"`,
        fields: 'id',
        requestKey: null,
    })).catch(() => []);

    for (const record of records) {
        await withPocketBaseRetry(`delete ${collectionName}`, () => (
            pb.collection(collectionName).delete(record.id, { requestKey: null })
        ));
    }

    return records.length;
}

async function createTechnicalSnapshot(pb: PocketBase, userId: string, measuredAt: Date, index: number) {
    const ttft = 330 + ((index * 37) % 260);
    const lcp = 950 + ((index * 83) % 850);
    const cls = Number((0.012 + ((index * 7) % 45) / 1000).toFixed(3));
    const bundle = 118 + ((index * 11) % 34);
    const latency = 7 + ((index * 5) % 28);
    const streamingChunks = 3 + (index % 5);

    await withPocketBaseRetry('create technical metric', () => pb.collection('technical_metric_snapshots').create({
        user: userId,
        measured_at: formatPocketBaseDate(measuredAt),
        screen: 'Pantalla principal del usuario aspirante (/welcome, Dashboard del rol usuario)',
        ttft_ms: ttft,
        lcp_ms: lcp,
        cls,
        bundle_kb: bundle,
        pocketbase_latency_ms: latency,
        streaming_chunks: streamingChunks,
        streaming_label: 'Streaming correcto',
        metrics: {
            source: 'Generador admin de modo guiado',
            ttft: { value: `${ttft} ms`, raw: ttft, status: 'ok' },
            lcp: { value: `${(lcp / 1000).toFixed(2)} s`, raw: lcp, status: 'ok' },
            cls: { value: cls.toFixed(3), raw: cls, status: 'ok' },
            bundle: { value: `${bundle} KB`, raw: bundle, status: 'ok' },
            'pocketbase-latency': { value: `${latency} ms`, raw: latency, status: 'ok' },
            streaming: { value: 'Streaming correcto', raw: streamingChunks, status: 'ok' },
        },
        user_agent: 'admin-guided-usage-generator',
    }, { requestKey: null }));
}

async function callChatBackend(req: Request, params: {
    userId: string;
    chatId: string;
    mode: string;
    messages: Array<{ role: string; content: string }>;
}) {
    const response = await fetch(new URL('/api/chat', req.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!response.ok || !response.body) {
        throw new Error(`No se pudo generar respuesta del chat (${response.status}).`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const start = performance.now();
    let firstChunkMs = 0;
    let chunkCount = 0;
    let content = '';

    try {
        while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            chunkCount += 1;
            if (!firstChunkMs) firstChunkMs = performance.now() - start;
            content += decoder.decode(chunk.value, { stream: true });
        }
        content += decoder.decode();
    } finally {
        reader.releaseLock();
    }

    return {
        content: content.trim(),
        chunkCount,
        firstChunkMs,
    } satisfies ChatResponse;
}

async function createGuidedChat(pb: PocketBase, req: Request, params: {
    userId: string;
    level: GuidedLevel;
    levelIndex: number;
    activity: GuidedActivity;
    turnsPerActivity: number;
    activityDate: Date;
}) {
    const mode = `${params.activity.modePrefix}:${params.level.topic}`;
    const title = `${params.levelIndex + 1}. ${params.activity.titlePrefix}: ${params.level.topic}`.slice(0, 80);
    const chat = await withPocketBaseRetry('create guided chat', () => pb.collection('chats').create({
        user: params.userId,
        title,
        mode,
        last_active: formatPocketBaseDate(params.activityDate),
    }, { requestKey: null }));
    let messagesCreated = 0;
    let assistantResponsesCreated = 0;

    let generatedResponse: ChatResponse = { content: '', chunkCount: 0, firstChunkMs: 0 };
    try {
        generatedResponse = await callChatBackend(req, {
            userId: params.userId,
            chatId: chat.id,
            mode,
            messages: [{
                role: 'user',
                content: buildFullConversationPrompt(params.activity, params.level.topic, params.turnsPerActivity),
            }],
        });
    } catch (error) {
        console.warn('No se pudo generar conversacion completa con IA; se usa fallback local.', error);
    }

    const generatedConversation = parseGeneratedConversation(
        generatedResponse.content,
        params.activity,
        params.level.topic,
        params.turnsPerActivity,
    );

    for (let messageIndex = 0; messageIndex < generatedConversation.length; messageIndex += 1) {
        const message = generatedConversation[messageIndex];
        await withPocketBaseRetry(`create guided ${message.role} message`, () => pb.collection('messages').create({
            content: message.content,
            role: message.role,
            user: params.userId,
            chat: chat.id,
            generated_at: formatPocketBaseDate(getGuidedMessageTimestamp(params.activityDate, messageIndex, generatedResponse.firstChunkMs)),
        }, { requestKey: null }));
        messagesCreated += 1;
        if (message.role === 'assistant') {
            assistantResponsesCreated += 1;
        }
    }

    await withPocketBaseRetry('update guided chat last_active', () => pb.collection('chats').update(chat.id, {
        last_active: formatPocketBaseDate(new Date(params.activityDate.getTime() + params.turnsPerActivity * 7 * 60 * 1000)),
    }, { requestKey: null }));

    return { chat, messagesCreated, assistantResponsesCreated };
}

export async function POST(req: Request) {
    try {
        const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
        if (!token) {
            return NextResponse.json({ error: 'Falta token de autenticacion.' }, { status: 401 });
        }

        await getAuthenticatedAdmin(token);

        const body = await req.json();
        const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
        const allLevels = buildGuidedLevels();
        const generationMode = body.generationMode === 'append' ? 'append' : 'replace';
        const requestedLevelCount = body.levelCount === 'all'
            ? allLevels.length
            : clamp(Number(body.levelCount || 10), 1, allLevels.length);
        const turnsPerActivity = clamp(Number(body.interactionsPerLevel || 4), 3, 8);
        const startDate = parseDate(body.startDate, new Date());
        const endDate = parseDate(body.endDate, startDate);

        if (!userId) {
            return NextResponse.json({ error: 'Debes indicar un usuario.' }, { status: 400 });
        }

        const pb = new PocketBase(PB_URL);
        pb.autoCancellation(false);
        await authAsSuperuser(pb);

        const targetUser = await withPocketBaseRetry('get target user', () => pb.collection('users').getOne<PlatformUser>(userId, {
            fields: 'id,role',
            requestKey: null,
        }));

        if ((targetUser.role || 'usuario') !== 'usuario') {
            return NextResponse.json({ error: 'El modo guiado solo puede asociarse a usuarios aspirantes.' }, { status: 400 });
        }

        const existingContext = generationMode === 'append'
            ? await getExistingGuidedContext(pb, userId, allLevels)
            : null;
        const startLevelIndex = generationMode === 'append' ? existingContext?.nextLevelIndex || 0 : 0;
        const availableLevelCount = Math.max(0, allLevels.length - startLevelIndex);
        const effectiveLevelCount = body.levelCount === 'all'
            ? availableLevelCount
            : Math.min(requestedLevelCount, availableLevelCount);
        const selectedLevels = allLevels.slice(startLevelIndex, startLevelIndex + effectiveLevelCount);
        const totalActivities = selectedLevels.length * GUIDED_ACTIVITIES.length;

        if (selectedLevels.length === 0) {
            return NextResponse.json({ error: 'No hay nuevos niveles guiados disponibles para agregar a este usuario.' }, { status: 400 });
        }

        const minimumAppendStartDate = existingContext?.lastActivity
            ? new Date(existingContext.lastActivity.getTime() + 3 * 60 * 60 * 1000)
            : null;
        const effectiveStartDate = minimumAppendStartDate && minimumAppendStartDate.getTime() > startDate.getTime()
            ? minimumAppendStartDate
            : startDate;
        const effectiveEndDate = endDate.getTime() < effectiveStartDate.getTime() ? effectiveStartDate : endDate;
        const activitySchedule = buildGuidedActivitySchedule(selectedLevels.length, GUIDED_ACTIVITIES.length, effectiveStartDate, effectiveEndDate);

        const deleted = generationMode === 'replace'
            ? {
                messages: await deleteUserRecords(pb, 'messages', userId),
                chats: await deleteUserRecords(pb, 'chats', userId),
                progress: await deleteUserRecords(pb, 'user_progress', userId),
                technicalMetrics: await deleteUserRecords(pb, 'technical_metric_snapshots', userId),
            }
            : {
                messages: 0,
                chats: 0,
                progress: 0,
                technicalMetrics: 0,
            };
        let messagesCreated = 0;
        let assistantResponsesCreated = 0;
        let chatsCreated = 0;

        for (let levelIndex = 0; levelIndex < selectedLevels.length; levelIndex += 1) {
            for (let activityIndex = 0; activityIndex < GUIDED_ACTIVITIES.length; activityIndex += 1) {
                const globalActivityIndex = levelIndex * GUIDED_ACTIVITIES.length + activityIndex;
                const activityDate = activitySchedule[globalActivityIndex] || startDate;
                const result = await createGuidedChat(pb, req, {
                    userId,
                    level: selectedLevels[levelIndex],
                    levelIndex,
                    activity: GUIDED_ACTIVITIES[activityIndex],
                    turnsPerActivity,
                    activityDate,
                });
                chatsCreated += 1;
                messagesCreated += result.messagesCreated;
                assistantResponsesCreated += result.assistantResponsesCreated;
                await createTechnicalSnapshot(pb, userId, activityDate, globalActivityIndex);
            }
        }

        const completedLevelIds = generationMode === 'append'
            ? Array.from(new Set([...(existingContext?.completedLevelIds || []), ...selectedLevels.map((level) => level.id)]))
            : selectedLevels.map((level) => level.id);
        const progressPayload = {
            user: userId,
            completed_levels: completedLevelIds,
            stats: {
                ...(existingContext?.progressRecord?.stats || {}),
                accuracy: 'N/A',
                total_xp: completedLevelIds.length * 100,
                syntheticUsage: {
                    source: 'admin-guided-usage-generator',
                    mode: generationMode,
                    periodStart: formatPocketBaseDate(effectiveStartDate),
                    periodEnd: formatPocketBaseDate(effectiveEndDate),
                    guidedLevelsCompleted: completedLevelIds.length,
                    generatedLevelsThisRun: selectedLevels.length,
                    startLevelIndex,
                    activitiesPerLevel: GUIDED_ACTIVITIES.length,
                    turnsPerActivity,
                    chatSessions: chatsCreated,
                    generatedMessages: messagesCreated,
                    generatedAssistantResponses: assistantResponsesCreated,
                    minutesStudied: chatsCreated * (turnsPerActivity + 1) * 4,
                },
            },
        };
        const progress = generationMode === 'append' && existingContext?.progressRecord
            ? await withPocketBaseRetry('update user progress', () => (
                pb.collection('user_progress').update(existingContext.progressRecord!.id, progressPayload, { requestKey: null })
            ))
            : await withPocketBaseRetry('create user progress', () => (
                pb.collection('user_progress').create(progressPayload, { requestKey: null })
            ));

        return NextResponse.json({
            deleted,
            progress,
            generated: {
                levels: selectedLevels.length,
                activities: totalActivities,
                chats: chatsCreated,
                messages: messagesCreated,
                technicalMetricSnapshots: totalActivities,
                mode: generationMode,
                startLevelIndex,
            },
        });
    } catch (error) {
        console.error('Error generating guided usage:', error);
        const message = error instanceof Error ? error.message : 'No se pudo generar el uso guiado.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
