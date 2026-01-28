'use client';

import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';
import { useRouter } from 'next/navigation';
import { WORLDS } from '@/lib/gameData';
import { syncLocalProgress, saveCompletedLevel, updateUserStats, getUserProgress } from '@/lib/userProgress';

// Components
import Sidebar from '@/app/components/workspace/Sidebar';
import Dashboard from '@/app/components/workspace/Dashboard';
import ChatArea from '@/app/components/workspace/ChatArea';
import LevelCompletedModal from '@/app/components/LevelCompletedModal';
import OnboardingModal from '@/app/components/OnboardingModal';

export default function WelcomePage() {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null);
    const [input, setInput] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [messages, setMessages] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sessions, setSessions] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [chats, setChats] = useState<{[key: string]: any[]}>({}); // Map session_id -> chats[]
    
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<string>('standard'); // standard, simulation, workshop, socratic
    const [isChatViewOpen, setIsChatViewOpen] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    
    // Dashboard State (Lifted up to preserve modal state)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [dashboardLevel, setDashboardLevel] = useState<any>(null);
    const [completedLevels, setCompletedLevels] = useState<string[]>([]);
    const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);
    const [justCompletedLevel, setJustCompletedLevel] = useState('');
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Stats State
    const [stats, setStats] = useState({
        sessions: 0,
        accuracy: 'N/A',
        masteredAreas: 0,
        streak: 0,
        level: 1,
        title: 'Novato'
    });

    // Calculate local stats (synchronous)
    useEffect(() => {
        // 1. Total Sessions
        const totalSessions = sessions.length;

        // 2. Streak Calculation
        let currentStreak = 0;
        if (sessions.length > 0) {
            // Sort sessions by date descending
            const sortedSessions = [...sessions].sort((a, b) => 
                new Date(b.created).getTime() - new Date(a.created).getTime()
            );

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let lastDate = new Date(sortedSessions[0].created);
            lastDate.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays <= 1) {
                currentStreak = 1;
                for (let i = 0; i < sortedSessions.length - 1; i++) {
                    const d1 = new Date(sortedSessions[i].created);
                    const d2 = new Date(sortedSessions[i+1].created);
                    d1.setHours(0,0,0,0);
                    d2.setHours(0,0,0,0);
                    
                    const oneDay = 1000 * 60 * 60 * 24;
                    const diff = (d1.getTime() - d2.getTime()) / oneDay;

                    if (diff === 1) {
                        currentStreak++;
                    } else if (diff > 1) {
                        break;
                    }
                }
            }
        }

        // 3. Title Calculation
        let level = 1;
        let title = 'Novato';

        if (totalSessions >= 50) {
            level = 6;
            title = 'Leyenda PMP';
        } else if (totalSessions >= 25) {
            level = 5;
            title = 'Director de Programa';
        } else if (totalSessions >= 15) {
            level = 4;
            title = 'Gerente de Proyecto';
        } else if (totalSessions >= 10) {
            level = 3;
            title = 'Coordinador';
        } else if (totalSessions >= 5) {
            level = 2;
            title = 'Asistente';
        }

        // 4. Calculate Mastered Areas (Worlds fully completed)
        const masteredAreasCount = WORLDS.filter(w => {
            if (w.levels.length === 0) return false;
            return w.levels.every((_, idx) => completedLevels.includes(`${w.id}-${idx}`));
        }).length;

        setStats(prev => ({
            ...prev,
            sessions: totalSessions,
            masteredAreas: masteredAreasCount,
            streak: currentStreak,
            level,
            title
        }));
    }, [sessions, completedLevels]);

    // 5. Accuracy from DB (asynchronous)
    useEffect(() => {
        const fetchUserStats = async () => {
            if (user) {
                try {
                    const progress = await getUserProgress(user.id);
                    if (progress?.stats?.accuracy) {
                        setStats(prev => ({ ...prev, accuracy: progress.stats!.accuracy as string }));
                    }
                } catch (e) {
                    console.error("Error fetching stats:", e);
                }
            }
        };
        fetchUserStats();
    }, [user]);

    // Auth Check
    useEffect(() => {
        if (!pb.authStore.isValid) {
            router.push('/');
        } else {
            setUser(pb.authStore.model);
            if (pb.authStore.model) {
                loadSessions(pb.authStore.model.id);
                
                // Check for onboarding
                const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${pb.authStore.model.id}`);
                if (!hasSeenOnboarding) {
                    setShowOnboarding(true);
                }
            }
        }
    }, [router]);

    // Load Chats when Session Changes
    useEffect(() => {
        if (currentSessionId) {
            loadChats(currentSessionId);
        }
    }, [currentSessionId]);

    const loadSessions = async (userId: string) => {
        if (!userId) return;
        try {
            // Attempt to load with explicit filter
            const records = await pb.collection('study_sessions').getFullList({
                sort: '-created',
                filter: `user="${userId}"`,
            });
            setSessions(records);
            
            // Auto-select most recent session if exists
            if (records.length > 0 && !currentSessionId) {
                // Optional: Auto-select functionality can be enabled here
                // setCurrentSessionId(records[0].id);
            }
        } catch (error: any) {
            // Ignore auto-cancellation errors
            if (error.isAbort || error.status === 0) return;

            // Suppress 400 error logging if we are going to try fallback
            if (error.status !== 400 && error.status !== 404) {
                console.error("Error loading sessions:", error);
            }
            
            // Fallback: If 400 error (likely 'user' field missing or bad filter), try loading without filter
            // IF the collection exists. This relies on API rules for security.
            if (error.status === 400) {
                try {
                    console.warn("Attempting fallback load without user filter (relying on API rules)...");
                    const records = await pb.collection('study_sessions').getFullList({
                        sort: '-created',
                    });
                    
                    // Client-side filter to be safe, although API rules should handle it
                    const userSessions = records.filter((s: any) => s.user === userId);
                    setSessions(userSessions);
                } catch (fallbackError: any) {
                    if (fallbackError.isAbort || fallbackError.status === 0) return;
                    console.warn("Fallback load failed (collection might be missing or invalid):", fallbackError);
                    // If it still fails, it might be that the collection doesn't exist
                    setSessions([]);
                }
            } else {
                setSessions([]);
            }
        }
    };

    // Load Completed Levels from LocalStorage on mount AND Sync with DB
    useEffect(() => {
        const syncProgress = async () => {
            if (user) {
                // 1. Load from LocalStorage
                let localLevels: string[] = [];
                const savedLevels = localStorage.getItem(`completed_levels_${user.id}`);
                if (savedLevels) {
                    try {
                        localLevels = JSON.parse(savedLevels);
                        setCompletedLevels(localLevels);
                    } catch (e) {
                        console.error("Error parsing completed levels:", e);
                    }
                }

                // 2. Sync with PocketBase
                try {
                    const syncedLevels = await syncLocalProgress(user.id, localLevels);
                    if (JSON.stringify(syncedLevels) !== JSON.stringify(localLevels)) {
                        setCompletedLevels(syncedLevels);
                        localStorage.setItem(`completed_levels_${user.id}`, JSON.stringify(syncedLevels));
                    }
                } catch (error) {
                    console.error("Error syncing progress:", error);
                }
            }
        };

        syncProgress();
    }, [user]);

    const loadChats = async (sessionId: string) => {
        try {
            const records = await pb.collection('chats').getFullList({
                sort: '-created',
                filter: `study_session="${sessionId}"`,
            });
            setChats(prev => ({ ...prev, [sessionId]: records }));
        } catch (error: any) {
            // Check for auto-cancellation
            if (error.isAbort || error.status === 0) return;

            // Only log errors that are NOT 400 (Bad Request), as we have a fallback for those
            if (error.status !== 400) {
                console.error("Error loading chats for session:", sessionId, error);
            }
            
            // Fallback for 400 error (likely filter issue): Load all user chats and filter client-side
            if (error.status === 400) {
                try {
                    // console.warn("Attempting fallback load of chats without filter...");
                    const allRecords = await pb.collection('chats').getFullList({
                        sort: '-created',
                    });
                    // Client-side filter
                    const sessionRecords = allRecords.filter((r: any) => r.study_session === sessionId);
                    setChats(prev => ({ ...prev, [sessionId]: sessionRecords }));
                } catch (fallbackError: any) {
                    if (fallbackError.isAbort || fallbackError.status === 0) return;
                    if (fallbackError.status !== 400) {
                        console.error("Fallback chat load failed:", fallbackError);
                    }
                }
            }
        }
    };

    const loadMessages = async (chatId: string) => {
        if (!chatId) return [];
        
        try {
            const records = await pb.collection('messages').getFullList({
                sort: 'created',
                filter: `chat="${chatId}"`,
            });
            const formattedMessages = records.map(r => ({
                id: r.id,
                role: r.role,
                content: r.content
            }));
            setMessages(formattedMessages);
            return formattedMessages;
        } catch (error: any) {
            if (error.isAbort || error.status === 0) return [];

            // Ignore 404/400 errors which might happen if chat is deleted or invalid
            if (error.status !== 404 && error.status !== 400) {
                console.error("Error loading messages:", error);
            }
            setMessages([]);
            return [];
        }
    };

    const handleCreateSession = async (name: string) => {
        if (!name.trim() || !user) return;
        
        try {
            const newSession = await pb.collection('study_sessions').create({
                name: name,
                user: user.id
            });
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
            setChats(prev => ({ ...prev, [newSession.id]: [] }));
            // Reset views
            setCurrentChatId(null);
            setMessages([]);
            setIsChatViewOpen(false);
            setDashboardLevel(null);
        } catch (error) {
            console.error("Error creating session:", error);
            alert("Error creando la sesión.");
        }
    };

    const handleNewChat = (sessionId: string) => {
        if (!sessionId) return;
        setCurrentChatId(null);
        setCurrentSessionId(sessionId);
        setMessages([]);
        setChatMode('standard'); 
        setIsChatViewOpen(true);
    };

    // Helper to generate start message for a given mode
    const getStartMessageForMode = (mode: string) => {
        if (mode === 'simulation') return 'START_SIMULATION';
        if (mode === 'workshop') return 'START_WORKSHOP';
        if (mode === 'quiz') return 'START_QUIZ';
        if (mode === 'socratic') return 'START_SOCRATIC';
        if (mode === 'debate') return 'START_DEBATE';
        if (mode === 'case_study') return 'START_CASE_STUDY';
        if (mode === 'eli5') return 'START_ELI5';
        if (mode === 'math') return 'START_MATH';
        if (mode === 'boss_scope') return 'START_BOSS_SCOPE';
        if (mode === 'boss_risk') return 'START_BOSS_RISK';
        if (mode === 'boss_stakeholder') return 'START_BOSS_STAKEHOLDER';
        if (mode === 'boss_schedule') return 'START_BOSS_SCHEDULE';
        if (mode === 'boss_agile') return 'START_BOSS_AGILE';
        if (mode === 'boss_quality') return 'START_BOSS_QUALITY';
        if (mode.startsWith('level_practice')) return `START_LEVEL_PRACTICE: ${mode.split(':')[1] || 'General'}`;
        if (mode.startsWith('level_lesson')) return `START_LEVEL_LESSON: ${mode.split(':')[1] || 'General'}`;
        if (mode.startsWith('level_oracle')) return `START_LEVEL_ORACLE: ${mode.split(':')[1] || 'General'}`;
        if (mode.startsWith('level_exam')) return `START_LEVEL_EXAM: ${mode.split(':')[1] || 'General'}`;
        return '';
    };

    const handleSelectChat = async (chatId: string, sessionId: string, mode?: string) => {
        setCurrentChatId(chatId);
        setCurrentSessionId(sessionId);
        const selectedMode = mode || 'standard';
        setChatMode(selectedMode);
        
        const messages = await loadMessages(chatId);
        setIsChatViewOpen(true);

        // Auto-recover empty chats for special modes
        if (messages.length === 0 && selectedMode !== 'standard' && !isLoading) {
            console.log("Empty chat detected for special mode, attempting to restart...");
            const startMessage = getStartMessageForMode(selectedMode);
            if (startMessage) {
                // Call AI to start conversation without creating new chat
                startAIConversation(chatId, startMessage, selectedMode);
            }
        }
    };

    // Extracted AI conversation starter
    const startAIConversation = async (chatId: string, startMessage: string, mode: string) => {
        setIsLoading(true);
        try {
             // Don't save start command to DB/UI, just use it to trigger the AI
             const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: startMessage }],
                    mode: mode
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessageContent = '';
            const assistantMessageId = (Date.now() + 1).toString();
            
            setMessages([{ id: assistantMessageId, role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                assistantMessageContent += chunk;
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[0] = { 
                        id: assistantMessageId, 
                        role: 'assistant', 
                        content: assistantMessageContent 
                    };
                    return newMessages;
                });
            }

            // Save assistant message to PocketBase
            await pb.collection('messages').create({
                content: assistantMessageContent,
                role: 'assistant',
                user: user.id,
                chat: chatId
            });

            // CHECK FOR LEVEL COMPLETION logic ...
            const upperContent = assistantMessageContent.toUpperCase();
            if (mode.startsWith('level_exam') && 
               (upperContent.includes("PASASTE EL NIVEL") || upperContent.includes('"PASASTE EL NIVEL"'))) {
                const topic = mode.split(':')[1];
                if (topic) {
                    markLevelCompleted(topic);
                }
            }
        } catch (error) {
            console.error("Error restarting AI conversation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle automatic first message for modes like simulation
    const triggerAutoStart = async (sessionId: string, mode: string) => {
        setIsLoading(true);
        try {
            // Check if chat with this mode already exists in the current session
            const existingChats = chats[sessionId] || [];
            const existingChat = existingChats.find(c => c.mode === mode);

            if (existingChat) {
                // If chat exists, just load it
                setCurrentChatId(existingChat.id);
                const msgs = await loadMessages(existingChat.id);
                setIsLoading(false);
                
                // If existing chat is empty, restart it
                if (msgs.length === 0) {
                     const startMessage = getStartMessageForMode(mode);
                     if (startMessage) {
                         startAIConversation(existingChat.id, startMessage, mode);
                     }
                }
                return;
            }

            let title = 'Nuevo Chat';
            let startMessage = '';

            if (mode === 'simulation') {
                title = 'Simulación de Crisis';
                startMessage = 'START_SIMULATION';
            } else if (mode === 'workshop') {
                title = 'Taller de Entregables';
                startMessage = 'START_WORKSHOP';
            } else if (mode === 'quiz') {
                title = 'Examen Rápido';
                startMessage = 'START_QUIZ';
            } else if (mode === 'socratic') {
                title = 'Tutor Socrático';
                startMessage = 'START_SOCRATIC';
            } else if (mode === 'debate') {
                title = 'Debate PMP';
                startMessage = 'START_DEBATE';
            } else if (mode === 'case_study') {
                title = 'Caso de Estudio';
                startMessage = 'START_CASE_STUDY';
            } else if (mode === 'eli5') {
                title = 'Explícamelo como a un niño';
                startMessage = 'START_ELI5';
            } else if (mode === 'math') {
                title = 'Entrenador de Fórmulas';
                startMessage = 'START_MATH';
            } else if (mode === 'boss_scope') {
                title = 'VS Dr. Scope Creep';
                startMessage = 'START_BOSS_SCOPE';
            } else if (mode === 'boss_risk') {
                title = 'VS The Risker';
                startMessage = 'START_BOSS_RISK';
            } else if (mode === 'boss_stakeholder') {
                title = 'VS El Interesado Tóxico';
                startMessage = 'START_BOSS_STAKEHOLDER';
            } else if (mode === 'boss_schedule') {
                title = 'VS Deadline Demon';
                startMessage = 'START_BOSS_SCHEDULE';
            } else if (mode === 'boss_agile') {
                title = 'VS El Fantasma de la Cascada';
                startMessage = 'START_BOSS_AGILE';
            } else if (mode === 'boss_quality') {
                title = 'VS Capitán Deuda Técnica';
                startMessage = 'START_BOSS_QUALITY';
            } else if (mode.startsWith('level_practice')) {
                // mode format: "level_practice:TopicName"
                const topic = mode.split(':')[1] || 'General';
                title = `Entrenamiento: ${topic}`;
                startMessage = `START_LEVEL_PRACTICE: ${topic}`;
            } else if (mode.startsWith('level_lesson')) {
                const topic = mode.split(':')[1] || 'General';
                title = `Lección: ${topic}`;
                startMessage = `START_LEVEL_LESSON: ${topic}`;
            } else if (mode.startsWith('level_oracle')) {
                const topic = mode.split(':')[1] || 'General';
                title = `Oráculo: ${topic}`;
                startMessage = `START_LEVEL_ORACLE: ${topic}`;
            } else if (mode.startsWith('level_exam')) {
                const topic = mode.split(':')[1] || 'General';
                title = `Examen: ${topic}`;
                startMessage = `START_LEVEL_EXAM: ${topic}`;
            }

            // Create chat immediately
            let newChat;
            try {
                newChat = await pb.collection('chats').create({
                    user: user.id,
                    study_session: sessionId,
                    title: title,
                    mode: mode
                });
            } catch (err: any) {
                // If create fails (e.g. unique constraint or other 400), try to find existing
                if (err.status === 400) {
                     try {
                         console.warn("Creation failed, attempting to find existing chat...");
                         newChat = await pb.collection('chats').getFirstListItem(`study_session="${sessionId}" && mode="${mode}"`);
                     } catch (fetchErr) {
                         throw err; // Throw original error if not found
                     }
                } else {
                    throw err;
                }
            }
            
            const activeChatId = newChat.id;
            setCurrentChatId(activeChatId);
            setChats(prev => ({
                ...prev,
                [sessionId]: [newChat, ...(prev[sessionId] || [])]
            }));

            // Don't save start command to DB/UI, just use it to trigger the AI
            startAIConversation(activeChatId, startMessage, mode);

        } catch (error) {
            console.error('Error in auto-start:', error);
            alert("Error iniciando la simulación.");
            setIsLoading(false);
        }
    };

    const handleStartChatMode = async (mode: string) => {
        let targetSessionId = currentSessionId;

        if (!targetSessionId) {
            // If no session selected, try to find one or create one
            if (sessions.length > 0) {
                targetSessionId = sessions[0].id;
                setCurrentSessionId(targetSessionId);
            } else if (user) {
                // Auto-create a session
                    // Fix: Added robust session creation with fallback for 400 errors
                    try {
                        const sessionName = `Sesión ${new Date().toLocaleString()}`;
                        console.log("Creating session with name:", sessionName, "for user:", user.id);
                        
                        const newSession = await pb.collection('study_sessions').create({
                            name: sessionName,
                            user: user.id
                        });
                        setSessions(prev => [newSession, ...prev]);
                        targetSessionId = newSession.id;
                        setCurrentSessionId(targetSessionId);
                        setChats(prev => ({ ...prev, [newSession.id]: [] }));
                    } catch (error: any) {
                        console.error("Error auto-creating session (attempting fallback):", error);
                        if (error.data) console.error("Validation errors:", error.data);
                        
                        // Fallback: Try to reload sessions and use the first one if it exists
                        // This handles cases where a session might have been created but state wasn't updated,
                        // or if there was a race condition.
                        try {
                            const latestSessions = await pb.collection('study_sessions').getList(1, 1, {
                                sort: '-created',
                                filter: `user="${user.id}"`
                            });
                            
                            if (latestSessions.items.length > 0) {
                                const recoveredSession = latestSessions.items[0];
                                console.log("Recovered existing session successfully:", recoveredSession.id);
                                // Update state
                                setSessions(prev => {
                                    // Avoid duplicates
                                    if (prev.some(s => s.id === recoveredSession.id)) return prev;
                                    return [recoveredSession, ...prev];
                                });
                                targetSessionId = recoveredSession.id;
                                setCurrentSessionId(targetSessionId);
                                // Continue with this session
                            } else {
                                console.error("Fallback failed: No existing sessions found.");
                                alert(`No se pudo iniciar una sesión automáticamente. Por favor crea una sesión manualmente desde la barra lateral.`);
                                return;
                            }
                        } catch (retryError: any) {
                             console.error("Fallback failed with error:", retryError);
                             alert(`Error crítico al iniciar sesión: ${error.message}`);
                             return;
                        }
                    }
            }
        }
        
        if (targetSessionId) {
            setChatMode(mode);
            setCurrentChatId(null); // New chat
            setMessages([]);
            setIsChatViewOpen(true);

            // Auto-trigger simulation if selected
            if (mode === 'simulation' || mode === 'workshop' || mode === 'quiz' || mode === 'socratic' || mode === 'debate' || mode === 'case_study' || mode === 'eli5' || mode === 'math' || mode.startsWith('boss_') || mode.startsWith('level_')) {
                await triggerAutoStart(targetSessionId, mode);
            }
        }
    };

    const handleGoHome = () => {
        setCurrentChatId(null);
        setMessages([]);
        setIsChatViewOpen(false);
        setDashboardLevel(null);
    };

    const handleLogout = () => {
        pb.authStore.clear();
        router.push('/');
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta sesión y todos sus chats?')) return;
        
        try {
            await pb.collection('study_sessions').delete(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            
            // If deleted session was active, reset state
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setCurrentChatId(null);
                setMessages([]);
                setIsChatViewOpen(false);
                setDashboardLevel(null);
            }
        } catch (error) {
            console.error("Error deleting session:", error);
            alert("Error eliminando la sesión.");
        }
    };

    const handleRenameSession = async (sessionId: string, newName: string) => {
        if (!newName.trim()) return;
        
        try {
            await pb.collection('study_sessions').update(sessionId, {
                name: newName
            });
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name: newName } : s));
        } catch (error) {
            console.error("Error renaming session:", error);
            alert("Error renombrando la sesión.");
        }
    };

    // Helper to mark level as completed
    const markLevelCompleted = async (levelName: string) => {
        // Find the ID from the shared WORLDS data structure
        let foundId = null;
        // Normalizing the level name to avoid mismatches (trimming)
        const normalizedLevelName = levelName.trim();

        for (const w of WORLDS) {
            const idx = w.levels.findIndex(l => l.trim() === normalizedLevelName);
            if (idx !== -1) {
                foundId = `${w.id}-${idx}`;
                break;
            }
        }

        if (foundId) {
            if (!completedLevels.includes(foundId)) {
                // Optimistic update
                const newLevels = [...completedLevels, foundId];
                setCompletedLevels(newLevels);
                
                if (user) {
                    // Update LocalStorage
                    localStorage.setItem(`completed_levels_${user.id}`, JSON.stringify(newLevels));
                    
                    // Update PocketBase
                    try {
                        await saveCompletedLevel(user.id, foundId);
                    } catch (err) {
                        console.error("Failed to save progress to DB:", err);
                    }
                }
                
                // Show celebration modal
                setJustCompletedLevel(levelName);
                setShowLevelCompleteModal(true);
            }
        } else {
            console.warn(`Could not find level ID for topic: "${levelName}"`);
        }
    };

    const handleSubmit = async (e?: React.FormEvent, textOverride?: string) => {
        if (e) e.preventDefault();
        
        const messageContent = textOverride || input;

        // Special navigation commands from dynamic buttons
        if (messageContent === 'Volver al Mapa') {
            handleGoHome();
            return;
        }

        // Navigation between Level Modes (Lesson <-> Practice <-> Exam)
        if (chatMode.startsWith('level_')) {
            const topic = chatMode.split(':')[1];
            if (topic) {
                if (messageContent === 'Repasar Lección' || messageContent === 'Ir a la Lección') {
                    handleStartChatMode(`level_lesson:${topic}`);
                    return;
                }
                if (messageContent === 'Tomar Examen' || messageContent === 'Tomar el Examen' || messageContent === 'Hacer Examen') {
                    handleStartChatMode(`level_exam:${topic}`);
                    return;
                }
                if (messageContent === 'Hacer Práctica' || messageContent === 'Otra Práctica' || messageContent === 'Ir a la Práctica') {
                    handleStartChatMode(`level_practice:${topic}`);
                    return;
                }
                if (messageContent === 'Preguntar al Oráculo' || messageContent === 'Ir al Oráculo') {
                    handleStartChatMode(`level_oracle:${topic}`);
                    return;
                }
            }
        }

        if (!messageContent.trim() || isLoading || !currentSessionId) {
            if (!currentSessionId) alert("Por favor selecciona una Sesión de Estudio.");
            return;
        }

        const tempId = Date.now().toString();
        const userMessage = { id: tempId, role: 'user', content: messageContent };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        let activeChatId = currentChatId;

        try {
            // Create chat if it doesn't exist within the current session
            if (!activeChatId) {
                const newChat = await pb.collection('chats').create({
                    user: user.id,
                    study_session: currentSessionId,
                    title: messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : ''),
                    mode: chatMode
                });
                activeChatId = newChat.id;
                setCurrentChatId(activeChatId);
                // Update chats list for this session
                setChats(prev => ({
                    ...prev,
                    [currentSessionId]: [newChat, ...(prev[currentSessionId] || [])]
                }));
            }

            // Save user message to PocketBase
            await pb.collection('messages').create({
                content: userMessage.content,
                role: 'user',
                user: user.id,
                chat: activeChatId
            });

            // Update session ended_at
            if (currentSessionId) {
                try {
                    await pb.collection('study_sessions').update(currentSessionId, {
                        ended_at: new Date().toISOString()
                    });
                } catch (err) {
                    console.error("Error updating session end date:", err);
                }
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
                    mode: chatMode
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessageContent = '';
            const assistantMessageId = (Date.now() + 1).toString();
            
            setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                assistantMessageContent += chunk;
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { 
                        id: assistantMessageId, 
                        role: 'assistant', 
                        content: assistantMessageContent 
                    };
                    return newMessages;
                });
            }

            // Save assistant message to PocketBase
            await pb.collection('messages').create({
                content: assistantMessageContent,
                role: 'assistant',
                user: user.id,
                chat: activeChatId
            });

            // CHECK FOR LEVEL COMPLETION
            const upperContent = assistantMessageContent.toUpperCase();
            if (chatMode.startsWith('level_exam') && 
               (upperContent.includes("PASASTE EL NIVEL") || upperContent.includes('"PASASTE EL NIVEL"'))) {
                const topic = chatMode.split(':')[1];
                if (topic) {
                    console.log("Level completion detected for:", topic);
                    markLevelCompleted(topic);
                }
            }

            // CHECK FOR QUIZ/EXAM RESULTS (STATS)
            if (chatMode === 'quiz') {
                const upper = assistantMessageContent.toUpperCase();
                const start = upper.substring(0, 50); // Check start of message
                if (start.includes('CORRECTO') && !start.includes('INCORRECTO')) {
                     updateUserStats(user.id, 1, 1);
                } else if (start.includes('INCORRECTO')) {
                     updateUserStats(user.id, 0, 1);
                }
            } else if (chatMode.startsWith('level_exam')) {
                // Standard exam: "Puntuación (X/3)"
                const standardMatch = assistantMessageContent.match(/Puntuación\s*\(\s*(\d+)\s*\/\s*(\d+)\s*\)/i);
                if (standardMatch) {
                    const correct = parseInt(standardMatch[1]);
                    const total = parseInt(standardMatch[2]);
                    updateUserStats(user.id, correct, total);
                } else {
                    // Simulation exam: "X/Y aciertos"
                    const simMatch = assistantMessageContent.match(/(\d+)\s*\/\s*(\d+)\s*aciertos/i);
                    if (simMatch) {
                        const correct = parseInt(simMatch[1]);
                        const total = parseInt(simMatch[2]);
                        updateUserStats(user.id, correct, total);
                    }
                }
            }

        } catch (error) {
            console.error('Error in chat flow:', error);
            alert("Ocurrió un error al enviar el mensaje.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseOnboarding = () => {
        setShowOnboarding(false);
        if (user) {
            localStorage.setItem(`onboarding_seen_${user.id}`, 'true');
        }
    };

    if (!user) return null; // Or a loading spinner

    return (
        <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <Sidebar
                user={user}
                sessions={sessions}
                chats={chats}
                currentSessionId={currentSessionId}
                currentChatId={currentChatId}
                onSelectSession={(id) => setCurrentSessionId(id)}
                onSelectChat={handleSelectChat}
                onCreateSession={handleCreateSession}
                onCreateChat={handleNewChat}
                onLogout={handleLogout}
                onGoHome={handleGoHome}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
            />

            {/* Onboarding Modal */}
            <OnboardingModal 
                isOpen={showOnboarding} 
                onClose={handleCloseOnboarding} 
                userInitials={user?.name?.[0] || 'U'}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative min-w-0">
                {/* 
                    Logic:
                    - If isChatViewOpen is true -> Show Chat
                    - Else -> Show Dashboard
                */}
                {isChatViewOpen ? (
                    <ChatArea
                        messages={messages}
                        isLoading={isLoading}
                        input={input}
                        mode={chatMode}
                        onInputChange={setInput}
                        onSubmit={handleSubmit}
                        onSendOption={(opt) => handleSubmit(undefined, opt)}
                        userInitials={user?.name?.[0] || 'U'}
                        onBack={() => setIsChatViewOpen(false)}
                    />
                ) : (
                    <Dashboard 
                        userName={user?.name?.split(' ')[0] || 'Estudiante'} 
                        onStartChatMode={handleStartChatMode}
                        stats={stats}
                        selectedLevel={dashboardLevel}
                        onSelectLevel={setDashboardLevel}
                        completedLevels={completedLevels}
                    />
                )}

                {showLevelCompleteModal && (
                    <LevelCompletedModal
                        levelName={justCompletedLevel}
                        onClose={() => setShowLevelCompleteModal(false)}
                        onContinue={() => {
                            setShowLevelCompleteModal(false);
                            handleGoHome();
                        }}
                    />
                )}
            </main>
        </div>
    );
}