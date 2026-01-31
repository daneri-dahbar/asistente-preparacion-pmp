'use client';

import { useState } from 'react';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userInitials: string;
}

export default function OnboardingModal({ isOpen, onClose, userInitials }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    if (!isOpen) return null;

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header with Progress */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">✨</span>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Bienvenido a PMP Master
                            </h2>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex space-x-1 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        {[...Array(totalSteps)].map((_, i) => (
                            <div 
                                key={i}
                                className={`h-full flex-1 transition-all duration-300 ${
                                    i + 1 <= step ? 'bg-blue-500' : 'bg-transparent'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 flex flex-col items-center text-center min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-xl">
                                🎓
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Tu Viaje hacia la Certificación
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Hola, <span className="font-semibold text-blue-600 dark:text-blue-400">{userInitials}</span>. 
                                Has dado el primer paso para convertirte en PMP. 
                                Esta aplicación gamificada te guiará a través de todo el contenido del PMBOK 7ma Edición.
                            </p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-xl">
                                🗺️
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Explora el Mapa
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                El contenido está organizado en <span className="font-bold text-indigo-600 dark:text-indigo-400">Mundos y Niveles</span>.
                                <br/><br/>
                                Cada <strong>Fase</strong> cubre una parte del estándar (Principios, Dominios, etc.).
                                Completa niveles para desbloquear nuevos desafíos.
                            </p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-xl">
                                🤖
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Aprende con IA
                            </h3>
                            <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                <p>En cada nivel, tendrás un mentor de IA personal.</p>
                                <br/>
                                <p>Puedes elegir entre:</p>
                                <ul className="mt-2 text-sm text-left inline-block space-y-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <li>📚 <strong>Lección:</strong> Explicación teórica.</li>
                                    <li>⚔️ <strong>Práctica:</strong> Resuelve escenarios.</li>
                                    <li>🔮 <strong>Oráculo:</strong> Pregunta lo que quieras.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-xl">
                                🚀
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                ¿Listo para comenzar?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Tu progreso se guarda automáticamente.
                                Mantén tu racha diaria y domina todos los dominios para estar listo para el examen real.
                                <br/><br/>
                                <strong>¡Buena suerte!</strong>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            step === 1 
                                ? 'opacity-0 pointer-events-none' 
                                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                    >
                        Atrás
                    </button>
                    
                    <div className="flex space-x-2">
                        {step === totalSteps ? (
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all transform hover:scale-105 active:scale-95"
                            >
                                ¡Vamos!
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95"
                            >
                                Siguiente
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}