import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

export interface SimulationQuestion {
    id: string;
    text: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    explanation: string;
    domain: string;
}

function extractJsonArray(response: string) {
    const trimmed = response.trim();
    const withoutFence = trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
    const jsonMatch = withoutFence.match(/\[[\s\S]*\]/);

    return jsonMatch ? jsonMatch[0] : withoutFence;
}

function repairCommonJsonIssues(jsonStr: string) {
    return jsonStr
        // Gemini sometimes closes the last option object with ] instead of }.
        .replace(/(\{\s*"id"\s*:\s*"(?:A|B|C|D)"\s*,\s*"text"\s*:\s*"(?:\\.|[^"\\])*"\s*)\]/g, '$1}')
        .replace(/,\s*([}\]])/g, '$1');
}

function parseQuestionsJson(jsonStr: string) {
    try {
        return JSON.parse(jsonStr);
    } catch (firstError) {
        const repaired = repairCommonJsonIssues(jsonStr);
        if (repaired !== jsonStr) {
            return JSON.parse(repaired);
        }

        throw firstError;
    }
}

export async function generateSimulationQuestions({
    amount = 5,
    topic,
}: {
    amount?: number;
    topic?: string;
}) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set");
    }

    const model = new ChatGoogleGenerativeAI({
        model: "gemini-3-flash-preview",
        temperature: 0.35,
        apiKey,
    });

    const promptTemplate = new PromptTemplate({
        template: `Eres un experto creador de examenes de certificacion PMP (Project Management Professional).
            Tu tarea es generar {amount} preguntas de examen de alta calidad, estilo situacional, basadas en el ECO (Examination Content Outline) actual.

            Tema/Enfoque: {topic}

            REGLAS ESTRICTAS DE FORMATO:
            Debes responder UNICAMENTE con un array JSON valido.
            - No incluyas markdown (ej: bloques de codigo con tres comillas invertidas).
            - No incluyas texto adicional antes o despues del JSON.
            - IMPORTANTE: No uses saltos de linea reales dentro de las cadenas de texto (strings). Si necesitas un salto de linea en el texto, usa el caracter de escape \\n explicitamente. El JSON debe ser parseable por JSON.parse().

            Estructura del JSON:
            [
                {{
                    "id": "generar_un_id_unico_corto",
                    "text": "Texto de la pregunta situacional...",
                    "options": [
                        {{ "id": "A", "text": "Opcion A..." }},
                        {{ "id": "B", "text": "Opcion B..." }},
                        {{ "id": "C", "text": "Opcion C..." }},
                        {{ "id": "D", "text": "Opcion D..." }}
                    ],
                    "correctAnswer": "ID de la opcion correcta (A, B, C o D)",
                    "explanation": "Explicacion detallada de por que la correcta es la correcta y por que las otras son incorrectas. Cita el principio o dominio del PMBOK/ECO relevante.",
                    "domain": "Personas | Procesos | Entorno Empresarial"
                }}
            ]

            Asegurate de que las preguntas sean desafiantes, ambiguas como en el examen real, y requieran juicio situacional.`,
        inputVariables: ["amount", "topic"],
    });

    const formattedPrompt = await promptTemplate.format({
        amount,
        topic: topic || "Gestion de Proyectos General (Mix PMP)",
    });

    let lastJsonStr = '';
    let lastParseError: unknown = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
        const responseMsg = await model.invoke(formattedPrompt);
        const response = String(responseMsg.content);
        const jsonStr = extractJsonArray(response);
        lastJsonStr = jsonStr;

        try {
            const parsed = parseQuestionsJson(jsonStr);
            if (!Array.isArray(parsed)) {
                throw new Error("AI response was not a JSON array");
            }

            return parsed as SimulationQuestion[];
        } catch (parseError) {
            lastParseError = parseError;
            console.warn(`No se pudo parsear el JSON de preguntas PMP. Reintento ${attempt}/2.`);
        }
    }

    console.error("Error parsing JSON from AI:", lastJsonStr);
    throw lastParseError;
}
