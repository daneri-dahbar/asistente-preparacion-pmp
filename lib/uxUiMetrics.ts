export const UX_UI_METRIC_COLLECTION = 'ux_ui_metric_snapshots';

export const UX_UI_METRIC_DEFINITIONS = [
    {
        id: 'ease_of_use',
        label: 'Facilidad de uso',
        target: '>= 4/5',
        prompt: 'Que tan intuitiva fue la navegacion por la aplicacion?',
        scale: '1: muy confusa - 5: muy intuitiva',
        source: 'Anexo C.1.3 - Encuesta de satisfaccion post-prueba',
    },
    {
        id: 'answer_quality',
        label: 'Calidad de respuestas',
        target: '>= 4/5',
        prompt: 'Las explicaciones de la IA fueron claras y precisas?',
        scale: '1: confusas o erroneas - 5: excelentes',
        source: 'Anexo C.1.3 - Encuesta de satisfaccion post-prueba',
    },
    {
        id: 'response_speed',
        label: 'Velocidad percibida',
        target: '>= 4/5',
        prompt: 'La velocidad de respuesta del chat fue adecuada?',
        scale: '1: muy lenta - 5: instantanea',
        source: 'Anexo C.1.3 - Encuesta de satisfaccion post-prueba',
    },
    {
        id: 'exam_similarity',
        label: 'Similitud con examen',
        target: '>= 4/5',
        prompt: 'Las preguntas del simulador se parecen a las reales?',
        scale: '1: nada - 5: identicas',
        source: 'Anexo C.1.3 - Encuesta de satisfaccion post-prueba',
    },
] as const;

export interface UxUiMetricSnapshotRecord {
    id: string;
    user: string;
    measured_at?: string;
    context?: string;
    ease_of_use?: number;
    answer_quality?: number;
    response_speed?: number;
    exam_similarity?: number;
    average_likert?: number;
    nps?: number;
    nps_category?: string;
    friction_points?: string;
    comments?: string;
    metrics?: Record<string, unknown>;
    created?: string;
    updated?: string;
}

export interface UxUiMetricFormValues {
    context: string;
    ease_of_use: string;
    answer_quality: string;
    response_speed: string;
    exam_similarity: string;
    nps: string;
    friction_points: string;
    comments: string;
}

export const EMPTY_UX_UI_METRIC_FORM: UxUiMetricFormValues = {
    context: 'Uso de pantalla principal, chat y simulaciones',
    ease_of_use: '5',
    answer_quality: '5',
    response_speed: '5',
    exam_similarity: '4',
    nps: '9',
    friction_points: '',
    comments: '',
};

export function normalizeLikertValue(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(1, Math.min(5, Math.round(parsed)));
}

export function normalizeNpsValue(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(10, Math.round(parsed)));
}

export function calculateAverageLikert(values: Array<number | null>) {
    const validValues = values.filter((value): value is number => typeof value === 'number');
    if (!validValues.length) return null;

    const average = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
    return Number(average.toFixed(2));
}

export function classifyNps(value: number | null) {
    if (value === null) return 'Sin clasificar';
    if (value >= 9) return 'Promotor';
    if (value >= 7) return 'Pasivo';
    return 'Detractor';
}

export function buildUxUiMetricPayload(userId: string, values: UxUiMetricFormValues) {
    const easeOfUse = normalizeLikertValue(values.ease_of_use);
    const answerQuality = normalizeLikertValue(values.answer_quality);
    const responseSpeed = normalizeLikertValue(values.response_speed);
    const examSimilarity = normalizeLikertValue(values.exam_similarity);
    const nps = normalizeNpsValue(values.nps);
    const averageLikert = calculateAverageLikert([easeOfUse, answerQuality, responseSpeed, examSimilarity]);
    const npsCategory = classifyNps(nps);

    if ([easeOfUse, answerQuality, responseSpeed, examSimilarity, nps].some((value) => value === null)) {
        throw new Error('Completa todos los valores de la encuesta UX/UI.');
    }

    return {
        user: userId,
        measured_at: new Date().toISOString(),
        context: values.context.trim() || 'Medicion UX/UI sin contexto especifico',
        ease_of_use: easeOfUse,
        answer_quality: answerQuality,
        response_speed: responseSpeed,
        exam_similarity: examSimilarity,
        average_likert: averageLikert,
        nps,
        nps_category: npsCategory,
        friction_points: values.friction_points.trim(),
        comments: values.comments.trim(),
        metrics: {
            source: 'Informe final para aplicacion - Anexo C.1.3 y Capitulo 6.2',
            ease_of_use: {
                label: 'Facilidad de uso',
                value: easeOfUse,
                target: '>= 4/5',
            },
            answer_quality: {
                label: 'Calidad de respuestas',
                value: answerQuality,
                target: '>= 4/5',
            },
            response_speed: {
                label: 'Velocidad percibida',
                value: responseSpeed,
                target: '>= 4/5',
            },
            exam_similarity: {
                label: 'Similitud con examen',
                value: examSimilarity,
                target: '>= 4/5',
            },
            nps: {
                label: 'NPS',
                value: nps,
                target: '>= 8',
                category: npsCategory,
            },
        },
    };
}

export function formatUxUiScore(value?: number | null, suffix = '/5') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'No disponible';
    return `${value}${suffix}`;
}
