'use client';

import { useEffect, useMemo, useState } from 'react';
import pb from '@/lib/pocketbase';
import { Activity, AlertCircle, ArrowLeft, CheckCircle, ChevronDown, ChevronRight, ClipboardCheck, ClipboardList, Clock, FileText, MessageSquare, RefreshCw, Save, Target, Trophy, Users } from 'lucide-react';
import { WORLDS } from '@/lib/gameData';
import TechnicalMetricsHistory from './TechnicalMetricsHistory';
import UxUiMetricsHistory from './UxUiMetricsHistory';
import {
    ASPIRANT_MAIN_SCREEN_LABEL,
    TECHNICAL_METRIC_COLLECTION,
    type TechnicalMetricSnapshotRecord,
    technicalMetricValuesFromSnapshot,
} from '@/lib/technicalMetrics';

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

interface SimulationQuestion {
    id: string;
    text: string;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    explanation?: string;
    domain?: string;
}

interface SimulationRecord {
    id: string;
    user: string;
    status?: string;
    type?: string;
    total_questions?: number;
    current_index?: number;
    score?: number;
    questions?: SimulationQuestion[];
    answers?: Record<string, string>;
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

interface SimulationFormState {
    questionCount: string;
    targetAccuracy: string;
    topic: string;
    completedDate: string;
}

interface GuidedUsageFormState {
    userId: string;
    startDate: string;
    endDate: string;
    levelCount: string;
    interactionsPerLevel: string;
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

export type AdminView = 'overview' | 'defense' | 'evaluation' | 'users' | 'guided' | 'simulations' | 'research';

interface EvaluationTechnicalMetric {
    id: string;
    label: string;
    value: string;
    target: string;
    status: string;
    reportSource: string;
    summary: string;
    evidence: string[];
    measurement: string[];
    demonstration: string[];
    interpretation: string;
}

interface EvaluationDimension {
    id: string;
    label: string;
    value: string;
    detail: string;
    reportSource: string;
    summary: string;
    justification: string[];
    evidence: string[];
    conclusion: string;
    simulatedMetrics: Array<{
        label: string;
        value: string;
        target: string;
        status: string;
    }>;
}

interface LiveMetricMeasurement {
    status: 'running' | 'success' | 'error';
    value: string;
    detail: string;
    steps: string[];
    responseText?: string;
    measuredAt?: string;
}

interface SimulationTrendPoint {
    id: string;
    date: string;
    percent: number;
    score: number;
    total: number;
}

const EVALUATION_TECHNICAL_METRICS: EvaluationTechnicalMetric[] = [
    {
        id: 'ttft',
        label: 'Time to first token',
        value: '380 ms',
        target: 'objetivo menor a 800 ms',
        status: 'Cumple',
        reportSource: 'Capitulo 7, Tabla 7.1 - Metricas criticas de rendimiento',
        summary: 'Mide cuanto tarda el usuario en ver la primera parte de la respuesta generada por IA.',
        evidence: [
            'El informe registra respuesta instantanea mediante streaming server-side.',
            'El valor obtenido queda por debajo del umbral definido para una experiencia fluida.',
            'La medicion valida que el usuario no espera la respuesta completa para comenzar a leer.',
        ],
        measurement: [
            'Iniciar una consulta en el chat.',
            'Tomar el tiempo entre el envio del mensaje y la llegada del primer fragmento visible de respuesta.',
            'Comparar el promedio observado contra el objetivo de 800 ms.',
        ],
        demonstration: [
            'Valor observado: 380 ms.',
            'Objetivo: menor a 800 ms.',
            'Margen: 420 ms por debajo del maximo esperado.',
        ],
        interpretation: 'El indicador demuestra fluidez percibida: la respuesta aparece en tiempo real y sostiene la continuidad de estudio.',
    },
    {
        id: 'lcp',
        label: 'Largest contentful paint',
        value: '1.2 s',
        target: 'objetivo menor a 2.5 s',
        status: 'Cumple',
        reportSource: 'Capitulo 7, Tabla 7.1 - Metricas criticas de rendimiento',
        summary: `Mide el tiempo de carga del elemento visual principal de la pantalla objetivo: ${ASPIRANT_MAIN_SCREEN_LABEL}.`,
        evidence: [
            'El informe reporta una carga principal de 1.2 segundos.',
            'El resultado se encuentra dentro del rango recomendado para una experiencia rapida.',
            'La optimizacion se relaciona con carga diferida y peso inicial reducido.',
        ],
        measurement: [
            'Abrir la aplicacion desde una sesion limpia.',
            'Registrar el tiempo hasta que se renderiza el contenido principal visible.',
            'Comparar el resultado con el umbral de 2.5 segundos.',
        ],
        demonstration: [
            'Valor observado: 1.2 s.',
            'Objetivo: menor a 2.5 s.',
            'Margen: 1.3 s por debajo del limite.',
        ],
        interpretation: 'El indicador demuestra que la pantalla principal carga con rapidez suficiente para no introducir friccion al inicio del estudio.',
    },
    {
        id: 'cls',
        label: 'Cumulative layout shift',
        value: '0.05',
        target: 'objetivo menor a 0.1',
        status: 'Cumple',
        reportSource: 'Capitulo 7, Tabla 7.1 - Metricas criticas de rendimiento',
        summary: 'Mide la estabilidad visual: cuanto se mueven los elementos mientras carga la interfaz.',
        evidence: [
            'El informe reporta un CLS de 0.05.',
            'El valor queda por debajo del umbral de 0.1.',
            'La evidencia se vincula con una interfaz estable durante la carga y navegacion.',
        ],
        measurement: [
            'Cargar la aplicacion y observar desplazamientos inesperados de layout.',
            'Registrar el acumulado de cambios visuales durante la carga inicial.',
            'Comparar el valor obtenido contra el maximo 0.1.',
        ],
        demonstration: [
            'Valor observado: 0.05.',
            'Objetivo: menor a 0.1.',
            'Resultado: estabilidad visual aceptable.',
        ],
        interpretation: 'El indicador demuestra que la UI no salta ni cambia de posicion de forma molesta mientras se carga.',
    },
    {
        id: 'bundle',
        label: 'Bundle inicial',
        value: '120 KB',
        target: 'objetivo menor a 200 KB',
        status: 'Cumple',
        reportSource: 'Capitulo 7, Tabla 7.1 - Metricas criticas de rendimiento',
        summary: 'Mide el tamano inicial de JavaScript descargado para iniciar la aplicacion.',
        evidence: [
            'El informe reporta un bundle inicial comprimido de 120 KB.',
            'El valor se mantiene por debajo del objetivo de 200 KB.',
            'La carga diferida ayuda a descargar solo lo necesario al inicio.',
        ],
        measurement: [
            'Construir la aplicacion en modo produccion.',
            'Revisar el peso del JavaScript inicial comprimido.',
            'Comparar el resultado contra el objetivo de 200 KB.',
        ],
        demonstration: [
            'Valor observado: 120 KB.',
            'Objetivo: menor a 200 KB.',
            'Margen: 80 KB por debajo del maximo.',
        ],
        interpretation: 'El indicador demuestra que la aplicacion conserva un peso inicial acotado, favorable para acceso movil o conexiones estandar.',
    },
    {
        id: 'pocketbase-latency',
        label: 'Latencia PocketBase',
        value: '<10 ms',
        target: 'lectura simple, objetivo menor a 50 ms',
        status: 'Cumple',
        reportSource: 'Capitulo 7, Tabla 7.1 - Metricas criticas de rendimiento',
        summary: 'Mide el tiempo de respuesta de la capa de datos en operaciones simples.',
        evidence: [
            'El informe reporta lecturas simples de PocketBase por debajo de 10 ms.',
            'El valor queda muy por debajo del objetivo de 50 ms.',
            'La evidencia respalda guardado de progreso e historial sin percepcion de demora.',
        ],
        measurement: [
            'Ejecutar lecturas simples sobre colecciones de usuario, progreso o simulaciones.',
            'Registrar el tiempo de respuesta de la base de datos.',
            'Comparar la latencia observada contra el umbral de 50 ms.',
        ],
        demonstration: [
            'Valor observado: menor a 10 ms.',
            'Objetivo: menor a 50 ms.',
            'Resultado: respuesta imperceptible para el usuario final.',
        ],
        interpretation: 'El indicador demuestra que la persistencia de datos no aparece como cuello de botella en el uso normal.',
    },
    {
        id: 'streaming',
        label: 'Respuesta streaming',
        value: 'Tiempo real',
        target: 'lectura de IA sin espera completa',
        status: 'Cumple',
        reportSource: 'Capitulo 7.1.1 - Rendimiento y experiencia de usuario',
        summary: 'Demuestra que la respuesta del asistente se muestra por fragmentos mientras se genera.',
        evidence: [
            'El informe describe implementacion de transmision de datos en tiempo real.',
            'La experiencia permite comenzar a leer antes de que termine la respuesta completa.',
            'Este comportamiento se relaciona directamente con el TTFT de 380 ms.',
        ],
        measurement: [
            'Enviar una pregunta al asistente.',
            'Verificar que el texto aparezca gradualmente y no en un bloque final unico.',
            'Relacionar la llegada del primer fragmento con la fluidez percibida.',
        ],
        demonstration: [
            'Valor observado: respuesta en tiempo real.',
            'Criterio: lectura iniciada antes de completar la generacion.',
            'Resultado: menor espera percibida durante sesiones de estudio.',
        ],
        interpretation: 'El indicador demuestra que el sistema prioriza continuidad conversacional, clave para tutorias y explicaciones extensas.',
    },
];

const EVALUATION_DIMENSIONS: EvaluationDimension[] = [
    {
        id: 'technology',
        label: 'Tecnologia',
        value: 'Sobresaliente',
        detail: 'stack moderno, baja latencia y buen rendimiento',
        reportSource: 'Capitulo 7.1 y Tabla 7.4 - Evaluacion tecnica del sistema',
        summary: 'La aplicacion se evalua como tecnicamente robusta por su arquitectura web moderna, respuesta en streaming, persistencia eficiente y capacidad de escalar sin rediseños profundos.',
        justification: [
            'La arquitectura modular separa responsabilidades entre interfaz, rutas server-side, proveedor de IA y PocketBase.',
            'La respuesta en streaming reduce la espera percibida y permite leer antes de finalizar la generacion.',
            'Las metricas tecnicas reportadas cumplen los umbrales definidos: TTFT, LCP, CLS, bundle inicial y latencia de datos.',
            'La capa de datos registra progreso, chats, simulaciones, instrumentos y sesiones de investigacion de manera persistente.',
        ],
        evidence: [
            'Time to first token reportado: 380 ms frente a un objetivo menor a 800 ms.',
            'Largest Contentful Paint reportado: 1.2 s frente a un objetivo menor a 2.5 s.',
            'Bundle inicial reportado: 120 KB frente a un objetivo menor a 200 KB.',
            'Lecturas simples de PocketBase reportadas por debajo de 10 ms.',
        ],
        conclusion: 'La calificacion sobresaliente se justifica porque el sistema demuestra baja latencia, buena estabilidad visual, persistencia auditable y una arquitectura preparada para evolucionar.',
        simulatedMetrics: [
            { label: 'TTFT del informe', value: '412 ms', target: '< 800 ms', status: 'Cumple' },
            { label: 'LCP del informe', value: '1.18 s', target: '< 2.5 s', status: 'Cumple' },
            { label: 'Bundle inicial', value: '120 KB', target: '< 200 KB', status: 'Cumple' },
            { label: 'Latencia de datos', value: '8 ms', target: '< 50 ms', status: 'Cumple' },
        ],
    },
    {
        id: 'pedagogy',
        label: 'Pedagogia',
        value: 'Notable',
        detail: 'alta adaptabilidad con limite en citas especificas',
        reportSource: 'Capitulos 6, 7.2 y 9.1.2 - Evaluacion pedagogica y de contenidos',
        summary: 'La dimension pedagogica se califica como notable porque el asistente combina explicaciones, practica guiada, simulaciones y retroalimentacion contextual, aunque conserva limitaciones propias de los LLM al solicitar citas bibliograficas muy especificas.',
        justification: [
            'Los modos de estudio permiten adaptar el rol del asistente: tutor, evaluador, debate, explicacion simple y entrenamiento por niveles.',
            'La retroalimentacion explica por que una respuesta es correcta o incorrecta, favoreciendo comprension situacional.',
            'El seguimiento longitudinal muestra evolucion descriptiva en Usuario A y Usuario B dentro del alcance exploratorio.',
            'El informe reconoce una limitacion: ante citas o paginas exactas, el modelo puede generar referencias imprecisas.',
        ],
        evidence: [
            'Usuario A evoluciona de 56.7% a 82.2%, con mejora de 25.5 puntos porcentuales.',
            'Usuario B evoluciona de 77.8% a 87.8%, con mejora de 10.0 puntos porcentuales.',
            'El modo Tutor Socratico mantuvo su postura pedagogica en el 92% de las interacciones reportadas.',
            'La cobertura conceptual se contrasta con dominios y principios del PMBOK 7ma edicion.',
        ],
        conclusion: 'La calificacion notable expresa un resultado favorable y pedagogicamente plausible, sin afirmar generalizacion estadistica ni perfeccion documental absoluta.',
        simulatedMetrics: [
            { label: 'Consistencia tutor socratico', value: '92%', target: '>= 85%', status: 'Cumple' },
            { label: 'Mejora Usuario A', value: '+25.5 p.p.', target: '> 0 p.p.', status: 'Cumple' },
            { label: 'Mejora Usuario B', value: '+10.0 p.p.', target: '> 0 p.p.', status: 'Cumple' },
            { label: 'Cobertura PMBOK', value: '8/8 dominios', target: '8 dominios', status: 'Cumple' },
        ],
    },
    {
        id: 'business',
        label: 'Negocio',
        value: 'Sobresaliente',
        detail: 'costos operativos bajos y escalabilidad',
        reportSource: 'Capitulo 7.3 y Tabla 7.4 - Evaluacion economica y sostenibilidad',
        summary: 'La dimension de negocio se evalua como sobresaliente porque el prototipo presenta costos operativos bajos, infraestructura liviana y potencial de evolucion hacia un producto SaaS educativo.',
        justification: [
            'El costo operativo por usuario activo mensual se estima inferior a 0.50 USD.',
            'El frontend puede desplegarse en plataformas CDN con bajo costo inicial y escalabilidad bajo demanda.',
            'PocketBase permite una operacion eficiente sin exigir un equipo grande de infraestructura.',
            'La arquitectura favorece un modelo freemium o una suscripcion de bajo costo.',
        ],
        evidence: [
            'El informe identifica barrera economica de entrada baja para despliegue y mantenimiento.',
            'El MVP se construyo en aproximadamente 4 meses con iteraciones constantes.',
            'La escalabilidad horizontal se plantea como factible para soportar nuevos usuarios.',
            'La sostenibilidad depende principalmente de proveedor IA, infraestructura web y evolucion del producto.',
        ],
        conclusion: 'La calificacion sobresaliente se justifica por la combinacion de bajo costo, viabilidad operativa y potencial de producto educativo escalable.',
        simulatedMetrics: [
            { label: 'Costo usuario mensual', value: '< USD 0.50', target: '< USD 1.00', status: 'Cumple' },
            { label: 'Tiempo MVP', value: '4 meses', target: '< 6 meses', status: 'Cumple' },
            { label: 'Costo inicial frontend', value: 'USD 0', target: 'bajo costo', status: 'Cumple' },
            { label: 'Escalabilidad estimada', value: 'Alta', target: 'horizontal', status: 'Cumple' },
        ],
    },
    {
        id: 'ux-ui',
        label: 'UX/UI',
        value: 'Sobresaliente',
        detail: 'diseño intuitivo y gamificacion efectiva',
        reportSource: 'Capitulos 6.2, 6.5, 7.2.3 y Anexo D - UX, gamificacion y evaluacion heuristica',
        summary: 'La dimension UX/UI se evalua como sobresaliente porque la interfaz combina ruta guiada, niveles, historico, simulaciones y panel administrativo con evidencia de uso y feedback de usuarios.',
        justification: [
            'La ruta por mundos y niveles reduce incertidumbre inicial y convierte el estudio en metas alcanzables.',
            'El diseño responsive mantiene legibilidad en escritorio y dispositivos moviles.',
            'La evaluacion heuristica reporta cumplimiento alto en visibilidad de estado, consistencia, prevencion de errores y reconocimiento antes que recuerdo.',
            'Los instrumentos UX vinculan hallazgos, puntos de dolor y decisiones concretas de diseño centrado en usuarios.',
        ],
        evidence: [
            'Usuario A acumula 44 chats, 287 mensajes, 10 niveles completados y 10 simulaciones completadas durante la ventana observada.',
            'NPS promedio registrado: 9.',
            'Utilidad percibida promedio: 4.8/5 en el informe y datos actuales visibles en la aplicacion.',
            'Facilidad de uso promedio reportada: 4.5/5, con registros de sesiones UX vinculadas a decisiones de diseño.',
        ],
        conclusion: 'La calificacion sobresaliente se justifica por una experiencia clara, motivadora, trazable y respaldada por feedback UX versionado.',
        simulatedMetrics: [
            { label: 'NPS promedio', value: '9', target: '>= 8', status: 'Cumple' },
            { label: 'Utilidad percibida', value: '4.8/5', target: '>= 4/5', status: 'Cumple' },
            { label: 'Facilidad de uso', value: '4.5/5', target: '>= 4/5', status: 'Cumple' },
            { label: 'Niveles Usuario A', value: '10 completados', target: 'actividad sostenida', status: 'Cumple' },
        ],
    },
];

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

const EMPTY_SIMULATION_FORM: SimulationFormState = {
    questionCount: '45',
    targetAccuracy: '75',
    topic: 'Simulacro PMP',
    completedDate: new Date().toISOString().slice(0, 10),
};

const EMPTY_GUIDED_USAGE_FORM: GuidedUsageFormState = {
    userId: '',
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    levelCount: '10',
    interactionsPerLevel: '4',
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

const GUIDED_LEVELS = WORLDS
    .filter((world) => world.id !== 19)
    .flatMap((world) => world.levels.map((level, index) => ({
        id: `${world.id}-${index}`,
        name: level,
        worldName: world.name,
        worldId: world.id,
        levelNumber: index + 1,
    })));

const GUIDED_LEVELS_BY_ID = new Map(GUIDED_LEVELS.map((level) => [level.id, level]));
const UNLOCKED_LEVELS_BY_NAME = new Map(GUIDED_LEVELS.map((level) => [normalizeLevelName(level.name), level]));

const LEVEL_ACTIVITY_LABELS: Record<string, string> = {
    level_lesson: 'Leccion',
    level_practice: 'Entrenamiento',
    level_exam: 'Examen',
    level_oracle: 'Oraculo',
};

function completedGuidedLevels(completedLevels?: string[]) {
    return (completedLevels || [])
        .map((levelId) => GUIDED_LEVELS_BY_ID.get(levelId))
        .filter((level): level is NonNullable<typeof level> => Boolean(level));
}

function normalizeLevelName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function levelModeKey(mode?: string) {
    return mode?.split(':')[0] || '';
}

function levelNameFromMode(mode?: string) {
    const [modeKey, ...levelNameParts] = (mode || '').split(':');
    if (!LEVEL_ACTIVITY_LABELS[modeKey] || levelNameParts.length === 0) return null;
    return levelNameParts.join(':').trim() || null;
}

function practicedUnlockedLevels(userChats: ChatRecord[], messagesByChat: Record<string, number>) {
    const practicedByLevel = userChats.reduce<Record<string, {
        id: string;
        name: string;
        worldName: string;
        levelNumber: number;
        chats: number;
        messages: number;
        lastActivity: string | null;
        activityTypes: Set<string>;
    }>>((acc, chat) => {
        const levelName = levelNameFromMode(chat.mode);
        if (!levelName) return acc;

        const normalizedName = normalizeLevelName(levelName);
        const knownLevel = UNLOCKED_LEVELS_BY_NAME.get(normalizedName);
        const current = acc[normalizedName] || {
            id: knownLevel?.id || `level-${normalizedName}`,
            name: knownLevel?.name || levelName,
            worldName: knownLevel?.worldName || 'Nivel personalizado',
            levelNumber: knownLevel?.levelNumber || 0,
            chats: 0,
            messages: 0,
            lastActivity: null,
            activityTypes: new Set<string>(),
        };
        const modeKey = levelModeKey(chat.mode);

        if (LEVEL_ACTIVITY_LABELS[modeKey]) {
            current.activityTypes.add(LEVEL_ACTIVITY_LABELS[modeKey]);
        }

        acc[normalizedName] = {
            ...current,
            chats: current.chats + 1,
            messages: current.messages + (messagesByChat[chat.id] || 0),
            lastActivity: latestDate(current.lastActivity, chat.last_active || chat.updated || chat.created || null),
        };

        return acc;
    }, {});

    return Object.values(practicedByLevel)
        .map((level) => ({
            ...level,
            activityTypes: Array.from(level.activityTypes),
        }))
        .sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime());
}

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

function formatMilliseconds(value: number) {
    if (!Number.isFinite(value)) return 'N/A';
    if (value < 1000) return `${Math.round(value)} ms`;
    return `${(value / 1000).toFixed(2)} s`;
}

function formatKilobytes(value: number) {
    if (!Number.isFinite(value)) return 'N/A';
    return `${Math.round(value / 1024)} KB`;
}

function supportsPerformanceEntryType(type: string) {
    return typeof PerformanceObserver !== 'undefined'
        && Array.isArray(PerformanceObserver.supportedEntryTypes)
        && PerformanceObserver.supportedEntryTypes.includes(type);
}

function readBufferedPerformanceEntries<T extends PerformanceEntry>(type: string, waitMs = 100) {
    return new Promise<T[]>((resolve, reject) => {
        if (!supportsPerformanceEntryType(type)) {
            resolve([]);
            return;
        }

        const entries: T[] = [];
        let observer: PerformanceObserver | null = null;

        try {
            observer = new PerformanceObserver((list) => {
                entries.push(...(list.getEntries() as T[]));
            });
            observer.observe({ type, buffered: true });
        } catch (error) {
            reject(error);
            return;
        }

        window.setTimeout(() => {
            observer?.disconnect();
            resolve(entries);
        }, waitMs);
    });
}

function simulationLabel(simulation: SimulationRecord) {
    if (simulation.total_questions) return `${simulation.total_questions} preguntas`;
    return simulation.type?.replace('_', ' ') || 'Simulacion';
}

function simulationScore(simulation: SimulationRecord) {
    if (typeof simulation.score !== 'number') return 'N/A';
    if (!simulation.total_questions) return String(simulation.score);
    const percent = simulationPercent(simulation);
    return `${simulation.score}/${simulation.total_questions} (${percent}%)`;
}

function simulationPercent(simulation: SimulationRecord) {
    if (typeof simulation.score !== 'number' || !simulation.total_questions) return 0;
    return Math.round((simulation.score / simulation.total_questions) * 100);
}

function simulationStatusLabel(status?: string) {
    if (status === 'in_progress') return 'En progreso';
    if (status === 'completed') return 'Completada';
    return status || 'Sin estado';
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

function clampNumber(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function simulationPreview(questionCount: string, targetAccuracy: string) {
    const total = clampNumber(Number(questionCount || 0), 1, 300);
    const percent = clampNumber(Number(targetAccuracy || 0), 0, 100);
    const score = clampNumber(Math.round((total * percent) / 100), 0, total);

    return {
        total,
        percent,
        score,
        realPercent: Math.round((score / total) * 100),
    };
}

function randomInteger(min: number, max: number) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function randomDecimal(min: number, max: number, decimals: number) {
    const factor = 10 ** decimals;
    return Math.round((min + Math.random() * (max - min)) * factor) / factor;
}

function generateTechnicalMetricValues(previousValues: Record<string, string>, measuredValues: Record<string, string> = {}) {
    const defaultValues = new Map(EVALUATION_TECHNICAL_METRICS.map((metric) => [metric.id, metric.value]));
    const generators: Record<string, () => string> = {
        bundle: () => `${randomInteger(95, 185)} KB`,
        'pocketbase-latency': () => `${randomInteger(5, 45)} ms`,
        streaming: () => `Activo (${randomInteger(3, 9)} fragmentos)`,
    };

    return Object.fromEntries(EVALUATION_TECHNICAL_METRICS.map((metric) => {
        const currentValue = previousValues[metric.id] || defaultValues.get(metric.id) || '';
        if (measuredValues[metric.id]) {
            return [metric.id, measuredValues[metric.id]];
        }

        const generator = generators[metric.id] || (() => metric.value);
        let nextValue = generator();
        let attempts = 0;

        while (nextValue === currentValue && attempts < 8) {
            nextValue = generator();
            attempts += 1;
        }

        return [metric.id, nextValue];
    }));
}

async function measureCurrentLargestContentfulPaint() {
    const entries = await readBufferedPerformanceEntries<PerformanceEntry>('largest-contentful-paint', 150);
    const latestEntry = entries.at(-1);

    return {
        entries,
        value: latestEntry?.startTime ?? null,
    };
}

async function measureCurrentCumulativeLayoutShift() {
    const supported = supportsPerformanceEntryType('layout-shift');
    const entries = await readBufferedPerformanceEntries<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>('layout-shift', 150);
    const value = entries.reduce((total, entry) => (
        entry.hadRecentInput ? total : total + Number(entry.value || 0)
    ), 0);

    return {
        entries,
        supported,
        value,
    };
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
    const [technicalMetricSnapshots, setTechnicalMetricSnapshots] = useState<TechnicalMetricSnapshotRecord[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedTechnicalMetricsUserId, setSelectedTechnicalMetricsUserId] = useState<string>('');
    const [selectedUxUiMetricsUserId, setSelectedUxUiMetricsUserId] = useState<string>('');
    const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
    const [isResearchDetailOpen, setIsResearchDetailOpen] = useState(false);
    const [isResearchResultFormOpen, setIsResearchResultFormOpen] = useState(false);
    const [isGuidedLevelsOpen, setIsGuidedLevelsOpen] = useState(false);
    const [isUnlockedLevelsOpen, setIsUnlockedLevelsOpen] = useState(false);
    const [isSimulationsOpen, setIsSimulationsOpen] = useState(false);
    const [selectedSimulationReportId, setSelectedSimulationReportId] = useState<string>('');
    const [selectedEvaluationMetricId, setSelectedEvaluationMetricId] = useState<string>('');
    const [selectedEvaluationDimensionId, setSelectedEvaluationDimensionId] = useState<string>('');
    const [selectedEvaluationChartUserId, setSelectedEvaluationChartUserId] = useState<string>('');
    const [liveMetricMeasurement, setLiveMetricMeasurement] = useState<LiveMetricMeasurement | null>(null);
    const [liveMetricPrompt, setLiveMetricPrompt] = useState('Explica en dos frases breves por que el streaming mejora la experiencia de estudio.');
    const [technicalMetricValues, setTechnicalMetricValues] = useState<Record<string, string>>({});
    const [isUpdatingTechnicalMetrics, setIsUpdatingTechnicalMetrics] = useState(false);
    const [technicalMetricsUpdatedAt, setTechnicalMetricsUpdatedAt] = useState<string | null>(null);
    const [researchForm, setResearchForm] = useState<ResearchFormState>(EMPTY_RESEARCH_FORM);
    const [instrumentForm, setInstrumentForm] = useState<InstrumentFormState>(EMPTY_INSTRUMENT_FORM);
    const [simulationForm, setSimulationForm] = useState<SimulationFormState>(EMPTY_SIMULATION_FORM);
    const [guidedUsageForm, setGuidedUsageForm] = useState<GuidedUsageFormState>(EMPTY_GUIDED_USAGE_FORM);
    const [isSavingResearch, setIsSavingResearch] = useState(false);
    const [isSavingInstrument, setIsSavingInstrument] = useState(false);
    const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false);
    const [isGeneratingGuidedUsage, setIsGeneratingGuidedUsage] = useState(false);
    const [researchNotice, setResearchNotice] = useState<string | null>(null);
    const [instrumentNotice, setInstrumentNotice] = useState<string | null>(null);
    const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
    const [guidedUsageNotice, setGuidedUsageNotice] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPlatformData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [userRecords, chatRecords, messageRecords, progressRecords, simulationRecords, researchRecords, instrumentRecords, technicalMetricRecords] = await Promise.all([
                pb.collection('users').getFullList({ fields: 'id,email,name,role,created,updated', sort: '-created', requestKey: null }),
                pb.collection('chats').getFullList({ fields: 'id,user,title,mode,last_active,created,updated', requestKey: null }),
                pb.collection('messages').getFullList({ fields: 'id,user,chat,role,created', requestKey: null }),
                pb.collection('user_progress').getFullList({ fields: 'id,user,completed_levels,stats,created,updated', requestKey: null }),
                pb.collection('simulations').getFullList({ fields: 'id,user,status,type,total_questions,current_index,score,questions,answers,started_at,completed_at,created,updated', sort: '-updated', requestKey: null }),
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
                pb.collection(TECHNICAL_METRIC_COLLECTION).getFullList({
                    fields: 'id,user,measured_at,screen,ttft_ms,lcp_ms,cls,bundle_kb,pocketbase_latency_ms,streaming_chunks,streaming_label,metrics,user_agent,created,updated',
                    sort: '-measured_at',
                    requestKey: null,
                }).catch((collectionError) => {
                    console.warn('No se pudieron cargar metricas tecnicas:', collectionError);
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
            setTechnicalMetricSnapshots((technicalMetricRecords as unknown as TechnicalMetricSnapshotRecord[]).sort((a, b) => (
                new Date(b.measured_at || b.created || 0).getTime() - new Date(a.measured_at || a.created || 0).getTime()
            )));
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

    useEffect(() => {
        const selectableUsers = users.filter((user) => (user.role || 'usuario') === 'usuario');
        if (!selectableUsers.length) {
            setGuidedUsageForm((current) => ({ ...current, userId: '' }));
            return;
        }

        setGuidedUsageForm((current) => (
            current.userId && selectableUsers.some((user) => user.id === current.userId)
                ? current
                : { ...current, userId: selectableUsers[0].id }
        ));
    }, [users]);

    useEffect(() => {
        const selectableUsers = users.filter((user) => (user.role || 'usuario') === 'usuario');
        if (!selectableUsers.length) {
            setSelectedTechnicalMetricsUserId('');
            return;
        }

        if (!selectedTechnicalMetricsUserId || !selectableUsers.some((user) => user.id === selectedTechnicalMetricsUserId)) {
            const firstUserWithMetrics = selectableUsers.find((user) => (
                technicalMetricSnapshots.some((snapshot) => snapshot.user === user.id)
            ));
            setSelectedTechnicalMetricsUserId((firstUserWithMetrics || selectableUsers[0]).id);
        }
    }, [users, technicalMetricSnapshots, selectedTechnicalMetricsUserId]);

    useEffect(() => {
        const selectableUsers = users.filter((user) => (user.role || 'usuario') === 'usuario');
        if (!selectableUsers.length) {
            setSelectedUxUiMetricsUserId('');
            return;
        }

        if (!selectedUxUiMetricsUserId || !selectableUsers.some((user) => user.id === selectedUxUiMetricsUserId)) {
            setSelectedUxUiMetricsUserId(selectableUsers[0].id);
        }
    }, [users, selectedUxUiMetricsUserId]);

    useEffect(() => {
        if (activeAdminView !== 'users') {
            setIsUserDetailOpen(false);
        }
        if (activeAdminView !== 'research') {
            setIsResearchDetailOpen(false);
        }
        if (activeAdminView !== 'evaluation') {
            setSelectedEvaluationMetricId('');
            setSelectedEvaluationDimensionId('');
        }
    }, [activeAdminView]);

    useEffect(() => {
        setIsGuidedLevelsOpen(false);
        setIsUnlockedLevelsOpen(false);
        setIsSimulationsOpen(false);
        setSelectedSimulationReportId('');
        setIsResearchResultFormOpen(false);
    }, [selectedUserId, isUserDetailOpen, isResearchDetailOpen]);

    useEffect(() => {
        setLiveMetricMeasurement(null);
        const selectedMetric = EVALUATION_TECHNICAL_METRICS.find((metric) => metric.id === selectedEvaluationMetricId);
        if (selectedMetric?.id === 'streaming') {
            setLiveMetricPrompt('Explica en dos frases breves por que el streaming mejora la experiencia de estudio.');
        }
    }, [selectedEvaluationMetricId]);

    const handleResearchFormChange = (field: keyof ResearchFormState, value: string) => {
        setResearchNotice(null);
        setResearchForm((current) => ({ ...current, [field]: value }));
    };

    const handleInstrumentFormChange = (field: keyof InstrumentFormState, value: string) => {
        setInstrumentNotice(null);
        setInstrumentForm((current) => ({ ...current, [field]: value }));
    };

    const handleSimulationFormChange = (field: keyof SimulationFormState, value: string) => {
        setSimulationNotice(null);
        setSimulationForm((current) => ({ ...current, [field]: value }));
    };

    const handleGuidedUsageFormChange = (field: keyof GuidedUsageFormState, value: string) => {
        setGuidedUsageNotice(null);
        setGuidedUsageForm((current) => ({ ...current, [field]: value }));
    };

    const handleUpdateTechnicalMetrics = async () => {
        if (isUpdatingTechnicalMetrics) return;

        setIsUpdatingTechnicalMetrics(true);
        try {
            await loadPlatformData();
            setTechnicalMetricsUpdatedAt(new Date().toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }));
        } catch (updateError) {
            console.error('No se pudieron recargar las metricas tecnicas:', updateError);
        } finally {
            setIsUpdatingTechnicalMetrics(false);
        }
    };

    const measureChatStreaming = async (prompt: string, options: { omitSystemPrompt?: boolean } = {}) => {
        const start = performance.now();
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: options.omitSystemPrompt ? undefined : 'standard',
                omitSystemPrompt: options.omitSystemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });

        if (!response.ok || !response.body) {
            throw new Error('No se pudo abrir el stream de respuesta del chat.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let firstChunkMs: number | null = null;
        let chunkCount = 0;
        let characterCount = 0;
        let responseText = '';

        try {
            while (true) {
                const chunk = await reader.read();
                if (chunk.done) break;

                chunkCount += 1;
                const decodedChunk = decoder.decode(chunk.value, { stream: true });
                responseText += decodedChunk;
                characterCount += decodedChunk.length;

                if (firstChunkMs === null) {
                    firstChunkMs = performance.now() - start;
                }
            }
            responseText += decoder.decode();
        } finally {
            reader.releaseLock();
        }

        return {
            firstChunkMs: firstChunkMs ?? performance.now() - start,
            chunkCount,
            characterCount,
            responseText: responseText.trim(),
        };
    };

    const handleRunEvaluationMetricMeasurement = async (metric: EvaluationTechnicalMetric) => {
        setLiveMetricMeasurement({
            status: 'running',
            value: 'Midiendo...',
            detail: 'Ejecutando medicion en vivo desde este navegador.',
            steps: ['Preparando medicion del indicador seleccionado.'],
        });

        try {
            const measuredAt = new Date().toLocaleString('es-AR');

            if (metric.id === 'ttft') {
                const result = await measureChatStreaming('Hola', { omitSystemPrompt: true });
                const measuredValue = formatMilliseconds(result.firstChunkMs);

                setTechnicalMetricValues((current) => ({
                    ...current,
                    ttft: measuredValue,
                }));

                setLiveMetricMeasurement({
                    status: 'success',
                    value: measuredValue,
                    detail: 'Medicion real del tiempo entre el envio del prompt y la llegada del primer fragmento del stream.',
                    measuredAt,
                    responseText: result.responseText,
                    steps: [
                        'Se envio solamente el mensaje "Hola", sin system prompt ni contexto adicional.',
                        `Primer fragmento recibido en ${measuredValue}.`,
                        `Fragmentos totales recibidos: ${result.chunkCount}.`,
                    ],
                });
                return;
            }

            if (metric.id === 'streaming') {
                const result = await measureChatStreaming(liveMetricPrompt.trim() || 'Explica en dos frases breves por que el streaming mejora la experiencia de estudio.');
                setLiveMetricMeasurement({
                    status: 'success',
                    value: result.chunkCount > 1 ? 'Streaming activo' : 'Respuesta unica',
                    detail: 'Se verifica si la respuesta llega en fragmentos antes de completarse.',
                    measuredAt,
                    responseText: result.responseText,
                    steps: [
                        'Se envio el prompt ingresado al endpoint de chat.',
                        `Se recibieron ${result.chunkCount} fragmentos de respuesta.`,
                        `Primer fragmento visible en ${formatMilliseconds(result.firstChunkMs)}.`,
                    ],
                });
                return;
            }

            if (metric.id === 'lcp') {
                const lcpResult = await measureCurrentLargestContentfulPaint();
                const isAspirantMainScreen = pb.authStore.model?.role === 'usuario' && window.location.pathname === '/welcome';

                if (!isAspirantMainScreen) {
                    setLiveMetricMeasurement({
                        status: 'error',
                        value: 'No disponible',
                        detail: `Este indicador corresponde a ${ASPIRANT_MAIN_SCREEN_LABEL}. La vista actual no es una sesion de usuario aspirante, por lo tanto no se informa un LCP simulado.`,
                        measuredAt,
                        steps: [
                            `Pantalla objetivo: ${ASPIRANT_MAIN_SCREEN_LABEL}.`,
                            `Rol actual: ${pb.authStore.model?.role || 'sin rol'}.`,
                            'Para obtener el valor real, ejecutar esta medicion desde una sesion de usuario aspirante en /welcome.',
                        ],
                    });
                    return;
                }

                if (lcpResult.value === null) {
                    setLiveMetricMeasurement({
                        status: 'error',
                        value: 'No disponible',
                        detail: supportsPerformanceEntryType('largest-contentful-paint')
                            ? `El navegador no entrego una entrada real de Largest Contentful Paint para ${ASPIRANT_MAIN_SCREEN_LABEL}.`
                            : 'Este navegador no expone el tipo de entrada largest-contentful-paint en PerformanceObserver.',
                        measuredAt,
                        steps: [
                            'Se intento leer LCP real con PerformanceObserver y buffered=true.',
                            'No se uso DOMContentLoaded ni otro sustituto.',
                            'Para medirlo, recarga la pantalla principal del aspirante y vuelve a ejecutar la medicion.',
                        ],
                    });
                    return;
                }

                const measuredValue = formatMilliseconds(lcpResult.value);
                setTechnicalMetricValues((current) => ({
                    ...current,
                    lcp: measuredValue,
                }));
                setLiveMetricMeasurement({
                    status: 'success',
                    value: measuredValue,
                    detail: `Valor real tomado de PerformanceObserver para ${ASPIRANT_MAIN_SCREEN_LABEL}.`,
                    measuredAt,
                    steps: [
                        `Pantalla objetivo: ${ASPIRANT_MAIN_SCREEN_LABEL}.`,
                        'Se leyo PerformanceObserver con type=largest-contentful-paint y buffered=true.',
                        `Entradas LCP reales encontradas: ${lcpResult.entries.length}.`,
                        `Valor medido: ${measuredValue}.`,
                    ],
                });
                return;
            }

            if (metric.id === 'cls') {
                const clsResult = await measureCurrentCumulativeLayoutShift();

                if (!clsResult.supported) {
                    setLiveMetricMeasurement({
                        status: 'error',
                        value: 'No disponible',
                        detail: 'Este navegador no expone el tipo de entrada layout-shift en PerformanceObserver.',
                        measuredAt,
                        steps: [
                            'Se intento leer CLS real con PerformanceObserver.',
                            'No se uso ningun sustituto aproximado.',
                            'La medicion requiere soporte del navegador para Layout Instability API.',
                        ],
                    });
                    return;
                }

                const measuredValue = clsResult.value.toFixed(3);
                setTechnicalMetricValues((current) => ({
                    ...current,
                    cls: measuredValue,
                }));

                setLiveMetricMeasurement({
                    status: 'success',
                    value: measuredValue,
                    detail: clsResult.entries.length
                        ? 'Valor real calculado con entradas layout-shift de PerformanceObserver.'
                        : 'Valor real calculado: el navegador no registro desplazamientos de layout en esta navegacion.',
                    measuredAt,
                    steps: [
                        'Se leyo PerformanceObserver con type=layout-shift y buffered=true.',
                        `Entradas analizadas: ${clsResult.entries.length}.`,
                        `CLS acumulado sin interacciones recientes: ${measuredValue}.`,
                    ],
                });
                return;
            }

            if (metric.id === 'bundle') {
                const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
                const jsResources = resources.filter((entry) => entry.name.includes('.js'));
                const totalBytes = jsResources.reduce((sum, entry) => (
                    sum + (entry.transferSize || entry.encodedBodySize || 0)
                ), 0);

                setLiveMetricMeasurement({
                    status: 'success',
                    value: formatKilobytes(totalBytes),
                    detail: 'Suma de recursos JavaScript cargados en la sesion actual segun Performance API.',
                    measuredAt,
                    steps: [
                        'Se listaron los recursos cargados por el navegador.',
                        `Recursos JavaScript detectados: ${jsResources.length}.`,
                        `Peso transferido o codificado acumulado: ${formatKilobytes(totalBytes)}.`,
                    ],
                });
                return;
            }

            if (metric.id === 'pocketbase-latency') {
                const start = performance.now();
                await pb.collection('users').getList(1, 1, {
                    fields: 'id',
                    requestKey: null,
                });
                const elapsed = performance.now() - start;

                setLiveMetricMeasurement({
                    status: 'success',
                    value: formatMilliseconds(elapsed),
                    detail: 'Tiempo de una lectura simple contra la coleccion users en PocketBase.',
                    measuredAt,
                    steps: [
                        'Se ejecuto una lectura minima de 1 registro.',
                        `La respuesta llego en ${formatMilliseconds(elapsed)}.`,
                        'La medicion incluye latencia de red local/sesion actual del navegador.',
                    ],
                });
                return;
            }

            throw new Error('No hay medicion disponible para este indicador.');
        } catch (measurementError) {
            console.error('Error running live metric measurement:', measurementError);
            setLiveMetricMeasurement({
                status: 'error',
                value: 'No disponible',
                detail: measurementError instanceof Error ? measurementError.message : 'No se pudo ejecutar la medicion en vivo.',
                steps: ['La medicion no pudo completarse en esta sesion.'],
                measuredAt: new Date().toLocaleString('es-AR'),
            });
        }
    };

    const handleGenerateSimulation = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedUserId || isGeneratingSimulation) return;

        const preview = simulationPreview(simulationForm.questionCount, simulationForm.targetAccuracy);
        setIsGeneratingSimulation(true);
        setSimulationNotice(null);

        try {
            const response = await fetch('/api/admin/simulations/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify({
                    userId: selectedUserId,
                    questionCount: preview.total,
                    targetAccuracy: preview.percent,
                    topic: simulationForm.topic,
                    completedDate: simulationForm.completedDate,
                }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'No se pudo generar la simulacion.');
            }

            setSimulations((current) => [payload.simulation as SimulationRecord, ...current].sort((a, b) => (
                new Date(simulationActivityDate(b) || 0).getTime() - new Date(simulationActivityDate(a) || 0).getTime()
            )));

            if (payload.progress) {
                setProgress((current) => {
                    const progressRecord = payload.progress as UserProgressRecord;
                    const exists = current.some((item) => item.id === progressRecord.id);
                    return exists
                        ? current.map((item) => item.id === progressRecord.id ? progressRecord : item)
                        : [progressRecord, ...current];
                });
            }

            setSimulationNotice(`Simulacion creada: ${preview.score}/${preview.total} aciertos (${preview.realPercent}%).`);
        } catch (saveError) {
            console.error('Error generating simulation:', saveError);
            const message = saveError instanceof Error ? saveError.message : 'No se pudo generar la simulacion.';
            setSimulationNotice(message);
        } finally {
            setIsGeneratingSimulation(false);
        }
    };

    const handleGenerateGuidedUsage = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!guidedUsageForm.userId || isGeneratingGuidedUsage) return;

        setIsGeneratingGuidedUsage(true);
        setGuidedUsageNotice(null);

        try {
            const response = await fetch('/api/admin/guided-usage/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${pb.authStore.token}`,
                },
                body: JSON.stringify(guidedUsageForm),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'No se pudo generar el modo guiado.');
            }

            await loadPlatformData();
            setGuidedUsageNotice(
                `Modo guiado generado: ${payload.generated?.levels || 0} niveles, ${payload.generated?.activities || 0} actividades, ${payload.generated?.chats || 0} chats y ${payload.generated?.messages || 0} mensajes.`
            );
        } catch (saveError) {
            console.error('Error generating guided usage:', saveError);
            const message = saveError instanceof Error ? saveError.message : 'No se pudo generar el modo guiado.';
            setGuidedUsageNotice(message);
        } finally {
            setIsGeneratingGuidedUsage(false);
        }
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
            setIsResearchResultFormOpen(false);
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

    const evaluationSimulationSeries = useMemo(() => (
        regularUsers.map((user) => {
            const points: SimulationTrendPoint[] = simulations
                .filter((simulation) => (
                    simulation.user === user.id
                    && simulation.status === 'completed'
                    && typeof simulation.score === 'number'
                    && typeof simulation.total_questions === 'number'
                    && simulation.total_questions > 0
                ))
                .sort((a, b) => new Date(simulationActivityDate(a) || 0).getTime() - new Date(simulationActivityDate(b) || 0).getTime())
                .map((simulation, index) => {
                    const score = Number(simulation.score || 0);
                    const total = Number(simulation.total_questions || 1);
                    return {
                        id: simulation.id || `${user.id}-${index}`,
                        date: formatDateOnly(simulationActivityDate(simulation)),
                        percent: Number(((score / total) * 100).toFixed(1)),
                        score,
                        total,
                    };
                });
            const initial = points[0]?.percent ?? null;
            const final = points.at(-1)?.percent ?? null;

            return {
                user,
                points,
                initial,
                final,
                improvement: initial !== null && final !== null ? Number((final - initial).toFixed(1)) : null,
            };
        })
    ), [regularUsers, simulations]);

    useEffect(() => {
        if (!evaluationSimulationSeries.length) {
            setSelectedEvaluationChartUserId('');
            return;
        }

        if (!selectedEvaluationChartUserId || !evaluationSimulationSeries.some((series) => series.user.id === selectedEvaluationChartUserId)) {
            setSelectedEvaluationChartUserId(evaluationSimulationSeries[0].user.id);
        }
    }, [evaluationSimulationSeries, selectedEvaluationChartUserId]);

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
        const completedGuidedLevelDetails = completedGuidedLevels(userProgress?.completed_levels);
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
        const practicedUnlockedLevelDetails = practicedUnlockedLevels(userChats, messagesByChat);

        return {
            user: selectedUser,
            chats: userChats,
            messages: userMessages,
            progress: userProgress,
            researchSessions: userResearchSessions,
            simulations: userSimulations,
            completedSimulations,
            completedGuidedLevelDetails,
            practicedUnlockedLevelDetails,
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
        evaluation: {
            title: 'Evaluación',
            description: 'Evaluación técnica, pedagógica, UX y de sostenibilidad según el informe final de la aplicación.',
        },
        users: {
            title: 'Usuarios',
            description: 'Histórico de uso y evolución individual de los usuarios.',
        },
        guided: {
            title: 'Modo guiado',
            description: 'Genera uso guiado desde cero para un aspirante, creando progreso, chats, mensajes y metricas asociadas.',
        },
        simulations: {
            title: 'Generador de simulaciones',
            description: 'Crea intentos de examen asociados a usuarios con cantidad de preguntas y aciertos aproximados.',
        },
        research: {
            title: 'Investigación UX',
            description: 'Instrumentos, entrevistas, encuestas y feedback registrado.',
        },
    }[activeAdminView];
    const simulationPlan = simulationPreview(simulationForm.questionCount, simulationForm.targetAccuracy);
    const selectedUserSimulations = selectedHistory?.simulations || [];
    const selectedSimulationReport = selectedUserSimulations.find((simulation) => simulation.id === selectedSimulationReportId) || null;
    const selectedEvaluationMetric = EVALUATION_TECHNICAL_METRICS.find((metric) => metric.id === selectedEvaluationMetricId) || null;
    const selectedEvaluationDimension = EVALUATION_DIMENSIONS.find((dimension) => dimension.id === selectedEvaluationDimensionId) || null;
    const selectedTechnicalMetricsUser = users.find((user) => user.id === selectedTechnicalMetricsUserId) || null;
    const selectedUxUiMetricsUser = users.find((user) => user.id === selectedUxUiMetricsUserId) || null;
    const selectedTechnicalMetricSnapshot = technicalMetricSnapshots.find((snapshot) => snapshot.user === selectedTechnicalMetricsUserId) || null;
    const selectedTechnicalMetricValues = technicalMetricValuesFromSnapshot(selectedTechnicalMetricSnapshot);
    const selectedEvaluationMetricValue = selectedEvaluationMetric
        ? selectedTechnicalMetricValues[selectedEvaluationMetric.id] || technicalMetricValues[selectedEvaluationMetric.id] || selectedEvaluationMetric.value
        : '';
    const selectedEvaluationSimulationSeries = evaluationSimulationSeries.find((series) => series.user.id === selectedEvaluationChartUserId)
        || evaluationSimulationSeries[0]
        || null;
    const evaluationChartWidth = 720;
    const evaluationChartHeight = 260;
    const evaluationChartPadding = { top: 20, right: 28, bottom: 44, left: 46 };
    const evaluationChartPlotWidth = evaluationChartWidth - evaluationChartPadding.left - evaluationChartPadding.right;
    const evaluationChartPlotHeight = evaluationChartHeight - evaluationChartPadding.top - evaluationChartPadding.bottom;
    const evaluationChartPoints = selectedEvaluationSimulationSeries?.points || [];
    const evaluationChartCoordinates = evaluationChartPoints.map((point, index) => {
        const x = evaluationChartPadding.left + (evaluationChartPoints.length <= 1
            ? evaluationChartPlotWidth / 2
            : (index / (evaluationChartPoints.length - 1)) * evaluationChartPlotWidth);
        const boundedPercent = clampNumber(point.percent, 0, 100);
        const y = evaluationChartPadding.top + ((100 - boundedPercent) / 100) * evaluationChartPlotHeight;

        return { ...point, x, y };
    });
    const evaluationChartLine = evaluationChartCoordinates.map((point) => `${point.x},${point.y}`).join(' ');
    const evaluationChartArea = evaluationChartCoordinates.length > 1
        ? [
            `${evaluationChartCoordinates[0].x},${evaluationChartPadding.top + evaluationChartPlotHeight}`,
            ...evaluationChartCoordinates.map((point) => `${point.x},${point.y}`),
            `${evaluationChartCoordinates[evaluationChartCoordinates.length - 1].x},${evaluationChartPadding.top + evaluationChartPlotHeight}`,
        ].join(' ')
        : '';

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
                                                ) : item.trend.map((entry, index) => (
                                                    <div key={`${item.userId}-${entry.date}-${entry.totalQuestions}-${index}`} className="space-y-1">
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

                        {activeAdminView === 'evaluation' && (
                        selectedEvaluationMetric ? (
                        <div className="space-y-6">
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <button
                                    type="button"
                                    onClick={() => setSelectedEvaluationMetricId('')}
                                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-200"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Volver a evaluacion
                                </button>

                                <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="max-w-3xl">
                                        <div className="inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:bg-green-950/50 dark:text-green-200">
                                            <CheckCircle className="h-4 w-4" />
                                            {selectedEvaluationMetric.status}
                                        </div>
                                        <h2 className="mt-4 text-xl font-bold text-gray-950 dark:text-white">{selectedEvaluationMetric.label}</h2>
                                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{selectedEvaluationMetric.summary}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/60 lg:w-80">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Valor de medicion</p>
                                        <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{selectedEvaluationMetricValue}</p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{selectedEvaluationMetric.target}</p>
                                        <p className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-300">{selectedEvaluationMetric.reportSource}</p>
                                    </div>
                                </div>
                            </section>

                            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <h3 className="text-base font-bold text-gray-950 dark:text-white">Como se demuestra</h3>
                                    <div className="mt-4 space-y-3">
                                        {selectedEvaluationMetric.demonstration.map((item) => (
                                            <div key={item} className="flex gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-950/60">
                                                <CheckCircle className="mt-0.5 h-4 w-4 flex-none text-green-600 dark:text-green-300" />
                                                <p className="text-sm text-gray-700 dark:text-gray-200">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <h3 className="text-base font-bold text-gray-950 dark:text-white">Procedimiento de medicion</h3>
                                    <ol className="mt-4 space-y-3">
                                        {selectedEvaluationMetric.measurement.map((item, index) => (
                                            <li key={item} className="flex gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-950/60">
                                                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-200">{index + 1}</span>
                                                <p className="text-sm text-gray-700 dark:text-gray-200">{item}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            </div>

                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h3 className="text-base font-bold text-gray-950 dark:text-white">Evidencia vinculada</h3>
                                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                    {selectedEvaluationMetric.evidence.map((item) => (
                                        <div key={item} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <p className="text-sm leading-6 text-gray-700 dark:text-gray-200">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/20">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-950 dark:text-white">Medicion en vivo del indicador</h3>
                                        <p className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-200">
                                            Ejecuta una medicion desde esta sesion para contrastarla con el valor reportado en el informe.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRunEvaluationMetricMeasurement(selectedEvaluationMetric)}
                                        disabled={liveMetricMeasurement?.status === 'running'}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                    >
                                        <Clock className="h-4 w-4" />
                                        {liveMetricMeasurement?.status === 'running' ? 'Midiendo...' : 'Ejecutar medicion'}
                                    </button>
                                </div>

                                {selectedEvaluationMetric.id === 'ttft' && (
                                    <div className="mt-4 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-blue-900/60 dark:bg-gray-950 dark:text-gray-200">
                                        Prompt de medicion: <span className="font-semibold">Hola</span>. No se envia system prompt ni contexto adicional.
                                    </div>
                                )}

                                {selectedEvaluationMetric.id === 'streaming' && (
                                    <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Texto del prompt
                                        <textarea
                                            value={liveMetricPrompt}
                                            onChange={(event) => setLiveMetricPrompt(event.target.value)}
                                            disabled={liveMetricMeasurement?.status === 'running'}
                                            rows={3}
                                            className="mt-2 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm normal-case leading-6 tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-blue-900/60 dark:bg-gray-950 dark:text-gray-100"
                                            placeholder="Ingresa el prompt que queres medir..."
                                        />
                                    </label>
                                )}

                                <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-900/60 dark:bg-gray-950/70">
                                    {!liveMetricMeasurement ? (
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Todavia no se ejecuto ninguna medicion en vivo para este indicador.
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Resultado medido</p>
                                                    <p className={`mt-1 text-2xl font-bold ${
                                                        liveMetricMeasurement.status === 'error'
                                                            ? 'text-red-600 dark:text-red-300'
                                                            : 'text-gray-950 dark:text-white'
                                                    }`}>
                                                        {liveMetricMeasurement.value}
                                                    </p>
                                                </div>
                                                {liveMetricMeasurement.measuredAt && (
                                                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-200">
                                                        {liveMetricMeasurement.measuredAt}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{liveMetricMeasurement.detail}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                        ) : (
                        selectedEvaluationDimension ? (
                        <div className="space-y-6">
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <button
                                    type="button"
                                    onClick={() => setSelectedEvaluationDimensionId('')}
                                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-200"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Volver a evaluacion
                                </button>

                                <div className="mt-5">
                                    <div className="max-w-5xl">
                                        <div className="inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:bg-green-950/50 dark:text-green-200">
                                            <CheckCircle className="h-4 w-4" />
                                            {selectedEvaluationDimension.value}
                                        </div>
                                        <h2 className="mt-4 text-xl font-bold text-gray-950 dark:text-white">{selectedEvaluationDimension.label}</h2>
                                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{selectedEvaluationDimension.summary}</p>
                                    </div>
                                </div>
                            </section>

                            {selectedEvaluationDimension.id === 'technology' ? (
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-950 dark:text-white">Metricas tecnicas del informe</h3>
                                        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                            Indicadores reales guardados cuando el usuario aspirante ingresa a su pantalla principal.
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-start gap-2 sm:items-end">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Usuario aspirante
                                            <select
                                                value={selectedTechnicalMetricsUserId}
                                                onChange={(event) => setSelectedTechnicalMetricsUserId(event.target.value)}
                                                className="mt-1 block min-w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                            >
                                                {users.filter((user) => (user.role || 'usuario') === 'usuario').map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name || user.email || 'Usuario'}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleUpdateTechnicalMetrics}
                                            disabled={isUpdatingTechnicalMetrics}
                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isUpdatingTechnicalMetrics ? 'animate-spin' : ''}`} />
                                            {isUpdatingTechnicalMetrics ? 'Actualizando...' : 'Recargar datos'}
                                        </button>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-200">
                                                Cumple
                                            </span>
                                            {(selectedTechnicalMetricSnapshot?.measured_at || technicalMetricsUpdatedAt) && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Ultima medicion {selectedTechnicalMetricSnapshot?.measured_at
                                                        ? new Date(selectedTechnicalMetricSnapshot.measured_at).toLocaleString('es-AR')
                                                        : technicalMetricsUpdatedAt}
                                                </span>
                                            )}
                                            {isUpdatingTechnicalMetrics && (
                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                                                    Consultando base de datos...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {EVALUATION_TECHNICAL_METRICS.map((metric) => (
                                        <button
                                            key={metric.id}
                                            type="button"
                                            onClick={() => setSelectedEvaluationMetricId(metric.id)}
                                            disabled={isUpdatingTechnicalMetrics}
                                            className={`group w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-wait dark:border-gray-800 dark:bg-gray-950/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/30 ${
                                                isUpdatingTechnicalMetrics ? 'animate-pulse opacity-80' : ''
                                            }`}
                                        >
                                            <div className="grid gap-4 md:grid-cols-[minmax(180px,0.8fr)_minmax(140px,0.45fr)_minmax(0,1.4fr)_auto] md:items-center">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{metric.label}</p>
                                                <div className="min-w-0">
                                                    <p className="text-2xl font-bold text-gray-950 dark:text-white">{selectedTechnicalMetricValues[metric.id] || technicalMetricValues[metric.id] || metric.value}</p>
                                                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{metric.target}</p>
                                                </div>
                                                <div className="rounded-md bg-white p-3 dark:bg-gray-900">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Que mide</p>
                                                    <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{metric.summary}</p>
                                                    {metric.id === 'lcp' && (
                                                        <p className="mt-2 text-xs font-semibold leading-5 text-gray-700 dark:text-gray-200">
                                                            Pantalla medida: principal del usuario aspirante.
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight className="hidden h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300 md:block" />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {selectedTechnicalMetricsUserId && (
                                    <div className="mt-6">
                                        <TechnicalMetricsHistory
                                            userId={selectedTechnicalMetricsUserId}
                                            userName={selectedTechnicalMetricsUser?.name || selectedTechnicalMetricsUser?.email || 'Usuario'}
                                            embedded
                                        />
                                    </div>
                                )}
                            </section>
                            ) : selectedEvaluationDimension.id === 'business' ? (
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h3 className="text-base font-bold text-gray-950 dark:text-white">Evaluacion de negocio del informe</h3>
                                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                    La dimension de negocio se mantiene como evaluacion cualitativa del informe, sin almacenar historicos operativos de tokens ni costos por usuario.
                                </p>

                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    {[
                                        ['Costo operativo', 'Se analiza desde la viabilidad general del prototipo, no desde mediciones guardadas por interaccion.'],
                                        ['Escalabilidad', 'Se considera la arquitectura liviana y la posibilidad de crecimiento gradual.'],
                                        ['Sostenibilidad', 'Se evalua el potencial de evolucion del producto sin registrar consumo economico individual.'],
                                    ].map(([title, detail]) => (
                                        <div key={title} className="rounded-md bg-gray-50 p-4 dark:bg-gray-950/60">
                                            <p className="text-sm font-semibold text-gray-950 dark:text-white">{title}</p>
                                            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            ) : selectedEvaluationDimension.id === 'ux-ui' ? (
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-950 dark:text-white">Metricas UX/UI del informe</h3>
                                        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                            Mediciones perceptuales guardadas por usuario aspirante, basadas en la encuesta UX del Anexo C.
                                        </p>
                                    </div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Usuario aspirante
                                        <select
                                            value={selectedUxUiMetricsUserId}
                                            onChange={(event) => setSelectedUxUiMetricsUserId(event.target.value)}
                                            className="mt-1 block min-w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                        >
                                            {users.filter((user) => (user.role || 'usuario') === 'usuario').map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name || user.email || 'Usuario'}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div className="mt-6">
                                    {selectedUxUiMetricsUserId ? (
                                        <UxUiMetricsHistory
                                            userId={selectedUxUiMetricsUserId}
                                            userName={selectedUxUiMetricsUser?.name || selectedUxUiMetricsUser?.email || 'Usuario'}
                                            embedded
                                        />
                                    ) : (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-300">
                                            No hay usuarios aspirantes disponibles para consultar metricas UX/UI.
                                        </div>
                                    )}
                                </div>
                            </section>
                            ) : (
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-950 dark:text-white">Progreso en simulaciones por usuario</h3>
                                        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                            Evolucion porcentual de los intentos completados, calculada sobre respuestas correctas y total de preguntas.
                                        </p>
                                    </div>
                                    <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                                        {evaluationSimulationSeries.length === 0 ? (
                                            <span className="rounded-md bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">Sin usuarios</span>
                                        ) : evaluationSimulationSeries.map((series) => {
                                            const isSelected = selectedEvaluationSimulationSeries?.user.id === series.user.id;

                                            return (
                                                <button
                                                    key={series.user.id}
                                                    type="button"
                                                    onClick={() => setSelectedEvaluationChartUserId(series.user.id)}
                                                    className={`whitespace-nowrap rounded-md border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                                                        isSelected
                                                            ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                                                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-200'
                                                    }`}
                                                >
                                                    {series.user.name || series.user.email || 'Usuario'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                        {evaluationChartPoints.length === 0 ? (
                                            <div className="flex min-h-[260px] items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                                                No hay simulaciones completadas para graficar en este usuario.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <svg
                                                    viewBox={`0 0 ${evaluationChartWidth} ${evaluationChartHeight}`}
                                                    role="img"
                                                    aria-label="Grafico lineal de progreso de simulaciones"
                                                    className="h-[260px] min-w-[640px] w-full"
                                                >
                                                    {[0, 25, 50, 75, 100].map((tick) => {
                                                        const y = evaluationChartPadding.top + ((100 - tick) / 100) * evaluationChartPlotHeight;

                                                        return (
                                                            <g key={tick}>
                                                                <line
                                                                    x1={evaluationChartPadding.left}
                                                                    x2={evaluationChartPadding.left + evaluationChartPlotWidth}
                                                                    y1={y}
                                                                    y2={y}
                                                                    className="stroke-gray-200 dark:stroke-gray-800"
                                                                    strokeWidth="1"
                                                                />
                                                                <text
                                                                    x={evaluationChartPadding.left - 12}
                                                                    y={y + 4}
                                                                    textAnchor="end"
                                                                    className="fill-gray-500 text-[11px] dark:fill-gray-400"
                                                                >
                                                                    {tick}%
                                                                </text>
                                                            </g>
                                                        );
                                                    })}
                                                    <line
                                                        x1={evaluationChartPadding.left}
                                                        x2={evaluationChartPadding.left + evaluationChartPlotWidth}
                                                        y1={evaluationChartPadding.top + evaluationChartPlotHeight}
                                                        y2={evaluationChartPadding.top + evaluationChartPlotHeight}
                                                        className="stroke-gray-300 dark:stroke-gray-700"
                                                        strokeWidth="1.5"
                                                    />
                                                    {evaluationChartArea && (
                                                        <polygon
                                                            points={evaluationChartArea}
                                                            className="fill-blue-100/80 dark:fill-blue-950/40"
                                                        />
                                                    )}
                                                    {evaluationChartCoordinates.length > 1 && (
                                                        <polyline
                                                            points={evaluationChartLine}
                                                            fill="none"
                                                            className="stroke-blue-600 dark:stroke-blue-300"
                                                            strokeWidth="4"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    )}
                                                    {evaluationChartCoordinates.map((point, index) => (
                                                        <g key={point.id}>
                                                            <circle
                                                                cx={point.x}
                                                                cy={point.y}
                                                                r="6"
                                                                className="fill-white stroke-blue-600 dark:fill-gray-950 dark:stroke-blue-300"
                                                                strokeWidth="3"
                                                            />
                                                            <text
                                                                x={point.x}
                                                                y={evaluationChartPadding.top + evaluationChartPlotHeight + 24}
                                                                textAnchor="middle"
                                                                className="fill-gray-500 text-[11px] dark:fill-gray-400"
                                                            >
                                                                {evaluationChartCoordinates.length > 6 ? `#${index + 1}` : point.date}
                                                            </text>
                                                            <text
                                                                x={point.x}
                                                                y={Math.max(12, point.y - 12)}
                                                                textAnchor="middle"
                                                                className="fill-gray-900 text-[12px] font-semibold dark:fill-white"
                                                            >
                                                                {point.percent}%
                                                            </text>
                                                        </g>
                                                    ))}
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Usuario</p>
                                            <p className="mt-2 text-sm font-bold text-gray-950 dark:text-white">
                                                {selectedEvaluationSimulationSeries?.user.name || selectedEvaluationSimulationSeries?.user.email || 'Sin usuario'}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {evaluationChartPoints.length} intento{evaluationChartPoints.length === 1 ? '' : 's'} completado{evaluationChartPoints.length === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                        {[
                                            ['Inicial', selectedEvaluationSimulationSeries?.initial !== null && selectedEvaluationSimulationSeries?.initial !== undefined ? `${selectedEvaluationSimulationSeries.initial}%` : 'N/A'],
                                            ['Final', selectedEvaluationSimulationSeries?.final !== null && selectedEvaluationSimulationSeries?.final !== undefined ? `${selectedEvaluationSimulationSeries.final}%` : 'N/A'],
                                            ['Mejora', selectedEvaluationSimulationSeries?.improvement !== null && selectedEvaluationSimulationSeries?.improvement !== undefined ? `${selectedEvaluationSimulationSeries.improvement >= 0 ? '+' : ''}${selectedEvaluationSimulationSeries.improvement} p.p.` : 'N/A'],
                                        ].map(([label, value]) => (
                                            <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                                                <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                            )}
                        </div>
                        ) : (
                        <div className="space-y-6">
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="max-w-3xl">
                                        <div className="inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:bg-green-950/50 dark:text-green-200">
                                            <CheckCircle className="h-4 w-4" />
                                            Informe final
                                        </div>
                                        <h2 className="mt-4 text-xl font-bold text-gray-950 dark:text-white">Evaluacion integral de la aplicacion</h2>
                                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                            Sintesis operativa basada en <span className="font-semibold">output/informe_final_para_aplicacion.pdf</span>. La lectura combina validacion con usuarios, auditoria tecnica, usabilidad, seguridad, sostenibilidad y trazabilidad con la hipotesis del trabajo.
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/60 lg:w-96">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Alcance metodologico</p>
                                        <p className="mt-2 font-semibold text-gray-950 dark:text-white">Estudio exploratorio con casos extremos</p>
                                        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                            La evidencia no se interpreta como prueba estadistica generalizable, sino como validacion descriptiva con un aspirante en preparacion intensiva y un validador experto PMP.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {EVALUATION_DIMENSIONS.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedEvaluationDimensionId(item.id)}
                                            className="group rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-gray-800 dark:bg-gray-950/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                                                    <p className="mt-2 text-xl font-bold text-gray-950 dark:text-white">{item.value}</p>
                                                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{item.detail}</p>
                                                </div>
                                                <ChevronRight className="mt-1 h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
                                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base font-bold text-gray-950 dark:text-white">Metricas tecnicas del informe</h2>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Indicadores reportados en la evaluacion tecnica del Capitulo 7.</p>
                                        </div>
                                        <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-200">Cumple</span>
                                    </div>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {EVALUATION_TECHNICAL_METRICS.map((metric) => (
                                            <button
                                                key={metric.id}
                                                type="button"
                                                onClick={() => setSelectedEvaluationMetricId(metric.id)}
                                                className="group rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-gray-800 dark:bg-gray-950/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{metric.label}</p>
                                                        <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{metric.value}</p>
                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{metric.target}</p>
                                                    </div>
                                                    <ChevronRight className="mt-1 h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">Evidencia cargada en la aplicacion</h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lectura actual de los registros administrativos.</p>
                                    <div className="mt-4 space-y-3">
                                        {[
                                            ['Usuarios observados', String(dashboard.regularUserCount), 'rol usuario'],
                                            ['Sesiones UX', String(dashboard.regularResearchSessions.length), `${researchInstruments.length} instrumentos`],
                                            ['NPS promedio', formatAverage(defensePanel.averageNps), 'encuestas y relevamientos'],
                                            ['Utilidad percibida', formatAverage(defensePanel.usefulnessAverage, '/5'), 'escala UX'],
                                            ['Facilidad percibida', formatAverage(defensePanel.usabilityAverage, '/5'), 'escala UX'],
                                            ['Simulaciones completadas', String(defensePanel.completedSimulations.length), `${defensePanel.completedFullSimulations.length} completas de 180 preguntas`],
                                        ].map(([label, value, detail]) => (
                                            <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-4 py-3 dark:bg-gray-950/60">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-950 dark:text-white">{label}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>
                                                </div>
                                                <span className="text-lg font-bold text-gray-950 dark:text-white">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-950 dark:text-white">Evolucion observada en casos de estudio</h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Resultados descriptivos informados para Usuario A y Usuario B.</p>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Capitulos 6, 7 y 9</span>
                                </div>
                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                    {[
                                        {
                                            user: 'Usuario A',
                                            profile: 'Aspirante en preparacion intensiva',
                                            initial: 56.7,
                                            final: 82.2,
                                            improvement: '+25.5 p.p.',
                                            interpretation: 'Evolucion favorable asociada a practica sostenida, uso guiado y familiarizacion con el criterio PMI.',
                                        },
                                        {
                                            user: 'Usuario B',
                                            profile: 'Validador experto certificado PMP',
                                            initial: 77.8,
                                            final: 87.8,
                                            improvement: '+10.0 p.p.',
                                            interpretation: 'Desempeno creciente util para validar dificultad, fidelidad del simulador y consistencia de la experiencia.',
                                        },
                                    ].map((item) => (
                                        <div key={item.user} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-950 dark:text-white">{item.user}</p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.profile}</p>
                                                </div>
                                                <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-200">{item.improvement}</span>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="rounded-md bg-white p-3 dark:bg-gray-900">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Inicial</p>
                                                    <p className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{item.initial}%</p>
                                                </div>
                                                <div className="rounded-md bg-white p-3 dark:bg-gray-900">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Final</p>
                                                    <p className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{item.final}%</p>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-xs leading-5 text-gray-600 dark:text-gray-300">{item.interpretation}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">Trazabilidad hipotesis - evidencia - resultado</h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lectura transversal tomada de la Tabla 7.6 del informe.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                                            <tr>
                                                <th className="px-5 py-3 text-left font-semibold">Componente</th>
                                                <th className="px-5 py-3 text-left font-semibold">Evidencia considerada</th>
                                                <th className="px-5 py-3 text-left font-semibold">Resultado interpretado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {[
                                                ['Comprension de escenarios PMP', 'Conversaciones, razonamiento etico, calculos contextualizados y casos de uso.', 'El asistente guia situaciones ambiguas, explica alternativas y refuerza criterios alineados con PMI.'],
                                                ['Internalizacion del criterio PMI', 'Feedback de Usuario A, revision del experto, simulaciones y evolucion longitudinal.', 'La evidencia sugiere contraste entre razonamientos intuitivos y criterios formales del examen.'],
                                                ['Complemento de preparacion', 'Encuestas, sesiones de feedback, progreso acumulado, modos guiados y simulador.', 'Los usuarios percibieron valor pedagogico y operativo como apoyo interactivo bajo demanda.'],
                                            ].map(([component, evidence, result]) => (
                                                <tr key={component} className="align-top">
                                                    <td className="px-5 py-4 font-semibold text-gray-950 dark:text-white">{component}</td>
                                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{evidence}</td>
                                                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{result}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">Seguridad y robustez</h2>
                                    <div className="mt-4 space-y-3">
                                        {[
                                            ['Prompt injection', 'Mitigado', 'restricciones de rol y redireccion al dominio PMP'],
                                            ['Salida insegura', 'Sanitizado', 'limpieza de respuestas antes de renderizar'],
                                            ['Informacion sensible', 'Seguro', 'claves y prompts internos protegidos server-side'],
                                            ['Denegacion de servicio', 'Parcial', 'dependencia de limites operativos del proveedor'],
                                            ['Sobreconfianza', 'Mitigado', 'diseño orientado a explicacion, no sustitucion del estudio formal'],
                                        ].map(([risk, status, detail]) => (
                                            <div key={risk} className="flex gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-950/60">
                                                <CheckCircle className="mt-0.5 h-4 w-4 flex-none text-green-600 dark:text-green-300" />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-950 dark:text-white">{risk} - {status}</p>
                                                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">Limitaciones y proxima evolucion</h2>
                                    <div className="mt-4 space-y-3">
                                        {[
                                            ['Muestra acotada', 'La validacion usa dos casos extremos y requiere muestras mas amplias para generalizar.'],
                                            ['Dependencia de proveedor IA', 'El cambio de modelo puede requerir ajuste de prompts y validacion de comportamiento.'],
                                            ['Actualizacion documental', 'Una futura version deberia consultar documentos oficiales recientes del PMI.'],
                                            ['Citas especificas', 'El informe advierte riesgo de referencias inexactas cuando se piden paginas o citas bibliograficas muy puntuales.'],
                                        ].map(([label, detail]) => (
                                            <div key={label} className="flex gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-950/60">
                                                <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-300" />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-950 dark:text-white">{label}</p>
                                                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                        )
                        )
                        )}

                        {activeAdminView === 'guided' && (
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h2 className="text-base font-bold text-gray-950 dark:text-white">Generar recorrido de modo guiado</h2>
                                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                    Reemplaza el uso guiado existente del aspirante seleccionado y recorre cada nivel desde el inicio, creando las cuatro actividades con conversaciones extensas.
                                </p>

                                <form onSubmit={handleGenerateGuidedUsage} className="mt-5 space-y-4">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Usuario aspirante
                                        <select
                                            value={guidedUsageForm.userId}
                                            onChange={(event) => handleGuidedUsageFormChange('userId', event.target.value)}
                                            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                            required
                                        >
                                            {users.filter((user) => (user.role || 'usuario') === 'usuario').map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name || user.email || 'Usuario'}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                            Fecha inicio
                                            <input
                                                type="date"
                                                value={guidedUsageForm.startDate}
                                                onChange={(event) => handleGuidedUsageFormChange('startDate', event.target.value)}
                                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                                required
                                            />
                                        </label>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                            Fecha fin
                                            <input
                                                type="date"
                                                value={guidedUsageForm.endDate}
                                                onChange={(event) => handleGuidedUsageFormChange('endDate', event.target.value)}
                                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                                required
                                            />
                                        </label>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                            Niveles
                                            <select
                                                value={guidedUsageForm.levelCount}
                                                onChange={(event) => handleGuidedUsageFormChange('levelCount', event.target.value)}
                                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                            >
                                                <option value="5">Primeros 5 niveles</option>
                                                <option value="10">Primeros 10 niveles</option>
                                                <option value="20">Primeros 20 niveles</option>
                                                <option value="all">Todos los niveles guiados</option>
                                            </select>
                                        </label>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                            Turnos del usuario por actividad
                                            <select
                                                value={guidedUsageForm.interactionsPerLevel}
                                                onChange={(event) => handleGuidedUsageFormChange('interactionsPerLevel', event.target.value)}
                                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                            >
                                                <option value="3">3 turnos por actividad</option>
                                                <option value="4">4 turnos por actividad</option>
                                                <option value="6">6 turnos por actividad</option>
                                                <option value="8">8 turnos por actividad</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                                        Esta accion elimina chats, mensajes, progreso guiado y metricas tecnicas actuales del aspirante seleccionado antes de generar el nuevo recorrido. Cada nivel crea 4 chats: Leccion Magistral, Entrenamiento Practico, Oraculo y Prueba de Fuego.
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="min-h-6 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            {guidedUsageNotice || 'La generacion usa el backend de chat real, crea conversaciones largas y puede demorar varios minutos.'}
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={isGeneratingGuidedUsage || !guidedUsageForm.userId}
                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:bg-gray-400"
                                        >
                                            <Save className="h-4 w-4" />
                                            {isGeneratingGuidedUsage ? 'Generando...' : 'Generar recorrido'}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h2 className="text-base font-bold text-gray-950 dark:text-white">Que se genera</h2>
                                <div className="mt-4 space-y-3">
                                    {[
                                        ['Progreso', 'Marca los niveles completados en user_progress desde el primero hasta el limite elegido.'],
                                        ['Actividades', 'Por cada nivel recorre Leccion Magistral, Entrenamiento Practico, Oraculo y Prueba de Fuego.'],
                                        ['Chats y mensajes', 'Crea un chat por actividad. El asistente inicia la conversacion y luego se generan varios turnos usuario/asistente con el endpoint real de IA.'],
                                        ['Metricas tecnicas', 'Registra snapshots tecnicos asociados al uso de las actividades del aspirante.'],
                                    ].map(([title, detail]) => (
                                        <div key={title} className="rounded-md bg-gray-50 p-4 dark:bg-gray-950/60">
                                            <p className="text-sm font-semibold text-gray-950 dark:text-white">{title}</p>
                                            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                        )}

                        {activeAdminView === 'simulations' && (
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-md bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                                        <ClipboardCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-950 dark:text-white">Nueva simulacion</h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Define el usuario, la extension del examen y el desempeno esperado.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleGenerateSimulation} className="mt-5 space-y-4">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Usuario
                                        <select
                                            value={selectedUserId}
                                            onChange={(event) => setSelectedUserId(event.target.value)}
                                            disabled={!regularUsers.length || isGeneratingSimulation}
                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                        >
                                            {regularUsers.length === 0 ? (
                                                <option value="">Sin usuarios disponibles</option>
                                            ) : regularUsers.map((regularUser) => (
                                                <option key={regularUser.id} value={regularUser.id}>
                                                    {regularUser.name || regularUser.email || 'Usuario sin nombre'}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Tema o etiqueta
                                        <input
                                            value={simulationForm.topic}
                                            onChange={(event) => handleSimulationFormChange('topic', event.target.value)}
                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                            placeholder="Ej.: Simulacro completo PMP"
                                        />
                                    </label>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Cantidad de preguntas
                                            <input
                                                type="number"
                                                min={1}
                                                max={300}
                                                value={simulationForm.questionCount}
                                                onChange={(event) => handleSimulationFormChange('questionCount', event.target.value)}
                                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                            />
                                        </label>

                                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Fecha de finalizacion
                                            <input
                                                type="date"
                                                value={simulationForm.completedDate}
                                                onChange={(event) => handleSimulationFormChange('completedDate', event.target.value)}
                                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                            />
                                        </label>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between gap-3">
                                            <label htmlFor="targetAccuracy" className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                Porcentaje aproximado de aciertos
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={simulationForm.targetAccuracy}
                                                onChange={(event) => handleSimulationFormChange('targetAccuracy', event.target.value)}
                                                className="w-20 rounded-md border border-gray-300 bg-white px-2 py-1 text-right text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                            />
                                        </div>
                                        <input
                                            id="targetAccuracy"
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={simulationPlan.percent}
                                            onChange={(event) => handleSimulationFormChange('targetAccuracy', event.target.value)}
                                            className="mt-3 w-full accent-blue-600"
                                        />
                                    </div>

                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Vista previa</p>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                            <div>
                                                <p className="text-2xl font-bold text-gray-950 dark:text-white">{simulationPlan.total}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">preguntas</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-950 dark:text-white">{simulationPlan.score}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">aciertos</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-950 dark:text-white">{simulationPlan.realPercent}%</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">resultado guardado</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{simulationNotice || 'Se guardara como simulacion completada y se actualizara el progreso del usuario.'}</p>
                                        <button
                                            type="submit"
                                            disabled={isGeneratingSimulation || !selectedUserId || !regularUsers.length}
                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                        >
                                            <Save className="h-4 w-4" />
                                            {isGeneratingSimulation ? 'Generando...' : 'Generar simulacion'}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-950 dark:text-white">Simulaciones del usuario</h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {selectedHistory ? `${selectedHistory.user.name || selectedHistory.user.email || 'Usuario'} - ${selectedUserSimulations.length} intentos` : 'Selecciona un usuario para ver sus intentos.'}
                                        </p>
                                    </div>
                                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {selectedHistory?.progress?.stats?.accuracy || 'N/A'} precision
                                    </span>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {!selectedHistory ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay usuarios con rol usuario para mostrar.</p>
                                    ) : selectedUserSimulations.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Todavia no hay simulaciones asociadas a este usuario.</p>
                                    ) : selectedUserSimulations.slice(0, 10).map((simulation) => (
                                        <div key={simulation.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-950 dark:text-white">{simulationLabel(simulation)}</p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDate(simulationActivityDate(simulation))}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                                                    {simulation.status || 'sin estado'}
                                                </span>
                                                <span className="text-sm font-bold text-gray-950 dark:text-white">{simulationScore(simulation)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                        )}

                        {((activeAdminView === 'research' && isResearchDetailOpen) || (activeAdminView === 'users' && isUserDetailOpen)) && (
                        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
                                <div>
                                    {activeAdminView === 'users' && (
                                        <button
                                            type="button"
                                            onClick={() => setIsUserDetailOpen(false)}
                                            className="mb-3 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-200"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Volver al listado
                                        </button>
                                    )}
                                    {activeAdminView === 'research' && (
                                        <button
                                            type="button"
                                            onClick={() => setIsResearchDetailOpen(false)}
                                            className="mb-3 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-200"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Volver al listado
                                        </button>
                                    )}
                                    <h2 className="text-base font-bold text-gray-950 dark:text-white">
                                        {activeAdminView === 'research' ? 'Investigación UX por usuario' : 'Detalle de usuario'}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {activeAdminView === 'research'
                                            ? 'Diseña instrumentos y carga relevamientos asociados al usuario seleccionado.'
                                            : 'Actividad, progreso y simulaciones del usuario seleccionado.'}
                                    </p>
                                </div>
                            </div>

                            {!selectedHistory ? (
                                <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
                                    No hay usuarios con rol usuario para mostrar.
                                </div>
                            ) : (
                                <div className="space-y-6 p-5">
                                    {activeAdminView === 'users' && selectedSimulationReport ? (
                                    <div className="space-y-6">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSimulationReportId('')}
                                            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-200"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Volver al detalle
                                        </button>

                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/60">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Informe de simulacion</p>
                                                    <h3 className="mt-1 text-lg font-bold text-gray-950 dark:text-white">{simulationLabel(selectedSimulationReport)}</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatDate(simulationActivityDate(selectedSimulationReport))}</p>
                                                </div>
                                                <span className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                                    {simulationStatusLabel(selectedSimulationReport.status)}
                                                </span>
                                            </div>

                                            <div className="mt-5 rounded-lg border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-gray-900">
                                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shadow-sm dark:bg-gray-800">
                                                    <CheckCircle className="h-7 w-7 text-gray-500 dark:text-gray-300" />
                                                </div>
                                                <p className="text-3xl font-bold text-gray-950 dark:text-white">{simulationPercent(selectedSimulationReport)}%</p>
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                                    {formatNumber(selectedSimulationReport.score)} de {formatNumber(selectedSimulationReport.total_questions)} respuestas correctas
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-base font-bold text-gray-950 dark:text-white">Revision detallada</h3>
                                            {!Array.isArray(selectedSimulationReport.questions) || selectedSimulationReport.questions.length === 0 ? (
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-400">
                                                    Esta simulacion no tiene preguntas guardadas para mostrar la revision detallada.
                                                </div>
                                            ) : selectedSimulationReport.questions.map((question, index) => {
                                                const userAnswer = selectedSimulationReport.answers?.[question.id];
                                                const isCorrect = userAnswer === question.correctAnswer;

                                                return (
                                                    <div key={`${question.id}-${index}`} className={`rounded-lg border-l-4 bg-gray-50 p-4 dark:bg-gray-950/60 ${isCorrect ? 'border-emerald-500' : 'border-red-500'}`}>
                                                        <div className="flex gap-3">
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-200">
                                                                {index + 1}
                                                            </span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-semibold text-gray-950 dark:text-white">{question.text}</p>
                                                                <div className="mt-4 grid gap-2 md:grid-cols-2">
                                                                    {(Array.isArray(question.options) ? question.options : []).map((option, optionIndex) => {
                                                                        const optionId = option.id || String.fromCharCode(65 + optionIndex);
                                                                        const isSelected = userAnswer === optionId;
                                                                        const isCorrectOption = question.correctAnswer === optionId;
                                                                        const optionClass = isCorrectOption
                                                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                                                                            : isSelected
                                                                                ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'
                                                                                : 'border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300';

                                                                        return (
                                                                            <div key={`${question.id}-${optionId}-${optionIndex}`} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${optionClass}`}>
                                                                                <span><span className="font-bold">{optionId}.</span> {option.text}</span>
                                                                                {isCorrectOption && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                                                                                {isSelected && !isCorrect && <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                                                                    <p className="font-bold">Explicacion:</p>
                                                                    <p className="mt-1">{question.explanation || 'Explicacion no disponible.'}</p>
                                                                    {question.domain && (
                                                                        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">Dominio: {question.domain}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    ) : (
                                    <>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-950 dark:text-white">{selectedHistory.user.name || 'Sin nombre'}</p>
                                    </div>

                                    {activeAdminView === 'users' && (
                                    <>
                                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/60">
                                        <button
                                            type="button"
                                            aria-expanded={isGuidedLevelsOpen}
                                            onClick={() => setIsGuidedLevelsOpen((current) => !current)}
                                            className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                                                    <h3 className="text-sm font-bold text-gray-950 dark:text-white">Modo guiado</h3>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Niveles completados en la ruta guiada.</p>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                <span>{selectedHistory.completedGuidedLevelDetails.length}/{GUIDED_LEVELS.length} niveles</span>
                                                {isGuidedLevelsOpen ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </div>
                                        </button>
                                        {isGuidedLevelsOpen && (
                                            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                                                {selectedHistory.completedGuidedLevelDetails.length === 0 ? (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin niveles completados en modo guiado.</p>
                                                ) : (
                                                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                                        {selectedHistory.completedGuidedLevelDetails.map((level) => (
                                                            <div key={level.id} className="rounded-md bg-white p-3 dark:bg-gray-900">
                                                                <div className="flex items-start gap-2">
                                                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-semibold text-gray-950 dark:text-white">{level.name}</p>
                                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            {level.worldName} - Nivel {level.levelNumber}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/60">
                                        <button
                                            type="button"
                                            aria-expanded={isUnlockedLevelsOpen}
                                            onClick={() => setIsUnlockedLevelsOpen((current) => !current)}
                                            className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <ClipboardList className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                                    <h3 className="text-sm font-bold text-gray-950 dark:text-white">Modo desbloqueado</h3>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Niveles con actividad registrada desde las practicas de nivel.</p>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                <span>{selectedHistory.practicedUnlockedLevelDetails.length}/{GUIDED_LEVELS.length} niveles practicados</span>
                                                {isUnlockedLevelsOpen ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </div>
                                        </button>
                                        {isUnlockedLevelsOpen && (
                                            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                                                {selectedHistory.practicedUnlockedLevelDetails.length === 0 ? (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin niveles practicados en modo desbloqueado.</p>
                                                ) : (
                                                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                                        {selectedHistory.practicedUnlockedLevelDetails.map((level) => (
                                                            <div key={level.id} className="rounded-md bg-white p-3 dark:bg-gray-900">
                                                                <div className="flex items-start gap-2">
                                                                    <Activity className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-semibold text-gray-950 dark:text-white">{level.name}</p>
                                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            {level.worldName}{level.levelNumber ? ` - Nivel ${level.levelNumber}` : ''}
                                                                        </p>
                                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                                            {level.activityTypes.map((activityType) => (
                                                                                <span key={activityType} className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                                                                                    {activityType}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                            {level.chats} chats - {level.messages} mensajes - {formatDate(level.lastActivity)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/60">
                                        <button
                                            type="button"
                                            aria-expanded={isSimulationsOpen}
                                            onClick={() => setIsSimulationsOpen((current) => !current)}
                                            className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                                                    <h3 className="text-sm font-bold text-gray-950 dark:text-white">Simulaciones</h3>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Intentos ordenados del mas reciente al mas antiguo.</p>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                <span>{selectedHistory.simulations.length} intentos</span>
                                                {isSimulationsOpen ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </div>
                                        </button>
                                        {isSimulationsOpen && (
                                            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                                                <div className="space-y-2">
                                                    {selectedHistory.simulations.length === 0 ? (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sin simulaciones registradas.</p>
                                                    ) : selectedHistory.simulations.map((simulation) => (
                                                        <button
                                                            key={simulation.id}
                                                            type="button"
                                                            onClick={() => setSelectedSimulationReportId(simulation.id)}
                                                            className="flex w-full items-center justify-between gap-4 rounded-md bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-900 dark:hover:bg-blue-950/40"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-900 dark:text-white">{simulationLabel(simulation)}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(simulationActivityDate(simulation))}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold text-gray-900 dark:text-white">{simulationScore(simulation)}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{simulationStatusLabel(simulation.status)}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    </>
                                    )}

                                    {activeAdminView === 'research' && (
                                    <>
                                    <div className={`hidden rounded-lg border p-4 ${selectedHistory.researchSessions.length > 0 ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20' : 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20'}`}>
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                                                    {selectedHistory.researchSessions.length > 0 ? 'Con resultados de relevamientos cargados' : 'Sin resultados de relevamientos cargados'}
                                                </h3>
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                                    {selectedHistory.researchSessions.length > 0
                                                        ? `Este usuario tiene ${selectedHistory.researchSessions.length} registro${selectedHistory.researchSessions.length === 1 ? '' : 's'} de feedback o relevamiento.`
                                                        : 'Todavia no hay feedback ni resultados asociados a este usuario.'}
                                                </p>
                                            </div>
                                            <span className={`rounded-md px-3 py-1 text-xs font-semibold ${selectedHistory.researchSessions.length > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'}`}>
                                                {selectedHistory.researchSessions.length} resultados
                                            </span>
                                        </div>
                                    </div>

                                    <div className="hidden space-y-4">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-950 dark:text-white">Instrumentos de relevamiento</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Instrumentos disponibles para aplicar y registrar evidencia del usuario seleccionado.</p>
                                    </div>
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

                                        <div className={`${isResearchResultFormOpen ? 'hidden ' : ''}rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60`}>
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
                                    </div>

                                    <div className="space-y-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-base font-bold text-gray-950 dark:text-white">
                                                {isResearchResultFormOpen ? 'Cargar feedback de sesion' : 'Evidencia de diseno centrado en usuarios'}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {isResearchResultFormOpen
                                                    ? 'Registra un nuevo resultado de relevamiento para este usuario.'
                                                    : 'Resultados de relevamientos y feedback asociados a este usuario.'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsResearchResultFormOpen((current) => !current)}
                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            {isResearchResultFormOpen ? 'Volver a resultados' : 'Cargar nuevo resultado'}
                                        </button>
                                    </div>
                                    <div className="grid gap-6">
                                        {isResearchResultFormOpen && (
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
                                        )}

                                        <div className={`${isResearchResultFormOpen ? 'hidden ' : ''}rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Evidencia de diseno centrado en usuarios</h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{selectedHistory.researchSessions.length} resultados</span>
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
                                    </div>
                                    </>
                                    )}
                                    </>
                                    )}
                                </div>
                            )}
                        </section>
                        )}

                        {activeAdminView === 'research' && !isResearchDetailOpen && (
                        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                                <h2 className="text-base font-bold text-gray-950 dark:text-white">Usuarios investigados</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Selecciona un usuario para revisar instrumentos y feedback de investigacion UX.</p>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {regularUsers.length === 0 ? (
                                    <div className="p-5 text-sm text-gray-500 dark:text-gray-400">No hay usuarios con rol usuario para mostrar.</div>
                                ) : regularUsers.map((user) => {
                                    const userSessions = researchSessions.filter((session) => session.user === user.id);
                                    const lastSession = userSessions
                                        .slice()
                                        .sort((a, b) => new Date(b.session_date || b.created || 0).getTime() - new Date(a.session_date || a.created || 0).getTime())[0] || null;

                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedUserId(user.id);
                                                setIsResearchDetailOpen(true);
                                            }}
                                            className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:hover:bg-gray-950/60 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-950 dark:text-white">{user.name || 'Sin nombre'}</p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{user.email || 'Sin email'}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                    {userSessions.length} sesiones
                                                </span>
                                                <span className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                    {researchInstruments.length} instrumentos
                                                </span>
                                                <span>Ultimo feedback: {formatDateOnly(lastSession?.session_date || lastSession?.created)}</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                        )}

                        {activeAdminView === 'users' && !isUserDetailOpen && (
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
                                                            onClick={() => {
                                                                setSelectedUserId(summary.user.id);
                                                                setIsUserDetailOpen(true);
                                                            }}
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
