'use client';

import { useState } from 'react';

interface SidebarProps {
    user: any;
    sessions: any[];
    chats: { [key: string]: any[] };
    currentSessionId: string | null;
    currentChatId: string | null;
    onSelectSession: (sessionId: string) => void;
    onSelectChat: (chatId: string, sessionId: string, mode?: string) => void;
    onCreateSession: (name: string) => void;
    onCreateChat: (sessionId: string) => void;
    onLogout: () => void;
    onGoHome: () => void;
    onDeleteSession: (sessionId: string) => void;
    onRenameSession: (sessionId: string, newName: string) => void;
}

export default function Sidebar({
    user,
    sessions,
    chats,
    currentSessionId,
    currentChatId,
    onSelectSession,
    onSelectChat,
    onCreateSession,
    onCreateChat,
    onLogout,
    onGoHome,
    onDeleteSession,
    onRenameSession
}: SidebarProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');

    const handleSubmitSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSessionName.trim()) {
            onCreateSession(newSessionName);
            setNewSessionName('');
            setIsCreating(false);
        }
    };

    const handleRenameSubmit = (e: React.FormEvent, sessionId: string) => {
        e.preventDefault();
        if (tempName.trim()) {
            onRenameSession(sessionId, tempName);
            setEditingSessionId(null);
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return date.toLocaleDateString();
    };

    return (
        <aside className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full transition-all duration-300">
            {/* Header / User Profile */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                    {user?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Usuario'}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Preparación PMP</p>
                </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <button 
                    onClick={onGoHome}
                    className="w-full flex items-center gap-3 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mb-4"
                >
                    <span className="text-xl">🏠</span>
                    <span className="font-medium">Inicio</span>
                </button>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sesiones de Estudio</h2>
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500"
                            title="Nueva Sesión"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    {isCreating && (
                        <form onSubmit={handleSubmitSession} className="mb-4 animate-fade-in-up">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Nombre de la sesión..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                onBlur={() => !newSessionName && setIsCreating(false)}
                            />
                        </form>
                    )}

                    <div className="space-y-3">
                        {sessions.map(session => (
                            <div key={session.id} className="group">
                                {editingSessionId === session.id ? (
                                    <form 
                                        onSubmit={(e) => handleRenameSubmit(e, session.id)} 
                                        className="mb-2 px-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full px-2 py-1 text-sm rounded border border-blue-400 focus:outline-none dark:bg-gray-800"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={() => setEditingSessionId(null)}
                                            onKeyDown={(e) => {
                                                if(e.key === 'Escape') setEditingSessionId(null);
                                            }}
                                        />
                                    </form>
                                ) : (
                                    <div
                                        onClick={() => onSelectSession(session.id)}
                                        className={`w-full flex flex-col p-2 rounded-lg text-sm transition-colors cursor-pointer ${
                                            currentSessionId === session.id 
                                                ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400' 
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="truncate font-medium">{session.name}</span>
                                            
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Edit Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingSessionId(session.id);
                                                        setTempName(session.name);
                                                    }}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-blue-500"
                                                    title="Renombrar"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteSession(session.id);
                                                    }}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>

                                                {/* Add Chat Button */}
                                                {currentSessionId === session.id && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCreateChat(session.id);
                                                        }}
                                                        className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-blue-500"
                                                        title="Nuevo Chat"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                                            {formatRelativeTime(session.created)}
                                        </span>
                                    </div>
                                )}

                                {/* Chats List (only if session is active) */}
                                {currentSessionId === session.id && (
                                    <div className="ml-2 pl-2 border-l border-gray-200 dark:border-gray-800 mt-1 space-y-0.5">
                                        {(chats[session.id] || []).map(chat => (
                                            <button
                                                key={chat.id}
                                                onClick={() => onSelectChat(chat.id, session.id, chat.mode)}
                                                className={`w-full text-left px-2 py-1.5 rounded-md text-xs truncate transition-colors flex items-center gap-2 ${
                                                    currentChatId === chat.id
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                        : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    chat.mode === 'simulation' ? 'bg-purple-400' :
                                                    chat.mode === 'workshop' ? 'bg-green-400' :
                                                    chat.mode === 'socratic' ? 'bg-yellow-400' :
                                                    'bg-blue-400'
                                                }`}></span>
                                                <span className="truncate flex-1">{chat.title || 'Chat sin título'}</span>
                                            </button>
                                        ))}
                                        {(chats[session.id] || []).length === 0 && (
                                            <p className="text-[10px] text-gray-400 px-2 py-1 italic">Sin chats aún</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}