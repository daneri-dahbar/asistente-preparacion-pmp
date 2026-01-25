import pb from './pocketbase';

export interface UserProgress {
    id?: string;
    user: string;
    completed_levels: string[];
    stats?: {
        total_xp?: number;
        accuracy?: string;
        streak?: number;
        correct_answers?: number;
        total_questions?: number;
    };
}

export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
    try {
        const records = await pb.collection('user_progress').getFullList({
            filter: `user="${userId}"`,
        });
        
        if (records.length > 0) {
            return {
                id: records[0].id,
                user: records[0].user,
                completed_levels: records[0].completed_levels || [],
                stats: records[0].stats
            };
        }
        return null;
    } catch (error: any) {
        // Silent fail if collection doesn't exist or other error
        // console.warn("Could not load user progress:", error);
        return null;
    }
};

export const saveCompletedLevel = async (userId: string, levelId: string) => {
    try {
        // 1. Get existing progress
        let progress = await getUserProgress(userId);
        
        if (progress) {
            // Update existing
            const currentLevels = progress.completed_levels || [];
            if (!currentLevels.includes(levelId)) {
                const newLevels = [...currentLevels, levelId];
                await pb.collection('user_progress').update(progress.id!, {
                    completed_levels: newLevels
                });
                return newLevels;
            }
            return currentLevels;
        } else {
            // Create new
            try {
                const newRecord = await pb.collection('user_progress').create({
                    user: userId,
                    completed_levels: [levelId],
                    stats: {}
                });
                return [levelId];
            } catch (createError) {
                console.error("Error creating user_progress record:", createError);
                throw createError;
            }
        }
    } catch (error) {
        console.error("Error saving completed level:", error);
        throw error;
    }
};

export const updateUserStats = async (userId: string, correct: number, total: number) => {
    try {
        const progress = await getUserProgress(userId);
        if (progress) {
            const currentStats = progress.stats || {};
            const oldCorrect = currentStats.correct_answers || 0;
            const oldTotal = currentStats.total_questions || 0;
            
            const newCorrect = oldCorrect + correct;
            const newTotal = oldTotal + total;
            const newAccuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) + '%' : '0%';

            await pb.collection('user_progress').update(progress.id!, {
                stats: {
                    ...currentStats,
                    correct_answers: newCorrect,
                    total_questions: newTotal,
                    accuracy: newAccuracy
                }
            });
            return { newCorrect, newTotal, newAccuracy };
        }
    } catch (error) {
        console.error("Error updating stats:", error);
    }
};

export const syncLocalProgress = async (userId: string, localLevels: string[]) => {
    try {
        let progress = await getUserProgress(userId);
        
        if (progress) {
            // Merge
            const dbLevels = progress.completed_levels || [];
            const merged = Array.from(new Set([...dbLevels, ...localLevels]));
            
            if (merged.length > dbLevels.length) {
                await pb.collection('user_progress').update(progress.id!, {
                    completed_levels: merged
                });
            }
            return merged;
        } else {
            // Create
            if (localLevels.length > 0) {
                 await pb.collection('user_progress').create({
                    user: userId,
                    completed_levels: localLevels,
                    stats: {}
                });
            }
            return localLevels;
        }
    } catch (error) {
        console.error("Error syncing progress:", error);
        return localLevels;
    }
};
