'use client';

import { useEffect, useMemo, useState } from 'react';
import pb from '@/lib/pocketbase';
import { Activity, BarChart2, CalendarDays, CheckCircle, ClipboardList, Clock, FileText, MessageSquare, Save, Target, Trophy, Users } from 'lucide-react';

interface PlatformUser {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    created?: string;
    updated?: string;
}

interface ChatRecord {
    id: string;
    user: string;
    title?: string;
    mode?: string;
    last_active?: string;
    created?: string;
    updated?: string;
}

interface MessageRecord {
    id: string;
    user: string;
    chat?: string;
    role?: string;
    created?: string;
}

interface UserProgressRecord {
    id: string;
    user: string;
    completed_levels?: string[];
    stats?: {
        accuracy?: string;
        correct_answers?: number;
        total_questions?: number;
        total_xp?: number;
        streak?: number;
        syntheticUsage?: {
            periodStart?: string;
            periodEnd?: string;
            studySessions?: number;
            chatSessions?: number;
            completedSimulations?: number;
            minutesStudied?: number;
            improvementTrend?: Array<{
                date?: string;
                accuracy?: number;
                questions?: number;
                totalQuestions?: number;
                scorePercent?: number;
            }>;
        };
        survey?: {
            nps?: number;
        };
    };
    created?: string;
    updated?: string;
}

interface SimulationRecord {
    id: string;
    user: string;
    status?: string;
    type?: string;
    total_questions?: number;
    current_index?: number;
    score?: number;
    started_at?: string;
    completed_at?: string;
    created?: string;
    updated?: string;
}

interface UserResearchSessionRecord {
    id: string;
    user: string;
    admin?: string;
    instrument?: string;
    session_date?: string;
    session_type?: string;
    context?: string;
    feedback?: string;
    pain_points?: string[];
    design_decisions?: string[];
    nps?: number;
    usefulness_score?: number;
    usability_score?: number;
    follow_up?: string;
    evidence_tag?: string;
    created?: string;
    updated?: string;
}

interface ResearchInstrumentRecord {
    id: string;
    title?: string;
    instrument_type?: string;
    objective?: string;
    target_profile?: string;
    questions?: string[];
    scale_items?: string[];
    instructions?: string;
    evidence_tag?: string;
    version?: string;
    status?: string;
    created?: string;
    updated?: string;
}

interface ResearchFormState {
    instrument: string;
    session_date: string;
    session_type: string;
    context: string;
    feedback: string;
    pain_points: string;
    design_decisions: string;
    nps: string;
    usefulness_score: string;
    usability_score: string;
    follow_up: string;
    evidence_tag: string;
}

interface InstrumentFormState {
    title: string;
    instrument_type: string;
    objective: string;
    target_profile: string;
    questions: string;
    scale_items: string;
    instructions: string;
    evidence_tag: string;
    version: string;
    status: string;
}

interface UserSummary {
    user: PlatformUser;
    chats: number;
    messages: number;
    completedLevels: number;
    simulations: number;
    completedSimulations: number;
    bestScore: number | null;
    lastActivity: string | null;
}

interface HistoryItem {
    id: string;
    date: string | null;
    title: string;
    detail: string;
    kind: 'chat' | 'simulation';
}

export type AdminView = 'overview' | 'defense' | 'users' | 'research';

const EMPTY_RESEARCH_FORM: ResearchFormState = {
    instrument: '',
    session_date: new Date().toISOString().slice(0, 10),
    session_type: 'Entrevista semi-estructurada',
    context: '',
    feedback: '',
    pain_points: '',
    design_decisions: '',
    nps: '',
    usefulness_score: '',
    usability_score: '',
    follow_up: '',
    evidence_tag: '',
};

const EMPTY_INSTRUMENT_FORM: InstrumentFormState = {
    title: '',
    instrument_type: 'Entrevista semi-estructurada',
    objective: '',
    target_profile: '',
    questions: '',
    scale_items: '',
    instructions: '',
    evidence_tag: '',
    version: 'v1',
    status: 'activo',
};

const MODE_LABELS: Record<string, string> = {
    standard: 'General',
    simulation: 'Crisis',
    workshop: 'Taller',
    quiz: 'Quiz',
    socratic: 'Socratico',
    debate: 'Debate',
    case_study: 'Caso',
    eli5: 'ELI5',
    math: 'Formulas',
};

function formatDate(value?: string | null) {
    if (!value) return 'Sin actividad';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin actividad';

    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatDateOnly(value?: string | null) {
    if (!value) return 'Sin actividad';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin actividad';

    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

function latestDate(...values: Array<string | undefined | null>) {
    return values
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || null;
}

function simulationActivityDate(simulation: SimulationRecord) {
    return simulation.completed_at || simulation.started_at || simulation.updated || simulation.created || null;
}

function formatNumber(value?: number | null) {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('es-AR').format(value);
}

function formatMinutes(value?: number | null) {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    if (!hours) return `${minutes} min`;
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

function simulationLabel(simulation: SimulationRecord) {
    if (simulation.total_questions) return `${simulation.total_questions} preguntas`;
    return simulation.type?.replace('_', ' ') || 'Simulacion';
}

function simulationScore(simulation: SimulationRecord) {
    if (typeof simulation.score !== 'number') return 'N/A';
    if (!simulation.total_questions) return String(simulation.score);
    const percent = Math.round((simulation.score / simulation.total_questions) * 100);
    return `${simulation.score}/${simulation.total_questions} (${percent}%)`;
}

function parseList(value: string) {
    return value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function formatScore(value?: number | null) {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    return `${value}/5`;
}

function average(values: Array<number | undefined | null>) {
    const validValues = values.filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
    if (!validValues.length) return null;
    return validValues.reduce((total, value) => total + value, 0) / validValues.length;
}

function formatAverage(value: number | null, suffix = '') {
    if (value === null) return 'N/A';
    const formatted = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value);
    return suffix ? `${formatted}${suffix}` : formatted;
}

interface AdminDashboardProps {
    activeAdminView: AdminView;
}

export default function AdminDashboard({ activeAdminView }: AdminDashboardProps) {
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [chats, setChats] = useState<ChatRecord[]>([]);
    const [messages, setMessages] = useState<MessageRecord[]>([]);
    const [progress, setProgress] = useState<UserProgressRecord[]>([]);
    const [simulations, setSimulations] = useState<SimulationRecord[]>([]);
    const [researchSessions, setResearchSessions] = useState<UserResearchSessionRecord[]>([]);
    const [researchInstruments, setResearchInstruments] = useState<ResearchInstrumentRecord[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [researchForm, setResearchForm] = useState<ResearchFormState>(EMPTY_RESEARCH_FORM);
    const [instrumentForm, setInstrumentForm] = useState<InstrumentFormState>(EMPTY_INSTRUMENT_FORM);
    const [isSavingResearch, setIsSavingResearch] = useState(false);
    const [isSavingInstrument, setIsSavingInstrument] = useState(false);
    const [researchNotice, setResearchNotice] = useState<string | null>(null);
    const [instrumentNotice, setInstrumentNotice] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPlatformData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [userRecords, chatRecords, messageRecords, progressRecords, simulationRecords, researchRecords, instrumentRecords] = await Promise.all([
                pb.collection('users').getFullList({ fields: 'id,email,name,role,created,updated', sort: '-created', requestKey: null }),
                pb.collection('chats').getFullList({ fields: 'id,user,title,mode,last_active,created,updated', requestKey: null }),
                pb.collection('messages').getFullList({ fields: 'id,user,chat,role,created', requestKey: null }),
                pb.collection('user_progress').getFullList({ fields: 'id,user,completed_levels,stats,created,updated', requestKey: null }),
                pb.collection('simulations').getFullList({ fields: 'id,user,status,type,total_questions,current_index,score,started_at,completed_at,created,updated', sort: '-updated', requestKey: null }),
                pb.collection('user_research_sessions').getFullList({
                    fields: 'id,user,admin,instrument,session_date,session_type,context,feedback,pain_points,design_decisions,nps,usefulness_score,usability_score,follow_up,evidence_tag,created,updated',
                    sort: '-session_date',
                    requestKey: null,
                }).catch((collectionError) => {
                    console.warn('No se pudieron cargar sesiones de investigación de usuarios:', collectionError);
                    return [];
                }),
                pb.collection('user_research_instruments').getFullList({
                    fields: 'id,title,instrument_type,objective,target_profile,questions,scale_items,instructions,evidence_tag,version,status',
                    sort: 'evidence_tag',
                    requestKey: null,
                }).catch((collectionError) => {
                    console.warn('No se pudieron cargar instrumentos de investigacion:', collectionError);
                    return [];
                }),
            ]);

            setUsers(userRecords as unknown as PlatformUser[]);
            setChats((chatRecords as unknown as ChatRecord[]).sort((a, b) => (
                new Date(b.last_active || 0).getTime() - new Date(a.last_active || 0).getTime()
            )));
            setMessages(messageRecords as unknown as MessageRecord[]);
            setProgress(progressRecords as unknown as UserProgressRecord[]);
            setSimulations((simulationRecords as unknown as SimulationRecord[]).sort((a, b) => (
                new Date(simulationActivityDate(b) || 0).getTime() - new Date(simulationActivityDate(a) || 0).getTime()
            )));
            setResearchSessions((researchRecords as unknown as UserResearchSessionRecord[]).sort((a, b) => (
                new Date(b.session_date || b.created || 0).getTime() - new Date(a.session_date || a.created || 0).getTime()
            )));
            setResearchInstruments(instrumentRecords as unknown as ResearchInstrumentRecord[]);
        } catch (err) {
            if (err && typeof err === 'object' && 'isAbort' in err && err.isAbort) {
                return;
            }

            console.error('Error loading admin dashboard:', err);
            setError('No se pudieron cargar los datos globales. Verifica que tu usuario tenga rol admin.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPlatformData();
    }, []);

    useEffect(() => {
        const selectableUsers = users.filter((user) => (user.role || 'usuario') === 'usuario');
        if (!selectableUsers.length) {
            setSelectedUserId('');
            return;
        }

        if (!selectedUserId || !selectableUsers.some((user) => user.id === selectedUserId)) {
            setSelectedUserId(selectableUsers[0].id);
        }
    }, [users, selectedUserId]);

    const handleResearchFormChange = (field: keyof ResearchFormState, value: string) => {
        setResearchNotice(null);
        setResearchForm((current) => ({ ...current, [field]: value }));
    };

    const handleInstrumentFormChange = (field: keyof InstrumentFormState, value: string) => {
        setInstrumentNotice(null);
        setInstrumentForm((current) => ({ ...current, [field]: value }));
    };

    const handleSaveInstrument = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isSavingInstrument || !instrumentForm.title.trim()) return;

        setIsSavingInstrument(true);
        setInstrumentNotice(null);

        try {
            const record = await pb.collection('user_research_instruments').create({
                title: instrumentForm.title.trim(),
                instrument_type: instrumentForm.instrument_type.trim(),
                objective: instrumentForm.objective.trim(),
                target_profile: instrumentForm.target_profile.trim(),
                questions: parseList(instrumentForm.questions),
                scale_items: parseList(instrumentForm.scale_items),
                instructions: instrumentForm.instructions.trim(),
                evidence_tag: instrumentForm.evidence_tag.trim(),
                version: instrumentForm.version.trim(),
                status: instrumentForm.status.trim(),
            }, { requestKey: null });

            setResearchInstruments((current) => [record as unknown as ResearchInstrumentRecord, ...current]);
            setResearchForm((current) => ({
                ...current,
                instrument: (record as unknown as ResearchInstrumentRecord).id,
            }));
            setInstrumentForm(EMPTY_INSTRUMENT_FORM);
            setInstrumentNotice('Instrumento guardado y disponible para nuevos relevamientos.');
        } catch (saveError) {
            console.error('Error saving research instrument:', saveError);
            setInstrumentNotice('No se pudo guardar el instrumento. Verifica la coleccion user_research_instruments.');
        } finally {
            setIsSavingInstrument(false);
        }
    };

    const handleSaveResearchSession = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedUserId || isSavingResearch) return;

        setIsSavingResearch(true);
        setResearchNotice(null);

        try {
            const record = await pb.collection('user_research_sessions').create({
                user: selectedUserId,
                admin: pb.authStore.model?.id,
                instrument: researchForm.instrument || null,
                session_date: researchForm.session_date ? `${researchForm.session_date} 12:00:00.000Z` : new Date().toISOString(),
                session_type: researchForm.session_type.trim(),
                context: researchForm.context.trim(),
                feedback: researchForm.feedback.trim(),
                pain_points: parseList(researchForm.pain_points),
                design_decisions: parseList(researchForm.design_decisions),
                nps: researchForm.nps ? Number(researchForm.nps) : null,
                usefulness_score: researchForm.usefulness_score ? Number(researchForm.usefulness_score) : null,
                usability_score: researchForm.usability_score ? Number(researchForm.usability_score) : null,
                follow_up: researchForm.follow_up.trim(),
                evidence_tag: researchForm.evidence_tag.trim(),
            }, { requestKey: null });

            setResearchSessions((current) => [record as unknown as UserResearchSessionRecord, ...current].sort((a, b) => (
                new Date(b.session_date || b.created || 0).getTime() - new Date(a.session_date || a.created || 0).getTime()
            )));
            setResearchForm(EMPTY_RESEARCH_FORM);
            setResearchNotice('Sesion de feedback guardada.');
        } catch (saveError) {
            console.error('Error saving research session:', saveError);
            setResearchNotice('No se pudo guardar la sesión. Verifica la colección user_research_sessions.');
        } finally {
            setIsSavingResearch(false);
        }
    };

    const dashboard = useMemo(() => {
        const regularUserList = users.filter((user) => (user.role || 'usuario') === 'usuario');
        const regularUserIds = new Set(regularUserList.map((user) => user.id));
        const userMap = new Map(regularUserList.map((user) => [user.id, user]));
        const regularChats = chats.filter((chat) => regularUserIds.has(chat.user));
        const regularMessages = messages.filter((message) => regularUserIds.has(message.user));
        const regularProgress = progress.filter((item) => regularUserIds.has(item.user));
        const regularSimulations = simulations.filter((simulation) => regularUserIds.has(simulation.user));
        const regularResearchSessions = researchSessions.filter((session) => regularUserIds.has(session.user));
        const progressByUser = new Map(regularProgress.map((item) => [item.user, item]));
        const completedSimulations = regularSimulations.filter((simulation) => simulation.status === 'completed');
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const activeUsers = new Set([
            ...regularChats.filter((chat) => new Date(chat.last_active || chat.updated || chat.created || 0).getTime() >= sevenDaysAgo).map((chat) => chat.user),
            ...regularMessages.filter((message) => new Date(message.created || 0).getTime() >= sevenDaysAgo).map((message) => message.user),
            ...regularSimulations.filter((simulation) => new Date(simulationActivityDate(simulation) || 0).getTime() >= sevenDaysAgo).map((simulation) => simulation.user),
        ]);

        const summaries: UserSummary[] = regularUserList.map((user) => {
            const userChats = regularChats.filter((chat) => chat.user === user.id);
            const userMessages = regularMessages.filter((message) => message.user === user.id);
            const userSimulations = regularSimulations.filter((simulation) => simulation.user === user.id);
            const completed = userSimulations.filter((simulation) => simulation.status === 'completed');
            const bestScore = completed.reduce<number | null>((best, simulation) => {
                if (typeof simulation.score !== 'number') return best;
                return best === null ? simulation.score : Math.max(best, simulation.score);
            }, null);
            const userProgress = progressByUser.get(user.id);

            return {
                user,
                chats: userChats.length,
                messages: userMessages.length,
                completedLevels: Array.isArray(userProgress?.completed_levels) ? userProgress.completed_levels.length : 0,
                simulations: userSimulations.length,
                completedSimulations: completed.length,
                bestScore,
                lastActivity: latestDate(
                    ...userChats.map((chat) => chat.last_active || chat.updated || chat.created),
                    ...userMessages.map((message) => message.created),
                    ...userSimulations.map((simulation) => simulationActivityDate(simulation)),
                ),
            };
        }).sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime());

        const modeCounts = regularChats.reduce<Record<string, number>>((acc, chat) => {
            const mode = chat.mode || 'standard';
            acc[mode] = (acc[mode] || 0) + 1;
            return acc;
        }, {});
        const topModes = Object.entries(modeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
        const maxModeCount = Math.max(1, ...topModes.map(([, count]) => count));

        return {
            activeUsers: activeUsers.size,
            completedSimulations: completedSimulations.length,
            regularChats,
            regularMessages,
            regularResearchSessions,
            regularSimulations,
            regularUserCount: regularUserList.length,
            summaries,
            topModes,
            maxModeCount,
            recentChats: regularChats.slice(0, 8),
            userMap,
        };
    }, [users, chats, messages, progress, simulations, researchSessions]);

    const metricCards = [
        { label: 'Usuarios', value: dashboard.regularUserCount, detail: 'rol usuario', icon: Users, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' },
        { label: 'Activos 7 días', value: dashboard.activeUsers, detail: 'con actividad reciente', icon: Activity, tone: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300' },
        { label: 'Chats', value: dashboard.regularChats.length, detail: `${dashboard.regularMessages.length} mensajes`, icon: MessageSquare, tone: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-300' },
        { label: 'Simulaciones', value: dashboard.regularSimulations.length, detail: `${dashboard.completedSimulations} completadas`, icon: CheckCircle, tone: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300' },
        { label: 'Feedback UX', value: dashboard.regularResearchSessions.length, detail: `${researchInstruments.length} instrumentos`, icon: ClipboardList, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' },
    ];

    const instrumentsById = useMemo(
        () => new Map(researchInstruments.map((instrument) => [instrument.id, instrument])),
        [researchInstruments],
    );

    const regularUsers = useMemo(
        () => dashboard.summaries
            .filter((summary) => (summary.user.role || 'usuario') === 'usuario')
            .map((summary) => summary.user),
        [dashboard.summaries],
    );

    const defensePanel = useMemo(() => {
        const progressByUser = new Map(progress.map((item) => [item.user, item]));
        const researchSessionsByUser = researchSessions.reduce<Record<string, UserResearchSessionRecord[]>>((acc, session) => {
            acc[session.user] = acc[session.user] || [];
            acc[session.user].push(session);
            return acc;
        }, {});
        const completedFullSimulations = dashboard.regularSimulations.filter((simulation) => (
            simulation.status === 'completed' && simulation.total_questions === 180
        ));
        const completedSimulations = dashboard.regularSimulations.filter((simulation) => simulation.status === 'completed');
        const bestSimulationScore = completedSimulations.reduce<number | null>((best, simulation) => {
            if (typeof simulation.score !== 'number') return best;
            return best === null ? simulation.score : Math.max(best, simulation.score);
        }, null);
        const allActivityDates = [
            ...dashboard.summaries.map((summary) => summary.lastActivity),
            ...dashboard.regularResearchSessions.map((session) => session.session_date || session.created || null),
        ].filter((value): value is string => Boolean(value));
        const periodStart = allActivityDates.length
            ? allActivityDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
            : null;
        const periodEnd = allActivityDates.length
            ? allActivityDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
            : null;
        const regularProgress = progress.filter((item) => dashboard.userMap.has(item.user));
        const averageNps = average([
            ...dashboard.regularResearchSessions.map((session) => session.nps),
            ...regularProgress.map((item) => item.stats?.survey?.nps),
        ]);
        const usefulnessAverage = average(dashboard.regularResearchSessions.map((session) => session.usefulness_score));
        const usabilityAverage = average(dashboard.regularResearchSessions.map((session) => session.usability_score));

        const validationUsers = dashboard.summaries.map((summary, index) => {
            const email = (summary.user.email || '').toLowerCase();
            const userProgress = progressByUser.get(summary.user.id) || null;
            const sessions = (researchSessionsByUser[summary.user.id] || []).sort((a, b) => (
                new Date(b.session_date || b.created || 0).getTime() - new Date(a.session_date || a.created || 0).getTime()
            ));
            const userSimulations = dashboard.regularSimulations.filter((simulation) => simulation.user === summary.user.id);
            const userFullSimulation = userSimulations.find((simulation) => (
                simulation.status === 'completed' && simulation.total_questions === 180
            )) || null;
            const profile = email.includes('educlerici') || email.includes('usuario.b')
                ? 'Usuario B - validador experto certificado'
                : email.includes('carlos') || email.includes('usuario.a')
                    ? 'Usuario A - aspirante en preparacion'
                    : `Usuario ${String.fromCharCode(65 + index)} - caso de validacion`;

            return {
                ...summary,
                profile,
                progress: userProgress,
                researchSessions: sessions,
                fullSimulation: userFullSimulation,
            };
        });
        const learningEvidence = validationUsers.map((summary) => {
            const progressTrend = summary.progress?.stats?.syntheticUsage?.improvementTrend || [];
            const simulationTrend = dashboard.regularSimulations
                .filter((simulation) => simulation.user === summary.user.id && simulation.status === 'completed' && simulation.total_questions && typeof simulation.score === 'number')
                .sort((a, b) => new Date(simulationActivityDate(a) || 0).getTime() - new Date(simulationActivityDate(b) || 0).getTime())
                .map((simulation) => ({
                    date: formatDateOnly(simulationActivityDate(simulation)),
                    totalQuestions: Number(simulation.total_questions || 0),
                    scorePercent: Number(((Number(simulation.score || 0) / Number(simulation.total_questions || 1)) * 100).toFixed(1)),
                }));
            const trend = (progressTrend.length ? progressTrend : simulationTrend)
                .map((entry) => {
                    const totalQuestions = 'totalQuestions' in entry ? entry.totalQuestions : entry.questions;
                    const scorePercent = 'scorePercent' in entry ? entry.scorePercent : entry.accuracy;
                    return {
                        date: entry.date || 'Sin fecha',
                        totalQuestions: Number(totalQuestions || 0),
                        scorePercent: Number(scorePercent ?? 0),
                    };
                })
                .filter((entry) => entry.scorePercent > 0);
            const initial = trend[0]?.scorePercent ?? null;
            const final = trend.at(-1)?.scorePercent ?? null;

            return {
                userId: summary.user.id,
                label: summary.profile,
                initial,
                final,
                improvement: initial !== null && final !== null ? Number((final - initial).toFixed(1)) : null,
                trend,
            };
        });

        return {
            averageNps,
            usefulnessAverage,
            usabilityAverage,
            bestSimulationScore,
            completedFullSimulations,
            completedSimulations,
            periodStart,
            periodEnd,
            validationUsers,
            learningEvidence,
            evidenceCards: [
                {
                    label: 'Muestra observada',
                    value: dashboard.regularUserCount,
                    detail: 'usuarios con rol usuario',
                    icon: Users,
                },
                {
                    label: 'Interacciones',
                    value: dashboard.regularMessages.length,
                    detail: `${dashboard.regularChats.length} chats registrados`,
                    icon: MessageSquare,
                },
                {
                    label: 'Simulacros completos',
                    value: completedSimulations.length,
                    detail: `${completedFullSimulations.length} de 180 preguntas`,
                    icon: Trophy,
                },
                {
                    label: 'Evidencia UX',
                    value: dashboard.regularResearchSessions.length,
                    detail: `${researchInstruments.length} instrumentos`,
                    icon: ClipboardList,
                },
            ],
            traceability: [
                {
                    claim: 'La herramienta favorece la preparacion situacional para PMP.',
                    evidence: `${dashboard.regularChats.length} chats y ${dashboard.regularMessages.length} mensajes en modos de estudio.`,
                    defenseUse: 'Mostrar variedad de interacciones y continuidad de uso por usuario.',
                },
                {
                    claim: 'El simulador permite contrastar desempeno en condiciones cercanas al examen.',
                    evidence: `${completedFullSimulations.length} simulacros completos de 180 preguntas y ${completedSimulations.length} simulaciones completadas.`,
                    defenseUse: 'Abrir el detalle del usuario que completo el simulacro y explicar alcance de la evidencia.',
                },
                {
                    claim: 'La utilidad percibida se relevo con instrumentos de investigacion.',
                    evidence: `NPS promedio ${formatAverage(averageNps)}; utilidad ${formatAverage(usefulnessAverage, '/5')}; facilidad ${formatAverage(usabilityAverage, '/5')}.`,
                    defenseUse: 'Relacionar feedback cualitativo con decisiones de diseno y resultados del capitulo 7.',
                },
            ],
        };
    }, [dashboard, progress, researchSessions, researchInstruments]);

    const selectedHistory = useMemo(() => {
        const selectedUser = users.find((user) => user.id === selectedUserId && (user.role || 'usuario') === 'usuario') || null;
        if (!selectedUser) return null;

        const userChats = chats.filter((chat) => chat.user === selectedUser.id);
        const userMessages = messages.filter((message) => message.user === selectedUser.id);
        const userProgress = progress.find((item) => item.user === selectedUser.id) || null;
        const userResearchSessions = researchSessions
            .filter((session) => session.user === selectedUser.id)
            .sort((a, b) => new Date(b.session_date || b.created || 0).getTime() - new Date(a.session_date || a.created || 0).getTime());
        const userSimulations = simulations
            .filter((simulation) => simulation.user === selectedUser.id)
            .sort((a, b) => new Date(simulationActivityDate(b) || 0).getTime() - new Date(simulationActivityDate(a) || 0).getTime());
        const completedSimulations = userSimulations.filter((simulation) => simulation.status === 'completed');
        const messagesByChat = userMessages.reduce<Record<string, number>>((acc, message) => {
            if (!message.chat) return acc;
            acc[message.chat] = (acc[message.chat] || 0) + 1;
            return acc;
        }, {});
        const historyItems: HistoryItem[] = [
            ...userChats.map((chat) => ({
                id: `chat-${chat.id}`,
                date: chat.last_active || chat.updated || chat.created || null,
                title: chat.title || 'Chat sin titulo',
                detail: `${MODE_LABELS[chat.mode || 'standard'] || chat.mode || 'General'} - ${messagesByChat[chat.id] || 0} mensajes`,
                kind: 'chat' as const,
            })),
            ...userSimulations.map((simulation) => ({
                id: `simulation-${simulation.id}`,
                date: simulationActivityDate(simulation),
                title: `Simulacion ${simulationLabel(simulation)}`,
                detail: `${simulation.status === 'completed' ? 'Completada' : 'En progreso'} - ${simulationScore(simulation)}`,
                kind: 'simulation' as const,
            })),
        ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        const firstActivity = historyItems.length ? historyItems[historyItems.length - 1].date : null;
        const lastActivity = historyItems.length ? historyItems[0].date : null;

        return {
            user: selectedUser,
            chats: userChats,
            messages: userMessages,
            progress: userProgress,
            researchSessions: userResearchSessions,
            simulations: userSimulations,
            completedSimulations,
            historyItems,
            firstActivity,
            lastActivity,
        };
    }, [users, selectedUserId, chats, messages, progress, simulations, researchSessions]);

    const adminViewTitle = {
        overview: {
            title: 'Resumen',
            description: 'Vista global de usuarios, actividad, chats, simulaciones y relevamientos.',
        },
        defense: {
            title: 'Defensa',
            description: 'Evidencia trazable para mostrar al tribunal: muestra, simulacros, feedback UX y relacion con la hipotesis.',
        },
        users: {
            title: 'Usuarios',
            description: 'Histórico de uso y evolución individual de los usuarios.',
        },
        research: {
            title: 'Investigación UX',
            description: 'Instrumentos, entrevistas, encuestas y feedback registrado.',
        },
    }[activeAdminView];

    return (
        <div className="flex-1 overflow-y-scroll bg-gray-50/80 p-4 [scrollbar-gutter:stable] dark:bg-gray-950 md:p-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white md:text-3xl">{adminViewTitle.title}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{adminViewTitle.description}</p>
                </div>

                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                        {error}
                    </div>
                )}

                {activeAdminView === 'overview' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {metricCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</p>
                                        <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{card.value}</p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.detail}</p>
                                    </div>
                                    <div className={`rounded-md p-2 ${card.tone}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                )}

                {isLoading ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                        Cargando datos globales...
                    </div>
                ) : (
                    <>
                        {activeAdminView === 'overview' && (
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h2 className="text-base font-bold text-gray-950 dark:text-white">Uso por modo</h2>
                                <div className="mt-5 space-y-4">
                                    {dashboard.topModes.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Todavia no hay chats registrados.</p>
                                    ) : dashboard.topModes.map(([mode, count]) => (
                                        <div key={mode} className="space-y-2">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="font-medium text-gray-700 dark:text-gray-200">{MODE_LABELS[mode] || mode}</span>
                                                <span className="text-gray-500 dark:text-gray-400">{count}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                                                <div
                                                    className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                                                    style={{ width: `${Math.max(8, (count / dashboard.maxModeCount) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h2 className="text-base font-bold text-gray-950 dark:text-white">Actividad reciente</h2>
                                <div className="mt-4 space-y-3">
                                    {dashboard.recentChats.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay actividad reciente.</p>
                                    ) : dashboard.recentChats.map((chat) => {
                                        const owner = dashboard.userMap.get(chat.user);
                                        return (
                                            <div key={chat.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-800">
                                                <div className="mt-0.5 rounded-md bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{chat.title || 'Chat sin titulo'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {owner?.name || owner?.email || 'Usuario'} - {MODE_LABELS[chat.mode || 'standard'] || chat.mode || 'General'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-400">{formatDate(chat.last_active || chat.updated || chat.created)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                        )}

                        {activeAdminView === 'defense' && (
                        <div className="space-y-6">
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="max-w-3xl">
                                        <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                                            <FileText className="h-4 w-4" />
                                            Vista para tribunal
                                        </div>
                                        <h2 className="mt-4 text-xl font-bold text-gray-950 dark:text-white">Evidencia de validacion del asistente PMP</h2>
                                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                            Esta pantalla organiza los datos operativos y de investigacion para defender el alcance del trabajo: muestra intencional, uso real del sistema, simulacros, feedback UX y relacion directa con la hipotesis.
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/60 lg:w-80">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Periodo observado</p>
                                        <p className="mt-2 font-semibold text-gray-950 dark:text-white">
                                            {formatDateOnly(defensePanel.periodStart)} - {formatDateOnly(defensePanel.periodEnd)}
                                        </p>
                                        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                            Lectura metodologica: evidencia exploratoria, no generalizable estadisticamente.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {defensePanel.evidenceCards.map((card) => {
                                        const Icon = card.icon;
                                        return (
                                            <div key={card.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</p>
                                                        <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{card.value}</p>
                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.detail}</p>
                                                    </div>
                                                    <div className="rounded-md bg-white p-2 text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-300">
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">Guion metodologico para defensa</h2>
                                    <div className="mt-4 space-y-3">
                                        {[
                                            ['Muestra', 'Muestreo intencional por casos extremos: aspirante en preparacion y validador experto.'],
                                            ['Alcance', 'La evidencia sostiene una validacion exploratoria del prototipo, no una prueba estadistica poblacional.'],
                                            ['Contraste', 'Capitulo 6 documenta aplicacion; Capitulo 7 conecta resultados con la hipotesis.'],
                                            ['Trazabilidad', 'Cada afirmacion debe mostrarse con registros visibles: chats, simulacros, sesiones UX e instrumentos.'],
                                        ].map(([label, detail]) => (
                                            <div key={label} className="flex gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-950/60">
                                                <CheckCircle className="mt-0.5 h-4 w-4 flex-none text-green-600 dark:text-green-300" />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-950 dark:text-white">{label}</p>
                                                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">Indicadores de utilidad y desempeno</h2>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {[
                                            { label: 'NPS promedio', value: formatAverage(defensePanel.averageNps), detail: 'percepcion global registrada' },
                                            { label: 'Utilidad percibida', value: formatAverage(defensePanel.usefulnessAverage, '/5'), detail: 'escala de sesiones UX' },
                                            { label: 'Facilidad percibida', value: formatAverage(defensePanel.usabilityAverage, '/5'), detail: 'escala de sesiones UX' },
                                            { label: 'Mejor score', value: defensePanel.bestSimulationScore ?? 'N/A', detail: 'simulaciones completadas' },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                                                <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{item.value}</p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.detail}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-950 dark:text-white">Evolucion del aprendizaje</h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tendencia por usuario a partir de `improvementTrend` o de simulaciones completadas.</p>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {defensePanel.learningEvidence.filter((item) => item.trend.length > 0).length} series disponibles
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                    {defensePanel.learningEvidence.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos de aprendizaje para mostrar.</p>
                                    ) : defensePanel.learningEvidence.map((item) => (
                                        <div key={item.userId} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-950 dark:text-white">{item.label}</p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        Inicial {item.initial !== null ? `${item.initial}%` : 'N/A'} - Final {item.final !== null ? `${item.final}%` : 'N/A'}
                                                    </p>
                                                </div>
                                                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                                    item.improvement !== null && item.improvement >= 0
                                                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                    {item.improvement !== null ? `${item.improvement >= 0 ? '+' : ''}${item.improvement} pp` : 'Sin delta'}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                {item.trend.length === 0 ? (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin tendencia registrada.</p>
                                                ) : item.trend.map((entry) => (
                                                    <div key={`${item.userId}-${entry.date}-${entry.totalQuestions}`} className="space-y-1">
                                                        <div className="flex items-center justify-between gap-3 text-xs">
                                                            <span className="font-medium text-gray-700 dark:text-gray-200">{entry.date}</span>
                                                            <span className="text-gray-500 dark:text-gray-400">{entry.scorePercent}% - {entry.totalQuestions || 'N/A'} preguntas</span>
                                                        </div>
                                                        <div className="h-2 rounded-full bg-white dark:bg-gray-900">
                                                            <div
                                                                className="h-2 rounded-full bg-green-600 dark:bg-green-400"
                                                                style={{ width: `${Math.min(100, Math.max(4, entry.scorePercent))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">Trazabilidad hipotesis - evidencia</h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lectura preparada para vincular el sistema con las observaciones del tribunal.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                                            <tr>
                                                <th className="px-5 py-3 text-left font-semibold">Afirmacion defendible</th>
                                                <th className="px-5 py-3 text-left font-semibold">Evidencia en sistema</th>
                                                <th className="px-5 py-3 text-left font-semibold">Uso durante la defensa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {defensePanel.traceability.map((item) => (
                                                <tr key={item.claim} className="align-top">
                                                    <td className="px-5 py-4 font-semibold text-gray-950 dark:text-white">{item.claim}</td>
                                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{item.evidence}</td>
                                                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.defenseUse}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-950 dark:text-white">Usuarios de validacion</h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Detalle compacto para mostrar evidencia por caso observado.</p>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{defensePanel.validationUsers.length} casos</span>
                                </div>
                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                    {defensePanel.validationUsers.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay usuarios de validacion cargados.</p>
                                    ) : defensePanel.validationUsers.map((summary) => (
                                        <div key={summary.user.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-950 dark:text-white">{summary.profile}</p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{summary.user.name || summary.user.email || 'Usuario sin nombre'}</p>
                                                </div>
                                                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                                                    Ultima actividad: {formatDateOnly(summary.lastActivity)}
                                                </span>
                                            </div>
                                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                                {[
                                                    ['Chats', String(summary.chats), `${summary.messages} mensajes`],
                                                    ['Simulaciones', `${summary.completedSimulations}/${summary.simulations}`, `mejor ${summary.bestScore ?? 'N/A'}`],
                                                    ['UX', String(summary.researchSessions.length), `NPS ${summary.researchSessions[0]?.nps ?? summary.progress?.stats?.survey?.nps ?? 'N/A'}`],
                                                ].map(([label, value, detail]) => (
                                                    <div key={label} className="rounded-md bg-white p-3 dark:bg-gray-900">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                                                        <p className="mt-1 text-lg font-bold text-gray-950 dark:text-white">{value}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 rounded-md bg-white p-3 text-xs leading-5 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                                                {summary.fullSimulation
                                                    ? `Simulacro completo: ${simulationScore(summary.fullSimulation)} el ${formatDateOnly(simulationActivityDate(summary.fullSimulation))}.`
                                                    : 'Sin simulacro completo de 180 preguntas registrado.'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-950 dark:text-white">Simulacros de 180 preguntas</h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Punto de evidencia clave para responder la observacion del tribunal sobre el simulacro completo.</p>
                                    </div>
                                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {defensePanel.completedFullSimulations.length} completos
                                    </span>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {defensePanel.completedFullSimulations.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay simulacros completados de 180 preguntas registrados.</p>
                                    ) : defensePanel.completedFullSimulations.map((simulation) => {
                                        const owner = dashboard.userMap.get(simulation.user);
                                        return (
                                            <div key={simulation.id} className="flex flex-col gap-2 rounded-md bg-gray-50 px-4 py-3 text-sm dark:bg-gray-950/60 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-950 dark:text-white">{owner?.name || owner?.email || 'Usuario'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(simulationActivityDate(simulation))}</p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="font-semibold text-gray-950 dark:text-white">{simulationScore(simulation)}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{simulation.status || 'sin estado'}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                        )}

                        {(activeAdminView === 'users' || activeAdminView === 'research') && (
                        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">
                                        {activeAdminView === 'research' ? 'Investigación UX por usuario' : 'Histórico de uso por usuario'}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {activeAdminView === 'research'
                                            ? 'Diseña instrumentos y carga relevamientos asociados al usuario seleccionado.'
                                            : 'Selecciona un usuario con rol usuario para revisar chats, progreso y simulaciones.'}
                                    </p>
                                </div>
                                <select
                                    value={selectedUserId}
                                    onChange={(event) => setSelectedUserId(event.target.value)}
                                    disabled={!regularUsers.length}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/50 md:w-80"
                                >
                                    {regularUsers.length === 0 ? (
                                        <option value="">Sin usuarios disponibles</option>
                                    ) : regularUsers.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name || user.email || 'Usuario sin nombre'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!selectedHistory ? (
                                <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
                                    No hay usuarios con rol usuario para mostrar.
                                </div>
                            ) : (
                                <div className="space-y-6 p-5">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-950 dark:text-white">{selectedHistory.user.name || 'Sin nombre'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedHistory.user.email || 'Sin email'}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Periodo observado: {formatDateOnly(selectedHistory.progress?.stats?.syntheticUsage?.periodStart || selectedHistory.firstActivity)} - {formatDateOnly(selectedHistory.progress?.stats?.syntheticUsage?.periodEnd || selectedHistory.lastActivity)}
                                        </p>
                                    </div>

                                    {activeAdminView === 'users' && (
                                    <>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        {[
                                            { label: 'Chats', value: selectedHistory.chats.length, detail: `${selectedHistory.messages.length} mensajes`, icon: MessageSquare },
                                            { label: 'Simulaciones', value: selectedHistory.completedSimulations.length, detail: `${selectedHistory.simulations.length} intentos`, icon: Trophy },
                                            { label: 'Niveles', value: selectedHistory.progress?.completed_levels?.length || 0, detail: `${formatNumber(selectedHistory.progress?.stats?.total_xp)} XP`, icon: Target },
                                            { label: 'Precisión', value: selectedHistory.progress?.stats?.accuracy || 'N/A', detail: `${formatNumber(selectedHistory.progress?.stats?.correct_answers)}/${formatNumber(selectedHistory.progress?.stats?.total_questions)} respuestas`, icon: BarChart2 },
                                        ].map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                                                            <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{item.value}</p>
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.detail}</p>
                                                        </div>
                                                        <div className="rounded-md bg-white p-2 text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-300">
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Simulaciones</h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Racha: {formatNumber(selectedHistory.progress?.stats?.streak)} días
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                {selectedHistory.simulations.length === 0 ? (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin simulaciones registradas.</p>
                                                ) : selectedHistory.simulations.slice(0, 8).map((simulation) => (
                                                    <div key={simulation.id} className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2 text-sm dark:bg-gray-900">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 dark:text-white">{simulationLabel(simulation)}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(simulationActivityDate(simulation))}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gray-900 dark:text-white">{simulationScore(simulation)}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{simulation.status || 'sin estado'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Linea de tiempo</h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Tiempo: {formatMinutes(selectedHistory.progress?.stats?.syntheticUsage?.minutesStudied)}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                {selectedHistory.historyItems.length === 0 ? (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin actividad registrada.</p>
                                                ) : selectedHistory.historyItems.slice(0, 12).map((item) => {
                                                    const Icon = item.kind === 'chat' ? MessageSquare : CalendarDays;
                                                    return (
                                                        <div key={item.id} className="flex gap-3">
                                                            <div className="mt-0.5 rounded-md bg-white p-2 text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                                                                <Icon className="h-4 w-4" />
                                                            </div>
                                                            <div className="min-w-0 border-b border-gray-200 pb-3 last:border-0 last:pb-0 dark:border-gray-800">
                                                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.detail}</p>
                                                                <p className="mt-1 text-xs text-gray-400">{formatDate(item.date)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    </>
                                    )}

                                    {activeAdminView === 'research' && (
                                    <>
                                    <div className="grid gap-6 xl:grid-cols-2">
                                        <form onSubmit={handleSaveInstrument} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Diseñar instrumento de relevamiento</h3>
                                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Nombre
                                                    <input
                                                        value={instrumentForm.title}
                                                        onChange={(event) => handleInstrumentFormChange('title', event.target.value)}
                                                        required
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Ej.: Entrevista de adopción inicial"
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Tipo
                                                    <select
                                                        value={instrumentForm.instrument_type}
                                                        onChange={(event) => handleInstrumentFormChange('instrument_type', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    >
                                                        <option>Entrevista semi-estructurada</option>
                                                        <option>Guía de observación</option>
                                                        <option>Prueba de usabilidad</option>
                                                        <option>Encuesta post-prueba</option>
                                                        <option>Revisión de prototipo</option>
                                                    </select>
                                                </label>
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Objetivo
                                                    <textarea
                                                        value={instrumentForm.objective}
                                                        onChange={(event) => handleInstrumentFormChange('objective', event.target.value)}
                                                        rows={3}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Que decision o supuesto de diseno busca validar."
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Perfil objetivo
                                                    <textarea
                                                        value={instrumentForm.target_profile}
                                                        onChange={(event) => handleInstrumentFormChange('target_profile', event.target.value)}
                                                        rows={3}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Ej.: aspirante PMP sin formacion formal previa."
                                                    />
                                                </label>
                                            </div>

                                            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                Preguntas o tareas
                                                <textarea
                                                    value={instrumentForm.questions}
                                                    onChange={(event) => handleInstrumentFormChange('questions', event.target.value)}
                                                    rows={5}
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    placeholder="Una pregunta o tarea por linea"
                                                />
                                            </label>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Items de escala
                                                    <textarea
                                                        value={instrumentForm.scale_items}
                                                        onChange={(event) => handleInstrumentFormChange('scale_items', event.target.value)}
                                                        rows={4}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Ej.: utilidad percibida 1-5"
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Instrucciones de aplicación
                                                    <textarea
                                                        value={instrumentForm.instructions}
                                                        onChange={(event) => handleInstrumentFormChange('instructions', event.target.value)}
                                                        rows={4}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Cómo aplicar, registrar y cerrar la sesión."
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Etiqueta
                                                    <input
                                                        value={instrumentForm.evidence_tag}
                                                        onChange={(event) => handleInstrumentFormChange('evidence_tag', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Ej.: INST-UX-01"
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Version
                                                    <input
                                                        value={instrumentForm.version}
                                                        onChange={(event) => handleInstrumentFormChange('version', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Estado
                                                    <select
                                                        value={instrumentForm.status}
                                                        onChange={(event) => handleInstrumentFormChange('status', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    >
                                                        <option>activo</option>
                                                        <option>borrador</option>
                                                        <option>archivado</option>
                                                    </select>
                                                </label>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{instrumentNotice || 'El instrumento quedará disponible para asociarlo a sesiones relevadas.'}</p>
                                                <button
                                                    type="submit"
                                                    disabled={isSavingInstrument || !instrumentForm.title.trim()}
                                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {isSavingInstrument ? 'Guardando...' : 'Guardar instrumento'}
                                                </button>
                                            </div>
                                        </form>

                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Instrumentos disponibles</h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{researchInstruments.length} instrumentos</span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                {researchInstruments.length === 0 ? (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin instrumentos registrados.</p>
                                                ) : researchInstruments.map((instrument) => (
                                                    <div key={instrument.id} className="rounded-md bg-white p-3 text-sm dark:bg-gray-900">
                                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                                            <div>
                                                                <p className="font-semibold text-gray-900 dark:text-white">{instrument.title || 'Instrumento sin titulo'}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{instrument.instrument_type || 'Tipo no definido'} {instrument.evidence_tag ? `- ${instrument.evidence_tag}` : ''}</p>
                                                            </div>
                                                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{instrument.status || 'activo'}</span>
                                                        </div>
                                                        {instrument.objective && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{instrument.objective}</p>}
                                                        {Array.isArray(instrument.questions) && instrument.questions.length > 0 && (
                                                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{instrument.questions.length} preguntas/tareas definidas</p>
                                                        )}
                                                        {Array.isArray(instrument.scale_items) && instrument.scale_items.length > 0 && (
                                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{instrument.scale_items.length} items de escala</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 xl:grid-cols-2">
                                        <form onSubmit={handleSaveResearchSession} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Cargar feedback de sesión</h3>
                                                <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Instrumento aplicado
                                                    <select
                                                        value={researchForm.instrument}
                                                        onChange={(event) => handleResearchFormChange('instrument', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    >
                                                        <option value="">Sin instrumento asociado</option>
                                                        {researchInstruments.map((instrument) => (
                                                            <option key={instrument.id} value={instrument.id}>
                                                                {instrument.evidence_tag ? `${instrument.evidence_tag} - ` : ''}{instrument.title || 'Instrumento sin titulo'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Fecha
                                                    <input
                                                        type="date"
                                                        value={researchForm.session_date}
                                                        onChange={(event) => handleResearchFormChange('session_date', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:col-span-2">
                                                    Tipo
                                                    <select
                                                        value={researchForm.session_type}
                                                        onChange={(event) => handleResearchFormChange('session_type', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    >
                                                        <option>Entrevista semi-estructurada</option>
                                                        <option>Observacion de uso</option>
                                                        <option>Prueba de usabilidad</option>
                                                        <option>Revisión de prototipo</option>
                                                        <option>Encuesta post-prueba</option>
                                                    </select>
                                                </label>
                                            </div>

                                            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                Contexto de la sesión
                                                <textarea
                                                    value={researchForm.context}
                                                    onChange={(event) => handleResearchFormChange('context', event.target.value)}
                                                    rows={2}
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    placeholder="Ej.: simulacro de 45 preguntas desde notebook, entrevista posterior."
                                                />
                                            </label>

                                            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                Feedback del usuario
                                                <textarea
                                                    value={researchForm.feedback}
                                                    onChange={(event) => handleResearchFormChange('feedback', event.target.value)}
                                                    rows={3}
                                                    required
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    placeholder="Comentario cualitativo, percepción de utilidad, confianza o fricciones."
                                                />
                                            </label>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Puntos de dolor
                                                    <textarea
                                                        value={researchForm.pain_points}
                                                        onChange={(event) => handleResearchFormChange('pain_points', event.target.value)}
                                                        rows={4}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Uno por linea"
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Decisiones de diseno derivadas
                                                    <textarea
                                                        value={researchForm.design_decisions}
                                                        onChange={(event) => handleResearchFormChange('design_decisions', event.target.value)}
                                                        rows={4}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Una por linea"
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                                {[
                                                    ['nps', 'NPS', '0 a 10'],
                                                    ['usefulness_score', 'Utilidad', '1 a 5'],
                                                    ['usability_score', 'Facilidad', '1 a 5'],
                                                ].map(([field, label, placeholder]) => (
                                                    <label key={field} className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                        {label}
                                                        <input
                                                            type="number"
                                                            min={field === 'nps' ? 0 : 1}
                                                            max={field === 'nps' ? 10 : 5}
                                                            value={researchForm[field as keyof ResearchFormState]}
                                                            onChange={(event) => handleResearchFormChange(field as keyof ResearchFormState, event.target.value)}
                                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                            placeholder={placeholder}
                                                        />
                                                    </label>
                                                ))}
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Seguimiento
                                                    <input
                                                        value={researchForm.follow_up}
                                                        onChange={(event) => handleResearchFormChange('follow_up', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Ej.: ajustar copy del simulador"
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Etiqueta de evidencia
                                                    <input
                                                        value={researchForm.evidence_tag}
                                                        onChange={(event) => handleResearchFormChange('evidence_tag', event.target.value)}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        placeholder="Ej.: UX-EDU-01"
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{researchNotice || 'El registro queda asociado al usuario seleccionado.'}</p>
                                                <button
                                                    type="submit"
                                                    disabled={isSavingResearch || !researchForm.feedback.trim()}
                                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {isSavingResearch ? 'Guardando...' : 'Guardar feedback'}
                                                </button>
                                            </div>
                                        </form>

                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Evidencia de diseno centrado en usuarios</h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{selectedHistory.researchSessions.length} sesiones</span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                {selectedHistory.researchSessions.length === 0 ? (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin feedback registrado para este usuario.</p>
                                                ) : selectedHistory.researchSessions.map((session) => {
                                                    const instrument = session.instrument ? instrumentsById.get(session.instrument) : null;
                                                    return (
                                                        <div key={session.id} className="rounded-md bg-white p-3 text-sm dark:bg-gray-900">
                                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                                                <div>
                                                                    <p className="font-semibold text-gray-900 dark:text-white">{session.session_type || 'Sesion'}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateOnly(session.session_date || session.created)} {session.evidence_tag ? `- ${session.evidence_tag}` : ''}</p>
                                                                    {instrument && (
                                                                        <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                                                                            Instrumento: {instrument.evidence_tag ? `${instrument.evidence_tag} - ` : ''}{instrument.title}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    <span>NPS {session.nps ?? 'N/A'}</span>
                                                                    <span>Utilidad {formatScore(session.usefulness_score)}</span>
                                                                    <span>UX {formatScore(session.usability_score)}</span>
                                                                </div>
                                                            </div>
                                                            {session.context && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{session.context}</p>}
                                                            <p className="mt-2 text-gray-700 dark:text-gray-200">{session.feedback}</p>
                                                            {Array.isArray(session.pain_points) && session.pain_points.length > 0 && (
                                                                <div className="mt-3">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Hallazgos</p>
                                                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-gray-600 dark:text-gray-300">
                                                                        {session.pain_points.map((item) => <li key={item}>{item}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {Array.isArray(session.design_decisions) && session.design_decisions.length > 0 && (
                                                                <div className="mt-3">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Decisiones</p>
                                                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-gray-600 dark:text-gray-300">
                                                                        {session.design_decisions.map((item) => <li key={item}>{item}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {session.follow_up && <p className="mt-3 text-xs text-blue-600 dark:text-blue-300">Seguimiento: {session.follow_up}</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    </>
                                    )}
                                </div>
                            )}
                        </section>
                        )}

                        {activeAdminView === 'users' && (
                        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                                <h2 className="text-base font-bold text-gray-950 dark:text-white">Usuarios y progreso</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Resumen por usuario de actividad, avance y resultados.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                                        <tr>
                                            <th className="px-5 py-3 text-left font-semibold">Usuario</th>
                                            <th className="px-5 py-3 text-left font-semibold">Rol</th>
                                            <th className="px-5 py-3 text-right font-semibold">Chats</th>
                                            <th className="px-5 py-3 text-right font-semibold">Mensajes</th>
                                            <th className="px-5 py-3 text-right font-semibold">Niveles</th>
                                            <th className="px-5 py-3 text-right font-semibold">Simulaciones</th>
                                            <th className="px-5 py-3 text-right font-semibold">Mejor score</th>
                                            <th className="px-5 py-3 text-left font-semibold">Ultima actividad</th>
                                            <th className="px-5 py-3 text-right font-semibold">Histórico</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {dashboard.summaries.map((summary) => (
                                            <tr key={summary.user.id} className={`${selectedUserId === summary.user.id ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-950/60'}`}>
                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-gray-950 dark:text-white">{summary.user.name || 'Sin nombre'}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{summary.user.email || 'Sin email'}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${summary.user.role === 'admin' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                        {summary.user.role || 'usuario'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-200">{summary.chats}</td>
                                                <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-200">{summary.messages}</td>
                                                <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-200">{summary.completedLevels}</td>
                                                <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-200">{summary.completedSimulations}/{summary.simulations}</td>
                                                <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-200">{summary.bestScore ?? 'N/A'}</td>
                                                <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{formatDate(summary.lastActivity)}</td>
                                                <td className="px-5 py-4 text-right">
                                                    {(summary.user.role || 'usuario') === 'usuario' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedUserId(summary.user.id)}
                                                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-200"
                                                        >
                                                            Ver
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
