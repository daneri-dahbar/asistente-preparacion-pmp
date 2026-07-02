'use client';

export const TECHNICAL_METRIC_COLLECTION = 'technical_metric_snapshots';
export const ASPIRANT_MAIN_SCREEN_LABEL = 'Pantalla principal del usuario aspirante (/welcome, Dashboard del rol usuario)';

export interface TechnicalMetricValue {
    value: string;
    raw?: number | string | null;
    status: 'ok' | 'error' | 'unavailable';
    detail?: string;
}

export interface TechnicalMetricSnapshotRecord {
    id: string;
    user: string;
    measured_at?: string;
    screen?: string;
    ttft_ms?: number;
    lcp_ms?: number;
    cls?: number;
    bundle_kb?: number;
    pocketbase_latency_ms?: number;
    streaming_chunks?: number;
    streaming_label?: string;
    metrics?: Record<string, TechnicalMetricValue>;
    user_agent?: string;
    created?: string;
    updated?: string;
}

interface PocketBaseLike {
    collection: (name: string) => {
        create: (data: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
        getOne: (id: string, options?: Record<string, unknown>) => Promise<unknown>;
    };
}

interface ChatStreamingResult {
    firstChunkMs: number;
    chunkCount: number;
    characterCount: number;
    responseText: string;
}

export function formatMilliseconds(value: number) {
    if (!Number.isFinite(value)) return 'N/A';
    if (value < 1000) return `${Math.round(value)} ms`;
    return `${(value / 1000).toFixed(2)} s`;
}

export function formatKilobytes(value: number) {
    if (!Number.isFinite(value)) return 'N/A';
    return `${Math.round(value / 1024)} KB`;
}

export function supportsPerformanceEntryType(type: string) {
    return typeof PerformanceObserver !== 'undefined'
        && Array.isArray(PerformanceObserver.supportedEntryTypes)
        && PerformanceObserver.supportedEntryTypes.includes(type);
}

export function readBufferedPerformanceEntries<T extends PerformanceEntry>(type: string, waitMs = 100) {
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

export async function measureChatStreaming(prompt = 'Hola', options: { omitSystemPrompt?: boolean } = {}) {
    const start = performance.now();
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mode: options.omitSystemPrompt ? undefined : 'standard',
            omitSystemPrompt: options.omitSystemPrompt,
            messages: [{ role: 'user', content: prompt }],
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
}

export async function measureCurrentLargestContentfulPaint() {
    const entries = await readBufferedPerformanceEntries<PerformanceEntry>('largest-contentful-paint', 150);
    const latestEntry = entries.at(-1);

    return {
        entries,
        value: latestEntry?.startTime ?? null,
        supported: supportsPerformanceEntryType('largest-contentful-paint'),
    };
}

export async function measureCurrentCumulativeLayoutShift() {
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

export function measureInitialJavaScriptBundle() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter((entry) => entry.name.includes('.js'));
    const totalBytes = jsResources.reduce((sum, entry) => (
        sum + (entry.transferSize || entry.encodedBodySize || 0)
    ), 0);

    return {
        bytes: totalBytes,
        kilobytes: Math.round(totalBytes / 1024),
        resourceCount: jsResources.length,
    };
}

export async function measurePocketBaseLatency(pb: PocketBaseLike, userId: string) {
    const start = performance.now();
    await pb.collection('users').getOne(userId, { fields: 'id', requestKey: null });
    return performance.now() - start;
}

function metricOk(value: string, raw?: number | string | null, detail?: string): TechnicalMetricValue {
    return { value, raw, status: 'ok', detail };
}

function metricUnavailable(detail: string): TechnicalMetricValue {
    return { value: 'No disponible', raw: null, status: 'unavailable', detail };
}

function metricError(error: unknown): TechnicalMetricValue {
    return {
        value: 'No disponible',
        raw: null,
        status: 'error',
        detail: error instanceof Error ? error.message : 'No se pudo medir el indicador.',
    };
}

function compactPayload(payload: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

export async function captureAspirantTechnicalMetrics(pb: PocketBaseLike, userId: string) {
    const measuredAt = new Date().toISOString();
    const [ttftResult, lcpResult, clsResult, bundleResult, pocketBaseResult] = await Promise.allSettled([
        measureChatStreaming('Hola', { omitSystemPrompt: true }),
        measureCurrentLargestContentfulPaint(),
        measureCurrentCumulativeLayoutShift(),
        Promise.resolve(measureInitialJavaScriptBundle()),
        measurePocketBaseLatency(pb, userId),
    ]);

    const metrics: Record<string, TechnicalMetricValue> = {};
    const payload: Record<string, unknown> = {
        user: userId,
        measured_at: measuredAt,
        screen: ASPIRANT_MAIN_SCREEN_LABEL,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    if (ttftResult.status === 'fulfilled') {
        const result = ttftResult.value as ChatStreamingResult;
        metrics.ttft = metricOk(formatMilliseconds(result.firstChunkMs), Math.round(result.firstChunkMs), 'Prompt: Hola, sin system prompt ni contexto adicional.');
        metrics.streaming = metricOk(
            result.chunkCount > 1 ? `Activo (${result.chunkCount} fragmentos)` : 'Respuesta unica',
            result.chunkCount,
            'Cantidad de fragmentos recibidos desde el stream del chat.'
        );
        payload.ttft_ms = Math.round(result.firstChunkMs);
        payload.streaming_chunks = result.chunkCount;
        payload.streaming_label = metrics.streaming.value;
    } else {
        metrics.ttft = metricError(ttftResult.reason);
        metrics.streaming = metricError(ttftResult.reason);
    }

    if (lcpResult.status === 'fulfilled') {
        const result = lcpResult.value;
        if (result.value === null) {
            metrics.lcp = metricUnavailable(result.supported
                ? 'El navegador no entrego una entrada LCP para esta navegacion.'
                : 'El navegador no soporta largest-contentful-paint.');
        } else {
            metrics.lcp = metricOk(formatMilliseconds(result.value), Math.round(result.value), ASPIRANT_MAIN_SCREEN_LABEL);
            payload.lcp_ms = Math.round(result.value);
        }
    } else {
        metrics.lcp = metricError(lcpResult.reason);
    }

    if (clsResult.status === 'fulfilled') {
        const result = clsResult.value;
        if (!result.supported) {
            metrics.cls = metricUnavailable('El navegador no soporta layout-shift.');
        } else {
            metrics.cls = metricOk(result.value.toFixed(3), Number(result.value.toFixed(3)), `${result.entries.length} entradas layout-shift analizadas.`);
            payload.cls = Number(result.value.toFixed(3));
        }
    } else {
        metrics.cls = metricError(clsResult.reason);
    }

    if (bundleResult.status === 'fulfilled') {
        const result = bundleResult.value;
        metrics.bundle = metricOk(`${result.kilobytes} KB`, result.kilobytes, `${result.resourceCount} recursos JavaScript detectados.`);
        payload.bundle_kb = result.kilobytes;
    } else {
        metrics.bundle = metricError(bundleResult.reason);
    }

    if (pocketBaseResult.status === 'fulfilled') {
        const value = Math.round(pocketBaseResult.value);
        metrics['pocketbase-latency'] = metricOk(formatMilliseconds(value), value, 'Lectura simple del registro del usuario autenticado.');
        payload.pocketbase_latency_ms = value;
    } else {
        metrics['pocketbase-latency'] = metricError(pocketBaseResult.reason);
    }

    payload.metrics = metrics;

    const record = await pb.collection(TECHNICAL_METRIC_COLLECTION).create(compactPayload(payload), { requestKey: null });
    return record as TechnicalMetricSnapshotRecord;
}

export function technicalMetricValuesFromSnapshot(snapshot?: TechnicalMetricSnapshotRecord | null) {
    if (!snapshot) return {};

    return {
        ttft: snapshot.metrics?.ttft?.value || (typeof snapshot.ttft_ms === 'number' ? formatMilliseconds(snapshot.ttft_ms) : undefined),
        lcp: snapshot.metrics?.lcp?.value || (typeof snapshot.lcp_ms === 'number' ? formatMilliseconds(snapshot.lcp_ms) : undefined),
        cls: snapshot.metrics?.cls?.value || (typeof snapshot.cls === 'number' ? snapshot.cls.toFixed(3) : undefined),
        bundle: snapshot.metrics?.bundle?.value || (typeof snapshot.bundle_kb === 'number' ? `${snapshot.bundle_kb} KB` : undefined),
        'pocketbase-latency': snapshot.metrics?.['pocketbase-latency']?.value || (typeof snapshot.pocketbase_latency_ms === 'number' ? formatMilliseconds(snapshot.pocketbase_latency_ms) : undefined),
        streaming: snapshot.metrics?.streaming?.value || snapshot.streaming_label,
    } as Record<string, string | undefined>;
}
