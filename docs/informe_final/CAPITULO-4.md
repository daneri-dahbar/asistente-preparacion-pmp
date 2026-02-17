# CAPÍTULO 4: DISEÑO DE LA SOLUCIÓN

## 4.1. Introducción
Este capítulo detalla el diseño técnico y arquitectónico del "Asistente Virtual para la Preparación del Examen PMP". Se describe la estructura lógica y física del sistema, los componentes de software desarrollados, los modelos de datos implementados y los flujos de interacción que permiten el funcionamiento de las capacidades de inteligencia artificial generativa. El diseño se ha orientado a dar respuesta a los requisitos funcionales definidos en las Épicas y Historias de Usuario (ver **Anexo A**), creando una solución escalable, modular y mantenible, que prioriza la experiencia del usuario y la precisión pedagógica.

## 4.2. Arquitectura General del Sistema
La arquitectura del sistema ha sido diseñada siguiendo los principios modernos de la ingeniería de software para aplicaciones web distribuidas, adoptando un enfoque **Serverless** y **Jamstack** (JavaScript, APIs, and Markup). Este paradigma arquitectónico permite desacoplar completamente la capa de presentación (frontend) de la lógica de negocio y los datos (backend), lo que resulta en un sistema altamente modular, escalable y seguro.

La elección de esta arquitectura responde a la necesidad de ofrecer una experiencia de usuario fluida y de baja latencia, crucial para un entorno de estudio interactivo, minimizando al mismo tiempo la carga operativa de administración de servidores. Al utilizar servicios gestionados y funciones sin servidor ("serverless functions"), el sistema puede escalar automáticamente según la demanda de los usuarios, optimizando costos y recursos computacionales. Además, este enfoque facilita la integración continua y el despliegue rápido de nuevas funcionalidades pedagógicas.

### 4.2.1. Diagrama de Arquitectura de Alto Nivel
El sistema se estructura en cuatro capas lógicas claramente diferenciadas, cada una con responsabilidades específicas y canales de comunicación definidos:

1.  **Capa de Presentación (Frontend - Client Side):**
    Esta capa es responsable de toda la interacción con el usuario final. Desarrollada con **React** y ejecutada principalmente en el navegador del usuario, se encarga de renderizar la interfaz gráfica, gestionar el estado local de la sesión de estudio (como las respuestas seleccionadas en el simulador o el historial de chat visible) y capturar los eventos de entrada. Gracias al modelo de "hidratación" de React, la aplicación ofrece una experiencia de "Single Page Application" (SPA), donde la navegación entre secciones es instantánea y no requiere recargas completas de página.

2.  **Capa de Aplicación y Orquestación (Backend - Server Side):**
    Implementada mediante **Next.js API Routes**, esta capa actúa como el cerebro lógico del sistema. Funciona como un conjunto de microservicios ligeros que se ejecutan bajo demanda. Sus responsabilidades incluyen:
    *   Validación de seguridad y autenticación de las peticiones entrantes.
    *   Orquestación del flujo de datos entre el cliente, la base de datos y el servicio de IA.
    *   Construcción de contextos (prompts) enriquecidos para el modelo de lenguaje, inyectando información pedagógica específica según el modo de estudio seleccionado.
    *   Gestión de la lógica de negocio crítica, como el cálculo de puntajes de exámenes o la generación dinámica de preguntas.

3.  **Capa de Datos y Persistencia (Data Layer):**
    Esta capa garantiza la integridad y disponibilidad de la información a largo plazo. Se utiliza un servicio de **Backend-as-a-Service (BaaS)** que provee:
    *   Una base de datos relacional para almacenar perfiles de usuarios, historiales de chat y registros de simulaciones.
    *   Un sistema de autenticación seguro (JWT) que gestiona el ciclo de vida de las sesiones de usuario.
    *   Reglas de seguridad a nivel de fila (Row Level Security) que aseguran que cada estudiante solo pueda acceder a sus propios datos.

4.  **Capa de Inteligencia Cognitiva (AI Service Layer):**
    Es el componente externo que dota de "inteligencia" al asistente. El sistema consume la API de un Modelo de Lenguaje Grande (LLM) de última generación. Esta capa no almacena estado de la aplicación; funciona como un motor de procesamiento de lenguaje natural puro, recibiendo contexto y devolviendo explicaciones, preguntas o feedback pedagógico en tiempo real.

> **[Figura 4.1: Diagrama de arquitectura de alto nivel]**
> *Sugerencia: Incluir un diagrama de bloques detallado mostrando: Cliente Web (Navegador) -> Next.js (Vercel) -> API Routes (Node.js) -> PocketBase (SQLite) / Google Gemini API.*

### 4.2.2. Stack Tecnológico Detallado
Para materializar la arquitectura propuesta, se ha realizado una selección rigurosa de tecnologías, priorizando aquellas que ofrecen un equilibrio óptimo entre rendimiento, mantenibilidad y soporte de la comunidad (ecosistema).

#### A. Core Framework y Lenguaje
*   **Next.js 16.1 (App Router):** Se utiliza la última versión estable del framework full-stack de React. La adopción del "App Router" permite aprovechar capacidades avanzadas como los **React Server Components (RSC)** y el **Streaming SSR**. Esto significa que gran parte del HTML se genera en el servidor de manera incremental, reduciendo el tamaño del paquete JavaScript que el usuario debe descargar y mejorando drásticamente el tiempo de carga inicial (First Contentful Paint).
*   **TypeScript:** Todo el código base está escrito en TypeScript. El tipado estático fuerte es fundamental en este proyecto para garantizar que las estructuras de datos complejas (como los objetos JSON de las preguntas del examen PMP o las respuestas de la API de IA) se manejen correctamente, previniendo errores en tiempo de ejecución "undefined is not a function" antes de que ocurran.

#### B. Interfaz de Usuario y Experiencia (UX)
*   **React 19:** La biblioteca de interfaz de usuario subyacente. Se aprovechan sus nuevos hooks y primitivas para la gestión eficiente del estado y las transiciones concurrentes.
*   **Tailwind CSS 4:** Framework de estilos "utility-first". Permite construir interfaces consistentes y adaptables (responsive) directamente desde el HTML. La versión 4 introduce un motor de compilación JIT (Just-in-Time) de nueva generación, ultrarrápido y con detección automática de clases.
*   **Framer Motion:** Biblioteca utilizada para las animaciones de la interfaz (transiciones entre preguntas, aparición de mensajes de chat, confeti de celebración), proporcionando una sensación de fluidez y modernidad esencial para mantener el compromiso del usuario (engagement).
*   **Lucide React:** Conjunto de iconos vectoriales SVG ligeros y consistentes visualmente, utilizados para mejorar la usabilidad de la navegación y los controles.

#### C. Backend y Base de Datos
*   **PocketBase:** Una solución de backend ultra-portátil escrita en **Go**. A diferencia de bases de datos tradicionales como PostgreSQL que requieren una administración compleja, PocketBase utiliza **SQLite** en modo WAL (Write-Ahead Logging) embebido, lo que ofrece un rendimiento excepcional para el volumen de lectura/escritura esperado en una aplicación educativa (miles de operaciones por segundo). Su API en tiempo real permite futuras expansiones.
*   **LangChain.js:** Framework de orquestación para LLMs. Actúa como una capa de abstracción sobre la API de Gemini. Permite cambiar de modelo de IA con cambios mínimos en el código, y facilita la gestión de cadenas de pensamiento y la estructuración de las salidas (parsers) para asegurar que la IA siempre responda en el formato esperado (por ejemplo, JSON válido para las simulaciones).

#### D. Motor de Inteligencia Artificial
*   **Google Gemini 3.0 Flash (Preview):** Se ha seleccionado el modelo más reciente y experimental de Google para aprovechar sus capacidades superiores de razonamiento y velocidad. Esta versión "Flash" está optimizada para respuestas de latencia ultra baja, esencial para mantener una conversación fluida en tiempo real, mientras mantiene una ventana de contexto masiva que permite analizar documentos extensos del PMBOK sin perder coherencia.

## 4.3. Componentes Principales del Asistente Virtual
El sistema ha sido construido mediante una arquitectura modular basada en componentes reutilizables, ubicados principalmente en `app/components`. Esta estrategia no solo facilita el desarrollo paralelo y las pruebas unitarias, sino que también asegura que el mantenimiento futuro sea menos propenso a errores en cascada.

### 4.3.1. Estructura del Proyecto (Frontend)
El frontend de la aplicación, desarrollado sobre **Next.js**, aprovecha la distinción entre *Server Components* (para renderizado estático y acceso a datos seguro) y *Client Components* (para interactividad).

#### A. Layout y Navegación (`Sidebar` y `Dashboard`)
*   **Componente `Sidebar`:**
    Implementado como un componente de cliente (`'use client'`), gestiona la navegación global de la aplicación. Mantiene el estado de la ruta activa y colapsa/expande el menú en dispositivos móviles para garantizar la responsividad. Utiliza iconos vectoriales de la librería `lucide-react` para ofrecer pistas visuales claras. Además, integra el control de cierre de sesión, que invoca directamente al cliente de autenticación de PocketBase para limpiar el almacenamiento local (LocalStorage) y redirigir al login.

*   **Componente `Dashboard`:**
    Actúa como el centro de mando del estudiante. Al cargarse, realiza consultas asíncronas a la colección `user_progress` y `simulations` para calcular métricas en tiempo real. Visualiza:
    *   **Nivel de Usuario:** Una barra de progreso animada con `framer-motion` que muestra la experiencia (XP) actual relativa al siguiente nivel.
    *   **Racha de Estudio:** Lógica que compara la fecha de la última actividad registrada con la fecha actual para determinar la continuidad del hábito de estudio.
    *   **Resumen de Dominios:** Tarjetas informativas que desglosan el rendimiento por áreas del PMBOK (Personas, Procesos, Entorno de Negocio).
    *   **Historial de Simulaciones:** Una lista filtrable de los exámenes realizados, permitiendo retomar los que están "en progreso" o revisar los "completados".

#### B. Módulo de Chat Inteligente (`ChatArea`)
Este componente representa el núcleo interactivo de la solución y es técnicamente el más complejo del frontend.
*   **Gestión de Estado Avanzada:** Utiliza `useRef` para mantener referencias mutables al contenedor de scroll (logrando un auto-scroll suave cuando llegan nuevos mensajes) y `useState` para gestionar la cola de mensajes y el estado de "pensando" (loading state) del asistente.
*   **Streaming de Respuesta:** La comunicación con el backend utiliza flujos de datos (`streams`). El cliente procesa los chunks de texto a medida que llegan desde la API de Gemini, reduciendo la percepción de latencia y mostrando la respuesta carácter por carácter.
*   **Inyección de Contexto Dinámico:** El componente permite al usuario seleccionar "Modos" (Socrático, Simulación, Workshop, etc.). Al cambiar el modo, se actualiza un estado que se envía como metadato en el payload de la API, alterando el comportamiento de la IA sin recargar la página.
*   **Renderizado Markdown:** Los mensajes recibidos se procesan a través de `react-markdown`. Esto permite que el asistente estructure sus explicaciones con listas, tablas, negritas y bloques de código con resaltado de sintaxis.

#### C. Simulador de Examen (`ExamSimulator`)
Diseñado para replicar fielmente las condiciones del examen de certificación PMP.
*   **Motor de Preguntas:** Este componente maneja un array de objetos JSON que representan las preguntas. Puede operar en dos modos:
    1.  **Carga Estática/Histórica:** Recupera un examen existente desde PocketBase (colección `simulations`) para continuar una sesión previa.
    2.  **Generación Dinámica:** Invoca a la API de IA (`/api/simulation/generate`) para crear un set de preguntas único basado en un tema específico y una cantidad definida (ej. 10, 45, 90 preguntas).
*   **Control de Tiempo y Navegación:** Implementa un temporizador decreciente (`useEffect` con `setInterval`) que alerta al usuario cuando el tiempo se agota. La navegación entre preguntas se gestiona mediante un índice de estado.
*   **Lógica de Evaluación:** Al finalizar, compara las respuestas del usuario (`selectedOptions`) con las `correctAnswer` almacenadas. Calcula el porcentaje de aciertos y actualiza el registro en la base de datos, marcando el examen como `completed` y guardando el puntaje final.

#### D. Componentes Auxiliares de UX
*   **`OnboardingModal`:** Un asistente tipo "wizard" de 4 pasos que se presenta a los nuevos usuarios, explicando la metodología de estudio y las funcionalidades principales.
*   **`LevelCompletedModal`:** Un componente de celebración que se activa cuando el usuario alcanza el 100% de progreso en un nivel. Utiliza animaciones de confeti y transiciones de entrada para proporcionar refuerzo positivo inmediato.

> **[Figura 4.2: Componentes de la Interfaz de Usuario]**
> *Sugerencia: Captura de pantalla compuesta mostrando: 1) El Dashboard con métricas, 2) Una sesión de Chat activa con streaming de texto, y 3) La interfaz del Simulador con una pregunta de selección múltiple.*

### 4.3.1.E Estrategias de Navegación y Modos de Estudio
El Dashboard principal actúa como un controlador de estado que adapta la experiencia de aprendizaje a través de cuatro modos de visualización distintos, gestionados por el estado `viewMode`. Esta flexibilidad permite que la aplicación sirva tanto a estudiantes novatos que necesitan estructura como a expertos que buscan práctica específica.

1.  **Modo Guiado (🗺️):**
    *   **Enfoque:** Gamificación y Progresión Lineal.
    *   **Comportamiento:** Es la vista predeterminada. Presenta el contenido organizado en "Mundos" (Fases) y "Niveles". Implementa una lógica de bloqueo estricta donde un nivel solo se habilita (`isLocked: false`) cuando el inmediatamente anterior ha sido marcado como completado en la colección `user_progress`.
    *   **Objetivo:** Garantizar que el estudiante construya su conocimiento sobre bases sólidas antes de avanzar a conceptos complejos.

2.  **Modo Desbloqueado (🔓):**
    *   **Enfoque:** Referencia y Consulta.
    *   **Comportamiento:** Utiliza la misma interfaz visual de mapas y mundos que el Modo Guiado, pero elimina todas las restricciones de acceso. Todos los niveles son accesibles instantáneamente.
    *   **Objetivo:** Permitir a usuarios avanzados o repetidores navegar libremente para reforzar áreas específicas sin la fricción de tener que "desbloquear" contenido ya conocido.

3.  **Modo Libre (♾️):**
    *   **Enfoque:** Herramientas de IA a la Carta.
    *   **Comportamiento:** Reemplaza completamente la visualización del mapa de niveles por un menú de tarjetas ("Grid Layout"). Ofrece 9 herramientas especializadas diseñadas para cubrir diferentes estilos de aprendizaje y necesidades específicas:
        *   **Modo Estándar:** El asistente clásico. Proporciona preguntas y respuestas directas sobre cualquier tema del PMBOK. Es ideal para resolver dudas rápidas y obtener definiciones precisas.
        *   **Simulación de Crisis:** Un roleplay inmersivo donde la IA actúa como un stakeholder difícil, un miembro del equipo conflictivo o un patrocinador exigente. El usuario debe actuar como Project Manager para resolver la situación aplicando habilidades blandas y técnicas.
        *   **Taller de Entregables:** Una herramienta de creación guiada paso a paso. Ayuda al usuario a redactar documentos clave como el Project Charter, la Matriz de Riesgos o el Plan de Gestión de Comunicaciones, asegurando que se incluyan todos los componentes estándar.
        *   **Examen Rápido:** Genera una serie corta de preguntas tipo PMP para poner a prueba el conocimiento del usuario. Ofrece feedback inmediato y explicaciones detalladas para cada opción de respuesta (correcta e incorrectas).
        *   **Tutor Socrático:** Diseñado para profundizar en conceptos complejos. En lugar de dar la respuesta directa, la IA guía al usuario mediante una serie de preguntas reflexivas para que él mismo descubra la solución y construya su conocimiento.
        *   **Debate (Abogado del Diablo):** Un ejercicio de argumentación donde la IA adopta deliberadamente una postura polémica o incorrecta sobre un tema de gestión de proyectos. El usuario debe convencer a la IA utilizando argumentos basados en los estándares del PMBOK y el Código de Ética.
        *   **Caso de Estudio:** Presenta escenarios complejos y multifacéticos de proyectos. El usuario actúa como consultor externo para diagnosticar problemas raíz (root cause analysis) y proponer un plan de acción correctivo integral.
        *   **Explícamelo como a un niño (ELI5):** Simplifica conceptos densos o abstractos utilizando analogías cotidianas y lenguaje sencillo. Es especialmente útil para entender la esencia de procesos complejos antes de estudiar los detalles técnicos.
        *   **Entrenador de Fórmulas:** Se centra exclusivamente en la parte cuantitativa del examen. Genera ejercicios prácticos sobre Gestión del Valor Ganado (EVM), análisis de Ruta Crítica (CPM) y proyecciones financieras, enseñando a interpretar los resultados numéricos.
    *   **Objetivo:** Ofrecer acceso directo a las capacidades del LLM fuera del contexto de un "nivel" específico, ideal para sesiones de estudio auto-dirigidas o exploración de conceptos abstractos.

4.  **Simulación Examen (🎓):**
    *   **Enfoque:** Evaluación y Métricas.
    *   **Comportamiento:** Transforma el Dashboard en un centro de análisis de datos. Muestra gráficos de rendimiento acumulado, desglose de aciertos por dominio (Personas, Procesos, Entorno) y permite lanzar generadores de exámenes de longitud variable (simulacros de 45 a 180 preguntas).
    *   **Objetivo:** Validar la preparación del estudiante bajo condiciones controladas y proporcionar feedback cuantitativo sobre su preparación real para el examen.

### 4.3.2. Servicios de Backend (API Routes)
Las API Routes de Next.js actúan como una capa de abstracción segura (Backend-for-Frontend) que oculta las credenciales de servicios terceros y centraliza la lógica de negocio.

#### A. Ruta de Chat (`/api/chat`)
Esta ruta orquesta la interacción con el modelo de lenguaje Google Gemini.
*   **Validación:** Verifica que la solicitud contenga un array de mensajes válido y un modo de operación soportado.
*   **Integración con LangChain:** Utiliza la librería `LangChain.js` para instanciar el modelo `ChatGoogleGenerativeAI` configurado con el modelo **gemini-3-flash-preview**.
*   **Ingeniería de Prompts (System Prompting):** La ruta selecciona dinámicamente el "Prompt del Sistema" basándose en el parámetro `mode` recibido:
    *   **Estándar:** Tutor experto en PMBOK 7ma Edición.
    *   **Simulación:** Stakeholder o miembro del equipo en un escenario de crisis (Roleplay).
    *   **Workshop:** Facilitador senior que guía en la creación de entregables (Project Charter, WBS, etc.).
    *   **Socrático:** Profesor que responde solo con preguntas para fomentar el análisis.
    *   **Quiz:** Examinador oficial que lanza preguntas situacionales difíciles.
*   **Manejo de Streaming:** La respuesta del modelo se canaliza para devolver un flujo de datos continuo al cliente, permitiendo tiempos de respuesta percibidos casi instantáneos.

#### B. Ruta de Generación de Simulación (`/api/simulation/generate`)
Esta ruta es crítica para la funcionalidad de generación infinita de contenido.
*   **Prompt de Estructura Estricta (JSON Mode):** Se instruye al modelo Gemini para que actúe como un generador de datos estructurados. El prompt exige que la salida sea estrictamente un array JSON válido de objetos `Question`, definiendo campos como `text`, `options`, `correctAnswer` y `explanation`.
*   **Parsing y Validación:** La respuesta cruda de la IA se limpia y parsea. Aunque se confía en la capacidad del modelo, se implementan bloques `try-catch` para manejar posibles errores de formato JSON ("alucinaciones sintácticas") y asegurar que el frontend siempre reciba datos consumibles.

### 4.3.3. Modelo de Datos (PocketBase)
La base de datos se ha diseñado utilizando el esquema relacional ligero de PocketBase. A continuación se detallan las colecciones y sus estructuras de datos.

> **[Tabla 4.1: Esquema de Base de Datos Detallado]**
> *Sugerencia: Tabla técnica describiendo tipos de datos y relaciones.*

| Colección | Tipo | Campos Clave | Relaciones | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **users** | Auth | `id`, `username`, `email`, `avatar`, `name` | - | Colección del sistema para gestión de identidad. Almacena también preferencias de UI. |
| **user_progress** | Base | `user_id` (relation), `level` (int), `xp` (int), `streak_days` (int), `last_login` (date) | 1:1 con `users` | Almacena la gamificación y métricas acumuladas del estudiante. |
| **chats** | Base | `id`, `user_id` (relation), `title` (text), `mode` (select), `created` (date) | N:1 con `users` | Cabecera de una sesión de conversación. Permite listar el historial en el sidebar. |
| **messages** | Base | `chat_id` (relation), `role` (select: 'user'\|'assistant'), `content` (text), `created` (date) | N:1 con `chats` | Almacena cada interacción individual. Indexado por `chat_id` para recuperación rápida. |
| **simulations** | Base | `user_id` (relation), `score` (int), `questions` (json), `answers` (json), `status` (select: 'in_progress'\|'completed') | N:1 con `users` | Almacena exámenes completos. El campo `questions` guarda el array completo de preguntas generadas para mantener la integridad histórica del examen realizado. |

*   **Seguridad a Nivel de Fila (RLS):**
    Todas las colecciones tienen reglas de API configuradas para garantizar la privacidad.
    *   `List/View Rule`: `user_id = @request.auth.id` (El usuario solo ve sus propios registros).
    *   `Create/Update Rule`: `user_id = @request.auth.id` (El usuario solo puede crear/modificar datos asociados a su ID).
    *   Esto asegura que, incluso si un atacante intentara acceder a la API directamente, no podría leer datos de otros estudiantes.

## 4.4. Flujos de Interacción y Procesos
El diseño dinámico de la solución se detalla a través de los flujos de datos que ocurren entre el usuario, el sistema y los servicios externos. A continuación, se describen los algoritmos y secuencias de operación para los casos de uso principales.

### 4.4.1. Flujo de Autenticación y Onboarding
Este proceso es la puerta de entrada al sistema y garantiza que cada sesión de estudio esté personalizada y segura.
1.  **Detección de Sesión (Middleware):**
    Al intentar acceder a cualquier ruta protegida (ej. `/dashboard`), el sistema verifica la validez del estado de autenticación de PocketBase.
    *   *Si es válida:* Permite el acceso a la aplicación.
    *   *Si es inválida/inexistente:* Redirige al usuario a la ruta pública de bienvenida.
2.  **Autenticación (Login/Registro):**
    El usuario introduce sus credenciales. El cliente JS invoca al método `pb.collection('users').authWithPassword()`.
    *   PocketBase valida el hash de la contraseña (bcrypt).
    *   Si es correcto, retorna un token JWT firmado y el objeto `User`.
    *   El cliente guarda el token en el almacenamiento seguro y actualiza el estado global.
3.  **Onboarding (Primer Acceso):**
    Tras el primer login, se presenta el `OnboardingModal`. Este componente guía al usuario a través de 4 pasos clave, explicando cómo usar el chat, el simulador y cómo interpretar su progreso.

### 4.4.2. Flujo de Consulta al Asistente (Chat)
Este flujo representa el ciclo completo de una interacción conversacional, desde que el usuario presiona "Enviar" hasta que la respuesta completa se visualiza.

1.  **Captura y Optimización (Cliente):**
    *   El usuario escribe un mensaje. El componente `ChatArea` bloquea inmediatamente el input.
    *   Se añade el mensaje del usuario al estado local de la UI ("Optimistic UI update") para una sensación de respuesta instantánea.
2.  **Construcción del Payload (Cliente -> Servidor):**
    Se envía una solicitud POST a `/api/chat` conteniendo:
    *   `messages`: El historial reciente de la conversación.
    *   `mode`: El modo pedagógico actual (ej. `'socratic'`, `'workshop'`).
3.  **Orquestación de IA (Servidor):**
    *   **Inyección de System Prompt:** La API selecciona la "personalidad" de la IA adecuada para el modo solicitado.
    *   **Llamada a Gemini:** Se invoca la API de Google usando `streaming: true`.
4.  **Streaming y Persistencia (Respuesta):**
    *   El servidor transmite los tokens generados al cliente en tiempo real.
    *   Una vez finalizada la transmisión, el cliente envía una petición asíncrona a PocketBase para guardar el mensaje del usuario y la respuesta completa de la IA en la colección `messages`.

> **[Figura 4.3: Diagrama de Secuencia - Interacción de Chat]**
> *Sugerencia: Diagrama UML de secuencia detallado mostrando: Usuario -> Chat UI -> Next.js API (LangChain) -> Google Gemini -> PocketBase (Async Save).*

### 4.4.3. Flujo de Simulación de Examen
El proceso de simulación es técnicamente el más riguroso, ya que involucra generación procedimental y evaluación lógica.

1.  **Configuración del Examen:**
    El usuario define los parámetros: Cantidad de preguntas (ej. 10, 50, 180) y Tópico (ej. "Gestión de Riesgos").
2.  **Generación Procedimental (AI-Driven):**
    *   El sistema construye un prompt complejo que incluye la estructura JSON exacta requerida.
    *   Gemini retorna el JSON. El backend lo parsea y valida.
    *   Se crea un registro en la colección `simulations` con estado `in_progress`.
3.  **Ejecución del Examen:**
    *   Las preguntas se cargan en el `ExamSimulator`.
    *   El usuario responde secuencialmente. Las respuestas se guardan temporalmente en el estado local o se sincronizan periódicamente.
4.  **Envío y Evaluación (Scoring Algorithm):**
    *   Al finalizar, se comparan las respuestas del usuario con las correctas.
    *   Algoritmo de puntuación:
        ```typescript
        score = 0
        for (q of questions) {
           if (userAnswers[q.id] === q.correctAnswer) score++
        }
        percentage = (score / total) * 100
        ```
5.  **Cierre y Análisis:**
    *   Se actualiza el registro en `simulations` con el puntaje final y el estado `completed`.
    *   Si el usuario aprueba un nivel (en el contexto de la gamificación), se muestra el `LevelCompletedModal`.

## 4.5. Decisiones de Diseño y Justificación Tecnológica

Esta sección detalla las decisiones críticas de ingeniería y diseño tomadas durante el desarrollo del Asistente PMP. Cada decisión se justifica no solo desde una perspectiva técnica (rendimiento, escalabilidad), sino también desde una perspectiva pedagógica.

### 4.5.1. Selección del Motor de IA: Google Gemini 3.0 Flash (Preview)
La elección del modelo de lenguaje fundacional (LLM) fue una de las decisiones más trascendentales del proyecto. Se evaluaron opciones como OpenAI GPT-4o y Anthropic Claude 3.5 Sonnet. Finalmente, se seleccionó **Gemini 3.0 Flash (Preview)** por las siguientes razones técnicas y estratégicas:

1.  **Ventana de Contexto Masiva (1M+ Tokens):** Permite que el asistente mantenga en memoria todo el historial de conversaciones y documentos de referencia del PMBOK sin sufrir "amnesia".
2.  **Velocidad de Inferencia Superior:** La variante "Flash" está optimizada para respuestas de ultra baja latencia. Esto es vital para mantener la "ilusión de conversación" y evitar que el estudiante pierda el foco esperando una respuesta.
3.  **Capacidades de Razonamiento Avanzado:** A pesar de ser un modelo optimizado para velocidad, la versión 3.0 muestra mejoras significativas en lógica deductiva, crucial para explicar preguntas situacionales complejas del examen PMP.
4.  **Eficiencia de Costos:** Ofrece una relación rendimiento/costo superior para tareas educativas de alto volumen en comparación con modelos más pesados.

### 4.5.2. Arquitectura de "Prompt Engineering" y Roles Pedagógicos
En lugar de depender de un único "System Prompt" genérico, se diseñó una arquitectura de inyección de prompts dinámica basada en el concepto pedagógico de **Andamiaje Instruccional**. El sistema cambia su comportamiento interno según el "Modo de Estudio":

*   **Modo Estándar:** Tutor equilibrado, claro y conciso.
*   **Modo Tutor Socrático:** No da respuestas directas. Responde con preguntas guía para fomentar el pensamiento crítico (Nivel de Análisis en Bloom).
*   **Modo Simulador de Examen:** Adopta un tono de "Roleplay" (Stakeholder enojado, Patrocinador exigente) para preparar al estudiante para la presión emocional y la resolución de conflictos en escenarios realistas.
*   **Modo Workshop (Taller):** Actúa como un facilitador experto que guía al usuario paso a paso en la redacción de entregables formales (ej. Acta de Constitución), asegurando que se cumplan los estándares del PMBOK.
*   **Modo Quiz:** Un examinador estricto que lanza preguntas rápidas y directas para evaluar la retención de conocimientos específicos.

La implementación técnica utiliza plantillas de prompts que se ensamblan en tiempo de ejecución inyectando variables de contexto, logrando una experiencia altamente personalizada.

### 4.5.3. Estrategia de Interfaz de Usuario (UI/UX) para el Aprendizaje Profundo
La interfaz gráfica no es meramente estética; se diseñó como una herramienta para gestionar la carga cognitiva del estudiante.

*   **Diseño "Distraction-Free":** Se adoptó una filosofía minimalista donde los elementos de navegación se atenúan durante el estudio profundo.
*   **Modo Oscuro por Defecto:** Reduce la fatiga visual durante sesiones de estudio nocturnas.
*   **Feedback Inmediato y Optimista:** Patrones de UI que reaccionan instantáneamente a las acciones del usuario para mantener el estado de "flow".

### 4.5.4. Arquitectura de Datos Híbrida (Static vs. Dynamic)
Se diseñó un modelo de datos híbrido que combina la inmutabilidad de los estándares educativos con la flexibilidad del progreso del usuario.

*   **Contenido Estático en Código (`gameData.ts`):** La estructura del PMBOK (Dominios, Tareas, Principios) se codifica directamente en el cliente para garantizar acceso instantáneo y tipado estático.
*   **Datos Dinámicos en PocketBase:** Solo los datos generados por el usuario se persisten en la base de datos, separando claramente la lógica de dominio del estado del usuario.

### 4.5.5. Enfoque de Gamificación Estructural
La gamificación se integró en el núcleo de la navegación.

*   **Progresión Bloqueada:** El usuario debe "conquistar" conceptos para desbloquear los siguientes, asegurando una ruta de aprendizaje coherente.
*   **Sistema de XP y Celebración:** Los puntos de experiencia y las modales de "Nivel Completado" (`LevelCompletedModal`) utilizan recompensas visuales (confeti) para motivar al usuario a completar sus objetivos diarios.

## 4.6. Consideraciones de Seguridad y Robustez

La seguridad en el desarrollo de software educativo garantiza la integridad del proceso de aprendizaje.

### 4.6.1. Gestión Segura de Credenciales
Las claves API sensibles (`GOOGLE_API_KEY`) se almacenan en variables de entorno del lado del servidor, nunca expuestas al cliente. Next.js garantiza este aislamiento por diseño.

### 4.6.2. Validación de Datos y Prevención de Inyecciones
*   **Validación de Esquema:** Todas las entradas a los API Endpoints se validan rigurosamente (aunque el código actual utiliza validación manual y tipos TypeScript, la arquitectura está preparada para esquemas Zod).
*   **Sanitización:** Se verifica la estructura de los JSON generados por la IA antes de renderizarlos.

### 4.6.3. Aislamiento de Datos Multi-Inquilino (Row Level Security)
Se implementa RLS en PocketBase:
*   `user_id = @request.auth.id`: Regla inmutable que asegura que cada estudiante solo acceda a sus propios datos, independientemente de la lógica del frontend.

### 4.6.4. Privacidad
El sistema minimiza la recolección de datos, almacenando solo lo necesario para la continuidad pedagógica y el seguimiento del progreso.
