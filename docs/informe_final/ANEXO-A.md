# ANEXO A: ESPECIFICACIÓN DETALLADA DE REQUISITOS (ÉPICAS E HISTORIAS DE USUARIO)

Este anexo presenta el desglose exhaustivo de los requisitos funcionales y no funcionales del proyecto "Asistente de Preparación PMP". Siguiendo la metodología ágil Scrum adaptada para este trabajo, el alcance se ha organizado en **Épicas** (grandes contenedores de funcionalidad) e **Historias de Usuario** (unidades de trabajo implementables), cada una con sus respectivos **Criterios de Aceptación** (*Definition of Done*).

Esta documentación sirvió como el *Product Backlog* vivo del proyecto, guiando las decisiones de diseño arquitectónico (Capítulo 4) y la implementación técnica (Capítulo 5).

## A.1. Mapa de Épicas

El sistema se estructura en torno a cinco ejes funcionales principales:

| ID | Épica | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **E01** | **Gestión de Identidad y Personalización** | Funcionalidades para el registro, autenticación, gestión de perfil y personalización de la experiencia del usuario (Onboarding). | Alta |
| **E02** | **Núcleo de Aprendizaje Conversacional (IA)** | El motor de chat inteligente, incluyendo la gestión de prompts dinámicos, memoria de contexto y los múltiples roles pedagógicos del asistente. | Crítica |
| **E03** | **Simulación y Evaluación** | Herramientas para la generación procedural de exámenes, ejecución de simulacros cronometrados y análisis de resultados. | Crítica |
| **E04** | **Gamificación y Progresión** | Mecánicas de juego (niveles, XP, rachas, logros) diseñadas para fomentar el hábito de estudio y visualizar el avance. | Media |
| **E05** | **Arquitectura, Seguridad y Calidad** | Requisitos no funcionales transversales: rendimiento, privacidad de datos, seguridad de API y manejo de errores. | Alta |

---

## A.2. Detalle de Historias de Usuario

A continuación, se detallan las historias de usuario que componen cada épica.

### Épica 1: Gestión de Identidad y Personalización (E01)

#### HU-01: Onboarding de Nuevo Usuario (Tutorial)
**Como** nuevo estudiante,  
**Quiero** ser guiado a través de un recorrido interactivo la primera vez que ingreso,  
**Para** comprender rápidamente la metodología de "Mundos" y cómo utilizar las herramientas de IA sin necesidad de leer un manual.

**Criterios de Aceptación:**
*   [x] El sistema debe detectar si es el primer inicio de sesión del usuario (`isNewUser`).
*   [x] Se debe desplegar un modal multipaso (Wizard) que explique: 1) Estructura del PMBOK, 2) Uso del Chat, 3) Simulador.
*   [x] El sistema debe solicitar el nombre preferido del usuario para personalizar los saludos de la IA.
*   [x] Al finalizar, se debe persistir el estado `hasOnboarded: true` en la base de datos para no repetir el tour en futuras sesiones.

#### HU-02: Autenticación y Persistencia de Sesión
**Como** estudiante recurrente,  
**Quiero** mantener mi sesión activa incluso si recargo la página o cierro el navegador,  
**Para** no tener que ingresar mis credenciales cada vez que quiero estudiar unos minutos.

**Criterios de Aceptación:**
*   [x] Implementación de autenticación mediante JWT (JSON Web Tokens).
*   [x] El token debe almacenarse de forma segura en el almacenamiento local o cookies httpOnly.
*   [x] El middleware de la aplicación debe verificar la validez del token en cada cambio de ruta (`Next.js Middleware`).
*   [x] Si el token expira, el usuario debe ser redirigido automáticamente a la pantalla de Login.

#### HU-03: Gestión de Perfil de Usuario
**Como** estudiante,  
**Quiero** poder ver y editar mis datos básicos (avatar, nombre),  
**Para** sentir que el entorno de estudio es personal y propio.

**Criterios de Aceptación:**
*   [x] Visualización del avatar del usuario en la barra lateral y en los mensajes del chat.
*   [x] Integración con el servicio de avatares de PocketBase o uso de UI Avatars por defecto.
*   [x] Opción de "Cerrar Sesión" claramente visible y accesible.

---

### Épica 2: Núcleo de Aprendizaje Conversacional (E02)

#### HU-04: Chat con Streaming en Tiempo Real
**Como** estudiante,  
**Quiero** ver la respuesta de la IA generándose progresivamente (efecto máquina de escribir),  
**Para** reducir la ansiedad de espera y leer a velocidad natural.

**Criterios de Aceptación:**
*   [x] Implementación de `ReadableStream` en el cliente y servidor.
*   [x] La latencia inicial (TTFB) debe ser inferior a 1 segundo.
*   [x] El chat debe realizar *auto-scroll* inteligente (solo si el usuario está al final de la conversación).
*   [x] Indicador visual de "La IA está escribiendo..." durante la generación.

#### HU-05: Renderizado de Contenido Rico (Markdown)
**Como** estudiante,  
**Quiero** que las explicaciones incluyan formato (negritas, listas, tablas, código),  
**Para** facilitar la lectura y comprensión de conceptos estructurados.

**Criterios de Aceptación:**
*   [x] El componente de chat debe parsear Markdown estándar.
*   [x] Las tablas deben renderizarse con estilos CSS claros y bordes definidos.
*   [x] Los bloques de código deben tener resaltado de sintaxis (syntax highlighting).
*   [x] Soporte para listas anidadas y citas en bloque.

#### HU-06: Memoria Contextual de la Conversación
**Como** estudiante,  
**Quiero** hacer preguntas de seguimiento (ej. "¿Me das otro ejemplo de eso?"),  
**Para** profundizar en un tema sin tener que repetir el contexto anterior.

**Criterios de Aceptación:**
*   [x] El backend debe recibir una ventana deslizante de los últimos N mensajes (mínimo 10).
*   [x] La IA debe ser capaz de resolver referencias anafóricas ("eso", "el anterior").
*   [x] Botón para "Limpiar Conversación" que reinicia el contexto explícitamente.

#### HU-07: Modo Tutor Socrático
**Como** estudiante que quiere profundizar,  
**Quiero** activar un modo donde la IA no me dé respuestas directas, sino que me haga preguntas,  
**Para** desarrollar mi propio razonamiento crítico.

**Criterios de Aceptación:**
*   [x] *System Prompt* específico que instruya a la IA a responder *siempre* con una pregunta guía.
*   [x] La IA debe evaluar la respuesta del usuario y guiarlo hacia la conclusión correcta paso a paso.
*   [x] Activación seleccionable desde el menú de herramientas.

#### HU-08: Modo Roleplay (Simulación de Crisis)
**Como** futuro Project Manager,  
**Quiero** practicar mis habilidades blandas interactuando con "stakeholders virtuales",  
**Para** aprender a manejar conflictos y negociaciones difíciles.

**Criterios de Aceptación:**
*   [x] La IA debe adoptar una "persona" (ej. Cliente enojado, Patrocinador impaciente).
*   [x] El escenario debe presentar un conflicto realista de proyecto.
*   [x] La IA debe reaccionar emocionalmente a las respuestas del usuario (calmarse si se gestiona bien, escalar si no).

#### HU-09: Modo Taller de Entregables (Workshop)
**Como** estudiante práctico,  
**Quiero** ayuda para redactar documentos reales (ej. Project Charter),  
**Para** entender la estructura y contenido de los artefactos del PMBOK.

**Criterios de Aceptación:**
*   [x] La IA debe guiar la redacción sección por sección.
*   [x] Debe ofrecer ejemplos de redacción para cada apartado.
*   [x] Al final, debe compilar el documento completo en formato Markdown.

#### HU-10: Modo "Abogado del Diablo" (Debate)
**Como** estudiante avanzado,  
**Quiero** debatir contra la IA sobre temas polémicos de gestión,  
**Para** reforzar mis argumentos y convicciones éticas.

**Criterios de Aceptación:**
*   [x] La IA debe tomar deliberadamente una postura contraria o cuestionable (pero plausible).
*   [x] Debe desafiar los argumentos del usuario basándose en falacias comunes o presiones del mundo real.
*   [x] Debe conceder la victoria si el usuario argumenta sólidamente usando el PMBOK/Código de Ética.

---

### Épica 3: Simulación y Evaluación (E03)

#### HU-11: Generación Procedural de Exámenes
**Como** estudiante,  
**Quiero** generar exámenes de práctica ilimitados sobre temas específicos,  
**Para** no depender de un banco de preguntas finito que termine memorizando.

**Criterios de Aceptación:**
*   [x] Endpoint de API que acepte parámetros: `topic`, `questionCount`, `difficulty`.
*   [x] Prompt de IA diseñado para generar salida estrictamente en formato JSON.
*   [x] Las preguntas generadas deben ser inéditas (creadas en el momento).
*   [x] Validación de estructura JSON antes de presentar al usuario (fallback en caso de error).

#### HU-12: Simulador de Examen (Interfaz de Examen)
**Como** estudiante,  
**Quiero** una interfaz libre de distracciones con un temporizador,  
**Para** simular las condiciones de presión del examen real.

**Criterios de Aceptación:**
*   [x] Ocultar barras de navegación y chat durante el examen.
*   [x] Temporizador decreciente visible.
*   [x] Navegación secuencial (Anterior/Siguiente) y mapa de preguntas (acceso directo).
*   [x] Posibilidad de marcar preguntas para revisión ("Mark for Review").

#### HU-13: Evaluación y Feedback Detallado
**Como** estudiante,  
**Quiero** recibir una calificación inmediata y explicaciones de cada pregunta al finalizar,  
**Para** aprender de mis errores al instante.

**Criterios de Aceptación:**
*   [x] Cálculo automático de puntaje (Score/Total).
*   [x] Desglose de respuestas correctas e incorrectas.
*   [x] Explicación justificada para la opción correcta.
*   [x] Explicación de por qué cada distractor (opción incorrecta) es erróneo.

#### HU-14: Historial de Simulaciones
**Como** estudiante,  
**Quiero** acceder a un registro de mis exámenes pasados,  
**Para** revisar mi evolución y repasar preguntas falladas anteriormente.

**Criterios de Aceptación:**
*   [x] Listado de exámenes en el Dashboard con fecha y puntaje.
*   [x] Posibilidad de abrir un examen pasado en modo "Solo lectura" para revisión.
*   [x] Persistencia del objeto JSON completo del examen (para no perder las preguntas generadas).

---

### Épica 4: Gamificación y Progresión (E04)

#### HU-15: Sistema de Bloqueo de Niveles (Ruta de Aprendizaje)
**Como** estudiante novato,  
**Quiero** que el contenido se desbloquee progresivamente,  
**Para** seguir un orden lógico y no abrumarme.

**Criterios de Aceptación:**
*   [x] Visualización de niveles como nodos en un mapa o lista.
*   [x] Estado visual claro: "Completado" (Verde), "Disponible" (Azul), "Bloqueado" (Gris/Candado).
*   [x] Lógica de desbloqueo: Nivel N disponible ssi Nivel N-1 completado.

#### HU-16: Puntos de Experiencia (XP) y Nivel de Usuario
**Como** estudiante,  
**Quiero** ganar puntos por cada actividad completada,  
**Para** tener una sensación de logro tangible.

**Criterios de Aceptación:**
*   [x] Asignación de XP por: Aprobar nivel, Completar simulación, Mantener racha.
*   [x] Barra de progreso global en el Dashboard.
*   [x] Algoritmo de subida de nivel (Nivel 1 -> Nivel 50) basado en umbrales de XP.

#### HU-17: Racha de Estudio (Streak)
**Como** estudiante,  
**Quiero** ver cuántos días seguidos he estudiado,  
**Para** motivarme a mantener la constancia diaria.

**Criterios de Aceptación:**
*   [x] Contador de días consecutivos visible.
*   [x] Lógica de actualización: Incrementar si `last_login` == hoy.
*   [x] Lógica de reinicio: Resetear a 0 si `last_login` < ayer.

#### HU-18: Dashboard de Métricas de Desempeño
**Como** estudiante,  
**Quiero** ver mi rendimiento desglosado por los 3 dominios del examen (Personas, Procesos, Negocio),  
**Para** identificar mis áreas débiles.

**Criterios de Aceptación:**
*   [x] Gráficos de barra o radar por dominio.
*   [x] Cálculo basado en el histórico de preguntas respondidas en simulaciones.
*   [x] Indicadores de tendencia (mejorando/empeorando).

---

### Épica 5: Arquitectura, Seguridad y Calidad (E05)

#### HU-19: Privacidad de Datos (Multi-tenancy Lógico)
**Como** usuario consciente de la privacidad,  
**Quiero** que mis conversaciones y errores sean absolutamente privados,  
**Para** estudiar con confianza y sin miedo al juicio.

**Criterios de Aceptación:**
*   [x] Implementación estricta de **Row Level Security (RLS)** en la base de datos.
*   [x] Reglas de API que impidan físicamente leer registros donde `user_id != auth.id`.
*   [x] Validación de seguridad en el backend antes de procesar cualquier solicitud.

#### HU-20: Protección de Infraestructura (API Keys)
**Como** administrador,  
**Quiero** que la llave de API de Google Gemini esté oculta y protegida,  
**Para** evitar robos de cuota y costos inesperados.

**Criterios de Aceptación:**
*   [x] Uso exclusivo de `GOOGLE_API_KEY` en el entorno de servidor (Node.js).
*   [x] Prohibición de exponer la variable con prefijo `NEXT_PUBLIC_`.
*   [x] Proxy de API (`/api/chat`) que actúa como intermediario único.

#### HU-21: Manejo de Errores y Resiliencia
**Como** usuario,  
**Quiero** que el sistema me informe amigablemente si algo falla (ej. IA no responde),  
**Para** no quedarme esperando indefinidamente ante una pantalla congelada.

**Criterios de Aceptación:**
*   [x] Bloques `try-catch` en todas las llamadas asíncronas.
*   [x] Mensajes de error legibles por humanos ("La IA está tardando demasiado", "Error de conexión").
*   [x] Capacidad de reintentar una acción fallida sin recargar toda la página.

#### HU-22: Diseño Responsivo (Mobile First)
**Como** estudiante ocupado,  
**Quiero** poder estudiar desde mi celular en el transporte público,  
**Para** aprovechar los tiempos muertos.

**Criterios de Aceptación:**
*   [x] Interfaz adaptable a pantallas móviles (Sidebar colapsable).
*   [x] Tamaños de fuente y botones táctiles adecuados (min 44px).
*   [x] El chat y el simulador deben ser plenamente funcionales en viewport móvil.

#### HU-23: Validación de Integridad de Datos
**Como** sistema,  
**Quiero** asegurar que los datos generados por la IA tengan el formato correcto,  
**Para** evitar que la aplicación se rompa (crashee) al intentar mostrar una pregunta mal formada.

**Criterios de Aceptación:**
*   [x] Parsing robusto de JSON proveniente de la IA (manejo de posibles caracteres extraños).
*   [x] Verificación de existencia de campos obligatorios (`question`, `options`, `answer`) antes de renderizar.
*   [x] Fallback seguro (descartar pregunta o regenerar) si la validación falla.
