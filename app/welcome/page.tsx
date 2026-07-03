'use client';

import { useEffect, useState, useRef } from 'react';
import pb from '@/lib/pocketbase';
import { useRouter } from 'next/navigation';
import { WORLDS } from '@/lib/gameData';
import { saveCompletedLevel, updateUserStats, getUserProgress } from '@/lib/userProgress';
import { PanelLeftOpen } from 'lucide-react';

// Components
import Sidebar from '@/app/components/workspace/Sidebar';
import Dashboard from '@/app/components/workspace/Dashboard';
import AdminDashboard, { type AdminView } from '@/app/components/workspace/AdminDashboard';
import ChatArea from '@/app/components/workspace/ChatArea';
import ExamSimulator from '@/app/components/workspace/ExamSimulator';
import TechnicalMetricsHistory from '@/app/components/workspace/TechnicalMetricsHistory';
import UxUiMetricsHistory from '@/app/components/workspace/UxUiMetricsHistory';
import LevelCompletedModal from '@/app/components/LevelCompletedModal';
import OnboardingModal from '@/app/components/OnboardingModal';
import { captureAspirantTechnicalMetrics } from '@/lib/technicalMetrics';

const LEVEL_ACTIVITY_MODE_LABELS: Record<string, string> = {
    level_lesson: 'Leccion',
    level_practice: 'Entrenamiento',
    level_oracle: 'Oraculo',
    level_exam: 'Examen',
};

function normalizeLevelName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function levelIdFromName(levelName: string) {
    const normalizedLevelName = normalizeLevelName(levelName);

    for (const world of WORLDS) {
        const index = world.levels.findIndex((level) => normalizeLevelName(level) === normalizedLevelName);
        if (index !== -1) return `${world.id}-${index}`;
    }

    return null;
}

function levelNameFromMode(mode?: string) {
    const [modeKey, ...levelNameParts] = (mode || '').split(':');
    if (!LEVEL_ACTIVITY_MODE_LABELS[modeKey] || levelNameParts.length === 0) return null;
    return levelNameParts.join(':').trim() || null;
}

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
    const [activeAdminView, setActiveAdminView] = useState<AdminView>('users');
    const [isTechnicalMetricsViewOpen, setIsTechnicalMetricsViewOpen] = useState(false);
    const [isUxUiMetricsViewOpen, setIsUxUiMetricsViewOpen] = useState(false);
    const technicalMetricsCaptureRef = useRef<string | null>(null);

    // Stats State
    const [stats, setStats] = useState({
        sessions: 0,
        accuracy: 'N/A',
        masteredAreas: 0,
        streak: 0,
        level: 1,
        title: 'Novato'
    });

    const getMessageTimestamp = (message: any) => message.generated_at || message.created || message.updated;

    const sortMessagesChronologically = (items: any[]) => {
        const roleOrder: Record<string, number> = { user: 0, assistant: 1 };

        return items.sort((a: any, b: any) => {
            const timeA = new Date(getMessageTimestamp(a) || 0).getTime();
            const timeB = new Date(getMessageTimestamp(b) || 0).getTime();
            const safeTimeA = Number.isNaN(timeA) ? 0 : timeA;
            const safeTimeB = Number.isNaN(timeB) ? 0 : timeB;

            if (safeTimeA !== safeTimeB) return safeTimeA - safeTimeB;

            return (roleOrder[a.role] ?? 2) - (roleOrder[b.role] ?? 2);
        });
    };

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
        let cancelled = false;

        const initializeUser = async () => {
            if (!pb.authStore.isValid) {
                router.push('/');
                return;
            }

            if (pb.authStore.model) {
                let currentUser = pb.authStore.model;

                try {
                    currentUser = await pb.collection('users').getOne(pb.authStore.model.id, { requestKey: null });
                    pb.authStore.save(pb.authStore.token, currentUser);
                } catch (error) {
                    console.warn('No se pudo refrescar el usuario autenticado:', error);
                }

                if (cancelled) return;

                setUser(currentUser);
                if (currentUser.role === 'admin') {
                    setChats([]);
                    setCurrentChatId(null);
                    setMessages([]);
                    setIsChatViewOpen(false);
                } else {
                    loadChats(currentUser.id);
                }

                // Check for onboarding
                const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${currentUser.id}`);
                if (currentUser.role !== 'admin' && !hasSeenOnboarding) {
                    setShowOnboarding(true);
                }
            }
        };

        initializeUser();

        return () => {
            cancelled = true;
        };
    }, [router]);

    useEffect(() => {
        if (!user || user.role === 'admin') return;
        if (technicalMetricsCaptureRef.current === user.id) return;

        const pendingKey = `technical_metrics_capture_pending_${user.id}`;
        if (sessionStorage.getItem(pendingKey)) return;

        sessionStorage.setItem(pendingKey, 'true');
        const timeoutId = window.setTimeout(async () => {
            technicalMetricsCaptureRef.current = user.id;
            try {
                await captureAspirantTechnicalMetrics(pb, user.id);
            } catch (metricError) {
                console.warn('No se pudieron guardar las metricas tecnicas del usuario:', metricError);
            } finally {
                sessionStorage.removeItem(pendingKey);
            }
        }, 1400);

        return () => {
            window.clearTimeout(timeoutId);
            sessionStorage.removeItem(pendingKey);
        };
    }, [user?.id, user?.role]);

    // Load completed levels from PocketBase only. LocalStorage must not repopulate DB progress on login.
    useEffect(() => {
        const loadProgress = async () => {
            if (user) {
                try {
                    const progress = await getUserProgress(user.id);
                    let remoteLevels = progress?.completed_levels || [];

                    const guidedChats = await pb.collection('chats').getFullList({
                        filter: `user="${user.id}"`,
                        fields: 'id,mode',
                        requestKey: null,
                    }).catch(() => []);
                    const activityByLevel = guidedChats.reduce<Record<string, Set<string>>>((acc, chat: any) => {
                        const levelName = levelNameFromMode(chat.mode);
                        const modeKey = String(chat.mode || '').split(':')[0];
                        if (!levelName || !LEVEL_ACTIVITY_MODE_LABELS[modeKey]) return acc;

                        const levelId = levelIdFromName(levelName);
                        if (!levelId) return acc;

                        acc[levelId] = acc[levelId] || new Set<string>();
                        acc[levelId].add(modeKey);
                        return acc;
                    }, {});
                    const remoteLevelSet = new Set(remoteLevels);
                    const recoveredLevels = Object.entries(activityByLevel)
                        .filter(([, activities]) => activities.size >= 4)
                        .map(([levelId]) => levelId)
                        .filter((levelId) => !remoteLevelSet.has(levelId));

                    if (recoveredLevels.length > 0) {
                        remoteLevels = [...remoteLevels, ...recoveredLevels];
                        for (const levelId of recoveredLevels) {
                            await saveCompletedLevel(user.id, levelId);
                        }
                    }

                    setCompletedLevels(remoteLevels);
                    localStorage.removeItem(`completed_levels_${user.id}`);
                } catch (error) {
                    console.error("Error loading progress:", error);
                    setCompletedLevels([]);
                }
            }
        };

        loadProgress();
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
                fields: 'id,role,content,generated_at,created,updated',
            });
            
            // Client-side sort (oldest to newest for messages)
            sortMessagesChronologically(records);

            console.log(`[loadMessages] Found ${records.length} messages`);
            return records.map(r => ({
                id: r.id,
                role: r.role,
                content: r.content,
                generated_at: r.generated_at,
                created: r.created,
                updated: r.updated
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
                        fields: 'id,chat,role,content,generated_at,created,updated',
                    });
                    
                    // Filter by chat manually in client
                    const filtered = records.filter((r: any) => r.chat === safeChatId);
                    // Client-side sort
                    sortMessagesChronologically(filtered);

                    console.log(`[loadMessages] Fallback found ${filtered.length} messages`);
                    
                    return filtered.map((r: any) => ({
                        id: r.id,
                        role: r.role,
                        content: r.content,
                        generated_at: r.generated_at,
                        created: r.created,
                        updated: r.updated
                    }));
                } catch (fallbackErr) {
                    console.error("[loadMessages] Fallback failed:", fallbackErr);
                }
            }
            
            return [];
        }
    };

    useEffect(() => {
        if (!currentChatId || !isChatViewOpen || isLoadingHistory) return;
        if (messages.length === 0) return;

        const hasMessagesWithoutDates = messages.some((message) => !message.generated_at && !message.created && !message.updated);
        if (!hasMessagesWithoutDates) return;

        let cancelled = false;

        const reloadMissingDates = async () => {
            const reloadedMessages = await loadMessages(currentChatId);
            if (!cancelled && activeChatIdRef.current === currentChatId && reloadedMessages.length > 0) {
                setMessages(reloadedMessages);
            }
        };

        reloadMissingDates();

        return () => {
            cancelled = true;
        };
    }, [currentChatId, isChatViewOpen, isLoadingHistory, messages]);

    const handleNewChat = () => {
        if (user?.role === 'admin') return;

        setIsTechnicalMetricsViewOpen(false);
        setIsUxUiMetricsViewOpen(false);
        setCurrentChatId(null);
        setMessages([]);
        setChatMode('standard'); 
        setIsChatViewOpen(true);
    };

    const handleRenameChat = async (chatId: string, newTitle: string) => {
        try {
            await pb.collection('chats').update(chatId, {
                title: newTitle
            });
            
            // Update local state
            setChats(prev => prev.map(chat => 
                chat.id === chatId ? { ...chat, title: newTitle } : chat
            ));
        } catch (error) {
            console.error("Error renaming chat:", error);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            await pb.collection('chats').delete(chatId);
            
            // Update local state
            setChats(prev => prev.filter(chat => chat.id !== chatId));
            
            // If deleted chat was active, clear view
            if (currentChatId === chatId) {
                setCurrentChatId(null);
                setMessages([]);
                setChatMode('standard');
                setIsChatViewOpen(false);
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
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
        if (user?.role === 'admin') {
            handleGoHome();
            return;
        }

        setIsTechnicalMetricsViewOpen(false);
        setIsUxUiMetricsViewOpen(false);
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
        if (user?.role === 'admin') return;

        setIsLoading(true);
        try {
             // Don't save start command to DB/UI, just use it to trigger the AI
             const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: startMessage }],
                    mode: mode,
                    userId: user.id,
                    chatId,
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessageContent = '';
            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessageCreated = new Date().toISOString();
            
            setMessages([{ id: assistantMessageId, role: 'assistant', content: '', generated_at: assistantMessageCreated, created: assistantMessageCreated }]);

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
                        content: assistantMessageContent,
                        generated_at: assistantMessageCreated,
                        created: assistantMessageCreated
                    };
                    return newMessages;
                });
            }

            // Save assistant message to PocketBase
            const savedAssistantMessage = await pb.collection('messages').create({
                content: assistantMessageContent,
                role: 'assistant',
                user: user.id,
                chat: chatId,
                generated_at: assistantMessageCreated
            });
            setMessages((current) => current.map((message) => (
                message.id === assistantMessageId
                    ? {
                        ...message,
                        id: savedAssistantMessage.id,
                        generated_at: savedAssistantMessage.generated_at || message.generated_at,
                        created: savedAssistantMessage.created || message.created,
                        updated: savedAssistantMessage.updated || message.updated,
                    }
                    : message
            )));

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
        if (user?.role === 'admin') return;

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
        if (user?.role === 'admin') return;

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
            setIsTechnicalMetricsViewOpen(false);
            setIsUxUiMetricsViewOpen(false);
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
                 setIsTechnicalMetricsViewOpen(false);
                 setIsUxUiMetricsViewOpen(false);
                 return;
            }
        }

        setIsTechnicalMetricsViewOpen(false);
        setIsUxUiMetricsViewOpen(false);
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
        setIsTechnicalMetricsViewOpen(false);
        setIsUxUiMetricsViewOpen(false);
    };

    const handleOpenTechnicalMetrics = () => {
        if (user?.role === 'admin') return;

        setCurrentChatId(null);
        setMessages([]);
        setIsChatViewOpen(false);
        setDashboardLevel(null);
        setIsTechnicalMetricsViewOpen(true);
        setIsUxUiMetricsViewOpen(false);
        setIsMobileSidebarOpen(false);
    };

    const handleOpenUxUiMetrics = () => {
        if (user?.role === 'admin') return;

        setCurrentChatId(null);
        setMessages([]);
        setIsChatViewOpen(false);
        setDashboardLevel(null);
        setIsTechnicalMetricsViewOpen(false);
        setIsUxUiMetricsViewOpen(true);
        setIsMobileSidebarOpen(false);
    };

    const handleLogout = () => {
        pb.authStore.clear();
        router.push('/');
    };

    // Helper to mark level as completed
    const markLevelCompleted = async (levelName: string) => {
        const foundId = levelIdFromName(levelName);

        if (foundId) {
            if (!completedLevels.includes(foundId)) {
                // Optimistic update
                const newLevels = [...completedLevels, foundId];
                setCompletedLevels(newLevels);
                
                if (user) {
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

        if (user?.role === 'admin') {
            handleGoHome();
            return;
        }
        
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
        const userMessageCreated = new Date().toISOString();
        const userMessage = { id: tempId, role: 'user', content: messageContent, generated_at: userMessageCreated, created: userMessageCreated };
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
            const savedUserMessage = await pb.collection('messages').create({
                content: userMessage.content,
                role: 'user',
                user: user.id,
                chat: activeChatId,
                generated_at: userMessageCreated
            });
            setMessages((current) => current.map((message) => (
                message.id === tempId
                    ? {
                        ...message,
                        id: savedUserMessage.id,
                        generated_at: savedUserMessage.generated_at || message.generated_at,
                        created: savedUserMessage.created || message.created,
                        updated: savedUserMessage.updated || message.updated,
                    }
                    : message
            )));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
                    mode: chatMode,
                    userId: user.id,
                    chatId: activeChatId,
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessageContent = '';
            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessageCreated = new Date().toISOString();
            
            setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', generated_at: assistantMessageCreated, created: assistantMessageCreated }]);

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
                        content: assistantMessageContent,
                        generated_at: assistantMessageCreated,
                        created: assistantMessageCreated
                    };
                    return newMessages;
                });
            }

            // Save assistant message to PocketBase
            const savedAssistantMessage = await pb.collection('messages').create({
                content: assistantMessageContent,
                role: 'assistant',
                user: user.id,
                chat: activeChatId,
                generated_at: assistantMessageCreated
            });
            setMessages((current) => current.map((message) => (
                message.id === assistantMessageId
                    ? {
                        ...message,
                        id: savedAssistantMessage.id,
                        generated_at: savedAssistantMessage.generated_at || message.generated_at,
                        created: savedAssistantMessage.created || message.created,
                        updated: savedAssistantMessage.updated || message.updated,
                    }
                    : message
            )));

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

    const isAdmin = user?.role === 'admin';

    // ----------------------------------------------------------------------
    // RENDER: EXAM SIMULATION MODE
    // ----------------------------------------------------------------------
    if (isExamMode && examConfig && !isAdmin) {
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
                chats={isAdmin ? [] : chats}
                currentChatId={currentChatId}
                onSelectChat={handleSelectChat}
                onCreateChat={handleNewChat}
                onRenameChat={handleRenameChat}
                onDeleteChat={handleDeleteChat}
                onLogout={handleLogout}
                onGoHome={handleGoHome}
                isLoadingChats={isLoadingChats}
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
                isDesktopOpen={isDesktopSidebarOpen}
                onToggleDesktop={() => setIsDesktopSidebarOpen(prev => !prev)}
                activeAdminView={activeAdminView}
                onAdminViewChange={setActiveAdminView}
                onOpenTechnicalMetrics={handleOpenTechnicalMetrics}
                isTechnicalMetricsOpen={isTechnicalMetricsViewOpen}
                onOpenUxUiMetrics={handleOpenUxUiMetrics}
                isUxUiMetricsOpen={isUxUiMetricsViewOpen}
            />

            {/* Onboarding Modal */}
            <OnboardingModal 
                isOpen={showOnboarding} 
                onClose={handleCloseOnboarding} 
                userName={user?.name || user?.username || 'Estudiante'}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative min-w-0">
                
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
                {isTechnicalMetricsViewOpen && !isAdmin ? (
                    <TechnicalMetricsHistory
                        userId={user.id}
                        userName={user?.name || user?.email || 'Usuario'}
                        onBack={handleGoHome}
                    />
                ) : isUxUiMetricsViewOpen && !isAdmin ? (
                    <UxUiMetricsHistory
                        userId={user.id}
                        userName={user?.name || user?.email || 'Usuario'}
                        onBack={handleGoHome}
                        allowCreate
                    />
                ) : isChatViewOpen ? (
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
                ) : isAdmin ? (
                    <AdminDashboard activeAdminView={activeAdminView} />
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
