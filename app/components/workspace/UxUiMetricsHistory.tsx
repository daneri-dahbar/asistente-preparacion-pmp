'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, RefreshCw, Save, Smile } from 'lucide-react';
import pb from '@/lib/pocketbase';
import {
    EMPTY_UX_UI_METRIC_FORM,
    UX_UI_METRIC_COLLECTION,
    UX_UI_METRIC_DEFINITIONS,
    buildUxUiMetricPayload,
    formatDateTimeLocalInput,
    formatUxUiScore,
    type UxUiMetricFormValues,
    type UxUiMetricSnapshotRecord,
} from '@/lib/uxUiMetrics';

interface UxUiMetricsHistoryProps {
    userId: string;
    userName?: string;
    onBack?: () => void;
    embedded?: boolean;
    allowCreate?: boolean;
    adminCreate?: boolean;
    compactHeader?: boolean;
}

function formatDate(value?: string) {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';

    return date.toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'medium',
    });
}

function latestAverage(records: UxUiMetricSnapshotRecord[], field: keyof UxUiMetricSnapshotRecord) {
    const values = records
        .map((record) => record[field])
        .filter((value): value is number => typeof value === 'number');

    if (!values.length) return null;

    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export default function UxUiMetricsHistory({ userId, userName, onBack, embedded = false, allowCreate = false, adminCreate = false, compactHeader = false }: UxUiMetricsHistoryProps) {
    const [records, setRecords] = useState<UxUiMetricSnapshotRecord[]>([]);
    const [form, setForm] = useState<UxUiMetricFormValues>(() => ({
        ...EMPTY_UX_UI_METRIC_FORM,
        measured_at: formatDateTimeLocalInput(),
    }));
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadRecords = async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const items = await pb.collection(UX_UI_METRIC_COLLECTION).getFullList({
                filter: `user="${userId}"`,
                sort: '-measured_at',
                requestKey: null,
            });
            setRecords(items as unknown as UxUiMetricSnapshotRecord[]);
        } catch (loadError) {
            console.error('No se pudieron cargar las metricas UX/UI:', loadError);
            setRecords([]);
            setError('No se pudieron cargar las metricas UX/UI guardadas. Verifica que la coleccion exista en PocketBase.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, [userId]);

    const latestRecord = records[0] || null;
    const summary = useMemo(() => ({
        averageLikert: latestAverage(records, 'average_likert'),
        easeOfUse: latestAverage(records, 'ease_of_use'),
        answerQuality: latestAverage(records, 'answer_quality'),
        responseSpeed: latestAverage(records, 'response_speed'),
        examSimilarity: latestAverage(records, 'exam_similarity'),
        nps: latestAverage(records, 'nps'),
    }), [records]);

    const handleFormChange = (field: keyof UxUiMetricFormValues, value: string) => {
        setNotice(null);
        setError(null);
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!allowCreate || !userId || isSaving) return;

        setIsSaving(true);
        setNotice(null);
        setError(null);

        try {
            const record = adminCreate
                ? await fetch('/api/admin/ux-ui-metrics/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${pb.authStore.token}`,
                    },
                    body: JSON.stringify({ userId, values: form }),
                }).then(async (response) => {
                    const payload = await response.json();
                    if (!response.ok) {
                        throw new Error(payload.error || 'No se pudo guardar la medicion UX/UI.');
                    }
                    return payload.record;
                })
                : await pb.collection(UX_UI_METRIC_COLLECTION).create(buildUxUiMetricPayload(userId, form), { requestKey: null });
            setRecords((current) => [record as unknown as UxUiMetricSnapshotRecord, ...current]);
            setForm((current) => ({
                ...EMPTY_UX_UI_METRIC_FORM,
                measured_at: formatDateTimeLocalInput(),
                context: current.context || EMPTY_UX_UI_METRIC_FORM.context,
            }));
            setNotice('Medicion UX/UI guardada correctamente.');
        } catch (saveError) {
            console.error('No se pudo guardar la medicion UX/UI:', saveError);
            setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la medicion UX/UI.');
        } finally {
            setIsSaving(false);
        }
    };

    const containerClass = embedded
        ? 'space-y-5'
        : 'flex-1 overflow-y-auto bg-gray-50/50 p-4 dark:bg-gray-900/50 md:p-8';

    return (
        <div className={containerClass}>
            <div className={embedded ? 'space-y-5' : 'mx-auto w-full max-w-6xl space-y-6'}>
                {!compactHeader && (
                    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                {onBack && (
                                    <button
                                        type="button"
                                        onClick={onBack}
                                        className="mb-4 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-200"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Volver
                                    </button>
                                )}
                                <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                                    <Smile className="h-4 w-4" />
                                    UX/UI
                                </div>
                                <h2 className="mt-3 text-xl font-bold text-gray-950 dark:text-white">
                                    {userName ? `Mediciones UX/UI de ${userName}` : 'Mis mediciones UX/UI'}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    Encuesta basada en el Anexo C del informe final: facilidad de uso, calidad percibida, velocidad, similitud con examen y NPS.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={loadRecords}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:bg-gray-400"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Cargando...' : 'Actualizar'}
                            </button>
                        </div>

                        {latestRecord && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <CalendarClock className="h-4 w-4" />
                                Ultima medicion: {formatDate(latestRecord.measured_at || latestRecord.created)}
                            </div>
                        )}
                    </section>
                )}

                {allowCreate && (
                    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-base font-bold text-gray-950 dark:text-white">Anadir medicion UX/UI</h3>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    Contexto de uso
                                    <input
                                        value={form.context}
                                        onChange={(event) => handleFormChange('context', event.target.value)}
                                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                        placeholder="Ej: luego de usar dashboard, chat y simulador"
                                    />
                                </label>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    Fecha y hora de medicion
                                    <input
                                        type="datetime-local"
                                        value={form.measured_at}
                                        onChange={(event) => handleFormChange('measured_at', event.target.value)}
                                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                        required
                                    />
                                </label>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {UX_UI_METRIC_DEFINITIONS.map((metric) => (
                                    <label key={metric.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/60">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{metric.label}</span>
                                        <span className="mt-1 block text-sm font-semibold text-gray-950 dark:text-white">{metric.prompt}</span>
                                        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{metric.scale}</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={5}
                                            value={form[metric.id]}
                                            onChange={(event) => handleFormChange(metric.id, event.target.value)}
                                            className="mt-3 w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                            required
                                        />
                                    </label>
                                ))}
                            </div>

                            <label className="block rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/60">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">NPS</span>
                                <span className="mt-1 block text-sm font-semibold text-gray-950 dark:text-white">Recomendarias esta herramienta a un colega?</span>
                                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">0: nada probable - 10: muy probable</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={form.nps}
                                    onChange={(event) => handleFormChange('nps', event.target.value)}
                                    className="mt-3 w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                    required
                                />
                            </label>

                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    Fricciones detectadas
                                    <textarea
                                        value={form.friction_points}
                                        onChange={(event) => handleFormChange('friction_points', event.target.value)}
                                        rows={3}
                                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case leading-6 tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                        placeholder="Ej: dificultad para encontrar una accion, texto poco claro, perdida de contexto"
                                    />
                                </label>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    Comentarios
                                    <textarea
                                        value={form.comments}
                                        onChange={(event) => handleFormChange('comments', event.target.value)}
                                        rows={3}
                                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm normal-case leading-6 tracking-normal text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                        placeholder="Observaciones libres sobre la experiencia"
                                    />
                                </label>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-h-6">
                                    {notice && <p className="text-sm font-semibold text-green-700 dark:text-green-300">{notice}</p>}
                                    {error && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:bg-gray-400"
                                >
                                    <Save className="h-4 w-4" />
                                    {isSaving ? 'Guardando...' : 'Guardar medicion'}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {error && !allowCreate && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                        {error}
                    </div>
                )}

                {!error && !isLoading && records.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        Todavia no hay mediciones UX/UI guardadas para este usuario.
                    </div>
                )}

                {records.length > 0 && (
                    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Promedio Likert</p>
                            <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{formatUxUiScore(summary.averageLikert)}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Facilidad, calidad, velocidad y similitud.</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">NPS promedio</p>
                            <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{formatUxUiScore(summary.nps, '/10')}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Recomendacion de la herramienta.</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cantidad de mediciones</p>
                            <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{records.length}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Registros historicos guardados.</p>
                        </div>
                    </section>
                )}

                {records.length > 0 && (
                    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-base font-bold text-gray-950 dark:text-white">Historial UX/UI</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        <th className="px-3 py-2">Fecha y hora</th>
                                        <th className="px-3 py-2">Facilidad</th>
                                        <th className="px-3 py-2">Calidad IA</th>
                                        <th className="px-3 py-2">Velocidad</th>
                                        <th className="px-3 py-2">Examen</th>
                                        <th className="px-3 py-2">NPS</th>
                                        <th className="px-3 py-2">Fricciones</th>
                                        <th className="px-3 py-2">Comentarios</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {records.map((record) => (
                                        <tr key={record.id} className="text-gray-700 dark:text-gray-200">
                                            <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(record.measured_at || record.created)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatUxUiScore(record.ease_of_use)}</td>
                                            <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatUxUiScore(record.answer_quality)}</td>
                                            <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatUxUiScore(record.response_speed)}</td>
                                            <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatUxUiScore(record.exam_similarity)}</td>
                                            <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatUxUiScore(record.nps, '/10')}</td>
                                            <td className="min-w-60 px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                                                {record.friction_points || '-'}
                                            </td>
                                            <td className="min-w-60 px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                                                {record.comments || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
