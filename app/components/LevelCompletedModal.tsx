'use client';

import { useEffect, useState } from 'react';

interface LevelCompletedModalProps {
    levelName: string;
    onClose: () => void;
    onContinue: () => void;
}

export default function LevelCompletedModal({ levelName, onClose, onContinue }: LevelCompletedModalProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [confetti, setConfetti] = useState<any[]>([]);

    useEffect(() => {
        // Generate confetti particles
        const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
        const particles = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            animationDuration: 2 + Math.random() * 3,
            animationDelay: Math.random() * 2,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            size: 5 + Math.random() * 10,
        }));
        setConfetti(particles);
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Confetti Styles */}
            <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
                .confetti-piece {
                    position: absolute;
                    top: -20px;
                    border-radius: 4px;
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>

            {/* Confetti Container */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confetti.map((p) => (
                    <div
                        key={p.id}
                        className="confetti-piece"
                        style={{
                            left: `${p.left}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.backgroundColor,
                            animationDuration: `${p.animationDuration}s`,
                            animationDelay: `${p.animationDelay}s`,
                        }}
                    />
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl transform transition-all animate-scale-in border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl -z-10 animate-pulse"></div>

                <div className="mb-6 relative">
                    <div className="text-8xl animate-bounce mb-2">🏆</div>
                    <div className="text-6xl absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping opacity-20">⭐</div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    ¡FELICIDADES!
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Has dominado el nivel
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-8">
                    <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                        {levelName}
                    </h3>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onContinue}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                    >
                        Continuar al Mapa
                    </button>
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
