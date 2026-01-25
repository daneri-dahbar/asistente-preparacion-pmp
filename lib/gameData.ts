export const PHASE1_WORLDS = [
    { 
        id: 1, 
        name: 'Introducción', 
        desc: 'Fundamentos del Estándar', 
        color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
        headerColor: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        levels: [
            'Propósito del Estándar', 
            'Términos y Conceptos Clave', 
            'Audiencia del Estándar'
        ] 
    },
    { 
        id: 2, 
        name: 'Sistema de Entrega de Valor', 
        desc: 'Creación de Valor y Gobernanza', 
        color: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
        headerColor: 'bg-gradient-to-r from-emerald-500 to-teal-600',
        levels: [
            'Creación de Valor', 
            'Sistemas de Gobernanza', 
            'Funciones del Proyecto', 
            'Entorno del Proyecto', 
            'Gestión del Producto'
        ] 
    }
];

export const PHASE2_WORLDS = [
    {
        id: 4,
        name: 'Guía PMBOK - Introducción',
        desc: 'Estructura y Relaciones',
        color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
        headerColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
        levels: [
            'Estructura de la Guía del PMBOK®',
            'Relación con El Estándar para la Dirección de Proyectos',
            'Cambios en la Guía del PMBOK®',
            'Relación con PMIstandards+'
        ]
    },
    {
        id: 5,
        name: 'Adaptación',
        desc: 'Personalización del enfoque',
        color: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
        headerColor: 'bg-gradient-to-r from-cyan-500 to-sky-600',
        levels: [
            'Descripción General',
            '¿Por qué adaptar?',
            'Qué Adaptar',
            'Selección del Ciclo de Vida y del Enfoque de Desarrollo',
            'Procesos',
            'Involucramiento',
            'Herramientas',
            'Métodos y Artefactos',
            'El Proceso de Adaptación',
            'Seleccionar el Enfoque de Desarrollo Inicial',
            'Adaptar para la Organización',
            'Adaptar para el Proyecto',
            'Adaptación de los Dominios de Desempeño',
            'Interesados',
            'Equipo del Proyecto',
            'Enfoque de Desarrollo y Ciclo de Vida',
            'Planificación',
            'Trabajo del Proyecto',
            'Entrega',
            'Incertidumbre',
            'Métricas',
            'Diagnóstico',
            'Resumen'
        ]
    },
    {
        id: 6,
        name: 'Modelos, Métodos y Artefactos',
        desc: 'Herramientas y Entregables',
        color: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800',
        headerColor: 'bg-gradient-to-r from-fuchsia-500 to-purple-600',
        levels: [
            'Descripción General',
            'Modelos Comúnmente Utilizados',
            'Modelos de Liderazgo Situacional',
            'Modelos de Comunicación',
            'Modelos de Motivación',
            'Modelos de Cambio',
            'Modelos de Complejidad',
            'Modelos de Desarrollo del Equipo del Proyecto',
            'Otros Modelos',
            'Modelos Aplicados a Través de los Dominios de Desempeño',
            'Métodos Comúnmente Utilizados',
            'Recopilación y Análisis de Datos',
            'Estimación',
            'Reuniones y Eventos',
            'Otros Métodos',
            'Métodos Aplicados a Través de los Dominios de Desempeño',
            'Artefactos Comúnmente Utilizados',
            'Artefactos de Estrategia',
            'Bitácoras y Registros',
            'Planes',
            'Diagramas Jerárquicos',
            'Líneas base',
            'Datos e Información Visuales',
            'Informes',
            'Acuerdos y Contratos',
            'Otros Artefactos',
            'Artefactos Aplicados a través de los Dominios de Desempeño'
        ]
    }
];

export const PHASE3_WORLDS = [
    {
        id: 7,
        name: 'Dominios de Desempeño: Interesados',
        desc: 'Involucramiento efectivo',
        color: 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
        headerColor: 'bg-gradient-to-r from-rose-500 to-pink-600',
        levels: [
            'Involucramiento de los Interesados',
            'Interacciones con Otros Dominios de Desempeño',
            'Verificación de Resultados'
        ]
    },
    {
        id: 8,
        name: 'Dominios de Desempeño: Equipo',
        desc: 'Desarrollo y liderazgo',
        color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
        headerColor: 'bg-gradient-to-r from-orange-500 to-red-600',
        levels: [
            'Dirección y Liderazgo del Equipo de Proyecto',
            'Cultura del Equipo de Proyecto',
            'Equipos de Proyecto de Alto Rendimiento',
            'Habilidades de Liderazgo',
            'Adaptación de Estilos de Liderazgo',
            'Interacciones con Otros Dominios de Desempeño',
            'Verificación de Resultados'
        ]
    },
    {
        id: 9,
        name: 'Dominios de Desempeño: Enfoque de Desarrollo y Ciclo de Vida',
        desc: 'Cadencia y ciclo de vida',
        color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
        headerColor: 'bg-gradient-to-r from-amber-500 to-yellow-600',
        levels: [
            'Relación entre Cadencia, Desarrollo y Ciclo de vida',
            'Cadencia de Entrega',
            'Enfoques de Desarrollo',
            'Consideraciones para Seleccionar un Enfoque de Desarrollo',
            'Ciclo de Vida y Definiciones de Fase',
            'Alineación de Cadencia de Entrega, Enfoque de Desarrollo y Ciclo de Vida',
            'Interacciones con Otros Dominios de Desempeño',
            'Medición de los Resultados'
        ]
    },
    {
        id: 10,
        name: 'Dominios de Desempeño: Planificación',
        desc: 'Organización y coordinación',
        color: 'bg-lime-100 dark:bg-lime-900/30 border-lime-200 dark:border-lime-800',
        headerColor: 'bg-gradient-to-r from-lime-500 to-green-600',
        levels: [
            'Descripción General de la Planificación',
            'Variables para la Planificación',
            'Composición y Estructura del Equipo de Proyecto',
            'Comunicación',
            'Recursos Físicos',
            'Adquisición',
            'Cambios',
            'Métricas',
            'Alineación',
            'Interacciones con Otros Dominios de Desempeño',
            'Verificación de Resultados'
        ]
    },
    {
        id: 11,
        name: 'Dominios de Desempeño: Trabajo del Proyecto',
        desc: 'Ejecución y gestión',
        color: 'bg-teal-100 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',
        headerColor: 'bg-gradient-to-r from-teal-500 to-emerald-600',
        levels: [
            'Procesos del Proyecto',
            'Equilibrio de las Restricciones en Competencia',
            'Conservación del Enfoque del Equipo de Proyecto',
            'Comunicaciones e Involucramiento en el Proyecto',
            'Gestión de Recursos Físicos',
            'Trabajo con Adquisiciones',
            'Monitoreo de Nuevos Trabajos y Cambios',
            'Aprendizaje a lo largo del Proyecto',
            'Interacciones con Otros Dominios de Desempeño',
            'Verificación de Resultados'
        ]
    },
    {
        id: 12,
        name: 'Dominios de Desempeño: Entrega',
        desc: 'Valor y calidad',
        color: 'bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800',
        headerColor: 'bg-gradient-to-r from-sky-500 to-blue-600',
        levels: [
            'Entrega de Valor',
            'Entregables',
            'Calidad',
            'Resultados Subóptimos',
            'Interacciones con Otros Dominios de Desempeño',
            'Verificación de Resultados'
        ]
    },
    {
        id: 13,
        name: 'Dominios de Desempeño: Medición',
        desc: 'Monitoreo y control',
        color: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
        headerColor: 'bg-gradient-to-r from-indigo-500 to-violet-600',
        levels: [
            'Establecimiento de Medidas Efectivas',
            'Qué medir',
            'Presentación de la Información',
            'Peligros en las Mediciones',
            'Resolución de Problemas de Desempeño',
            'Crecimiento y Mejora',
            'Interacciones con Otros Dominios de Desempeño',
            'Verificación de Resultados'
        ]
    },
    {
        id: 14,
        name: 'Dominios de Desempeño: Incertidumbre',
        desc: 'Riesgos y ambigüedad',
        color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
        headerColor: 'bg-gradient-to-r from-purple-500 to-fuchsia-600',
        levels: [
            'Incertidumbre General',
            'Ambigüedad',
            'Complejidad',
            'Volatilidad',
            'Riesgo',
            'Interacciones con Otros Dominios de Desempeño',
            'Verificación de Resultados'
        ]
    }
];

export const PHASE4_WORLDS = [
    {
        id: 15,
        name: 'Principios de Dirección',
        desc: 'Los 12 principios fundamentales del PMBOK 7',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
        headerColor: 'bg-gradient-to-r from-yellow-500 to-amber-600',
        levels: [
            'Administración (Stewardship)',
            'Equipo (Team)',
            'Interesados (Stakeholders)',
            'Valor (Value)',
            'Pensamiento Sistémico (Systems Thinking)',
            'Liderazgo (Leadership)',
            'Adaptación (Tailoring)',
            'Calidad (Quality)',
            'Complejidad (Complexity)',
            'Riesgo (Risk)',
            'Adaptabilidad y Resiliencia',
            'Cambio (Change)'
        ]
    }
];

export const PHASE_ECO_WORLDS = [
    {
        id: 16,
        name: 'Dominio I: Personas (33%)',
        desc: 'Habilidades blandas y liderazgo',
        color: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
        headerColor: 'bg-gradient-to-r from-indigo-500 to-violet-600',
        levels: [
            'Tarea 1: Desarrollar una visión compartida',
            'Tarea 2: Gestionar conflictos',
            'Tarea 3: Liderar al equipo del proyecto',
            'Tarea 4: Involucrar a los interesados',
            'Tarea 5: Alinear expectativas de los interesados',
            'Tarea 6: Gestionar expectativas de los interesados',
            'Tarea 7: Asegurar la transferencia de conocimientos',
            'Tarea 8: Planificar y gestionar la comunicación'
        ]
    },
    {
        id: 17,
        name: 'Dominio II: Procesos (41%)',
        desc: 'Aspectos técnicos de la gestión',
        color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
        headerColor: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        levels: [
            'Tarea 1: Desarrollar plan integrado y entrega',
            'Tarea 2: Desarrollar y gestionar el alcance',
            'Tarea 3: Asegurar la entrega basada en valor',
            'Tarea 4: Planificar y gestionar recursos',
            'Tarea 5: Planificar y gestionar adquisiciones',
            'Tarea 6: Planificar y gestionar finanzas',
            'Tarea 7: Planificar y optimizar la calidad',
            'Tarea 8: Planificar y gestionar el cronograma',
            'Tarea 9: Evaluar el estado del proyecto',
            'Tarea 10: Gestionar el cierre del proyecto'
        ]
    },
    {
        id: 18,
        name: 'Dominio III: Entorno Empresarial (26%)',
        desc: 'Conexión con la estrategia organizacional',
        color: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
        headerColor: 'bg-gradient-to-r from-emerald-500 to-teal-600',
        levels: [
            'Tarea 1: Definir y establecer la gobernanza',
            'Tarea 2: Planificar y gestionar el cumplimiento',
            'Tarea 3: Gestionar y controlar cambios',
            'Tarea 4: Eliminar impedimentos y gestionar problemas',
            'Tarea 5: Planificar y gestionar riesgos',
            'Tarea 6: Mejora continua',
            'Tarea 7: Apoyar el cambio organizacional',
            'Tarea 8: Evaluar cambios del entorno externo'
        ]
    }
];

export const PHASE5_WORLDS = [
    {
        id: 19,
        name: 'Simulador de Examen PMP',
        desc: 'Pruebas de resistencia progresivas',
        color: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
        headerColor: 'bg-gradient-to-r from-red-600 to-rose-700',
        levels: [
            'Simulación Inicial (45 Preguntas)',
            'Simulación Media (90 Preguntas)',
            'Simulación Avanzada (135 Preguntas)',
            'Simulacro Real Completo (180 Preguntas)'
        ]
    }
];

export const WORLDS = [...PHASE1_WORLDS, ...PHASE2_WORLDS, ...PHASE3_WORLDS, ...PHASE4_WORLDS, ...PHASE_ECO_WORLDS, ...PHASE5_WORLDS];
