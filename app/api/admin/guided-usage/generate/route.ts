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

function spreadDate(index: number, total: number, startDate: Date, endDate: Date) {
    if (total <= 1) return new Date(startDate);

    const start = startDate.getTime();
    const end = Math.max(start, endDate.getTime());
    const ratio = index / (total - 1);
    const base = start + (end - start) * ratio;
    const minuteOffset = (index % 6) * 11 * 60 * 1000;

    return new Date(base + minuteOffset);
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
    const conversation: Array<{ role: string; content: string }> = [];
    let messagesCreated = 0;
    let assistantResponsesCreated = 0;

    const startTimestamp = new Date(params.activityDate);
    const openingMessages = [{ role: 'user', content: buildStartMessage(params.activity, params.level.topic) }];
    const openingResponse = await callChatBackend(req, {
        userId: params.userId,
        chatId: chat.id,
        mode,
        messages: openingMessages,
    });

    await withPocketBaseRetry('create opening assistant message', () => pb.collection('messages').create({
        content: openingResponse.content || `${params.activity.label} iniciada para ${params.level.topic}.`,
        role: 'assistant',
        user: params.userId,
        chat: chat.id,
        generated_at: formatPocketBaseDate(startTimestamp),
    }, { requestKey: null }));
    messagesCreated += 1;
    assistantResponsesCreated += 1;
    conversation.push({ role: 'assistant', content: openingResponse.content });

    for (let interactionIndex = 0; interactionIndex < params.turnsPerActivity; interactionIndex += 1) {
        const timestamp = new Date(params.activityDate.getTime() + interactionIndex * 7 * 60 * 1000);
        const userTimestamp = new Date(timestamp.getTime() + 2 * 60 * 1000);
        const prompt = buildUserPrompt(params.activity, params.level.topic, interactionIndex);

        await withPocketBaseRetry('create user message', () => pb.collection('messages').create({
            content: prompt,
            role: 'user',
            user: params.userId,
            chat: chat.id,
            generated_at: formatPocketBaseDate(userTimestamp),
        }, { requestKey: null }));
        messagesCreated += 1;
        conversation.push({ role: 'user', content: prompt });
        const requestMessages = [...conversation];

        const response = await callChatBackend(req, {
            userId: params.userId,
            chatId: chat.id,
            mode,
            messages: requestMessages,
        });
        const assistantTimestamp = new Date(userTimestamp.getTime() + Math.max(500, response.firstChunkMs));

        await withPocketBaseRetry('create assistant message', () => pb.collection('messages').create({
            content: response.content || `Resumen guiado sobre ${params.level.topic}.`,
            role: 'assistant',
            user: params.userId,
            chat: chat.id,
            generated_at: formatPocketBaseDate(assistantTimestamp),
        }, { requestKey: null }));
        messagesCreated += 1;
        assistantResponsesCreated += 1;
        conversation.push({ role: 'assistant', content: response.content });
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
        const requestedLevelCount = body.levelCount === 'all'
            ? allLevels.length
            : clamp(Number(body.levelCount || 10), 1, allLevels.length);
        const turnsPerActivity = clamp(Number(body.interactionsPerLevel || 4), 3, 8);
        const startDate = parseDate(body.startDate, new Date());
        const endDate = parseDate(body.endDate, startDate);
        const selectedLevels = allLevels.slice(0, requestedLevelCount);
        const totalActivities = selectedLevels.length * GUIDED_ACTIVITIES.length;

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

        const deleted = {
            messages: await deleteUserRecords(pb, 'messages', userId),
            chats: await deleteUserRecords(pb, 'chats', userId),
            progress: await deleteUserRecords(pb, 'user_progress', userId),
            technicalMetrics: await deleteUserRecords(pb, 'technical_metric_snapshots', userId),
        };
        let messagesCreated = 0;
        let assistantResponsesCreated = 0;
        let chatsCreated = 0;

        for (let levelIndex = 0; levelIndex < selectedLevels.length; levelIndex += 1) {
            for (let activityIndex = 0; activityIndex < GUIDED_ACTIVITIES.length; activityIndex += 1) {
                const globalActivityIndex = levelIndex * GUIDED_ACTIVITIES.length + activityIndex;
                const activityDate = spreadDate(globalActivityIndex, totalActivities, startDate, endDate);
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

        const progress = await withPocketBaseRetry('create user progress', () => pb.collection('user_progress').create({
            user: userId,
            completed_levels: selectedLevels.map((level) => level.id),
            stats: {
                accuracy: 'N/A',
                total_xp: selectedLevels.length * 100,
                syntheticUsage: {
                    source: 'admin-guided-usage-generator',
                    periodStart: formatPocketBaseDate(startDate),
                    periodEnd: formatPocketBaseDate(endDate),
                    guidedLevelsCompleted: selectedLevels.length,
                    activitiesPerLevel: GUIDED_ACTIVITIES.length,
                    turnsPerActivity,
                    chatSessions: chatsCreated,
                    generatedMessages: messagesCreated,
                    generatedAssistantResponses: assistantResponsesCreated,
                    minutesStudied: chatsCreated * (turnsPerActivity + 1) * 4,
                },
            },
        }, { requestKey: null }));

        return NextResponse.json({
            deleted,
            progress,
            generated: {
                levels: selectedLevels.length,
                activities: totalActivities,
                chats: chatsCreated,
                messages: messagesCreated,
                technicalMetricSnapshots: totalActivities,
            },
        });
    } catch (error) {
        console.error('Error generating guided usage:', error);
        const message = error instanceof Error ? error.message : 'No se pudo generar el uso guiado.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
