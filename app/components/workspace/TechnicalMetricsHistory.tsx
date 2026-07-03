'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react';
import pb from '@/lib/pocketbase';
import {
    TECHNICAL_METRIC_COLLECTION,
    type TechnicalMetricSnapshotRecord,
    technicalMetricValuesFromSnapshot,
} from '@/lib/technicalMetrics';

const METRIC_LABELS = [
    { id: 'ttft', label: 'Time to first token', translation: 'Tiempo hasta el primer token', target: 'Objetivo menor a 800 ms' },
    { id: 'lcp', label: 'Largest contentful paint', translation: 'Pintado del contenido principal', target: 'Objetivo mejor a 2.5 s' },
    { id: 'cls', label: 'Cumulative layout shift', translation: 'Cambio acumulado de diseño', target: 'Objetivo menor a 0.1' },
    { id: 'bundle', label: 'Bundle inicial', translation: 'Paquete inicial descargado', target: 'Objetivo menor a 200 kb' },
    { id: 'pocketbase-latency', label: 'Latencia PocketBase', translation: 'Tiempo de respuesta de la base de datos', target: 'Lectura simple, objetivo menor a 50 ms' },
    { id: 'streaming', label: 'Respuesta streaming', translation: 'Respuesta transmitida por fragmentos', target: '' },
];

interface TechnicalMetricsHistoryProps {
    userId: string;
    userName?: string;
    onBack?: () => void;
    embedded?: boolean;
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

export default function TechnicalMetricsHistory({ userId, userName, onBack, embedded = false }: TechnicalMetricsHistoryProps) {
    const [records, setRecords] = useState<TechnicalMetricSnapshotRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRecords = async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const items = await pb.collection(TECHNICAL_METRIC_COLLECTION).getFullList({
                filter: `user="${userId}"`,
                sort: '-measured_at',
                requestKey: null,
            });
            setRecords(items as unknown as TechnicalMetricSnapshotRecord[]);
        } catch (loadError) {
            console.error('No se pudieron cargar las metricas tecnicas:', loadError);
            setRecords([]);
            setError('No se pudieron cargar las metricas tecnicas guardadas. Verifica que la coleccion exista en PocketBase.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, [userId]);

    const latestRecord = records[0] || null;
    const latestValues = useMemo(() => technicalMetricValuesFromSnapshot(latestRecord), [latestRecord]);
    const containerClass = embedded
        ? 'space-y-5'
        : 'flex-1 overflow-y-auto bg-gray-50/50 p-4 dark:bg-gray-900/50 md:p-8';

    return (
        <div className={containerClass}>
            <div className={embedded ? 'space-y-5' : 'mx-auto w-full max-w-6xl space-y-6'}>
                {!embedded && (
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
                                    <BarChart3 className="h-4 w-4" />
                                    Metricas tecnicas
                                </div>
                                <h2 className="mt-3 text-xl font-bold text-gray-950 dark:text-white">
                                    {userName ? `Mediciones de ${userName}` : 'Mis metricas tecnicas'}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    Mediciones reales tomadas cuando el usuario aspirante ingreso a su pantalla principal.
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
                    </section>
                )}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                        {error}
                    </div>
                )}

                {!error && !isLoading && records.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        Todavia no hay mediciones guardadas para este usuario. Se registraran automaticamente al ingresar como aspirante a la pantalla principal.
                    </div>
                )}

                {!embedded && latestRecord && (
                    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {METRIC_LABELS.map((metric) => (
                            <div key={metric.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{metric.label}</p>
                                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{metric.translation}</p>
                                <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
                                    {latestValues[metric.id] || 'No disponible'}
                                </p>
                                {metric.target && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{metric.target}</p>
                                )}
                                {latestRecord.metrics?.[metric.id]?.detail && (
                                    <p className="mt-3 text-xs leading-5 text-gray-600 dark:text-gray-300">
                                        {latestRecord.metrics[metric.id].detail}
                                    </p>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {records.length > 0 && (
                    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-base font-bold text-gray-950 dark:text-white">Historial de mediciones</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        <th className="px-3 py-2">Fecha y hora</th>
                                        {METRIC_LABELS.map((metric) => (
                                            <th key={metric.id} className="px-3 py-2">
                                                <span className="block">{metric.label}</span>
                                                <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-gray-400 dark:text-gray-500">{metric.translation}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {records.map((record) => {
                                        const values = technicalMetricValuesFromSnapshot(record);
                                        return (
                                            <tr key={record.id} className="text-gray-700 dark:text-gray-200">
                                                <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(record.measured_at || record.created)}
                                                </td>
                                                {METRIC_LABELS.map((metric) => (
                                                    <td key={metric.id} className="whitespace-nowrap px-3 py-3 font-semibold">
                                                        {values[metric.id] || 'No disponible'}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
