import PocketBase from 'pocketbase';
import { NextResponse } from 'next/server';
import { generateSimulationQuestions, type SimulationQuestion } from '@/lib/simulationQuestions';

export const maxDuration = 300;

interface PlatformUser {
    id: string;
    role?: string;
}

interface UserProgressRecord {
    id: string;
    user: string;
    completed_levels?: string[];
    stats?: Record<string, unknown>;
}

interface SimulationRecord {
    id: string;
    user: string;
    status?: string;
    type?: string;
    total_questions?: number;
    current_index?: number;
    questions?: SimulationQuestion[];
    answers?: Record<string, string>;
    score?: number;
    started_at?: string;
    completed_at?: string;
}

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
const OPTION_IDS = ['A', 'B', 'C', 'D'];
const GENERATION_BATCH_SIZE = 10;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function formatPocketBaseDate(date: Date) {
    return date.toISOString().replace('T', ' ');
}

async function authAsSuperuser(pb: PocketBase) {
    if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
        throw new Error('Faltan credenciales PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD en el entorno del servidor.');
    }

    const maybeLegacyAdmin = pb as unknown as {
        admins?: { authWithPassword: (email: string, password: string) => Promise<unknown> };
    };

    if (maybeLegacyAdmin.admins?.authWithPassword) {
        await maybeLegacyAdmin.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
        return;
    }

    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
}

async function getAuthenticatedAdmin(token: string) {
    const authPb = new PocketBase(PB_URL);
    authPb.autoCancellation(false);
    authPb.authStore.save(token, null);

    const authData = await authPb.collection('users').authRefresh();
    const admin = authData.record as unknown as PlatformUser;

    if (admin.role !== 'admin') {
        throw new Error('El usuario autenticado no tiene rol admin.');
    }

    return admin;
}

function buildCompletedDate(value: unknown) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T15:00:00.000Z`);
    }

    return new Date();
}

function buildCorrectSlots(questionCount: number, score: number) {
    const slots = new Set<number>();
    if (score <= 0) return slots;

    for (let index = 0; index < score; index += 1) {
        slots.add(Math.floor((index * questionCount) / score));
    }

    return slots;
}

function normalizeQuestion(question: SimulationQuestion, index: number, stamp: string): SimulationQuestion {
    const options = Array.isArray(question.options)
        ? question.options
            .filter((option) => option && typeof option.id === 'string' && typeof option.text === 'string')
            .slice(0, 4)
        : [];
    const optionIds = new Set(options.map((option) => option.id));
    const correctAnswer = optionIds.has(question.correctAnswer)
        ? question.correctAnswer
        : options[0]?.id || 'A';

    return {
        ...question,
        id: `admin_${stamp}_${index + 1}_${question.id || 'q'}`,
        text: question.text || `Pregunta PMP ${index + 1}`,
        options,
        correctAnswer,
        explanation: question.explanation || 'Explicacion no disponible.',
        domain: question.domain || 'PMP',
    };
}

function buildAnswers(questions: SimulationQuestion[], score: number) {
    const correctSlots = buildCorrectSlots(questions.length, score);
    const answers: Record<string, string> = {};

    questions.forEach((question, index) => {
        if (correctSlots.has(index)) {
            answers[question.id] = question.correctAnswer;
            return;
        }

        const incorrectOption = question.options.find((option) => option.id !== question.correctAnswer);
        answers[question.id] = incorrectOption?.id || question.correctAnswer;
    });

    return answers;
}

async function generateAdminSimulationQuestions(questionCount: number, topic: string, stamp: string) {
    const questions: SimulationQuestion[] = [];
    let attempts = 0;

    while (questions.length < questionCount && attempts < questionCount) {
        attempts += 1;
        const amount = Math.min(GENERATION_BATCH_SIZE, questionCount - questions.length);
        const generated = await generateSimulationQuestions({ amount, topic });

        for (const question of generated) {
            const normalized = normalizeQuestion(question, questions.length, stamp);
            if (normalized.options.length >= 2) {
                questions.push(normalized);
            }
            if (questions.length >= questionCount) break;
        }
    }

    if (questions.length < questionCount) {
        throw new Error(`Solo se pudieron generar ${questions.length} de ${questionCount} preguntas.`);
    }

    return questions;
}

async function fieldExists(pb: PocketBase, collectionName: string, fieldName: string) {
    const collection = await pb.collections.getOne(collectionName);
    return collection.fields.some((field) => field.name === fieldName);
}

function buildProgressStats(simulations: SimulationRecord[], previousStats: Record<string, unknown> = {}) {
    const completed = simulations.filter((simulation) => simulation.status === 'completed');
    const totalQuestions = completed.reduce((sum, simulation) => sum + Number(simulation.total_questions || 0), 0);
    const correctAnswers = completed.reduce((sum, simulation) => sum + Number(simulation.score || 0), 0);
    const accuracy = totalQuestions > 0 ? `${Math.round((correctAnswers / totalQuestions) * 100)}%` : 'N/A';
    const trend = completed
        .filter((simulation) => simulation.total_questions && typeof simulation.score === 'number')
        .sort((a, b) => new Date(a.completed_at || a.started_at || 0).getTime() - new Date(b.completed_at || b.started_at || 0).getTime())
        .map((simulation) => ({
            date: String(simulation.completed_at || simulation.started_at || '').slice(0, 10),
            questions: Number(simulation.total_questions || 0),
            totalQuestions: Number(simulation.total_questions || 0),
            scorePercent: Number(((Number(simulation.score || 0) / Number(simulation.total_questions || 1)) * 100).toFixed(1)),
        }));

    return {
        ...previousStats,
        accuracy,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        syntheticUsage: {
            ...((previousStats.syntheticUsage as Record<string, unknown> | undefined) || {}),
            completedSimulations: completed.length,
            improvementTrend: trend,
        },
    };
}

async function upsertProgress(pb: PocketBase, userId: string) {
    const simulations = await pb.collection('simulations').getFullList<SimulationRecord>({
        filter: `user="${userId}"`,
        requestKey: null,
    });
    const existing = await pb.collection('user_progress')
        .getFirstListItem<UserProgressRecord>(`user="${userId}"`, { requestKey: null })
        .catch(() => null);

    const stats = buildProgressStats(simulations, existing?.stats || {});

    if (existing) {
        return pb.collection('user_progress').update(existing.id, {
            stats,
        }, { requestKey: null });
    }

    return pb.collection('user_progress').create({
        user: userId,
        completed_levels: [],
        stats,
    }, { requestKey: null });
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
        const questionCount = clamp(Number(body.questionCount || 0), 1, 300);
        const targetAccuracy = clamp(Number(body.targetAccuracy || 0), 0, 100);
        const topic = typeof body.topic === 'string' && body.topic.trim()
            ? body.topic.trim()
            : 'Simulacro PMP';

        if (!userId) {
            return NextResponse.json({ error: 'Debes indicar un usuario.' }, { status: 400 });
        }

        const pb = new PocketBase(PB_URL);
        pb.autoCancellation(false);
        await authAsSuperuser(pb);

        const targetUser = await pb.collection('users').getOne<PlatformUser>(userId, {
            fields: 'id,role',
            requestKey: null,
        });

        if ((targetUser.role || 'usuario') !== 'usuario') {
            return NextResponse.json({ error: 'La simulacion solo puede asociarse a usuarios con rol usuario.' }, { status: 400 });
        }

        const score = clamp(Math.round((questionCount * targetAccuracy) / 100), 0, questionCount);
        const stamp = Date.now().toString(36);
        const completedAt = buildCompletedDate(body.completedDate);
        const durationMinutes = Math.max(10, Math.round(questionCount * 1.2));
        const startedAt = new Date(completedAt.getTime() - durationMinutes * 60 * 1000);
        const questions = await generateAdminSimulationQuestions(questionCount, topic, stamp);
        const answers = buildAnswers(questions, score);

        const data: Record<string, unknown> = {
            user: userId,
            status: 'completed',
            type: `admin_${stamp}_${questionCount}_questions`,
            total_questions: questionCount,
            current_index: questionCount,
            questions,
            answers,
            score,
        };

        const [hasStartedAt, hasCompletedAt] = await Promise.all([
            fieldExists(pb, 'simulations', 'started_at').catch(() => false),
            fieldExists(pb, 'simulations', 'completed_at').catch(() => false),
        ]);

        if (hasStartedAt) data.started_at = formatPocketBaseDate(startedAt);
        if (hasCompletedAt) data.completed_at = formatPocketBaseDate(completedAt);

        const simulation = await pb.collection('simulations').create(data, { requestKey: null });
        const progress = await upsertProgress(pb, userId);

        return NextResponse.json({ simulation, progress });
    } catch (error) {
        console.error('Error generating admin simulation:', error);
        const message = error instanceof Error ? error.message : 'No se pudo generar la simulacion.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
