'use client';

import { useState, useMemo } from 'react';
import pb from '@/lib/pocketbase';
import { WORLDS } from '@/lib/gameData';
import { ChevronDown, ChevronRight, Clock, Folder, MessageSquare } from 'lucide-react';

interface SidebarProps {
    user: any;
    chats: any[];
    currentChatId: string | null;
    onSelectChat: (chatId: string, mode?: string) => void;
    onCreateChat: () => void;
    onLogout: () => void;
    onGoHome: () => void;
    isLoadingChats?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({
    user,
    chats,
    currentChatId,
    onSelectChat,
    onCreateChat,
    onLogout,
    onGoHome,
    isLoadingChats = false,
    isOpen = false,
    onClose
}: SidebarProps) {
    const [viewMode, setViewMode] = useState<'recent' | 'structure'>('recent');
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
    const [expandedWorlds, setExpandedWorlds] = useState<Record<string, boolean>>({});

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
    };

    const toggleWorld = (worldId: string) => {
        setExpandedWorlds(prev => ({ ...prev, [worldId]: !prev[worldId] }));
    };

    const formatRelativeTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
        if (diffDays === 0) return `Hoy, ${timeStr}`;
        if (diffDays === 1) return `Ayer, ${timeStr}`;
        if (diffDays < 7) return `Hace ${diffDays} días, ${timeStr}`;
        return `${date.toLocaleDateString()}, ${timeStr}`;
    };

    // Group chats by structure
    const structuredChats = useMemo(() => {
        const groups = {
            phases: {} as Record<string, { title: string, id: string, worlds: Record<string, { title: string, id: number, chats: any[] }> }>,
            simulations: [] as any[],
            training: [] as any[],
            general: [] as any[]
        };

        chats.forEach(chat => {
            const mode = chat.mode || 'standard';
            
            if (mode === 'standard') {
                groups.general.push(chat);
            } else if (mode === 'simulation' || mode.startsWith('resume_simulation')) {
                groups.simulations.push(chat);
            } else if (['workshop', 'socratic', 'quiz', 'debate', 'case_study', 'eli5', 'math'].includes(mode)) {
                groups.training.push(chat);
            } else if (mode.startsWith('level_')) {
                // Format: level_type:Topic Name
                const parts = mode.split(':');
                if (parts.length > 1) {
                    const topic = parts[1];
                    // Find world for this topic
                    const world = WORLDS.find(w => w.levels.includes(topic));
                    if (world) {
                        const worldKey = `world_${world.id}`;
                        if (!groups.phases[worldKey]) {
                            groups.phases[worldKey] = {
                                title: world.name,
                                id: worldKey,
                                worlds: {
                                    [worldKey]: { title: world.name, id: world.id, chats: [] }
                                }
                            };
                        }
                        groups.phases[worldKey].worlds[worldKey].chats.push(chat);
                    } else {
                        groups.general.push(chat);
                    }
                } else {
                    groups.general.push(chat);
                }
            } else {
                groups.general.push(chat);
            }
        });

        return groups;
    }, [chats]);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}
            <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full transition-transform duration-300 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } md:relative md:translate-x-0`}>
            {/* Header / User Profile */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden relative">
                    {user?.avatar ? (
                        <img 
                            src={pb.files.getUrl(user, user.avatar)} 
                            alt={user.name || 'User'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.classList.remove('overflow-hidden');
                                const fallback = document.getElementById('user-initial-fallback');
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                    ) : (
                        <span>{user?.name?.[0] || 'U'}</span>
                    )}
                    {/* Fallback for image error - hidden by default if image exists */}
                    {user?.avatar && (
                        <div id="user-initial-fallback" className="absolute inset-0 flex items-center justify-center bg-blue-600 hidden">
                            {user?.name?.[0] || 'U'}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Usuario'}</h3>
                    <button 
                        onClick={onLogout}
                        className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 truncate transition-colors flex items-center gap-1"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Chats List (Single Session View) */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                <button 
                    onClick={onGoHome}
                    className="w-full flex items-center gap-3 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mb-4"
                >
                    <span className="text-xl">🏠</span>
                    <span className="font-medium">Inicio</span>
                </button>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1 text-xs font-medium">
                        <button 
                            onClick={() => setViewMode('recent')}
                            className={`px-3 py-1 rounded-md transition-all ${
                                viewMode === 'recent' 
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Recientes</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('structure')}
                            className={`px-3 py-1 rounded-md transition-all ${
                                viewMode === 'structure' 
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> Todos</span>
                        </button>
                    </div>


                </div>

                <div className="flex-1 space-y-1">
                    {isLoadingChats ? (
                        <div className="text-sm text-gray-400 italic p-2">Cargando chats...</div>
                    ) : chats.length === 0 ? (
                            <div className="text-sm text-gray-400 italic p-2">No hay chats.</div>
                    ) : viewMode === 'recent' ? (
                        chats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => onSelectChat(chat.id, chat.mode)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors flex items-center gap-2 group relative ${
                                        currentChatId === chat.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        chat.mode === 'simulation' ? 'bg-purple-400' :
                                        chat.mode === 'workshop' ? 'bg-green-400' :
                                        chat.mode === 'socratic' ? 'bg-yellow-400' :
                                        'bg-blue-400'
                                    }`}></span>
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate font-medium">{chat.title || 'Chat sin título'}</div>
                                        <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {formatRelativeTime(chat.last_active || chat.updated || chat.created)}
                                        </div>
                                    </div>
                                </button>
                            ))
                    ) : (
                        <div className="space-y-4">
                            {/* Structured View */}
                            
                            {/* Phases/Worlds */}
                            {Object.values(structuredChats.phases).map((phase: any) => (
                                <div key={phase.id} className="space-y-1">
                                    <button 
                                        onClick={() => togglePhase(phase.id)}
                                        className="w-full flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                    >
                                        {expandedPhases[phase.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        {phase.title}
                                    </button>
                                    
                                    {expandedPhases[phase.id] && (
                                        <div className="pl-2 space-y-1 mt-1 border-l border-gray-200 dark:border-gray-800 ml-1.5">
                                            {Object.values(phase.worlds).map((world: any) => (
                                                <div key={world.id}>
                                                    {/* Chats directly in world */}
                                                    {world.chats.map((chat: any) => (
                                                        <button
                                                            key={chat.id}
                                                            onClick={() => onSelectChat(chat.id, chat.mode)}
                                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors flex items-center gap-2 ${
                                                                currentChatId === chat.id
                                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                            }`}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-0.5"></span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="truncate">{chat.title || 'Chat'}</div>
                                                                <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                                                    <Clock className="w-2.5 h-2.5" />
                                                                    {formatRelativeTime(chat.last_active || chat.updated || chat.created)}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Simulations */}
                            {structuredChats.simulations.length > 0 && (
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-purple-500 uppercase tracking-wider px-2">Simulaciones</h3>
                                    {structuredChats.simulations.map(chat => (
                                        <button
                                            key={chat.id}
                                            onClick={() => onSelectChat(chat.id, chat.mode)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors flex items-center gap-2 ${
                                                currentChatId === chat.id
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-0.5"></span>
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate">{chat.title || 'Simulación'}</div>
                                                <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {formatRelativeTime(chat.last_active || chat.updated || chat.created)}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Training Modes */}
                            {structuredChats.training.length > 0 && (
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider px-2">Entrenamiento</h3>
                                    {structuredChats.training.map(chat => (
                                        <button
                                            key={chat.id}
                                            onClick={() => onSelectChat(chat.id, chat.mode)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors flex items-center gap-2 ${
                                                currentChatId === chat.id
                                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-0.5"></span>
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate">{chat.title || 'Entrenamiento'}</div>
                                                <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {formatRelativeTime(chat.last_active || chat.updated || chat.created)}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* General */}
                            {structuredChats.general.length > 0 && (
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">General</h3>
                                    {structuredChats.general.map(chat => (
                                        <button
                                            key={chat.id}
                                            onClick={() => onSelectChat(chat.id, chat.mode)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors flex items-center gap-2 ${
                                                currentChatId === chat.id
                                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate">{chat.title || 'Chat'}</div>
                                                <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {formatRelativeTime(chat.last_active || chat.updated || chat.created)}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </aside>
        </>
    );
}