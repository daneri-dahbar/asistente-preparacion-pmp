
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pb from '@/lib/pocketbase';
import { AlertCircle, CheckCircle, Clock, Save, LogOut, Play, BarChart2, Trash2 } from 'lucide-react';

interface Question {
    id: string;
    text: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    explanation: string;
    domain: string;
}

interface SimulationRecord {
    id: string;
    user: string;
    status: 'in_progress' | 'completed';
    type: string; // e.g., '45_questions'
    total_questions: number;
    current_index: number;
    questions: Question[];
    answers: Record<string, string>; // { questionId: selectedOptionId }
    score: number;
    created: string;
    updated: string;
}

interface ExamSimulatorProps {
    simulationId: string | null; // If resuming
    initialQuestionCount: number;
    topic: string;
    userId: string;
    onExit: () => void;
    onComplete?: (score: number, total: number) => void;
}

export default function ExamSimulator({ simulationId, initialQuestionCount, topic, userId, onExit, onComplete }: ExamSimulatorProps) {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [record, setRecord] = useState<SimulationRecord | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const initRan = useRef(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Initialize or Load
    useEffect(() => {
        if (initRan.current) return;
        initRan.current = true;

        const initSession = async () => {
            try {
                setLoading(true);
                
                // 1. Try to load existing active simulation if ID provided OR search for one in progress
                let currentRecord: SimulationRecord | null = null;

                if (simulationId) {
                    currentRecord = await pb.collection('simulations').getOne(simulationId);
                } else {
                    // Check if there is an unfinished simulation for this user and topic/type
                    // This logic depends on business rules. For now, let's assume we always start fresh if no ID,
                    // OR we could check for an 'in_progress' one.
                    // Let's create a new one to be safe unless specified.
                }

                if (!currentRecord) {
                    // Create new simulation record
                    const newRecord = {
                        user: userId,
                        status: 'in_progress',
                        type: `${initialQuestionCount}_questions`,
                        total_questions: initialQuestionCount,
                        current_index: 0,
                        questions: [],
                        answers: {},
                        score: 0
                    };
                    currentRecord = await pb.collection('simulations').create(newRecord, { requestKey: null }) as unknown as SimulationRecord;
                    
                    // Generate first batch of questions (1 by 1)
                    setGenerating(true);
                    const res = await fetch('/api/simulation/generate', {
                        method: 'POST',
                        body: JSON.stringify({ amount: 1, topic: topic }), // Start with 1 as requested
                    });
                    const data = await res.json();
                    
                    if (data.questions) {
                        currentRecord = await pb.collection('simulations').update(currentRecord.id, {
                            questions: data.questions
                        }, { requestKey: null }) as unknown as SimulationRecord;
                    }
                    setGenerating(false);
                }

                setRecord(currentRecord);
                if (currentRecord?.status === 'completed') {
                    setShowResults(true);
                }

            } catch (err: any) {
                if (err.isAbort) return; // Ignore auto-cancellation/abort errors
                console.error("Error initializing exam:", err);
                setError(err.message || "Error al iniciar el simulador. Verifica tu conexión.");
            } finally {
                setLoading(false);
            }
        };

        initSession();
    }, [simulationId, initialQuestionCount, topic, userId]);

        // Buffer more questions if needed
    useEffect(() => {
        if (!record || record.status === 'completed' || generating) return;

        const remainingQuestions = record.questions.length - (record.current_index + 1);
        const questionsNeeded = record.total_questions - record.questions.length;

        // If we are running low on questions and haven't reached the total yet
        // Buffer set to 1 as requested (generates next question while viewing current)
        if (remainingQuestions < 1 && questionsNeeded > 0) {
            const fetchMore = async () => {
                try {
                    if (!isMounted.current) return;
                    setGenerating(true);
                    const amountToFetch = 1; // Always fetch 1 by 1 as requested
                    const res = await fetch('/api/simulation/generate', {
                        method: 'POST',
                        body: JSON.stringify({ amount: amountToFetch, topic: topic }),
                    });
                    
                    if (!isMounted.current) return;
                    const data = await res.json();
                    
                    if (data.questions && isMounted.current) {
                        // Append new questions
                        const updatedQuestions = [...record.questions, ...data.questions];
                        // Use requestKey: null to prevent auto-cancellation collisions with other updates
                        const updatedRecord = await pb.collection('simulations').update(record.id, {
                            questions: updatedQuestions
                        }, { requestKey: null }) as unknown as SimulationRecord;
                        
                        if (isMounted.current) {
                            setRecord(updatedRecord);
                        }
                    }
                } catch (err: any) {
                    // Ignore status 0 (auto-cancelled) or if unmounted
                    if (err.status !== 0 && isMounted.current) {
                        console.error("Background fetch error:", err);
                    }
                } finally {
                    if (isMounted.current) {
                        setGenerating(false);
                    }
                }
            };
            fetchMore();
        }
    }, [record?.current_index, record?.questions.length]);

    const handleAnswer = async (optionId: string) => {
        if (!record) return;

        const currentQ = record.questions[record.current_index];
        const newAnswers = { ...record.answers, [currentQ.id]: optionId };
        
        // Optimistic update
        const nextIndex = record.current_index + 1;
        const isFinished = nextIndex >= record.total_questions;
        
        const updates: any = {
            answers: newAnswers,
            current_index: nextIndex, // Move to next immediately?
            // Actually, we usually want to stay on current to show selection, then move.
            // But user requested "No feedback", so immediate move is fine.
        };

        if (isFinished) {
            updates.status = 'completed';
            // Calculate score
            let score = 0;
            record.questions.forEach(q => {
                if (newAnswers[q.id] === q.correctAnswer) score++;
            });
            updates.score = score;

            // Check for passing score (>= 70%)
            const percentage = Math.round((score / record.total_questions) * 100);
            if (percentage >= 70 && onComplete) {
                onComplete(score, record.total_questions);
            }
        }

        try {
            // Move local state
            setRecord(prev => prev ? ({ ...prev, ...updates }) : null);

            // Persist
            await pb.collection('simulations').update(record.id, updates, { requestKey: null });

            if (isFinished) {
                setShowResults(true);
            }

        } catch (err) {
            console.error("Error saving answer:", err);
            // Revert optimistic update if critical?
        }
    };

    const handleCancel = async () => {
        if (!record) return;
        if (!confirm('¿Estás seguro de que quieres cancelar el examen? Se perderá todo el progreso y el registro de este intento.')) return;

        try {
            setLoading(true);
            await pb.collection('simulations').delete(record.id);
            onExit();
        } catch (err) {
            console.error("Error canceling simulation:", err);
            setLoading(false);
            alert("Hubo un error al cancelar la simulación. Por favor intenta de nuevo.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <h2 className="text-xl font-bold animate-pulse">Preparando el entorno de examen...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 p-8">
                <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-2xl max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error de Inicialización</h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
                    <button onClick={onExit} className="px-6 py-2 bg-gray-200 dark:bg-gray-800 rounded-xl font-bold hover:bg-gray-300 transition">
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!record) return null;

    // Results View
    if (showResults) {
        const percentage = Math.round((record.score / record.total_questions) * 100);
        const passed = percentage >= 70; // PMP passing is roughly 61-70% depending on psychometrics, 70 is safe target.

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Resultados de Simulación</h1>
                    <button onClick={onExit} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>

                <div className="w-full mx-auto p-6 flex-1">
                    {/* Score Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 mb-8 text-center shadow-lg relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="mb-4 inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700">
                            {passed ? <CheckCircle className="w-16 h-16 text-green-500" /> : <AlertCircle className="w-16 h-16 text-red-500" />}
                        </div>
                        <h2 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{percentage}%</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {record.score} de {record.total_questions} respuestas correctas
                        </p>
                        <p className={`text-xl font-medium ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {passed ? '¡Aprobado! Estás listo para el siguiente nivel.' : 'Necesitas reforzar algunos conceptos.'}
                        </p>
                    </div>

                    {/* Question Review */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Revisión Detallada</h3>
                        {record.questions.map((q, idx) => {
                            const userAnswer = record.answers[q.id];
                            const isCorrect = userAnswer === q.correctAnswer;
                            
                            // Ensure unique key by combining id with index
                            const uniqueKey = `${q.id}-${idx}`;

                            return (
                                <div key={uniqueKey} className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'} shadow-sm`}>
                                    <div className="flex items-start gap-4 mb-4">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full font-bold text-sm">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">{q.text}</p>
                                            
                                            {/* Options */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                {q.options.map(opt => {
                                                    let stateClass = "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50";
                                                    const isSelected = userAnswer === opt.id;
                                                    const isTheCorrectOne = q.correctAnswer === opt.id;

                                                    if (isTheCorrectOne) stateClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                                                    else if (isSelected && !isCorrect) stateClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                                                    
                                                    return (
                                                        <div key={opt.id} className={`p-3 rounded-xl border ${stateClass} text-sm flex items-center justify-between h-full`}>
                                                            <span><span className="font-bold mr-2">{opt.id}.</span> {opt.text}</span>
                                                            {isTheCorrectOne && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                            {isSelected && !isCorrect && <AlertCircle className="w-4 h-4 text-red-500" />}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Explanation */}
                                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200">
                                                <span className="font-bold block mb-1">Explicación:</span>
                                                {q.explanation}
                                                <div className="mt-2 text-xs opacity-75 uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                                                    Dominio: {q.domain}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Exam View
    const currentQuestion = record.questions[record.current_index];

    // If waiting for generation but have no question to show
    if (!currentQuestion) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <p>Cargando la siguiente pregunta...</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col overflow-hidden text-white font-sans selection:bg-blue-500 selection:text-white">
            {/* Header / Status Bar */}
            <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Simulación PMP</span>
                        <span className="font-bold text-lg text-blue-400">{topic}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400">Progreso</span>
                        <span className="font-mono text-xl font-bold">
                            {record.current_index + 1} <span className="text-gray-500 text-sm">/ {record.total_questions}</span>
                        </span>
                    </div>
                    <button 
                        onClick={handleCancel}
                        className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors text-gray-400"
                        title="Cancelar y Eliminar"
                    >
                        <Trash2 className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={onExit}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Guardar y Salir"
                    >
                        <Save className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-800 shrink-0 z-20">
                <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((record.current_index + 1) / record.total_questions) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Main Stage */}
            <main className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="w-full mx-auto p-6 min-h-full flex flex-col justify-center">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            {/* Question Card */}
                            <div className="mb-12 text-center">
                                <h2 className="text-lg md:text-xl font-bold leading-tight md:leading-snug mb-8 text-shadow-sm">
                                    {currentQuestion.text}
                                </h2>
                            </div>

                            {/* Options Grid - Millionaire Style */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                {currentQuestion.options.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleAnswer(opt.id)}
                                        className="relative group group-hover:z-10 h-full"
                                    >
                                        <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                                        <div className="relative border-2 border-gray-600 bg-gray-800 hover:bg-blue-900/30 hover:border-blue-400 text-left p-6 rounded-2xl transition-all duration-200 flex items-center h-full">
                                            <span className="text-orange-400 font-bold text-xl mr-4">{opt.id}:</span>
                                            <span className="text-lg md:text-xl font-medium text-gray-100">{opt.text}</span>
                                        </div>
                                        
                                        {/* Decoration Lines (Millionaire style) */}
                                        <div className="absolute top-1/2 -left-3 w-3 h-[2px] bg-gray-600 group-hover:bg-blue-400 hidden md:block"></div>
                                        <div className="absolute top-1/2 -right-3 w-3 h-[2px] bg-gray-600 group-hover:bg-blue-400 hidden md:block"></div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 text-center text-gray-500 text-sm">
                Asistente de Preparación PMP • Modo Simulación Estricta
            </footer>
        </div>
    );
}
