'use client';

import { useState } from 'react';

interface SidebarProps {
    user: any;
    chats: any[];
    currentChatId: string | null;
    onSelectChat: (chatId: string, mode?: string) => void;
    onCreateChat: () => void;
    onLogout: () => void;
    onGoHome: () => void;
    isLoadingChats?: boolean;
}

export default function Sidebar({
    user,
    chats,
    currentChatId,
    onSelectChat,
    onCreateChat,
    onLogout,
    onGoHome,
    isLoadingChats = false
}: SidebarProps) {
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

            {/* Chats List (Single Session View) */}
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
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Historial de Chats</h2>
                        <button 
                            onClick={onCreateChat}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors text-blue-500"
                            title="Nuevo Chat"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-1">
                        {isLoadingChats ? (
                            <div className="text-sm text-gray-400 italic p-2">Cargando chats...</div>
                        ) : chats.length === 0 ? (
                             <div className="text-sm text-gray-400 italic p-2">No hay chats recientes.</div>
                        ) : (
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
                                    <span className="truncate flex-1">{chat.title || 'Chat sin título'}</span>
                                </button>
                            ))
                        )}
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