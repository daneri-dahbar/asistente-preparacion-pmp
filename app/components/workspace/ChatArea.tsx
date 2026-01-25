'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface Message {
    id: string;
    role: string;
    content: string;
}

interface ChatAreaProps {
    messages: Message[];
    isLoading: boolean;
    input: string;
    mode: string;
    onInputChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onSendOption?: (option: string) => void;
    userInitials: string;
    onBack?: () => void;
}

export default function ChatArea({
    messages,
    isLoading,
    input,
    mode,
    onInputChange,
    onSubmit,
    onSendOption,
    userInitials,
    onBack
}: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mode-specific styles
    const isSimulation = mode === 'simulation';
    const isWorkshop = mode === 'workshop';
    const isQuiz = mode === 'quiz';
    const isSocratic = mode === 'socratic';
    const isDebate = mode === 'debate';
    const isCaseStudy = mode === 'case_study';
    const isELI5 = mode === 'eli5';
    const isMath = mode === 'math';

    // Level modes
    const isLevelLesson = mode.startsWith('level_lesson');
    const isLevelPractice = mode.startsWith('level_practice');
    const isLevelOracle = mode.startsWith('level_oracle');
    const isLevelExam = mode.startsWith('level_exam');

    const getThemeStyles = () => {
        if (isSimulation) return {
            avatar: 'bg-purple-600 text-white',
            bubble: 'bg-white dark:bg-gray-900 border-l-4 border-purple-500 text-gray-800 dark:text-gray-200',
            border: 'border-purple-200 dark:border-purple-900 focus-within:ring-4 focus-within:ring-purple-100 dark:focus-within:ring-purple-900/30',
            button: 'bg-purple-600 hover:bg-purple-700 text-white'
        };
        if (isWorkshop) return {
            avatar: 'bg-green-600 text-white',
            bubble: 'bg-green-50 dark:bg-green-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-green-200 dark:border-green-900 focus-within:ring-4 focus-within:ring-green-100 dark:focus-within:ring-green-900/30',
            button: 'bg-green-600 hover:bg-green-700 text-white'
        };
        if (isQuiz) return {
            avatar: 'bg-orange-600 text-white',
            bubble: 'bg-orange-50 dark:bg-orange-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-orange-200 dark:border-orange-900 focus-within:ring-4 focus-within:ring-orange-100 dark:focus-within:ring-orange-900/30',
            button: 'bg-orange-600 hover:bg-orange-700 text-white'
        };
        if (isSocratic) return {
            avatar: 'bg-pink-600 text-white',
            bubble: 'bg-pink-50 dark:bg-pink-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-pink-200 dark:border-pink-900 focus-within:ring-4 focus-within:ring-pink-100 dark:focus-within:ring-pink-900/30',
            button: 'bg-pink-600 hover:bg-pink-700 text-white'
        };
        if (isDebate) return {
            avatar: 'bg-red-600 text-white',
            bubble: 'bg-red-50 dark:bg-red-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-red-200 dark:border-red-900 focus-within:ring-4 focus-within:ring-red-100 dark:focus-within:ring-red-900/30',
            button: 'bg-red-600 hover:bg-red-700 text-white'
        };
        if (isCaseStudy) return {
            avatar: 'bg-teal-600 text-white',
            bubble: 'bg-teal-50 dark:bg-teal-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-teal-200 dark:border-teal-900 focus-within:ring-4 focus-within:ring-teal-100 dark:focus-within:ring-teal-900/30',
            button: 'bg-teal-600 hover:bg-teal-700 text-white'
        };
        if (isELI5) return {
            avatar: 'bg-cyan-500 text-white',
            bubble: 'bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-cyan-200 dark:border-cyan-900 focus-within:ring-4 focus-within:ring-cyan-100 dark:focus-within:ring-cyan-900/30',
            button: 'bg-cyan-500 hover:bg-cyan-600 text-white'
        };
        if (isMath) return {
            avatar: 'bg-indigo-600 text-white',
            bubble: 'bg-indigo-50 dark:bg-indigo-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-indigo-200 dark:border-indigo-900 focus-within:ring-4 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30',
            button: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        };
        
        // Level Specific Styles
        if (isLevelLesson) return {
            avatar: 'bg-blue-600 text-white',
            bubble: 'bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-blue-200 dark:border-blue-900 focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30',
            button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
        if (isLevelPractice) return {
            avatar: 'bg-emerald-600 text-white',
            bubble: 'bg-emerald-50 dark:bg-emerald-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-emerald-200 dark:border-emerald-900 focus-within:ring-4 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/30',
            button: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
        if (isLevelOracle) return {
            avatar: 'bg-violet-600 text-white',
            bubble: 'bg-violet-50 dark:bg-violet-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-violet-200 dark:border-violet-900 focus-within:ring-4 focus-within:ring-violet-100 dark:focus-within:ring-violet-900/30',
            button: 'bg-violet-600 hover:bg-violet-700 text-white'
        };
        if (isLevelExam) return {
            avatar: 'bg-rose-600 text-white',
            bubble: 'bg-rose-50 dark:bg-rose-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-rose-200 dark:border-rose-900 focus-within:ring-4 focus-within:ring-rose-100 dark:focus-within:ring-rose-900/30',
            button: 'bg-rose-600 hover:bg-rose-700 text-white'
        };

        return {
            avatar: 'bg-gray-600 text-white',
            bubble: 'bg-gray-50 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
            border: 'border-gray-200 dark:border-gray-800 focus-within:ring-4 focus-within:ring-gray-100 dark:focus-within:ring-gray-900/20',
            button: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
    };

    const getModeEmoji = () => {
        if (isSimulation) return '🎭'; // PM/Stakeholder
        if (isWorkshop) return '🛠️';
        if (isQuiz) return '📝';
        if (isSocratic) return '🧠';
        if (isDebate) return '🥊';
        if (isCaseStudy) return '💼';
        if (isELI5) return '🍼';
        if (isMath) return '🧮';
        
        if (isLevelLesson) return '📖';
        if (isLevelPractice) return '⚔️';
        if (isLevelOracle) return '🔮';
        if (isLevelExam) return '🏆';
        
        return '🤖'; // Standard AI
    };

    const styles = getThemeStyles();
    const modeEmoji = getModeEmoji();

    // Voice Recognition Logic
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleListening = useCallback((e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission
        
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Tu navegador no soporta el reconocimiento de voz. Por favor, usa Google Chrome o Microsoft Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        
        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                // Use functional update if onInputChange supported it, but here we rely on the prop.
                // Since we can't easily access the latest 'input' state inside this callback without it being a dependency (which would recreate the recognition object),
                // we'll check if the input prop is available in the scope.
                // However, to be safe with closures, we might want to just append. 
                // But wait, 'input' is in the dependency array of useCallback?
                // If I add 'input' to dependency, toggleListening changes every time user types.
                // That's fine.
                const newText = input ? `${input} ${transcript}` : transcript;
                onInputChange(newText);
            }
        };

        recognition.start();
    }, [isListening, input, onInputChange]);

    // Extract topic if level mode
    const levelTopic = mode.startsWith('level_') ? (mode.split(':')[1] || 'Nivel') : null;

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 relative">
            {/* Context Badge (Scope Lock) */}
            {levelTopic && (
                <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-2 flex items-center justify-between px-4 shadow-sm">
                    {/* Left: Back Button */}
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all group"
                        title="Volver al Menú del Nivel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                        <span className="text-xs font-medium">Volver</span>
                    </button>

                    {/* Center: Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">
                            🔒 {levelTopic}
                        </span>
                    </div>

                    {/* Right: Spacer to center the badge */}
                    <div className="w-16"></div>
                </div>
            )}

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-32 scroll-smooth ${isSimulation ? 'bg-gray-100 dark:bg-gray-900' : ''} ${levelTopic ? 'pt-16' : ''}`}>
                <div className="max-w-3xl mx-auto space-y-8">
                    {messages.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <p>Comienza la conversación...</p>
                        </div>
                    )}

                    {messages.map((m, idx) => {
                        // Parse options if present
                        const [contentBody, optionsPart] = m.content.split('---OPTIONS---');
                        let options: string[] = [];
                        if (optionsPart && m.role === 'assistant') {
                             try {
                                 options = JSON.parse(optionsPart.trim());
                             } catch (e) {
                                 // Fallback: split by newlines
                                 options = optionsPart.trim().split('\n')
                                    .map(s => s.trim().replace(/^-\s*/, '').replace(/^\d+\.\s*/, ''))
                                    .filter(s => s.length > 0);
                             }
                        }

                        return (
                        <div
                            key={m.id}
                            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* Avatar & Name */}
                            <div className={`flex items-center gap-2 mb-1 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                                    m.role === 'user' 
                                        ? 'bg-gray-700 text-white' 
                                        : styles.avatar
                                }`}>
                                    {m.role === 'user' ? userInitials : modeEmoji}
                                </div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {m.role === 'user' ? 'Tú' : isSimulation ? 'Stakeholder' : 'Asistente'}
                                </span>
                            </div>
                            
                            {/* Message Bubble */}
                            <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                                m.role === 'user'
                                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tr-sm'
                                    : `${styles.bubble} rounded-tl-sm`
                            }`}>
                                <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none break-words">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                        {contentBody.replace(/\n(?=\s*(\d+\.|-|\*)\s)/g, '\n\n')}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* Suggested Actions / Options */}
                            {options.length > 0 && idx === messages.length - 1 && (
                                <div className="flex flex-wrap gap-2 mt-3 ml-2 max-w-[90%] sm:max-w-[85%] animate-in fade-in slide-in-from-top-2 duration-300">
                                    {options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onSendOption?.(opt)}
                                            disabled={isLoading}
                                            className={`text-xs sm:text-sm px-4 py-2 rounded-xl border transition-all duration-200 shadow-sm
                                                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer'}
                                                bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200
                                            `}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                    })}
                    
                    {isLoading && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse ml-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                            <span>Escribiendo...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-950 dark:via-gray-950 dark:to-transparent z-10">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={onSubmit} className="relative group">
                        <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-2xl shadow-xl -z-10 opacity-95"></div>
                        <div className={`flex items-end gap-3 p-3 rounded-2xl border transition-all duration-300 ${styles.border}`}>
                            <textarea
                                className="w-full bg-transparent text-base text-gray-800 dark:text-white placeholder-gray-400 outline-none py-3 px-2 resize-none max-h-32 min-h-[50px]"
                                value={input}
                                placeholder={isSimulation ? "Responde al stakeholder..." : "Escribe tu pregunta..."}
                                onChange={(e) => onInputChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSubmit(e);
                                    }
                                }}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`p-3 rounded-xl transition-all duration-200 mr-2 ${
                                    isListening 
                                        ? 'bg-red-500 text-white animate-pulse' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                                title="Dictar por voz"
                            >
                                {isListening ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                    </svg>
                                )}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className={`p-3 rounded-xl transition-all duration-200 shadow-md ${styles.button} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <div className="mt-2 flex justify-between px-2 text-[10px] text-gray-400">
                            <span>Markdown soportado</span>
                            <span>Enter para enviar, Shift+Enter para salto de línea</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}