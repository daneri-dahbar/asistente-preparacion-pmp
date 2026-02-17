# ANEXO B: PLANIFICACIÓN DETALLADA DE SPRINTS Y BACKLOG

Este anexo detalla la ejecución operativa del proyecto bajo la metodología Scrum descrita en el **Capítulo 3**. Se presenta el desglose cronológico y técnico del trabajo en **4 Sprints** principales, especificando los objetivos estratégicos, el *Sprint Backlog* seleccionado, el desglose de tareas de ingeniería y los resultados de las retrospectivas.

La planificación se alineó estrictamente con las Épicas e Historias de Usuario definidas en el **Anexo A**, asegurando la trazabilidad bidireccional entre los requisitos del negocio y los entregables técnicos.

## B.1. Estrategia de Ejecución y Roadmap

El desarrollo se estructuró en 4 iteraciones de **3 semanas** de duración cada una, siguiendo un enfoque incremental e iterativo. Se utilizó un tablero Kanban digital (simulado mediante GitHub Projects) para el seguimiento de tareas.

### Ceremonias Realizadas
*   **Sprint Planning:** Al inicio de cada ciclo, para seleccionar las historias del Product Backlog y estimar su complejidad (Puntos de Historia).
*   **Daily Standups:** Revisiones asíncronas diarias para identificar bloqueos técnicos.
*   **Sprint Review:** Demostración del incremento funcional al final de cada iteración.
*   **Retrospective:** Análisis de mejora continua aplicado al proceso de desarrollo.

### Cronograma de Alto Nivel

| Sprint | Fechas (Simuladas) | Foco Principal | Épicas Abordadas | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint 1** | Semanas 1-3 | Fundamentos, Arquitectura y Auth | E01, E05 | Completado |
| **Sprint 2** | Semanas 4-6 | Núcleo de IA y Lógica Conversacional | E02 | Completado |
| **Sprint 3** | Semanas 7-9 | Motor de Simulación y Evaluación | E03 | Completado |
| **Sprint 4** | Semanas 10-12 | Gamificación, Métricas y Pulido | E04, E05 | Completado |

---

## B.2. Detalle de Iteraciones

A continuación, se documenta la "vida" de cada Sprint, desde su planificación hasta su cierre.

### Sprint 1: Fundamentos y Prototipo Inicial

**Objetivo del Sprint:** Establecer la arquitectura base del proyecto ("Walking Skeleton"), configurar el entorno de desarrollo e implementar el sistema de gestión de identidad seguro para permitir el acceso de los primeros usuarios de prueba.

**Riesgos Identificados:**
*   Curva de aprendizaje de Next.js 16 (App Router) y Server Actions.
*   Configuración correcta de reglas de seguridad en PocketBase (RLS).

#### Sprint Backlog (Historias Seleccionadas)

| ID | Historia de Usuario / Tarea | Prioridad | Estimación |
| :--- | :--- | :--- | :--- |
| **T-01** | Configuración de Entorno y Repositorio | Alta | 3 pts |
| **T-02** | Infraestructura de Datos (PocketBase) | Alta | 5 pts |
| **HU-02** | Autenticación y Persistencia | Alta | 8 pts |
| **HU-03** | Gestión de Perfil de Usuario | Media | 5 pts |
| **HU-22** | Diseño Responsivo (Layout Base) | Alta | 5 pts |
| **HU-19** | Privacidad de Datos (RLS) | Crítica | 5 pts |
| **HU-01** | Onboarding de Nuevo Usuario | Media | 8 pts |

#### Desglose de Tareas Técnicas (Engineering Tasks)

*   **Infraestructura y Configuración:**
    *   [DevOps] Inicializar repositorio Git y configurar `.gitignore`.
    *   [Frontend] Crear proyecto Next.js con TypeScript, ESLint y Tailwind CSS.
    *   [Backend] Desplegar instancia local de PocketBase y verificar conexión HTTP.
    *   [Frontend] Configurar alias de rutas (`@/components`, `@/lib`) en `tsconfig.json`.

*   **Autenticación y Seguridad:**
    *   [Backend] Definir colección `users` en PocketBase con campos: `name`, `avatar`, `level`.
    *   [Backend] Escribir reglas API (RLS): `Admin only` para escritura general, `id = @request.auth.id` para lectura propia.
    *   [Frontend] Implementar `AuthProvider` (Context API) para manejo de estado global de sesión.
    *   [Frontend] Crear Middleware (`middleware.ts`) para proteger rutas `/dashboard/*`.
    *   [UI] Diseñar y maquetar formularios de Login y Registro con validación Zod.

*   **Interfaz de Usuario (UI/UX):**
    *   [UI] Implementar `Sidebar` responsivo con Framer Motion (colapsable en móvil).
    *   [UI] Crear componente `OnboardingModal` con persistencia de estado (`localStorage` + DB).
    *   [UI] Desarrollar vista de Perfil con funcionalidad de subida de avatar.

#### Retrospectiva del Sprint 1
*   **Lo bueno:** La integración de PocketBase fue mucho más rápida de lo esperado en comparación con Firebase.
*   **A mejorar:** El manejo de estado de sesión en componentes de servidor (RSC) vs componentes de cliente causó confusión inicial.
*   **Acción:** Se estandarizó el uso de un hook `useAuth` solo en componentes cliente.

---

### Sprint 2: Implementación del Asistente Inteligente

**Objetivo del Sprint:** Desarrollar el "corazón" del sistema: el núcleo conversacional. Integrar el modelo Gemini 3.0 Flash, habilitar el streaming de respuestas para mejorar la UX y configurar las distintas personalidades pedagógicas.

**Riesgos Identificados:**
*   Latencia alta en respuestas de la IA.
*   Posible exposición de la API Key en el cliente.
*   Alucinaciones del modelo en temas técnicos.

#### Sprint Backlog (Historias Seleccionadas)

| ID | Historia de Usuario | Prioridad | Estimación |
| :--- | :--- | :--- | :--- |
| **HU-20** | Protección de API Key (Proxy) | Crítica | 3 pts |
| **HU-04** | Chat Streaming en Tiempo Real | Alta | 8 pts |
| **HU-05** | Renderizado de Markdown Rico | Media | 5 pts |
| **HU-06** | Memoria Contextual | Alta | 5 pts |
| **HU-07** | Modo Tutor Socrático | Alta | 5 pts |
| **HU-08** | Modo Roleplay | Media | 5 pts |
| **HU-09** | Modo Taller de Entregables | Baja | 3 pts |

#### Desglose de Tareas Técnicas (Engineering Tasks)

*   **Integración de IA (Backend):**
    *   [Backend] Crear Route Handler `/api/chat` para ocultar la comunicación con Google.
    *   [Seguridad] Configurar variables de entorno en servidor (`GOOGLE_API_KEY`).
    *   [Backend] Implementar `GoogleGenerativeAIStream` (AI SDK) para streaming de texto.
    *   [Lógica] Desarrollar servicio de inyección de *System Prompts* dinámicos según el modo seleccionado.

*   **Interfaz de Chat (Frontend):**
    *   [Frontend] Implementar hook `useChat` para manejo de mensajes y estado de carga (`isLoading`).
    *   [UI] Integrar `react-markdown` con plugins (`remark-gfm`) para tablas y listas.
    *   [UI] Crear componentes visuales para mensajes de usuario (burbuja azul) vs IA (burbuja gris con logo).
    *   [UX] Implementar *auto-scroll* suave al recibir nuevos tokens.

*   **Ingeniería de Prompts:**
    *   [AI] Diseñar y testear el prompt "Socrático": *Restricción de no responder, solo preguntar*.
    *   [AI] Diseñar prompt "Roleplay": *Definición de personalidades (Stakeholder enojado)*.
    *   [AI] Implementar ventana deslizante de contexto (últimos 10 mensajes) para mantener coherencia.

#### Retrospectiva del Sprint 2
*   **Lo bueno:** El streaming mejora drásticamente la percepción de velocidad. Gemini 3.0 es muy capaz en razonamiento lógico.
*   **A mejorar:** Las tablas de Markdown a veces rompen el diseño móvil.
*   **Acción:** Se añadió un contenedor con `overflow-x-auto` a las tablas renderizadas.

---

### Sprint 3: Módulo de Simulación y Evaluación

**Objetivo del Sprint:** Construir el motor de generación procedural de exámenes y la interfaz de simulación cronometrada. Este sprint transforma la herramienta de un simple chat a una plataforma de evaluación objetiva.

**Riesgos Identificados:**
*   Generación de JSON inválido por parte de la IA.
*   Pérdida de estado del examen si el usuario recarga la página.

#### Sprint Backlog (Historias Seleccionadas)

| ID | Historia de Usuario | Prioridad | Estimación |
| :--- | :--- | :--- | :--- |
| **HU-11** | Generador de Preguntas (JSON) | Crítica | 8 pts |
| **HU-23** | Validación de Integridad (Zod) | Alta | 3 pts |
| **HU-12** | Interfaz de Examen (Simulador) | Alta | 8 pts |
| **HU-13** | Motor de Evaluación y Feedback | Alta | 5 pts |
| **HU-14** | Historial de Intentos | Media | 5 pts |

#### Desglose de Tareas Técnicas (Engineering Tasks)

*   **Generación y Validación:**
    *   [AI] Crear prompt específico para salida JSON estructurada (`Schema enforcement`).
    *   [Backend] Implementar esquema Zod: `QuestionSchema` (pregunta, opciones[], respuesta, explicación).
    *   [Backend] Crear lógica de reintento (retry) si el JSON generado es inválido.

*   **Simulador (Frontend):**
    *   [UI] Desarrollar componente `ExamSimulator` aislado (sin sidebar/chat).
    *   [Lógica] Implementar máquina de estados del examen: `idle` -> `loading` -> `active` -> `finished`.
    *   [UI] Crear temporizador decreciente (`CountdownTimer`).
    *   [UI] Diseñar vista de resultados con indicadores visuales (Check verde / Cruz roja).

*   **Persistencia:**
    *   [DB] Crear colección `simulation_results` en PocketBase.
    *   [Backend] Guardar el examen completo (preguntas + respuestas usuario) para revisión futura.

#### Retrospectiva del Sprint 3
*   **Lo bueno:** La generación procedural garantiza que el usuario nunca memorice preguntas.
*   **A mejorar:** La generación de 10 preguntas tarda unos 15 segundos, lo cual es lento.
*   **Acción:** Se implementó una pantalla de carga con "tips de estudio" aleatorios para amenizar la espera.

---

### Sprint 4: Gamificación, Optimización y Cierre

**Objetivo del Sprint:** Implementar las mecánicas de retención (gamificación), optimizar el rendimiento global, realizar pruebas de carga y finalizar la documentación académica.

**Riesgos Identificados:**
*   Complejidad lógica en el cálculo de desbloqueo de niveles.
*   "Bugs de integración" al unir todos los módulos.

#### Sprint Backlog (Historias Seleccionadas)

| ID | Historia de Usuario | Prioridad | Estimación |
| :--- | :--- | :--- | :--- |
| **HU-15** | Mapa de Niveles (Bloqueo/Desbloqueo) | Alta | 5 pts |
| **HU-16** | Sistema de XP y Nivel de Usuario | Media | 5 pts |
| **HU-17** | Racha de Estudio (Streak) | Baja | 3 pts |
| **HU-18** | Dashboard de Métricas | Media | 5 pts |
| **HU-21** | Manejo de Errores Global (Error Boundary) | Alta | 3 pts |
| **Cierre** | Documentación y Despliegue Final | - | - |

#### Desglose de Tareas Técnicas (Engineering Tasks)

*   **Gamificación:**
    *   [Lógica] Definir archivo maestro `gameData.ts` con la estructura de Mundos y Niveles.
    *   [Backend] Actualizar perfil de usuario al completar nivel: `completedLevels.push(id)`.
    *   [UI] Implementar efecto de confeti (`canvas-confetti`) al aprobar.
    *   [Lógica] Calcular racha diaria comparando `lastLoginDate`.

*   **Calidad y Cierre:**
    *   [Frontend] Envolver aplicación en `ErrorBoundary` de React para capturar crasheos no controlados.
    *   [UX] Implementar notificaciones tipo "Toast" (`react-hot-toast`) para feedback de acciones.
    *   [Testing] Ejecutar pruebas de carga manuales (ver Anexo C).
    *   [Doc] Generar capturas de pantalla y redactar manual de usuario.

#### Retrospectiva Final (Project Post-Mortem)
*   **Conclusión:** Se logró un MVP robusto que cumple con todos los "Must Have".
*   **Deuda Técnica:** Queda pendiente implementar tests unitarios automatizados (Jest/Vitest) para la lógica de negocio pura, ya que la validación fue principalmente manual/exploratoria.
