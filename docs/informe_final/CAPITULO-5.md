# CAPÍTULO 5: IMPLEMENTACIÓN DEL ASISTENTE VIRTUAL

## 5.1. Introducción
Este capítulo describe el proceso de construcción y materialización del "Asistente de Preparación PMP". Se detalla cómo el diseño arquitectónico propuesto en el capítulo anterior, y los requisitos funcionales especificados en el **Anexo A** (Épicas e Historias de Usuario), fueron transformados en un prototipo funcional de software siguiendo el plan de trabajo iterativo desglosado en el **Anexo B** (Planificación de Sprints). El manual detallado de operación para el usuario final se encuentra disponible en el **Anexo D**. Se abordan las herramientas de desarrollo seleccionadas, la configuración del entorno, la implementación de los componentes de frontend y backend, la integración de la Inteligencia Artificial Generativa y la configuración de la base de datos. Asimismo, se discuten los desafíos técnicos encontrados durante la codificación y las soluciones adoptadas para garantizar un sistema robusto, seguro y escalable.

## 5.2. Entorno de Desarrollo y Configuración

La fase de implementación comenzó con la definición y preparación de un entorno de desarrollo robusto, diseñado para maximizar la "Experiencia del Desarrollador" (DX) y garantizar la reproducibilidad del código entre diferentes máquinas. Se priorizó un enfoque de "Infraestructura como Código" y configuración estandarizada.

### 5.2.1. Selección y Justificación del Stack Tecnológico
Para la construcción del sistema se seleccionó un conjunto de tecnologías modernas ("Modern Stack") que favorecen el desarrollo rápido, la seguridad de tipos y el rendimiento en el borde (Edge). A continuación, se detalla la elección de cada componente.

> **[Tabla 5.1: Stack Tecnológico del Proyecto]**
>
> | Componente | Tecnología Seleccionada | Versión | Justificación Técnica |
> | :--- | :--- | :--- | :--- |
> | **Framework Frontend** | Next.js (App Router) | 16.1+ | Renderizado híbrido (SSR/CSR), Server Actions, Streaming, y soporte nativo para React Server Components. |
> | **Librería UI** | React | 19.0+ | Hooks modernos, gestión de estado optimizada y directivas como `use client` para interactividad. |
> | **Lenguaje** | TypeScript | 5.3+ | Tipado estático estricto para reducir errores en tiempo de ejecución, crucial para manejar estructuras de datos complejas del PMBOK. |
> | **Estilizado** | Tailwind CSS | 4.0+ | Motor JIT (Just-in-Time) de nueva generación, compilación instantánea y variables CSS nativas para temas. |
> | **Inteligencia Artificial** | Google Gemini API | 3.0 Flash (Preview) | Modelo multimodal de última generación con ventana de contexto de 1M+ tokens, razonamiento superior y latencia ultra baja. |
> | **Orquestación IA** | LangChain.js | 0.3+ | Abstracción agnóstica del modelo, gestión eficiente de cadenas de prompts y memoria conversacional. |
> | **Base de Datos / Auth** | PocketBase | 0.22+ | Backend-as-a-Service ligero basado en SQLite (modo WAL), con autenticación JWT integrada y reglas de seguridad (RLS). |
> | **Iconografía** | Lucide React | Latest | Iconos vectoriales SVG ligeros, consistentes y altamente personalizables. |
> | **Validación** | Zod | 3.23+ | Validación de esquemas en tiempo de ejecución (runtime), esencial para verificar las respuestas JSON de la IA. |

### 5.2.2. Configuración del Entorno Local
Antes de iniciar la codificación, se estandarizaron las herramientas base del sistema operativo (Windows 11 en este caso):

1.  **Runtime de JavaScript:** Se instaló **Node.js LTS** (v20.x o superior) para garantizar estabilidad y compatibilidad con las últimas características de Next.js 16.
2.  **Gestor de Paquetes:** Se optó por **npm** (Node Package Manager) configurado para asegurar la instalación exacta de versiones.
3.  **Sistema de Control de Versiones:**
    *   **Git:** Configurado con claves SSH para autenticación segura con GitHub.
    *   **Repositorio:** `https://github.com/daneri-dahbar/asistente-preparacion-pmp.git`
4.  **Entorno de Desarrollo Integrado (IDE):**
    *   **Visual Studio Code (VS Code)** con extensiones recomendadas (`dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`, `bradlc.vscode-tailwindcss`).

### 5.2.3. Inicialización y Estructura del Proyecto Next.js
El núcleo de la aplicación se inicializó utilizando `create-next-app` con las banderas modernas habilitadas por defecto:

```bash
npx create-next-app@latest asistente-preparacion-pmp \
  --typescript \
  --tailwind \
  --eslint \
  --app \           # App Router (obligatorio en Next.js 16)
  --src-dir=false   # Estructura plana en raíz para simplicidad
  --import-alias "@/*"
```

**Estructura de Carpetas Clave:**
*   `app/layout.tsx`: Root Layout con inyección de fuentes (`Geist`) y metadatos globales.
*   `app/api/`: Route Handlers para endpoints de backend (`chat`, `simulation`).
*   `app/components/`: Componentes reutilizables divididos por dominio (`ui`, `workspace`, `layout`).
*   `lib/`: Utilidades puras (`pocketbase.ts`, `gemini.ts`, `utils.ts`).
*   `types/`: Definiciones de tipos TypeScript compartidas (`UserProgress`, `Message`).

### 5.2.4. Configuración de Variables de Entorno y Seguridad
La seguridad se gestiona mediante variables de entorno en `.env.local`:

*   `GOOGLE_API_KEY`: Clave privada para acceder a los modelos de Gemini (Server-side only).
*   `NEXT_PUBLIC_POCKETBASE_URL`: URL de la instancia de base de datos (expuesta al cliente para conexiones realtime).

## 5.3. Implementación del Frontend (Interfaz de Usuario)

La interfaz de usuario (UI) busca reducir la carga cognitiva ajena al aprendizaje y facilitar el estado de "flow". Se implementó sobre React 19 aprovechando las nuevas capacidades de concurrencia y transiciones.

### 5.3.1. Arquitectura de Componentes y Patrón "Server-First"
Se siguió rigurosamente el patrón de **Server Components** por defecto:

*   **Server Components (RSC):** Utilizados para el layout, fetch de datos inicial y rutas protegidas (`app/dashboard/layout.tsx`). Reducen el JavaScript enviado al cliente.
*   **Client Components:** Reservados para interactividad (`'use client'`). Ejemplos: `ChatArea.tsx` (manejo de input), `ExamSimulator.tsx` (estado del quiz), `OnboardingModal.tsx` (wizard inicial).

### 5.3.2. Componentes de Experiencia de Usuario (UX)

#### A. Onboarding y Personalización
El componente `OnboardingModal.tsx` gestiona la primera experiencia del usuario. Implementa un wizard de 4 pasos que:
1.  Utiliza el nombre del usuario para personalizar la experiencia.
2.  Explica la metodología del asistente (Socrático, Simulaciones).
3.  Establece el tono de la interacción.
4.  Guarda el estado de completitud en `localStorage` para no repetir el tutorial.

#### B. Gamificación y Feedback
El `LevelCompletedModal.tsx` proporciona feedback visual inmediato al superar una prueba. Utiliza `framer-motion` para animaciones de entrada y confeti (`canvas-confetti`) para celebrar el logro, reforzando positivamente el progreso del estudiante.

### 5.3.3. Módulo de Conversación (ChatArea)
El componente `ChatArea.tsx` es el núcleo de la interacción:
1.  **Streaming:** Utiliza `ReadableStream` para procesar la respuesta de la IA token a token, reduciendo la latencia percibida.
2.  **Markdown Rendering:** Implementa `react-markdown` con soporte para GFM (GitHub Flavored Markdown), permitiendo renderizar tablas, listas y bloques de código con resaltado de sintaxis (`prismjs` o similar) dentro del chat.
3.  **Scroll Automático:** Lógica inteligente para mantener el scroll en el último mensaje mientras se genera la respuesta.

### 5.3.4. Motor de Simulación (ExamSimulator)
El simulador funciona como una Máquina de Estados Finitos (FSM):
*   **Estados:** `idle` -> `loading` -> `question` -> `review` -> `results`.
*   **Persistencia:** Las respuestas se mantienen en memoria durante el examen y solo se envían al servidor al finalizar para calcular el puntaje y actualizar el XP del usuario.

### 5.3.5. Navegación y Modos de Estudio
El `Dashboard` implementa una navegación híbrida:
*   **Sidebar:** Navegación lineal por fases y niveles (bloqueados/desbloqueados según progreso).
*   **Modo Libre (Grid):** Un layout de tarjetas (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) que permite acceso directo a herramientas especializadas (Simulación de Crisis, Taller de Entregables, etc.) sin restricciones de nivel.

## 5.4. Implementación del Backend y Lógica de IA

El backend se implementó utilizando **Next.js API Routes**, actuando como orquestador seguro entre el cliente y el modelo Gemini.

### 5.4.1. Integración con Gemini 3.0 Flash
Se actualizó el núcleo de IA para utilizar el modelo `gemini-3-flash-preview` a través de `ChatGoogleGenerativeAI` de LangChain.

```typescript
// app/api/chat/route.ts
const model = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview", // Modelo de última generación
  temperature: 0.7,
  streaming: true,
  apiKey: apiKey,
});
```
Esta actualización permite respuestas más rápidas y una ventana de contexto significativamente mayor para mantener el hilo de conversaciones largas o analizar casos de estudio extensos.

### 5.4.2. Inyección Dinámica de Sistema (Dynamic System Prompting)
La característica más potente del backend es la capacidad de cambiar la "personalidad" de la IA dinámicamente según el `mode` seleccionado por el usuario. El endpoint `POST /api/chat` intercepta la solicitud e inyecta un `SystemMessage` específico antes de llamar al modelo.

**Modos Implementados:**

1.  **Estándar:** Tutor experto, respuestas directas y concisas.
2.  **Simulación (Crisis):** Rol de stakeholder difícil/emocional. Inicia con un escenario de conflicto.
3.  **Taller (Workshop):** Facilitador que guía paso a paso en la creación de entregables (Project Charter, Riesgos).
4.  **Socrático:** Profesor que responde con preguntas para fomentar el pensamiento crítico.
5.  **Examen Rápido (Quiz):** Examinador que lanza preguntas de opción múltiple y da feedback inmediato.
6.  **Debate (Abogado del Diablo):** Adopta posturas polémicas (ej. "Agile no sirve") para obligar al usuario a argumentar.
7.  **Caso de Estudio:** Consultor que presenta escenarios complejos para diagnóstico de causa raíz.
8.  **ELI5 (Explícamelo como a un niño):** Usa analogías cotidianas para explicar conceptos abstractos.
9.  **Entrenador de Fórmulas (Math):** Tutor riguroso enfocado en EVM, CPM y matemáticas de proyectos.

Además, existen modos específicos de nivel (`level_practice`, `level_lesson`, `level_oracle`, `level_exam`) que restringen el conocimiento de la IA exclusivamente al tema del nivel actual, evitando que el estudiante se disperse.

### 5.4.3. Pipeline de Streaming
La respuesta se transmite al cliente mediante un `ReadableStream` personalizado que encadena la salida de LangChain (`pipe(parser).stream(...)`), permitiendo una experiencia de usuario fluida y en tiempo real.

## 5.5. Base de Datos y Persistencia

### 5.5.1. PocketBase y SQLite WAL
Se mantuvo **PocketBase** como solución BaaS por su eficiencia y simplicidad.
*   **Motor:** SQLite en modo WAL (Write-Ahead Logging) para alta concurrencia de lectura.
*   **Colecciones:**
    *   `users`: Perfil, XP, progreso.
    *   `chats`: Historial de conversaciones (reemplazando a la antigua colección `study_sessions`).
    *   `simulation_results`: Resultados detallados de exámenes y simulacros.
*   **Reglas de Seguridad (RLS):** Configuradas para asegurar que cada usuario solo pueda acceder y modificar sus propios datos (`id = @request.auth.id`).
