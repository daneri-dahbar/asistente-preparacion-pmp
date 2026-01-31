
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GOOGLE_API_KEY environment variable is not set" }, { status: 500 });
        }

        // Inicializar el modelo
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-3-flash-preview",
            temperature: 0.7,
            apiKey: apiKey,
        });

        const { topic, amount = 5, existingQuestions = [] } = await req.json();

        // Evitar duplicados enviando los IDs o temas de preguntas previas si es necesario
        // Por simplicidad, en este prompt pedimos variedad.

        const promptTemplate = new PromptTemplate({
            template: `Eres un experto creador de exámenes de certificación PMP (Project Management Professional).
            Tu tarea es generar {amount} preguntas de examen de alta calidad, estilo situacional, basadas en el ECO (Examination Content Outline) actual.
            
            Tema/Enfoque: {topic}
            
            REGLAS ESTRICTAS DE FORMATO:
            Debes responder ÚNICAMENTE con un array JSON válido.
            - No incluyas markdown (ej: bloques de código con tres comillas invertidas).
            - No incluyas texto adicional antes o después del JSON.
            - IMPORTANTE: No uses saltos de línea reales dentro de las cadenas de texto (strings). Si necesitas un salto de línea en el texto, usa el carácter de escape \\n explícitamente. El JSON debe ser parseable por JSON.parse().
            
            Estructura del JSON:
            [
                {{
                    "id": "generar_un_id_unico_corto",
                    "text": "Texto de la pregunta situacional...",
                    "options": [
                        {{ "id": "A", "text": "Opción A..." }},
                        {{ "id": "B", "text": "Opción B..." }},
                        {{ "id": "C", "text": "Opción C..." }},
                        {{ "id": "D", "text": "Opción D..." }}
                    ],
                    "correctAnswer": "ID de la opción correcta (A, B, C o D)",
                    "explanation": "Explicación detallada de por qué la correcta es la correcta y por qué las otras son incorrectas. Cita el principio o dominio del PMBOK/ECO relevante.",
                    "domain": "Personas | Procesos | Entorno Empresarial"
                }}
            ]
            
            Asegúrate de que las preguntas sean desafiantes, ambiguas como en el examen real, y requieran juicio situacional.`,
            inputVariables: ["amount", "topic"],
        });

        const formattedPrompt = await promptTemplate.format({
            amount: amount,
            topic: topic || "Gestión de Proyectos General (Mix PMP)",
        });

        const responseMsg = await model.invoke(formattedPrompt);
        // Cast content to string
        const response = String(responseMsg.content);
        
        // Extract JSON array using regex to handle potential markdown or extra text
        // Finds the substring starting with [ and ending with ] (greedy)
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        let jsonStr = jsonMatch ? jsonMatch[0] : response.trim();
        
        // Fallback cleanup if regex didn't match (unlikely for valid array) or if match still has issues
        if (!jsonMatch) {
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
            }
            jsonStr = jsonStr.trim();
        }

        try {
            const questions = JSON.parse(jsonStr);
            return NextResponse.json({ questions });
        } catch (parseError) {
            console.error("Error parsing JSON from AI:", jsonStr);
            
            // Attempt recovery for common issues (like newlines in strings)
            try {
                // Very basic recovery: escape unescaped newlines inside the string if that's the issue
                // But often it's safer to just return error or retry. 
                // Let's just log detailed error for now.
            } catch (e) { }

            return NextResponse.json({ error: "Failed to parse AI response", raw: jsonStr }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Error generating questions:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
