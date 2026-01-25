# Estructura del Informe Final: Asistente de Preparación PMP

Este documento define la estructura sugerida para el Informe Final del Trabajo de Ingeniería en Informática.

## 1. Elementos Preliminares

*   **Portada**: Título del proyecto, nombres de los autores, nombre del director/tutor, institución, fecha.
*   **Agradecimientos y Dedicatoria** (Opcional).
*   **Resumen (Abstract)**: Breve descripción del problema, objetivos, metodología, resultados principales y conclusiones (máximo 300 palabras). Incluir versión en español e inglés.
*   **Palabras Clave**: 3-5 términos clave (ej. LLM, PMP, Educación, IA Generativa, LangChain).
*   **Índice General**.
*   **Índice de Figuras**.
*   **Índice de Tablas**.

## 2. Capítulo 1: Introducción

Este capítulo establece los cimientos del proyecto, proporcionando una visión integral del entorno tecnológico y educativo, la problemática abordada y la hoja de ruta para la solución propuesta.

*   **1.1. Contexto**:
    *   **Evolución de la IA Generativa**: Panorama actual de los LLMs (GPT-4, Claude, etc.) y su capacidad de razonamiento.
    *   **Revolución Educativa**: Cómo la IA está redefiniendo la tutoría personalizada y el aprendizaje autodidacta.
    *   **El Estándar PMP**: Importancia de la certificación del PMI en la industria global y la exigencia de su preparación.
    *   **Sinergia Tecnológica**: La oportunidad de aplicar IA avanzada para optimizar procesos de certificación profesional.

*   **1.2. Planteamiento del Problema**:
    *   **Desafíos del Aspirante**: Sobrecarga de información (PMBOK), complejidad de preguntas situacionales y falta de personalización en métodos tradicionales.
    *   **Limitaciones Actuales**: Análisis de las carencias en simuladores estáticos y cursos unidireccionales.
    *   **Necesidad Detectada**: Falta de herramientas que combinen evaluación con pedagogía activa (método socrático) y retroalimentación inmediata.
    *   **Pregunta de Investigación**: ¿Es posible desarrollar un asistente virtual que mejore significativamente la experiencia de preparación PMP mediante LLMs?

*   **1.3. Objetivos**:
    *   **1.3.1. Objetivo General**: Definición clara de la meta principal del proyecto (Desarrollo y evaluación del asistente).
    *   **1.3.2. Objetivos Específicos**: Desglose de las metas parciales alineadas con las fases del proyecto:
        *   Comprensión profunda del examen PMP.
        *   Selección y adaptación tecnológica (LLM y LangChain).
        *   Integración de estrategias pedagógicas.
        *   Diseño centrado en el usuario.
        *   Implementación técnica y validación.

*   **1.4. Justificación**:
    *   **Académica**: Aplicación de conocimientos de Ingeniería Informática en un problema complejo interdisciplinario.
    *   **Tecnológica**: Implementación de arquitecturas modernas (RAG, Prompt Engineering, Agentes) y exploración de sus límites.
    *   **Social y Profesional**: Aporte a la comunidad de gestión de proyectos facilitando el acceso a certificaciones clave.

*   **1.5. Alcance y Limitaciones**:
    *   **Alcance Funcional**: Descripción detallada de las funcionalidades incluidas en el MVP (Chat, Modos, Gamificación).
    *   **Alcance Técnico**: Stack tecnológico y plataformas soportadas.
    *   **Limitaciones y Exclusiones**:
        *   Dependencia de servicios externos (OpenAI API).
        *   Consideraciones sobre la precisión del modelo (alucinaciones).
        *   Clarificación de que no es un producto oficial del PMI.

## 3. Capítulo 2: Marco Teórico

El marco teórico profundiza en los conceptos clave que sustentan el desarrollo del asistente, abarcando desde la gestión de proyectos y la inteligencia artificial hasta la pedagogía moderna y las tecnologías de desarrollo. Se establecen aquí las bases conceptuales necesarias para comprender las decisiones de diseño e implementación.

*   **3.1. Gestión de Proyectos y Certificación PMP**:
    *   **Project Management Institute (PMI)**: Historia, relevancia global y su rol en la estandarización de la profesión.
    *   **Evolución del Estándar PMBOK**:
        *   *PMBOK 6ta Edición*: Enfoque basado en procesos, 49 procesos, 5 grupos de procesos y 10 áreas de conocimiento.
        *   *PMBOK 7ma Edición*: Cambio de paradigma hacia principios y dominios de desempeño. La transición de "entregables" a "resultados de valor".
    *   **Los 12 Principios de Dirección de Proyectos**: Análisis de principios como "Custodia (Stewardship)", "Equipo", "Interesados", "Valor", "Pensamiento Sistémico", "Liderazgo", "Adaptación (Tailoring)", "Calidad", "Complejidad", "Riesgo", "Adaptabilidad y Resiliencia" y "Cambio".
    *   **Los 8 Dominios de Desempeño**: Interesados, Equipo, Enfoque de Desarrollo y Ciclo de Vida, Planificación, Trabajo del Proyecto, Entrega, Medición, Incertidumbre.
    *   **Examination Content Outline (ECO)**:
        *   Estructura actual del examen PMP (Enero 2021 en adelante).
        *   **Personas (42%)**: Liderazgo, gestión de conflictos, apoyo al equipo virtual, mentoría.
        *   **Procesos (50%)**: Ejecución de proyectos con metodologías predictivas, ágiles e híbridas.
        *   **Entorno de Negocio (8%)**: Cumplimiento, beneficios y valor, apoyo al cambio organizacional.
        *   *Tareas y Facilitadores (Enablers)*: Desglose de lo que se evalúa en cada dominio.

*   **3.2. Inteligencia Artificial y Modelos de Lenguaje (LLMs)**:
    *   **Fundamentos de Aprendizaje Profundo**: Redes neuronales artificiales y el procesamiento de lenguaje natural (NLP).
    *   **Arquitectura Transformer**:
        *   Mecanismos de Atención (*Self-Attention*): Cómo el modelo pondera la relevancia de cada palabra en el contexto.
        *   Codificadores y Decodificadores: Diferencias entre modelos BERT (Encoder-only) y GPT (Decoder-only).
    *   **Ciclo de Entrenamiento de un LLM**:
        *   *Pre-entrenamiento*: Aprendizaje no supervisado en grandes corpus de texto.
        *   *Supervised Fine-Tuning (SFT)*: Ajuste con pares de instrucción-respuesta.
        *   *Reinforcement Learning from Human Feedback (RLHF)*: Alineación del modelo con preferencias humanas (seguridad, utilidad).
    *   **Parámetros de Inferencia**:
        *   *Temperatura y Top-P*: Control de la creatividad vs. determinismo en las respuestas.
        *   *Frequency/Presence Penalty*: Evitar repeticiones en la generación de texto.
    *   **Frameworks de Orquestación (LangChain)**:
        *   Abstracción de interacciones con LLMs.
        *   Concepto de "Chains" (Cadenas) y "Agents" (Agentes).
        *   Gestión de memoria conversacional y parsers de salida.
    *   **Ingeniería de Prompts Avanzada (Prompt Engineering)**:
        *   *Técnicas de Prompting*: Zero-shot, Few-shot learning.
        *   *Chain-of-Thought (CoT)*: Descomposición de problemas complejos en pasos lógicos.
        *   *System Prompts*: Definición de roles, tono y restricciones de comportamiento.
    *   **Generación Aumentada por Recuperación (RAG)**:
        *   Arquitectura de RAG: Recuperador (Retriever) + Generador (Generator).
        *   Embeddings y Bases de Datos Vectoriales: Búsqueda semántica para recuperar contexto relevante (PMBOK) y reducir alucinaciones.

*   **3.3. Tecnologías Web y Arquitectura de Software**:
    *   **Arquitecturas de Frontend Modernas**:
        *   *SPA (Single Page Application)* vs *MPA (Multi Page Application)*.
        *   **Next.js y el App Router**: Componentes de Servidor (RSC) vs Componentes de Cliente. Ventajas en SEO y carga inicial.
        *   *Streaming SSR*: Renderizado progresivo para mejorar el Time-To-First-Byte (TTFB).
    *   **Backend-as-a-Service (BaaS) y PocketBase**:
        *   Filosofía de "Backend ligero": Cuándo usar un BaaS vs desarrollar un backend custom.
        *   Arquitectura interna de PocketBase: Uso de Go (Golang) para concurrencia y SQLite en modo WAL para rendimiento.
        *   Realtime Subscriptions: Uso de Server-Sent Events (SSE) para actualizaciones en tiempo real.
    *   **Integración de APIs y Streaming de Texto**:
        *   Protocolo HTTP/2 y manejo de streams para respuestas de IA palabra por palabra.
        *   Manejo de estados asíncronos en el cliente.

*   **3.4. Metodologías de Desarrollo y Trabajo**:
    *   **Filosofía Ágil**: El Manifiesto Ágil y su aplicación en proyectos con alta incertidumbre tecnológica (IA).
    *   **Marco de Trabajo Scrum en Profundidad**:
        *   *Los 3 Roles*: Product Owner (Visión), Scrum Master (Facilitador), Developers (Ejecución).
        *   *Los 5 Eventos*: Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective, El Sprint mismo.
        *   *Los 3 Artefactos*: Product Backlog, Sprint Backlog, Incremento. Definición de "Done" (DoD).
    *   **Gestión de Requisitos**:
        *   *Historias de Usuario*: Estructura "Como [rol], quiero [acción], para [beneficio]".
        *   *Criterios de Aceptación*: Condiciones específicas para considerar una historia completada.
    *   **Estimación Ágil**: Puntos de historia, Planning Poker y velocidad del equipo.

*   **3.5. Pedagogía y Andragogía (Aprendizaje de Adultos)**:
    *   **Principios de Andragogía (Malcolm Knowles)**:
        *   Necesidad de saber, Autoconcepto del alumno, Experiencia previa, Disposición para aprender, Orientación al aprendizaje, Motivación intrínseca.
    *   **Taxonomía de Bloom Revisada**:
        *   Niveles cognitivos: Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear.
        *   Aplicación en preguntas PMP: Cómo las preguntas situacionales evalúan niveles superiores (Analizar/Evaluar).
    *   **Método Socrático en la Era Digital**:
        *   Constructivismo: El conocimiento se construye, no se transmite.
        *   Diseño de prompts para guiar el descubrimiento en lugar de dar la respuesta final.
    *   **Sistemas de Repetición Espaciada (SRS)**:
        *   La Curva del Olvido de Ebbinghaus.
        *   Algoritmos (ej. SuperMemo, Leitner) para programar repasos óptimos.
    *   **Gamificación (Game-based Learning)**:
        *   *Marco Octalysis*: Análisis de impulsos motivacionales (Significado Épico, Desarrollo y Logro, Empoderamiento, Propiedad, Influencia Social, Escasez, Imprevisibilidad, Evitación).
        *   *Mecánicas vs Dinámicas*: Puntos, medallas y tablas (PBL) vs estatus, competencia y altruismo.
        *   *Estado de Flujo (Flow)*: Equilibrio entre habilidad y desafío.

## 4. Capítulo 3: Estado del Arte

Este capítulo analiza el panorama actual de soluciones tecnológicas para la preparación de certificaciones y el estado de la investigación en IA educativa, identificando la brecha que este proyecto busca cerrar.

*   **4.1. Revisión de Herramientas de Preparación PMP Existentes**:
    *   **Simuladores Tradicionales**:
        *   Análisis de plataformas líderes (ej. PMI Study Hall, Rita Mulcahy’s FASTrack).
        *   Fortalezas (precisión de contenido) y debilidades (estatismo, falta de explicación interactiva).
    *   **Cursos Online y MOOCs**:
        *   Evaluación de cursos masivos (Udemy, Coursera, LinkedIn Learning).
        *   Limitaciones en personalización y feedback inmediato.
    *   **Aplicaciones Móviles**:
        *   Revisión de apps de "Flashcards" y preguntas diarias.
        *   Análisis de la gamificación existente en el mercado actual.

*   **4.2. Estado de la Cuestión: LLMs en el Ámbito Educativo**:
    *   **Evolución de Tutores Inteligentes**: De sistemas basados en reglas a la IA Generativa.
    *   **Estudios Recientes (2023-2024)**:
        *   Eficacia de ChatGPT y modelos similares en entornos de aprendizaje (Referencia a Dao, 2023; Elkins, 2023).
        *   Uso de LLMs para la generación automática de preguntas de evaluación.
    *   **Desafíos Documentados**:
        *   Alucinaciones y la importancia de la verificación factual.
        *   Sesgos en los modelos de lenguaje.

*   **4.3. Análisis Comparativo de Soluciones**:
    *   **Matriz de Comparación**: Tabla comparativa cualitativa considerando criterios como:
        *   Costo y Accesibilidad.
        *   Nivel de Interactividad (Pasivo vs. Activo).
        *   Personalización del aprendizaje (Adaptativo vs. Estático).
        *   Calidad del Feedback (Genérico vs. Específico).
    *   **Análisis de Brechas (Gap Analysis)**: Identificación de la falta de herramientas que integren la metodología socrática con la simulación rigurosa del examen PMP.

*   **4.4. Diferenciación de la Propuesta**:
    *   **Innovación Pedagógica**: Fusión de simulador + tutor socrático + gamificación.
    *   **Valor Agregado**: Cómo la solución propuesta cubre las carencias detectadas en el estado del arte.

## 5. Capítulo 4: Metodología y Gestión del Proyecto

Este capítulo detalla el enfoque metodológico adoptado para garantizar el éxito del proyecto, describiendo cómo se aplicaron los principios ágiles para gestionar la incertidumbre tecnológica y asegurar la entrega continua de valor.

*   **5.1. Metodología de Desarrollo**:
    *   **Justificación de Scrum**: Razones para elegir un enfoque iterativo e incremental en un proyecto de IA experimental.
    *   **Ciclo de Vida del Proyecto**: Descripción de las fases de inicio, planificación, ejecución, revisión y retrospectiva.
    *   **Adaptación de Roles y Eventos**: Cómo se ajustó el marco Scrum a las características del equipo y del proyecto académico.

*   **5.2. Planificación y Ejecución de Sprints**:
    *   **Sprint 1: Fundamentos y Setup Tecnológico**:
        *   *Objetivos*: Configuración del entorno de desarrollo y validación de la conectividad con OpenAI mediante LangChain.
        *   *Entregables*: Repositorio inicial, "Hola Mundo" con LLM, investigación de modelos.
    *   **Sprint 2: Prototipo Funcional y Diseño UX**:
        *   *Objetivos*: Construcción de la estructura base de la aplicación y diseño de la interfaz de usuario.
        *   *Entregables*: Wireframes, sistema de autenticación, integración frontend-backend básica.
    *   **Sprint 3: Lógica de Negocio y Pedagogía**:
        *   *Objetivos*: Implementación de los modos de estudio (Socrático/Examen) y el sistema de gamificación.
        *   *Entregables*: Gestión de sesiones, lógica de niveles y mundos, persistencia de datos.
    *   **Sprint 4: Optimización, Validación y Cierre**:
        *   *Objetivos*: Refinamiento de prompts, corrección de errores y pruebas con usuarios.
        *   *Entregables*: Versión final desplegada, documentación técnica y manual de usuario.

*   **5.3. Gestión de Riesgos y Calidad**:
    *   **Matriz de Riesgos**: Identificación y mitigación de riesgos técnicos (alucinaciones, latencia API) y de proyecto (tiempos, alcance).
    *   **Estrategia de Calidad**: Pruebas continuas, revisión de código y validación de respuestas del LLM.

*   **5.4. Herramientas de Gestión y Colaboración**:
    *   **Control de Versiones**: Uso de Git y GitHub (flujo de trabajo, ramas).
    *   **Gestión de Tareas**: Tableros Kanban para el seguimiento del Backlog y el progreso de los Sprints.
    *   **Documentación**: Herramientas utilizadas para la documentación técnica y de usuario (Markdown, Diagramas).

## 6. Capítulo 5: Análisis y Diseño del Sistema

Este capítulo traduce las necesidades detectadas en especificaciones técnicas y visuales, definiendo la estructura lógica, física y gráfica del asistente.

*   **6.1. Análisis de Requisitos**:
    *   **Identificación de Actores**: Definición del perfil del usuario (aspirante PMP) y del administrador del sistema.
    *   **Requisitos Funcionales (RF)**:
        *   *Gestión de Usuarios*: Registro, autenticación y seguimiento de progreso.
        *   *Módulo de Chat Inteligente*: Interacción en lenguaje natural, selección de modos (Guiado/Libre).
        *   *Motor de Evaluación*: Generación y corrección de preguntas tipo PMP.
        *   *Sistema de Gamificación*: Asignación de puntos, niveles y desbloqueo de mundos.
    *   **Requisitos No Funcionales (RNF)**:
        *   *Rendimiento*: Tiempos de respuesta aceptables para la interacción con el LLM (streaming).
        *   *Usabilidad*: Interfaz intuitiva y accesible (Diseño Responsivo).
        *   *Seguridad*: Protección de datos de usuario y gestión segura de claves de API.
        *   *Escalabilidad*: Capacidad de soportar múltiples usuarios concurrentes.

*   **6.2. Arquitectura del Software**:
    *   **Patrón Arquitectónico**: Descripción de la arquitectura cliente-servidor moderna (SPA + BaaS).
    *   **Diagrama de Componentes**:
        *   *Frontend*: Next.js (App Router), Componentes React, Tailwind CSS.
        *   *Backend*: PocketBase (Auth, DB, Realtime).
        *   *Orquestación de IA*: **LangChain** como capa intermedia para gestión de modelos y prompts.
        *   *Servicios Externos*: OpenAI API (Modelo GPT-4/GPT-3.5) accedido vía LangChain.
    *   **Diagrama de Flujo de Datos (DFD)**:
        *   Ciclo de vida de un mensaje: Usuario -> Frontend -> API Route (LangChain) -> OpenAI -> Frontend -> Usuario.
        *   Persistencia asíncrona de conversaciones en la base de datos.

*   **6.3. Diseño de la Base de Datos**:
    *   **Modelo de Datos**: Justificación del uso de una base de datos relacional (SQLite embebido en PocketBase).
    *   **Esquema de Colecciones**:
        *   `users`: Perfil, nivel actual, experiencia acumulada.
        *   `conversations`: Metadatos de la sesión (modo, fecha).
        *   `messages`: Contenido del chat, rol (user/assistant), timestamps.
        *   `questions`: Banco de preguntas generadas (si aplica persistencia).
    *   **Reglas de Seguridad (RLS)**: Configuración de permisos de acceso en PocketBase para asegurar la privacidad de los datos.

*   **6.4. Diseño de Interfaz Centrado en el Usuario (UX/UI)**:
    *   **Principios de Diseño**: Enfoque minimalista para reducir la carga cognitiva durante el estudio.
    *   **Prototipado (Wireframes)**: Evolución desde bocetos de baja fidelidad hasta el diseño final.
    *   **Componentes Clave**:
        *   *Dashboard*: Visualización clara del progreso y acceso a mundos.
        *   *Interfaz de Chat*: Elementos visuales para distinguir roles, renderizado de Markdown (tablas, código).
        *   *Feedback Visual*: Indicadores de carga, notificaciones de éxito/error, animaciones de gamificación.

## 7. Capítulo 6: Desarrollo e Implementación

Este capítulo documenta el proceso de construcción del asistente, detallando cómo se transformaron los diseños en software funcional, las decisiones técnicas tomadas y la resolución de problemas complejos durante la codificación.

*   **7.1. Selección y Configuración del Stack Tecnológico**:
    *   **Evaluación del Modelo LLM**: Comparativa técnica y económica (GPT-3.5 vs GPT-4 vs Claude). Justificación de la elección final (balance costo/razonamiento).
    *   **Orquestación con LangChain**: Ventajas de usar un framework estándar (flexibilidad, abstracción) frente a llamadas directas a la API.
    *   **Entorno de Desarrollo**: Configuración de Next.js con TypeScript, ESLint y Prettier para calidad de código.
    *   **Infraestructura Backend**: Despliegue y configuración de PocketBase (colecciones, autenticación, reglas de acceso).

*   **7.2. Adaptación e Implementación del Asistente (Core)**:
    *   **Integración con LangChain y OpenAI**:
        *   Uso de `ChatOpenAI` para inicializar el modelo con parámetros específicos (temperatura, streaming).
        *   Implementación de *Streaming* nativo de LangChain (`.pipe(parser).stream()`) para mejorar la latencia percibida.
        *   Manejo de errores y reintentos automáticos proporcionados por el framework.
    *   **Ingeniería de Prompts Avanzada**:
        *   Diseño de *System Prompts* para los roles "Tutor Socrático" y "Simulador de Examen".
        *   Técnicas de inyección de contexto para personalizar la respuesta según el nivel del usuario.
    *   **Gestión del Historial de Conversación**: Algoritmos para truncar o resumir el contexto y mantener la coherencia sin exceder la ventana de tokens.

*   **7.3. Implementación de Funcionalidades Clave**:
    *   **Sistema de Modos de Estudio**:
        *   *Modo Guiado*: Lógica para guiar al usuario a través de conceptos secuenciales.
        *   *Modo Libre*: Chat abierto para consultas específicas.
    *   **Gamificación y Progresión**:
        *   Lógica de desbloqueo de "Mundos" (Áreas de Conocimiento) y "Niveles" (Procesos).
        *   Sistema de cálculo de experiencia (XP) basado en interacciones y respuestas correctas.
    *   **Persistencia y Sesiones**: Sincronización de datos entre cliente y servidor para mantener el estado del usuario entre dispositivos.

*   **7.4. Desafíos Técnicos y Soluciones**:
    *   **Alucinaciones del Modelo**: Implementación de validaciones y RAG (si aplica) para minimizar información incorrecta.
    *   **Latencia y UX**: Optimizaciones en el frontend (UI optimista) para mitigar la espera de respuesta de la IA.
    *   **Formato de Respuestas**: Parsing de Markdown y bloques de código para asegurar que el contenido educativo sea legible y estructurado.

## 8. Capítulo 7: Pruebas y Resultados

Este capítulo presenta la validación integral del sistema, abarcando desde la verificación técnica del código hasta la evaluación de la experiencia educativa con usuarios reales.

*   **8.1. Estrategia de Pruebas del Software**:
    *   **Pruebas Unitarias**: Verificación de componentes aislados (ej. funciones de cálculo de XP, validadores de formularios) utilizando Jest/Vitest.
    *   **Pruebas de Integración**: Validación del flujo completo: Frontend -> API Route -> LangChain -> OpenAI -> DB, asegurando la consistencia de los datos.
    *   **Pruebas de Usabilidad (UX)**: Evaluación de la interfaz con usuarios para detectar fricciones en la navegación y claridad en la visualización del progreso.

*   **8.2. Casos de Estudio (Validación Pedagógica)**:
    *   **Metodología de los Casos**: Descripción del protocolo de prueba (duración, tareas asignadas, instrumentos de recolección de datos).
    *   **Caso 1: El Aspirante (Usuario Novato)**:
        *   *Perfil*: Persona en etapa inicial de preparación.
        *   *Resultados Cuantitativos*: Mejora en puntajes de tests simulados pre y post uso.
        *   *Resultados Cualitativos*: Percepción sobre la reducción de ansiedad y claridad de explicaciones.
    *   **Caso 2: El Experto (Validación de Contenido)**:
        *   *Perfil*: PMP certificado con experiencia docente.
        *   *Auditoría de Respuestas*: Evaluación de la precisión técnica y alineación con el PMBOK 7.
        *   *Evaluación del "Rol Socrático"*: ¿El asistente realmente guía o solo da respuestas?

*   **8.3. Evaluación del Desempeño Técnico y del Modelo**:
    *   **Métricas de Calidad de Respuesta**:
        *   *Precisión (Accuracy)*: Tasa de respuestas correctas en preguntas de control.
        *   *Coherencia*: Evaluación de la consistencia en conversaciones largas.
        *   *Alucinaciones*: Tasa de invención de términos o referencias inexistentes.
    *   **Métricas de Rendimiento del Sistema**:
        *   *Latencia*: Tiempo promedio hasta el primer token (TTFT) y tiempo total de generación.
        *   *Consumo de Tokens*: Análisis de costos por sesión de estudio.

*   **8.4. Encuesta de Satisfacción (SUS - System Usability Scale)**:
    *   Análisis de resultados de encuestas estandarizadas aplicadas a los participantes.
    *   Feedback abierto y sugerencias de mejora recolectadas.

## 9. Capítulo 8: Conclusiones y Trabajos Futuros

*   **9.1. Conclusiones**: Resumen de logros frente a los objetivos planteados.
*   **9.2. Lecciones Aprendidas**: Reflexión sobre el proceso de desarrollo e investigación.
*   **9.3. Trabajos Futuros**: Posibles mejoras (ej. App móvil, integración de voz real-time, más idiomas, modo multijugador).

## 10. Referencias Bibliográficas

*   Listado de fuentes citadas en formato APA o IEEE.

## 11. Anexos

*   **Anexo A**: Manual de Usuario.
*   **Anexo B**: Prompts utilizados (System Prompts).
*   **Anexo C**: Ejemplos de conversaciones / evaluaciones.
*   **Anexo D**: Repositorio de Código (Link).
