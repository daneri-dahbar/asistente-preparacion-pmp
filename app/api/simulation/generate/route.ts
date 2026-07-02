import { NextResponse } from 'next/server';
import { generateSimulationQuestions } from '@/lib/simulationQuestions';

export async function POST(req: Request) {
    try {
        const { topic, amount = 5 } = await req.json();
        const questions = await generateSimulationQuestions({ amount, topic });

        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Error generating questions:", error);
        const message = error instanceof Error ? error.message : "Error generating questions";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
