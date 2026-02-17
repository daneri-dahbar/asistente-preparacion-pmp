'use client';

import { useEffect, useState, useRef } from 'react';
import pb from '@/lib/pocketbase';
import { useRouter } from 'next/navigation';
import { WORLDS } from '@/lib/gameData';
import { syncLocalProgress, saveCompletedLevel, updateUserStats, getUserProgress } from '@/lib/userProgress';
import { PanelLeftOpen } from 'lucide-react';

// Components
import Sidebar from '@/app/components/workspace/Sidebar';
import Dashboard from '@/app/components/workspace/Dashboard';
import ChatArea from '@/app/components/workspace/ChatArea';
import ExamSimulator from '@/app/components/workspace/ExamSimulator';
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
    const [chats, setChats] = useState<any[]>([]); 
    
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<string>('standard'); // standard, simulation, workshop, socratic, exam_simulation
    const [isChatViewOpen, setIsChatViewOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
    
    // Exam Simulation State
    const [isExamMode, setIsExamMode] = useState(false);
    const [examConfig, setExamConfig] = useState<{count: number, topic: string, simulationId?: string} | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const activeChatIdRef = useRef<string | null>(null);
    
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
        // 1. Total Sessions (now meaningless, but keeping stats structure)
        const totalSessions = 0;

        // 2. Streak Calculation (simplified or removed)
        let currentStreak = 0;
        
        // 3. Title Calculation
        let level = 1;
        let title = 'Novato';

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
    }, [completedLevels]);

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
                const userId = pb.authStore.model.id;
                loadChats(userId);
                
                // Check for onboarding
                const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${userId}`);
                if (!hasSeenOnboarding) {
                    setShowOnboarding(true);
                }
            }
        }
    }, [router]);

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

    const loadChats = async (userId: string) => {
        setIsLoadingChats(true);
        try {
            // Using single quotes for filter and removing server-side sort to avoid 400 errors
            const records = await pb.collection('chats').getFullList({
                filter: `user='${userId}'`,
            });
            
            // Client-side sort
            records.sort((a: any, b: any) => {
                const timeA = new Date(a.last_active || a.updated).getTime();
                const timeB = new Date(b.last_active || b.updated).getTime();
                return timeB - timeA;
            });

            setChats(records);
        } catch (error: any) {
            // Check for auto-cancellation first to avoid noise
            if (error.isAbort || error.status === 0) return;

            console.error("Error loading chats:", error);
            
            // Fallback: try loading without filter (relying on API rules)
            if (error.status === 400) {
                try {
                    const allRecords = await pb.collection('chats').getFullList();
                    // Client-side filter and sort
                    const userChats = allRecords.filter((r: any) => r.user === userId);
                    userChats.sort((a: any, b: any) => {
                        const timeA = new Date(a.last_active || a.updated).getTime();
                        const timeB = new Date(b.last_active || b.updated).getTime();
                        return timeB - timeA;
                    });
                    setChats(userChats);
                } catch (fallbackError: any) {
                    if (fallbackError.isAbort || fallbackError.status === 0) return;
                    console.error("Fallback chat load failed:", fallbackError);
                }
            }
        } finally {
            setIsLoadingChats(false);
        }
    };

    // Helper to load messages (pure fetcher)
    const loadMessages = async (chatId: string) => {
        if (!chatId) return [];
        const safeChatId = chatId.trim();
        
        try {
            console.log(`[loadMessages] Loading messages for chat: ${safeChatId}`);
            
            // Using safe filter format and client-side sorting to avoid 400 errors
            const records = await pb.collection('messages').getFullList({
                filter: `chat='${safeChatId}'`,
            });
            
            // Client-side sort (oldest to newest for messages)
            records.sort((a: any, b: any) => new Date(a.created).getTime() - new Date(b.created).getTime());

            console.log(`[loadMessages] Found ${records.length} messages`);
            return records.map(r => ({
                id: r.id,
                role: r.role,
                content: r.content
            }));
        } catch (error: any) {
            // Check for auto-cancellation (abort) errors
            if (error.isAbort || error.status === 0) {
                return [];
            }
            
            console.error(`[loadMessages] Error loading messages:`, error);
            if (error.data) console.error("[loadMessages] Error details:", error.data);

            // Fallback for 400 (Bad Request) - likely schema mismatch or filter issue
            if (error.status === 400 && pb.authStore.model?.id) {
                console.warn("[loadMessages] Attempting fallback: Client-side filtering...");
                try {
                    // Try to get messages for this user instead of filtering by chat directly
                    // Removing sort to avoid 400 bad request if index is missing
                    const records = await pb.collection('messages').getFullList({
                        filter: `user='${pb.authStore.model.id}'`, 
                    });
                    
                    // Filter by chat manually in client
                    const filtered = records.filter((r: any) => r.chat === safeChatId);
                    // Client-side sort
                    filtered.sort((a: any, b: any) => new Date(a.created).getTime() - new Date(b.created).getTime());

                    console.log(`[loadMessages] Fallback found ${filtered.length} messages`);
                    
                    return filtered.map((r: any) => ({
                        id: r.id,
                        role: r.role,
                        content: r.content
                    }));
                } catch (fallbackErr) {
                    console.error("[loadMessages] Fallback failed:", fallbackErr);
                }
            }
            
            return [];
        }
    };

    const handleNewChat = () => {
        setCurrentChatId(null);
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
        if (mode.startsWith('level_practice')) return `START_LEVEL_PRACTICE: ${mode.split(':')[1] || 'General'}`;
        if (mode.startsWith('level_lesson')) return `START_LEVEL_LESSON: ${mode.split(':')[1] || 'General'}`;
        if (mode.startsWith('level_oracle')) return `START_LEVEL_ORACLE: ${mode.split(':')[1] || 'General'}`;
        if (mode.startsWith('level_exam')) return `START_LEVEL_EXAM: ${mode.split(':')[1] || 'General'}`;
        return '';
    };

    const handleSelectChat = async (chatId: string, mode?: string) => {
        setIsMobileSidebarOpen(false);
        // Prevent race conditions by tracking the latest request
        activeChatIdRef.current = chatId;
        
        setCurrentChatId(chatId);
        const selectedMode = mode || 'standard';
        setChatMode(selectedMode);
        
        // Show loading state immediately
        setIsLoadingHistory(true);
        setMessages([]); // Clear previous messages
        setIsChatViewOpen(true);
        
        const messages = await loadMessages(chatId);
        
        // Ensure we only update if the user is still on this chat
        if (activeChatIdRef.current !== chatId) {
             console.log(`[handleSelectChat] Ignoring stale response for chat ${chatId}`);
             return;
        }
        
        setMessages(messages);
        setIsLoadingHistory(false);

        // Auto-recover empty chats for special modes
        if (messages.length === 0 && selectedMode !== 'standard' && !isLoading) {
            console.log("Empty chat detected for special mode, attempting to restart...");
            const startMessage = getStartMessageForMode(selectedMode);
            if (startMessage) {
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
    const triggerAutoStart = async (mode: string) => {
        setIsLoading(true);
        try {
            // Check if chat with this mode already exists
            const existingChat = chats.find(c => c.mode === mode);

            if (existingChat) {
                // If chat exists, just load it
                activeChatIdRef.current = existingChat.id;
                setCurrentChatId(existingChat.id);
                
                setIsLoadingHistory(true);
                setMessages([]);
                setIsChatViewOpen(true);
                
                const msgs = await loadMessages(existingChat.id);
                if (activeChatIdRef.current === existingChat.id) {
                    setMessages(msgs);
                }
                setIsLoadingHistory(false);
                setIsLoading(false);
                
                // If existing chat is empty, restart it
                if (msgs.length === 0 && activeChatIdRef.current === existingChat.id) {
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
                    title: title,
                    mode: mode
                });
            } catch (err: any) {
                // If create fails (e.g. unique constraint or other 400), try to find existing
                if (err.status === 400) {
                     try {
                         console.warn("Creation failed, attempting to find existing chat...");
                         newChat = await pb.collection('chats').getFirstListItem(`user="${user.id}" && mode="${mode}"`);
                     } catch (fetchErr) {
                         throw err; // Throw original error if not found
                     }
                } else {
                    throw err;
                }
            }
            
            const activeChatId = newChat.id;
            activeChatIdRef.current = activeChatId;
            setCurrentChatId(activeChatId);
            setChats(prev => [newChat, ...prev]);

            // Don't save start command to DB/UI, just use it to trigger the AI
            startAIConversation(activeChatId, startMessage, mode);

        } catch (error) {
            console.error('Error in auto-start:', error);
            alert("Error iniciando la simulación.");
            setIsLoading(false);
        }
    };

    const handleStartChatMode = async (mode: string) => {
        // Intercept Resume Simulation
        if (mode.startsWith('resume_simulation:')) {
            const parts = mode.split(':');
            const simulationId = parts[1];
            // parts[2] is type, parts[3] is total_questions
            const countStr = parts[3]; 
            const count = parseInt(countStr) || 45;
            
            // Map count to topic string to ensure consistency
            let topic = `Simulación (${count} Preguntas)`;
            if (count === 45) topic = 'Simulación Inicial (45 Preguntas)';
            if (count === 90) topic = 'Simulación Media (90 Preguntas)';
            if (count === 135) topic = 'Simulación Avanzada (135 Preguntas)';
            if (count === 180) topic = 'Simulacro Real Completo (180 Preguntas)';
            
            setExamConfig({ count, topic, simulationId });
            setIsExamMode(true);
            setIsChatViewOpen(true);
            return;
        }

        // Intercept Simulation Mode (Only for full exams, not "Prueba de Fuego")
        if (mode.startsWith('level_exam:')) {
            const topic = mode.split(':')[1];
            
            // Check if it's a full simulation based on topic name conventions
            // If it's just "level_exam:TopicName" (Prueba de Fuego), fall through to Chat Mode
            if (topic.includes('45') || topic.includes('90') || topic.includes('135') || topic.includes('180')) {
                 let count = 45;
                 if (topic.includes('90')) count = 90;
                 if (topic.includes('135')) count = 135;
                 if (topic.includes('180')) count = 180;
                 
                 setExamConfig({ count, topic });
                 setIsExamMode(true);
                 setIsChatViewOpen(true);
                 return;
            }
        }

        setChatMode(mode);
        setCurrentChatId(null); // New chat
        setMessages([]);
        setIsChatViewOpen(true);

        // Auto-trigger simulation if selected
        if (mode === 'simulation' || mode === 'workshop' || mode === 'quiz' || mode === 'socratic' || mode === 'debate' || mode === 'case_study' || mode === 'eli5' || mode === 'math' || mode.startsWith('level_')) {
            await triggerAutoStart(mode);
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

        if (!messageContent.trim() || isLoading) {
            return;
        }

        const tempId = Date.now().toString();
        const userMessage = { id: tempId, role: 'user', content: messageContent };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        let activeChatId = currentChatId;

        try {
            // Create chat if it doesn't exist
            if (!activeChatId) {
                const newChat = await pb.collection('chats').create({
                    user: user.id,
                    title: messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : ''),
                    mode: chatMode
                });
                activeChatId = newChat.id;
                setCurrentChatId(activeChatId);
                // Update chats list
                setChats(prev => [newChat, ...prev]);
            }

            // Save user message to PocketBase
            await pb.collection('messages').create({
                content: userMessage.content,
                role: 'user',
                user: user.id,
                chat: activeChatId
            });

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

            // Update chat timestamp in PocketBase to ensure it appears as most recent
            const now = new Date().toISOString();
            try {
                await pb.collection('chats').update(activeChatId, {
                    last_active: now
                });
            } catch (err) {
                console.warn("Failed to update last_active field. Ensure the field exists in PocketBase.", err);
            }

            // Update local chats state to reflect new timestamp and move to top
            setChats(prev => {
                const updatedChats = prev.map(c => 
                    c.id === activeChatId 
                        ? { ...c, last_active: now, updated: now } 
                        : c
                );
                return updatedChats.sort((a, b) => {
                    const timeA = new Date(a.last_active || a.updated).getTime();
                    const timeB = new Date(b.last_active || b.updated).getTime();
                    return timeB - timeA;
                });
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

    // ----------------------------------------------------------------------
    // RENDER: EXAM SIMULATION MODE
    // ----------------------------------------------------------------------
    if (isExamMode && examConfig) {
        return (
            <ExamSimulator 
                simulationId={examConfig.simulationId || null}
                initialQuestionCount={examConfig.count}
                topic={examConfig.topic}
                userId={user.id}
                onExit={() => {
                    setIsExamMode(false);
                    setExamConfig(null);
                    setIsChatViewOpen(false);
                    setDashboardLevel(null);
                }}
                onComplete={(score, total) => {
                    // If it's a "Prueba de Fuego" (small exam <= 10 questions), mark the level as completed
                    if (examConfig.count <= 10) {
                        markLevelCompleted(examConfig.topic);
                    }
                }}
            />
        );
    }

    // ----------------------------------------------------------------------
    // RENDER: MAIN APP
    // ----------------------------------------------------------------------
    return (
        <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <Sidebar
                user={user}
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={handleSelectChat}
                onCreateChat={handleNewChat}
                onLogout={handleLogout}
                onGoHome={handleGoHome}
                isLoadingChats={isLoadingChats}
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
                isDesktopOpen={isDesktopSidebarOpen}
                onToggleDesktop={() => setIsDesktopSidebarOpen(prev => !prev)}
            />

            {/* Onboarding Modal */}
            <OnboardingModal 
                isOpen={showOnboarding} 
                onClose={handleCloseOnboarding} 
                userName={user?.name || user?.username || 'Estudiante'}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative min-w-0">
                {/* Desktop Expand Button */}
                {!isDesktopSidebarOpen && (
                    <div className="hidden md:flex w-full px-4 md:px-8 pt-4 pb-0 z-30 shrink-0">
                        <button 
                            onClick={() => setIsDesktopSidebarOpen(true)}
                            className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                            title="Mostrar barra lateral"
                        >
                            <PanelLeftOpen className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-30">
                    <button 
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Abrir menú"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" x2="20" y1="12" y2="12" />
                            <line x1="4" x2="20" y1="6" y2="6" />
                            <line x1="4" x2="20" y1="18" y2="18" />
                        </svg>
                    </button>
                    <span className="ml-3 font-semibold text-gray-900 dark:text-white truncate">
                        {isChatViewOpen ? (chats.find(c => c.id === currentChatId)?.title || 'Chat') : 'Asistente PMP'}
                    </span>
                </div>

                {/* 
                    Logic:
                    - If isChatViewOpen is true -> Show Chat
                    - Else -> Show Dashboard
                */}
                {isChatViewOpen ? (
                    <ChatArea
                        messages={messages}
                        isLoading={isLoading}
                        isLoadingHistory={isLoadingHistory}
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
