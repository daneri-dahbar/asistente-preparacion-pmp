'use client';

import { useState } from 'react';
import { WORLDS, PHASE1_WORLDS, PHASE2_WORLDS, PHASE3_WORLDS, PHASE4_WORLDS, PHASE_ECO_WORLDS, PHASE5_WORLDS } from '@/lib/gameData';

interface LevelData {
    id: string;
    name: string;
    worldId: number;
    color: string;
    headerColor?: string;
    levelNumber?: number;
}

interface DashboardProps {
    userName: string;
    onStartChatMode: (mode: string) => void;
    stats: {
        sessions: number;
        accuracy: string;
        masteredAreas: number;
        streak: number;
        level?: number;
        title?: string;
    };
    selectedLevel?: LevelData | null;
    onSelectLevel?: (level: LevelData | null) => void;
    completedLevels?: string[]; // IDs of completed levels (e.g., "1-0", "1-1")
}

export default function Dashboard({ 
    userName, 
    onStartChatMode, 
    stats, 
    selectedLevel: controlledSelectedLevel, 
    onSelectLevel: controlledSetSelectedLevel,
    completedLevels = [] // Default to empty array
}: DashboardProps) {
    const [localSelectedLevel, setLocalSelectedLevel] = useState<LevelData | null>(null);
    const [activePhaseIndex, setActivePhaseIndex] = useState(0);
    const [viewMode, setViewMode] = useState<'guided' | 'free' | 'guided_unlocked'>('guided');
    const [expandedWorlds, setExpandedWorlds] = useState<Record<number, boolean>>({});
    const [levelFilter, setLevelFilter] = useState<'all' | 'completed' | 'todo'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const phases = [
        { title: 'Fase 1: El Estándar para la Dirección de Proyectos 📘', worlds: PHASE1_WORLDS, prevPhaseLastWorld: null },
        { title: 'Fase 2: Guía de los Fundamentos (PMBOK®) 📙', worlds: PHASE2_WORLDS, prevPhaseLastWorld: PHASE1_WORLDS[PHASE1_WORLDS.length - 1] },
        { title: 'Fase 3: Dominios de Desempeño 🚀', worlds: PHASE3_WORLDS, prevPhaseLastWorld: PHASE2_WORLDS[PHASE2_WORLDS.length - 1] },
        { title: 'Fase 4: Principios de Dirección 🌟', worlds: PHASE4_WORLDS, prevPhaseLastWorld: PHASE3_WORLDS[PHASE3_WORLDS.length - 1] },
        { title: 'Fase 5: Esquema de Contenido (ECO) 📋', worlds: PHASE_ECO_WORLDS, prevPhaseLastWorld: PHASE4_WORLDS[PHASE4_WORLDS.length - 1] },
        { title: 'Fase 6: Simulación de Exámenes 🎓', worlds: PHASE5_WORLDS, prevPhaseLastWorld: PHASE_ECO_WORLDS[PHASE_ECO_WORLDS.length - 1] }
    ];
    
    const selectedLevel = controlledSelectedLevel !== undefined ? controlledSelectedLevel : localSelectedLevel;
    const setSelectedLevel = controlledSetSelectedLevel || setLocalSelectedLevel;

    // Calculate Next Level
    const allLevelsFlat = phases.flatMap(phase => 
        phase.worlds.flatMap((world) => 
            world.levels.map((lvl, lIdx) => ({
                id: `${world.id}-${lIdx}`,
                name: lvl,
                worldName: world.name,
                worldId: world.id,
                phaseTitle: phase.title,
                color: world.headerColor,
                bg: world.color,
                isCompleted: completedLevels.includes(`${world.id}-${lIdx}`),
                levelNumber: lIdx + 1
            }))
        )
    );

    const nextLevelIndex = allLevelsFlat.findIndex(l => !l.isCompleted);
    const nextLevel = nextLevelIndex !== -1 ? allLevelsFlat[nextLevelIndex] : null;

    // Toggle World Expansion
    const toggleWorld = (worldId: number) => {
        setExpandedWorlds(prev => ({
            ...prev,
            [worldId]: !prev[worldId]
        }));
    };

    return (
        <div 
            className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-gray-900/50"
            style={{ scrollbarGutter: 'stable' }}
        >
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Hola, {userName} 👋
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Aquí tienes tu resumen de preparación PMP para hoy.
                        </p>
                    </div>
                    
                    {/* Mode Switcher */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setViewMode('guided')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                viewMode === 'guided'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            🗺️ Modo Guiado
                        </button>
                        <button
                            onClick={() => setViewMode('guided_unlocked')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                viewMode === 'guided_unlocked'
                                    ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            🔓 Modo Desbloqueado
                        </button>
                        <button
                            onClick={() => setViewMode('free')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                viewMode === 'free'
                                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            ♾️ Modo Libre
                        </button>
                    </div>
                </div>

                {viewMode === 'guided' || viewMode === 'guided_unlocked' ? (
                    <div className="space-y-12">
                        {/* CURRENT LEVEL HERO SECTION */}
                        {nextLevel && (
                    <div className="relative overflow-hidden rounded-3xl shadow-lg group cursor-pointer" onClick={() => setSelectedLevel({ id: nextLevel.id, name: nextLevel.name, worldId: nextLevel.worldId, color: nextLevel.color, levelNumber: nextLevel.levelNumber })}>
                        <div className={`absolute inset-0 bg-gradient-to-r ${nextLevel.color || 'from-blue-500 to-indigo-600'} opacity-90 transition-opacity group-hover:opacity-100`}></div>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                        
                        <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-3">
                                    <span>🚀 Tu Siguiente Paso</span>
                                </div>
                                <h2 className="text-3xl font-bold mb-2">{nextLevel.levelNumber}. {nextLevel.name}</h2>
                                <p className="text-white/80 font-medium flex items-center gap-2">
                                    <span>{nextLevel.phaseTitle}</span>
                                    <span>•</span>
                                    <span>{nextLevel.worldId}. {nextLevel.worldName}</span>
                                </p>
                            </div>
                            
                            <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transform transition-all group-hover:scale-105 flex items-center gap-2">
                                <span>Continuar Nivel</span>
                                <span>▶️</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* WORLD MAP SELECTION */}
                <div className="space-y-8">
                    {/* Controls Header */}
                    <div className="flex flex-col gap-6">
                        {/* Phase Navigation */}
                        <div className="w-full">
                            <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Tabs">
                                {phases.map((phase, idx) => {
                                     // Determine if phase is unlocked
                                    let isPhaseUnlocked = false;
                                    if (viewMode === 'guided_unlocked') {
                                        isPhaseUnlocked = true;
                                    } else if (idx === 0) {
                                        isPhaseUnlocked = true;
                                    } else {
                                        const prevPhaseLastWorld = phases[idx - 1].worlds[phases[idx - 1].worlds.length - 1];
                                        const prevPhaseLastLevelId = `${prevPhaseLastWorld.id}-${prevPhaseLastWorld.levels.length - 1}`;
                                        if (completedLevels.includes(prevPhaseLastLevelId)) {
                                            isPhaseUnlocked = true;
                                        }
                                    }
                                    // Also unlock if any level in this phase is completed (for edge cases)
                                    if (!isPhaseUnlocked) {
                                         const firstWorldFirstLevelId = `${phase.worlds[0].id}-0`;
                                         if (completedLevels.includes(firstWorldFirstLevelId) || completedLevels.some(l => phase.worlds.some(w => l.startsWith(`${w.id}-`)))) {
                                             isPhaseUnlocked = true;
                                         }
                                    }

                                    return (
                                    <button
                                        key={idx}
                                        onClick={() => setActivePhaseIndex(idx)}
                                        className={`p-4 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                                            !isPhaseUnlocked 
                                                ? (activePhaseIndex === idx 
                                                    ? 'opacity-100 grayscale bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-500 ring-2 ring-gray-400 dark:ring-gray-500 text-gray-800 dark:text-gray-200 shadow-md transform scale-[1.02]' 
                                                    : 'opacity-60 grayscale bg-gray-100 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600')
                                                : activePhaseIndex === idx
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-500'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="font-bold text-sm flex justify-between items-center">
                                            {phase.title}
                                            {!isPhaseUnlocked && <span className="text-xs">🔒</span>}
                                        </div>
                                    </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Search and Filters Toolbar - REMOVED */}
                    </div>

                    {/* Active Phase Worlds */}
                    <div className="flex flex-col gap-6">
                        {phases[activePhaseIndex].worlds.map((world, wIdx) => {
                            // Filter levels logic
                            const filteredLevels = world.levels.map((lvl, idx) => {
                                const levelId = `${world.id}-${idx}`;
                                const isCompleted = completedLevels.includes(levelId);
                                return { lvl, idx, isCompleted, levelId };
                            }).filter(item => {
                                // Search Filter
                                if (searchQuery) {
                                    if (!item.lvl.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                                }
                                // Status Filter
                                if (levelFilter === 'all') return true;
                                if (levelFilter === 'completed') return item.isCompleted;
                                if (levelFilter === 'todo') return !item.isCompleted;
                                return true;
                            });

                            // Determine expansion state
                            const hasMatches = searchQuery.length > 0 && filteredLevels.length > 0;
                            const isManuallyExpanded = expandedWorlds[world.id] ?? false;
                            const isExpanded = hasMatches || isManuallyExpanded;

                            // Determine if world is unlocked (first world of first phase or previous world completed)
                            let isWorldUnlocked = false;
                            if (viewMode === 'guided_unlocked') {
                                isWorldUnlocked = true;
                            } else if (activePhaseIndex === 0 && wIdx === 0) {
                                isWorldUnlocked = true;
                            } else {
                                let prevWorldLastLevelId = null;
                                if (wIdx > 0) {
                                    const prevWorld = phases[activePhaseIndex].worlds[wIdx - 1];
                                    prevWorldLastLevelId = `${prevWorld.id}-${prevWorld.levels.length - 1}`;
                                } else if (phases[activePhaseIndex].prevPhaseLastWorld) {
                                    const prevWorld = phases[activePhaseIndex].prevPhaseLastWorld!;
                                    prevWorldLastLevelId = `${prevWorld.id}-${prevWorld.levels.length - 1}`;
                                }
                                if (prevWorldLastLevelId && completedLevels.includes(prevWorldLastLevelId)) {
                                    isWorldUnlocked = true;
                                }
                            }
                            
                            // Also unlock if any level in this world is completed or unlocked (for edge cases)
                            if (!isWorldUnlocked) {
                                const firstLevelId = `${world.id}-0`;
                                if (completedLevels.includes(firstLevelId) || completedLevels.some(l => l.startsWith(`${world.id}-`))) {
                                    isWorldUnlocked = true;
                                }
                            }

                            return (
                                <div 
                                    key={world.id} 
                                    className={`w-full bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
                                        !isWorldUnlocked 
                                            ? (isExpanded 
                                                ? 'opacity-80 grayscale ring-1 ring-gray-400 dark:ring-gray-600 shadow-sm' 
                                                : 'opacity-50 grayscale shadow-sm hover:shadow-md')
                                            : (isExpanded 
                                                ? 'shadow-md ring-1 ring-blue-500/10' 
                                                : 'shadow-sm hover:shadow-md')
                                    }`}
                                >
                                    {/* World Header (Clickable) */}
                                    <button 
                                        onClick={() => toggleWorld(world.id)}
                                        className={`w-full text-left relative overflow-hidden group focus:outline-none transition-colors cursor-pointer
                                            ${isExpanded ? 'bg-gray-50/50 dark:bg-gray-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}
                                        `}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${world.headerColor || 'bg-gray-400'}`}></div>
                                        
                                        <div className="p-6 pl-8 flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400`}>
                                                        Etapa {world.id}
                                                    </span>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{world.name}</h3>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{world.desc}</p>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                {!isExpanded && (
                                                    <div className="hidden md:flex items-center gap-3">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                                {Math.round((world.levels.filter((_, i) => completedLevels.includes(`${world.id}-${i}`)).length / world.levels.length) * 100)}%
                                                            </span>
                                                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                                                                <div 
                                                                    className={`h-full rounded-full ${world.headerColor?.replace('bg-', 'bg-') || 'bg-blue-500'}`}
                                                                    style={{ width: `${(world.levels.filter((_, i) => completedLevels.includes(`${world.id}-${i}`)).length / world.levels.length) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400' : ''}`}>
                                                    ▼
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    {/* Expandable Content */}
                                    {isExpanded && (
                                        <div className="p-6 pt-0 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-900/30">
                                            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {filteredLevels.length === 0 ? (
                                                        <div className="text-center py-4 text-sm opacity-50 italic col-span-full">
                                                            No hay niveles {levelFilter === 'completed' ? 'completados' : 'pendientes'}
                                                        </div>
                                                    ) : (
                                                        filteredLevels.map(({ lvl, idx, isCompleted, levelId }) => {
                                                            let prevLevelId = null;
                                                            if (idx === 0) {
                                                                if (wIdx > 0) {
                                                                    const prevWorld = phases[activePhaseIndex].worlds[wIdx - 1];
                                                                    prevLevelId = `${prevWorld.id}-${prevWorld.levels.length - 1}`;
                                                                } else if (phases[activePhaseIndex].prevPhaseLastWorld) {
                                                                    const prevWorld = phases[activePhaseIndex].prevPhaseLastWorld!;
                                                                    prevLevelId = `${prevWorld.id}-${prevWorld.levels.length - 1}`;
                                                                }
                                                            } else {
                                                                prevLevelId = `${world.id}-${idx - 1}`;
                                                            }
                                                            
                                                            const isUnlocked = 
                                                                viewMode === 'guided_unlocked' ||
                                                                (world.id === 1 && idx === 0) || 
                                                                (prevLevelId && completedLevels.includes(prevLevelId)) ||
                                                                isCompleted;

                                                            return (
                                                                <button 
                                                                    key={idx}
                                                                    disabled={!isUnlocked}
                                                                    onClick={() => setSelectedLevel({ id: levelId, name: lvl, worldId: world.id, color: world.headerColor, levelNumber: idx + 1 })}
                                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium border shrink-0 text-left
                                                                        ${isUnlocked 
                                                                            ? 'bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border-transparent cursor-pointer hover:shadow-sm' 
                                                                            : 'bg-gray-200/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                                                                        }
                                                                    `}
                                                                >
                                                                    <div className={`
                                                                        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs
                                                                        ${isCompleted 
                                                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                                                            : isUnlocked
                                                                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                                                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                                        }
                                                                    `}>
                                                                        {isCompleted ? '✓' : idx + 1}
                                                                    </div>
                                                                    
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="truncate text-gray-900 dark:text-gray-200">{lvl}</div>
                                                                    </div>

                                                                    {isUnlocked && !isCompleted && (
                                                                        <div className="text-gray-400 text-xs">→</div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                                })}
                    </div>
                </div>
            </div>
            ) : null}



                {/* Modes Selection */}
                {viewMode === 'free' ? (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Entrenamiento Estándar 📚</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Standard Mode */}
                        <button 
                            onClick={() => onStartChatMode('standard')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-blue-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">📚</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    📚
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Modo Estándar</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    El asistente clásico. Preguntas y respuestas directas sobre cualquier tema del PMBOK. Ideal para resolver dudas rápidas.
                                </p>
                            </div>
                        </button>

                        {/* Simulation Mode */}
                        <button 
                            onClick={() => onStartChatMode('simulation')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-purple-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">🎭</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    🎭
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Simulación de Crisis</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Roleplay inmersivo. La IA actuará como un stakeholder difícil o un equipo en problemas. Tú eres el PM. ¡Resuelve la situación!
                                </p>
                            </div>
                        </button>

                        {/* Workshop Mode */}
                        <button 
                            onClick={() => onStartChatMode('workshop')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-green-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">🛠️</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    🛠️
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Taller de Entregables</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Creación guiada paso a paso. Redacta Project Charters, matrices de riesgo y planes de gestión con ayuda experta.
                                </p>
                            </div>
                        </button>

                        {/* Quiz Mode */}
                        <button 
                            onClick={() => onStartChatMode('quiz')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-orange-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">📝</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    📝
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Examen Rápido</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Ponte a prueba con preguntas tipo PMP. Recibe feedback inmediato y explicaciones detalladas de cada respuesta.
                                </p>
                            </div>
                        </button>

                        {/* Socratic Mode */}
                        <button 
                            onClick={() => onStartChatMode('socratic')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-pink-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">🧠</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    🧠
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tutor Socrático</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Profundiza en conceptos complejos. La IA no te dará la respuesta, sino que te guiará con preguntas para que tú la descubras.
                                </p>
                            </div>
                        </button>

                        {/* Debate Mode */}
                        <button 
                            onClick={() => onStartChatMode('debate')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-red-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">🥊</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    🥊
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Debate (Abogado del Diablo)</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Defiende tus ideas. La IA tomará una postura polémica o incorrecta y tú tendrás que convencerla usando los estándares del PMP.
                                </p>
                            </div>
                        </button>

                        {/* Case Study Mode */}
                        <button 
                            onClick={() => onStartChatMode('case_study')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-teal-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">💼</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    💼
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Caso de Estudio</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Analiza escenarios complejos. Actúa como consultor para diagnosticar problemas profundos en proyectos y proponer soluciones.
                                </p>
                            </div>
                        </button>

                        {/* ELI5 Mode */}
                        <button 
                            onClick={() => onStartChatMode('eli5')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-cyan-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">🍼</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    🍼
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Explícamelo como a un niño</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    ¿Conceptos muy densos? Este modo usa analogías divertidas y cotidianas para que entiendas la esencia sin tecnicismos.
                                </p>
                            </div>
                        </button>

                        {/* Math Mode */}
                        <button 
                            onClick={() => onStartChatMode('math')}
                            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-transparent hover:border-indigo-500 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-9xl">🧮</span>
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    🧮
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Entrenador de Fórmulas</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Domina el Valor Ganado (EVM) y la Ruta Crítica. Practica ejercicios numéricos y aprende a interpretar los resultados.
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
                ) : null}



                {/* Level Detail Modal */}
                {selectedLevel && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedLevel(null)}>
                        <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className={`p-8 ${selectedLevel.headerColor || 'bg-blue-600'} text-white relative`}>
                                <button 
                                    onClick={() => setSelectedLevel(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                                >
                                    <span className="text-xl">✕</span>
                                </button>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-3">
                                    <span>Nivel {selectedLevel.levelNumber}</span>
                                </div>
                                <h2 className="text-3xl font-bold mb-2 leading-tight">{selectedLevel.name}</h2>
                                <p className="text-white/80 font-medium">Selecciona una actividad para comenzar</p>
                            </div>
                            
                            {/* Content */}
                            <div className="p-8 overflow-y-auto bg-gray-50 dark:bg-gray-950/50">
                                <div className="flex flex-col gap-4">
                                    <button 
                                        onClick={() => {
                                            onStartChatMode(`level_lesson:${selectedLevel.name}`);
                                            setSelectedLevel(null);
                                        }}
                                        className="group p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-lg transition-all text-left"
                                    >
                                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform w-fit origin-left">📖</div>
                                        <div className="font-bold text-gray-900 dark:text-white mb-1">Lección Magistral</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Aprende los conceptos clave y fundamentos teóricos.</div>
                                    </button>

                                    <button 
                                        onClick={() => {
                                            onStartChatMode(`level_practice:${selectedLevel.name}`);
                                            setSelectedLevel(null);
                                        }}
                                        className="group p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-green-500 shadow-sm hover:shadow-lg transition-all text-left"
                                    >
                                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform w-fit origin-left">⚔️</div>
                                        <div className="font-bold text-gray-900 dark:text-white mb-1">Entrenamiento Práctico</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Aplica lo aprendido en escenarios simulados.</div>
                                    </button>

                                    <button 
                                        onClick={() => {
                                            onStartChatMode(`level_oracle:${selectedLevel.name}`);
                                            setSelectedLevel(null);
                                        }}
                                        className="group p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-purple-500 shadow-sm hover:shadow-lg transition-all text-left"
                                    >
                                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform w-fit origin-left">🔮</div>
                                        <div className="font-bold text-gray-900 dark:text-white mb-1">Oráculo</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Resuelve todas tus dudas específicas sobre este tema.</div>
                                    </button>

                                    <button 
                                        onClick={() => {
                                            onStartChatMode(`level_exam:${selectedLevel.name}`);
                                            setSelectedLevel(null);
                                        }}
                                        className="group p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-red-500 shadow-sm hover:shadow-lg transition-all text-left"
                                    >
                                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform w-fit origin-left">🏆</div>
                                        <div className="font-bold text-gray-900 dark:text-white mb-1">Prueba de Fuego</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Demuestra tu dominio para pasar al siguiente nivel.</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}