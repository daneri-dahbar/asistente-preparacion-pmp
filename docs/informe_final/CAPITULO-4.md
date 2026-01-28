# Capítulo 4: Diseño de la Solución Propuesta

El presente capítulo se centra en el diseño conceptual y técnico de la solución propuesta: un asistente virtual basado en modelos de lenguaje de gran escala, orientado a brindar soporte inteligente a la preparación del examen de certificación Project Management Professional (PMP). Luego de haber establecido el marco teórico y el estado del arte, y de haber descrito en detalle la metodología de trabajo y el proceso iterativo seguido durante el desarrollo, este capítulo traduce dichos fundamentos en decisiones concretas de diseño.

El diseño de la solución se concibe como un puente entre los objetivos académicos del trabajo y su materialización en un sistema de software funcional, usable y alineado con principios pedagógicos sólidos. En este sentido, el capítulo aborda el diseño desde una perspectiva integral, considerando no solo los aspectos técnicos y arquitectónicos del sistema, sino también las necesidades de los usuarios finales, los objetivos educativos perseguidos y la experiencia de interacción propuesta.

En primer lugar, se definen los objetivos de diseño del asistente, distinguiendo entre objetivos funcionales, educativos y de experiencia de usuario. Esta distinción permite explicitar de manera clara qué se espera que el sistema haga, cómo debe contribuir al proceso de aprendizaje y de qué manera debe interactuar con los usuarios para resultar efectivo y aceptable en un contexto de estudio autónomo.

Posteriormente, se adopta un enfoque de diseño centrado en el usuario, caracterizando los perfiles de uso esperados, identificando las principales necesidades de aprendizaje asociadas a la preparación del examen PMP y describiendo los flujos de interacción previstos. Este enfoque busca asegurar que las decisiones de diseño no se basen únicamente en criterios tecnológicos, sino que respondan a problemáticas reales y a contextos de uso concretos.

A continuación, se presenta la arquitectura general del sistema, detallando su implementación moderna basada en Next.js y PocketBase, así como los componentes principales que conforman la solución. Esta descripción permite comprender cómo se organizan y articulan los distintos elementos del sistema —modelo de lenguaje, backend, frontend y mecanismos de gamificación— y de qué manera se soportan los objetivos definidos previamente.

Finalmente, el capítulo aborda el diseño de la interfaz de usuario, exponiendo los principios de usabilidad aplicados, el diseño de las pantallas principales (Dashboard, Chat, Sidebar) y el sistema de retroalimentación implementado. Estos aspectos resultan clave para garantizar una experiencia de uso clara, coherente y orientada al aprendizaje, especialmente en un sistema basado en interacción conversacional avanzada.

En conjunto, este capítulo establece las bases de diseño que guían la implementación del asistente virtual presentada en el capítulo siguiente, proporcionando un marco claro y justificado para las decisiones adoptadas y facilitando la comprensión integral de la solución propuesta.

## 4.1 Objetivos de diseño del asistente

El diseño del asistente virtual propuesto se fundamentó en la necesidad de articular de manera coherente los aspectos tecnológicos, educativos y experienciales involucrados en la preparación para el examen de certificación Project Management Professional (PMP). Dado que el asistente se concibe como un sistema socio-técnico basado en un modelo de lenguaje de gran escala, su diseño no se limitó únicamente a la implementación de funcionalidades técnicas, sino que incorporó explícitamente objetivos pedagógicos y criterios de experiencia de usuario.

En este sentido, los objetivos de diseño fueron definidos como un conjunto de lineamientos que orientaron las decisiones tomadas a lo largo del desarrollo del asistente, asegurando la alineación entre el problema planteado, la solución propuesta y la hipótesis de investigación. Estos objetivos se agrupan en tres dimensiones complementarias: objetivos funcionales, objetivos educativos y objetivos de experiencia de usuario. La articulación de estas tres dimensiones permitió concebir un asistente equilibrado, capaz de ofrecer soporte efectivo al estudio, sin perder de vista la usabilidad, la claridad conceptual ni la coherencia con el dominio de la certificación PMP.

### 4.1.1 Objetivos funcionales

Los objetivos funcionales del asistente se orientaron a definir qué acciones debía ser capaz de realizar el sistema desde una perspectiva operativa y técnica. Estos objetivos se establecieron considerando tanto las necesidades de los usuarios finales como las posibilidades y limitaciones inherentes al uso de modelos de lenguaje de gran escala.

En primer lugar, uno de los objetivos funcionales centrales fue permitir la interacción conversacional en lenguaje natural, posibilitando que el usuario formule consultas, plantee dudas y solicite explicaciones de manera flexible, sin necesidad de utilizar comandos estructurados o interfaces rígidas. Esta característica resulta esencial para favorecer un uso fluido del asistente y reducir las barreras de acceso al sistema.

Asimismo, se definió como objetivo funcional que el asistente fuera capaz de responder consultas conceptuales vinculadas al dominio de la certificación PMP, ofreciendo explicaciones claras, coherentes y alineadas con los marcos conceptuales promovidos por el Project Management Institute. Esto incluyó la capacidad de explicar principios, dominios, enfoques predictivos, ágiles e híbridos, así como de contextualizar dichos conceptos en escenarios prácticos.

Otro objetivo funcional relevante consistió en la generación y análisis de preguntas tipo examen PMP. El asistente debía ser capaz de presentar escenarios situacionales, analizar alternativas de respuesta y justificar de manera razonada por qué una opción resulta más adecuada que las demás. Este objetivo fue clave para simular, en la medida de lo posible, el razonamiento esperado en el examen real.

Adicionalmente, se estableció como objetivo funcional la provisión de retroalimentación explicativa ante las respuestas del usuario. El asistente no debía limitarse a indicar si una respuesta era correcta o incorrecta, sino que debía ofrecer una justificación detallada, orientada a corregir errores conceptuales y reforzar el aprendizaje.

Finalmente, se consideró como objetivo funcional la posibilidad de adaptar el nivel de profundidad de las respuestas en función del contexto de interacción y del tipo de consulta realizada, mediante modos de chat especializados (Simulación, Socrático, Taller, Examen). Esto permitió evitar explicaciones excesivamente superficiales o, por el contrario, innecesariamente extensas, contribuyendo a una experiencia de uso más equilibrada.

### 4.1.2 Objetivos educativos

Los objetivos educativos del asistente se definieron a partir de los principios pedagógicos analizados en el marco teórico y de las dificultades identificadas en los métodos tradicionales de preparación para el examen PMP. En este sentido, el asistente fue concebido como una herramienta de apoyo al aprendizaje, orientada a promover la comprensión profunda y el razonamiento aplicado, más que la memorización mecánica de contenidos.

Uno de los principales objetivos educativos fue facilitar la comprensión conceptual de los contenidos evaluados en la certificación PMP. Esto implicó diseñar el asistente para que explicara no solo el “qué” de cada concepto, sino también el “por qué” detrás de las decisiones, principios y prácticas de la gestión de proyectos.

Otro objetivo educativo clave consistió en promover el aprendizaje activo del usuario. El asistente fue diseñado para fomentar la reflexión, el análisis de escenarios y la justificación de decisiones, estimulando la participación cognitiva del estudiante y evitando una interacción pasiva basada únicamente en la recepción de información.

Asimismo, se estableció como objetivo educativo integrar técnicas de estudio reconocidas, tales como la práctica de recuperación, el aprendizaje basado en escenarios, la elaboración cognitiva y la metacognición. Estas técnicas se incorporaron en la forma de estructurar las respuestas del asistente, en las preguntas de seguimiento y en los mecanismos de retroalimentación, con el fin de fortalecer la retención y transferencia del conocimiento.

Otro objetivo relevante fue acompañar el proceso de aprendizaje autodirigido mediante elementos de gamificación. El sistema debía motivar al usuario a mantener la constancia en su estudio a través de niveles, rachas y progreso visible, ayudándolo a identificar errores, reforzar áreas débiles y consolidar progresivamente su comprensión del dominio PMP.

Finalmente, desde una perspectiva educativa, se buscó que el asistente contribuyera a reducir la brecha entre el conocimiento teórico y su aplicación práctica. Dado que el examen PMP se basa en situaciones reales de gestión de proyectos, el asistente fue diseñado para contextualizar los conceptos en escenarios verosímiles, facilitando el desarrollo del juicio profesional requerido por la certificación.

### 4.1.3 Objetivos de experiencia de usuario

Los objetivos de experiencia de usuario se orientaron a garantizar que la interacción con el asistente resultara clara, intuitiva y cognitivamente sostenible, especialmente considerando que los usuarios son profesionales o aspirantes que suelen utilizar la herramienta en contextos de estudio prolongados.

Uno de los objetivos principales en esta dimensión fue diseñar una experiencia de interacción simple e intuitiva, minimizando la carga cognitiva asociada al uso de la herramienta. El asistente debía ser fácil de utilizar, sin requerir conocimientos técnicos previos ni procesos complejos de aprendizaje de la interfaz.

Asimismo, se estableció como objetivo ofrecer respuestas estructuradas y comprensibles, priorizando la claridad del discurso y la organización lógica de la información mediante el uso de formato Markdown renderizado. Esto resultó especialmente relevante para evitar confusión en explicaciones complejas y para facilitar la lectura y comprensión de respuestas extensas.

Otro objetivo de experiencia de usuario fue mantener un tono comunicacional coherente, profesional y didáctico. El asistente debía transmitir confianza, claridad y consistencia conceptual, utilizando terminología alineada con el dominio de la gestión de proyectos y evitando ambigüedades innecesarias.

Adicionalmente, se consideró fundamental que el asistente ofreciera una experiencia de uso flexible, adaptándose a distintos estilos de estudio y a diferentes momentos del proceso de preparación. El usuario debía poder utilizar el asistente tanto para consultas rápidas como para sesiones de estudio más profundas, sin que ello afectara negativamente la calidad de la interacción.

Finalmente, desde la perspectiva de la experiencia de usuario, se buscó que el asistente generara una percepción de utilidad real y acompañamiento continuo. El sistema debía ser percibido como un apoyo efectivo al proceso de estudio, capaz de aportar valor tangible y de integrarse de manera natural en la rutina de preparación del aspirante a la certificación PMP.

## 4.2 Diseño centrado en el usuario

El diseño de la solución propuesta se fundamentó en un enfoque de diseño centrado en el usuario, entendiendo que la efectividad de un asistente virtual educativo no depende únicamente de sus capacidades técnicas o de la potencia del modelo de lenguaje subyacente, sino de su adecuación a las características, necesidades y contextos reales de uso de las personas que lo utilizan. En el marco de este trabajo, dicho enfoque resultó especialmente relevante debido a la diversidad de perfiles que se preparan para la certificación PMP y a la complejidad cognitiva asociada a dicho proceso.

Adoptar un diseño centrado en el usuario implicó priorizar, desde las etapas iniciales del desarrollo, la comprensión de quiénes serían los usuarios del asistente, cuáles son sus objetivos de aprendizaje, qué dificultades enfrentan durante la preparación del examen y de qué manera interactúan con herramientas digitales de estudio. Este enfoque permitió orientar las decisiones de diseño funcional, pedagógico y experiencial hacia la generación de una herramienta verdaderamente útil, accesible y alineada con las expectativas del usuario final.

En este sentido, el diseño centrado en el usuario se abordó a partir de tres dimensiones complementarias: la caracterización del perfil de usuarios esperados, la identificación de sus necesidades de aprendizaje y la definición de flujos de interacción coherentes con dichos perfiles y necesidades.

### 4.2.1 Perfil de usuarios

El asistente virtual desarrollado está orientado principalmente a aspirantes a la certificación Project Management Professional (PMP), un grupo de usuarios que presenta características particulares tanto desde el punto de vista profesional como cognitivo y contextual. En términos generales, se trata de profesionales adultos, con experiencia previa en gestión de proyectos o roles afines, que buscan validar y formalizar sus competencias mediante una certificación reconocida internacionalmente.

Estos usuarios suelen presentar trayectorias laborales diversas, provenientes de sectores como tecnología, ingeniería, construcción, administración, consultoría u organismos públicos y privados. En consecuencia, poseen conocimientos prácticos heterogéneos, adquiridos en contextos reales de trabajo, pero no siempre alineados de manera explícita con los marcos conceptuales, principios y enfoques promovidos por el Project Management Institute. Esta situación genera, en muchos casos, una brecha entre la experiencia práctica y el razonamiento esperado en el examen PMP.

Desde el punto de vista del uso de tecnologías digitales, los usuarios objetivo presentan un nivel de alfabetización tecnológica medio a alto. Están familiarizados con plataformas de aprendizaje en línea, simuladores de examen, materiales digitales y herramientas de consulta, aunque no necesariamente con sistemas basados en inteligencia artificial avanzada. Por este motivo, el asistente debía resultar intuitivo y accesible, evitando barreras de entrada asociadas a interfaces complejas o a modos de interacción poco familiares.

Asimismo, se identificó que los usuarios objetivo suelen preparar el examen PMP en paralelo con responsabilidades laborales y personales, lo que condiciona el tiempo disponible para el estudio y favorece el uso de herramientas flexibles, accesibles bajo demanda y adaptables a distintos momentos y duraciones de estudio. En este contexto, el asistente fue concebido como una herramienta de apoyo autónomo, capaz de integrarse de manera natural en rutinas de estudio fragmentadas o no lineales.

Finalmente, se contempló también un perfil secundario de usuarios, compuesto por profesionales ya certificados PMP, interesados en utilizar el asistente como herramienta de repaso, reflexión conceptual o contraste de enfoques frente a situaciones complejas de gestión de proyectos. Este perfil aportó una perspectiva experta valiosa para validar la profundidad conceptual y la coherencia del asistente.

### 4.2.2 Necesidades de aprendizaje

A partir del análisis del perfil de usuarios, se identificaron una serie de necesidades de aprendizaje específicas asociadas a la preparación del examen PMP, las cuales orientaron de manera directa el diseño del asistente virtual y su lógica de interacción.

Una de las necesidades centrales detectadas fue la comprensión profunda de conceptos y principios, más allá de su definición superficial. Los aspirantes suelen enfrentar dificultades para interpretar correctamente los fundamentos que subyacen a las decisiones esperadas en el examen, especialmente cuando estas difieren de prácticas habituales en sus entornos laborales. En este sentido, el asistente debía facilitar explicaciones que abordaran tanto el contenido conceptual como el razonamiento que justifica su aplicación en distintos escenarios.

Otra necesidad clave se relaciona con la interpretación de preguntas situacionales. El examen PMP presenta escenarios complejos, con múltiples alternativas plausibles, donde la respuesta correcta no siempre es evidente a primera vista. Los usuarios requieren apoyo para analizar el contexto del problema, identificar qué se está evaluando realmente y comprender por qué una opción resulta más adecuada que las demás. El asistente fue diseñado para acompañar este proceso de análisis, guiando el razonamiento del usuario de manera estructurada.

Asimismo, se identificó la necesidad de retroalimentación explicativa y contextualizada. A diferencia de los simuladores tradicionales, que suelen limitarse a indicar si una respuesta es correcta o incorrecta, los usuarios demandan explicaciones que les permitan aprender de sus errores, comprender sus malentendidos conceptuales y ajustar su forma de razonar frente a preguntas similares.

Otra necesidad relevante corresponde al aprendizaje autodirigido y flexible. Los aspirantes requieren herramientas que les permitan estudiar a su propio ritmo, profundizar en temas específicos según sus debilidades y adaptar el proceso de estudio a su disponibilidad temporal. En este marco, el asistente debía actuar como un tutor virtual que acompañe, oriente y refuerce el aprendizaje, sin imponer un recorrido rígido o lineal.

Finalmente, se identificó la necesidad de alineación con el enfoque del PMI, particularmente en lo referido a la integración de enfoques predictivos, ágiles e híbridos. Muchos aspirantes presentan confusión respecto a cuándo aplicar cada enfoque y cómo interpretar escenarios que combinan elementos de distintos marcos. El asistente fue diseñado para ayudar a clarificar estas distinciones y a contextualizar adecuadamente cada decisión dentro del marco conceptual esperado por la certificación.

### 4.2.3 Flujos de interacción

Los flujos de interacción del asistente virtual fueron definidos en coherencia con los perfiles de usuarios y las necesidades de aprendizaje identificadas, priorizando una interacción conversacional natural, flexible y orientada al razonamiento. En lugar de proponer recorridos rígidos o secuencias predefinidas de contenido, se optó por flujos adaptativos que permiten al usuario dirigir la interacción según sus objetivos inmediatos de estudio.

Uno de los flujos principales corresponde a la consulta conceptual, en la cual el usuario plantea una duda específica sobre un concepto, principio o dominio del examen PMP. En este flujo, el asistente interpreta la consulta, ofrece una explicación estructurada y, cuando resulta pertinente, propone ejemplos o preguntas de seguimiento que refuercen la comprensión.

Otro flujo relevante es el de resolución guiada de preguntas tipo examen. En este caso, el usuario puede solicitar la generación de una pregunta o presentar una pregunta concreta. El asistente analiza el escenario, descompone el problema, discute las alternativas posibles y justifica la respuesta más adecuada, promoviendo un razonamiento alineado con el enfoque del PMI.

Asimismo, se definió un flujo orientado a la retroalimentación sobre respuestas del usuario, en el cual el asistente evalúa la respuesta propuesta, identifica aciertos y errores conceptuales y brinda explicaciones orientadas a corregir el razonamiento. Este flujo fue diseñado para fomentar el aprendizaje a partir del error y para reforzar la reflexión metacognitiva.

Un flujo adicional corresponde al acompañamiento progresivo del estudio, donde el asistente actúa como un tutor que sugiere temas a reforzar, propone ejercicios adicionales o invita al usuario a reflexionar sobre su nivel de comprensión. Este flujo no se basa en un seguimiento automatizado estricto, sino en interacciones orientativas que respetan la autonomía del usuario.

En todos los flujos de interacción se priorizó la claridad del lenguaje, la coherencia conceptual y la adaptación del nivel de profundidad de las respuestas. El asistente fue diseñado para sostener interacciones tanto breves como prolongadas, permitiendo que el usuario lo utilice de manera puntual o como apoyo durante sesiones de estudio más extensas.

En conjunto, estos flujos de interacción materializan el enfoque de diseño centrado en el usuario adoptado en este trabajo, asegurando que el asistente virtual no solo sea técnicamente funcional, sino también pedagógicamente pertinente y experiencialmente adecuado para el proceso de preparación del examen PMP.

## 4.3 Arquitectura general del sistema

La arquitectura general del sistema fue diseñada con el objetivo de soportar de manera robusta, escalable y flexible el funcionamiento de un asistente virtual educativo de última generación. Para lograr esto, se seleccionó un stack tecnológico moderno basado en el ecosistema de React y Next.js, integrando servicios de backend en tiempo real y modelos de lenguaje avanzados.

La solución se estructura como una aplicación web progresiva (PWA) de página única (SPA), lo que garantiza una experiencia de usuario fluida y reactiva, similar a una aplicación de escritorio nativa. Esta arquitectura permite una clara separación de responsabilidades entre el cliente, el servidor de datos y el motor de inteligencia artificial.

### 4.3.1 Arquitectura lógica y tecnologías clave

La arquitectura lógica del sistema se organiza en capas que interactúan entre sí para ofrecer la funcionalidad completa:

1.  **Capa de Presentación (Frontend):** Construida sobre **Next.js 16.1 (con Turbopack)** y **React 19**. Esta capa es responsable de renderizar la interfaz de usuario, gestionar el estado local de la aplicación (sesiones, chats, progreso) y manejar la interacción directa con el usuario. Se utiliza **Tailwind CSS v4** para el diseño visual, permitiendo una interfaz moderna, responsiva y adaptable (modo oscuro/claro).
2.  **Capa de Datos y Autenticación (Backend as a Service):** Se implementó **PocketBase v0.26**, una solución de backend ligera y de alto rendimiento basada en SQLite. PocketBase gestiona:
    *   **Autenticación:** Registro y login de usuarios.
    *   **Persistencia:** Almacenamiento de sesiones de estudio (`study_sessions`), historiales de chat (`chats`), mensajes (`messages`) y progreso del usuario (`user_progress`).
    *   **Tiempo Real:** Sincronización de datos entre el cliente y el servidor.
3.  **Capa de Inteligencia Artificial:** El núcleo inteligente del sistema utiliza **LangChain.js** como framework de orquestación y el **Vercel AI SDK** para la gestión del streaming de respuestas. El sistema se conecta a modelos de lenguaje avanzados (como GPT-4o-mini) a través de la API de OpenAI, permitiendo generar respuestas contextualizadas y pedagógicamente ricas.

### 4.3.2 Arquitectura física y despliegue

La arquitectura física sigue un modelo distribuido y "serverless" en gran medida:

*   **Cliente Web:** Se ejecuta en el navegador del usuario, minimizando la latencia en la interacción de la interfaz.
*   **Servidor de Aplicación (Next.js):** Alojado en una infraestructura de nube escalable (como Vercel), gestiona el enrutamiento y las API routes (`app/api/chat/route.ts`) que actúan como proxy seguro para las llamadas al modelo de lenguaje.
*   **Servidor de Base de Datos (PocketBase):** Se despliega como un servicio independiente, proporcionando una API REST para las operaciones de datos.
*   **Proveedor de LLM:** Los modelos de lenguaje se consumen como servicios externos (SaaS), garantizando acceso a la última tecnología sin necesidad de infraestructura de entrenamiento o inferencia propia.

### 4.3.3 Componentes principales del sistema

A partir de las arquitecturas lógica y física, se identifican los siguientes componentes esenciales desarrollados:

*   **Chat Interface & AI Orchestrator:** El corazón del sistema. Gestiona el envío de mensajes, la construcción de prompts dinámicos según el modo seleccionado (Simulación, Taller, etc.) y el rendering de respuestas en formato Markdown. Utiliza `StringOutputParser` de LangChain para procesar el flujo de texto en tiempo real.
*   **Dashboard de Progreso:** Un componente visual que muestra al usuario su avance en el "mundo" del PMP. Incluye visualización de niveles, rachas de estudio y áreas dominadas.
*   **Gestor de Sesiones (Sidebar):** Permite al usuario crear, renombrar y eliminar sesiones de estudio, facilitando la organización temática de su preparación.
*   **Motor de Gamificación:** Lógica interna que calcula la experiencia (XP), determina el nivel del usuario (desde "Novato" hasta "Leyenda PMP") y desbloquea logros basados en la interacción y la constancia.

## 4.4 Diseño de la interfaz de usuario

El diseño de la interfaz de usuario (UI) del asistente virtual constituye un componente central de la solución propuesta, ya que actúa como el principal punto de contacto entre el sistema y el usuario final. Dado que el asistente está orientado a apoyar procesos de estudio complejos, la interfaz debía facilitar una interacción clara, fluida y cognitivamente sostenible.

Se adoptó un enfoque de diseño centrado en la simplicidad, utilizando una estética limpia y moderna que reduce la carga cognitiva.

### 4.4.1 Principios de usabilidad y Estilo Visual

El diseño visual se apoya en **Tailwind CSS**, utilizando una paleta de colores neutra con acentos de color para indicar estados (verde para éxito, rojo para errores, azul para acciones principales).

*   **Simplicidad:** La interfaz elimina el ruido visual. El foco está siempre en el contenido de la conversación o en el panel de control.
*   **Modo Oscuro/Claro:** Se implementó soporte nativo para temas oscuros y claros, permitiendo al usuario adaptar la interfaz a sus preferencias y condiciones de iluminación, algo crucial para largas sesiones de estudio nocturno.
*   **Tipografía:** Se seleccionaron fuentes sans-serif modernas y legibles (`Geist`, `Inter`), optimizadas para la lectura en pantalla.

### 4.4.2 Estructura de Pantallas

La aplicación se organiza en una estructura de "Single Page Application" con tres áreas principales:

1.  **Barra Lateral (Sidebar):**
    *   Proporciona navegación rápida entre diferentes sesiones de estudio.
    *   Permite la gestión de sesiones (crear, borrar, editar).
    *   Incluye acceso al perfil de usuario y cierre de sesión.
    *   Es colapsable en dispositivos móviles para maximizar el espacio.

2.  **Panel de Control (Dashboard):**
    *   Es la vista inicial ("Home") del estudiante.
    *   Muestra tarjetas de estadísticas: "Sesiones Totales", "Precisión", "Áreas Dominadas" y "Racha Actual".
    *   Presenta un mapa visual de progreso o lista de niveles desbloqueados, gamificando la experiencia de avance a través de los dominios del PMP (Personas, Procesos, Entorno de Negocio).

3.  **Área de Chat (Workspace):**
    *   Es el espacio de trabajo principal.
    *   **Selector de Modos:** Una barra superior permite cambiar dinámicamente el comportamiento del asistente entre modos como "Estándar", "Simulación de Crisis", "Taller de Entregables", "Método Socrático" y "Examen Rápido".
    *   **Historial de Mensajes:** Renderiza el diálogo con soporte para formato rico (negritas, listas, código, tablas) gracias a `react-markdown`.
    *   **Input de Texto:** Una barra de entrada persistente y accesible.

### 4.4.3 Sistema de Retroalimentación y Gamificación

El sistema de retroalimentación va más allá del texto. Se integraron elementos visuales para reforzar el aprendizaje y la motivación:

*   **Feedback Inmediato:** En el modo examen, las respuestas correctas o incorrectas se acompañan de explicaciones claras y distintivos visuales.
*   **Modales de Logro:** Al completar un nivel o alcanzar un hito (ej. "Racha de 7 días"), el sistema despliega modales de celebración (`LevelCompletedModal`), reforzando positivamente la conducta de estudio.
*   **Indicadores de Estado:** El uso de iconos (`Lucide React`) y colores semánticos ayuda al usuario a entender rápidamente el estado del sistema (cargando, error, éxito).

En síntesis, la interfaz fue diseñada no solo como un medio de entrada y salida, sino como un entorno de aprendizaje inmersivo que combina la seriedad del contenido PMP con la interactividad y el "engagement" de las aplicaciones modernas.
