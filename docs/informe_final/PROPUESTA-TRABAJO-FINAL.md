# Propuesta de Trabajo Final: “Desarrollo y Evaluación de un Asistente Virtual Optimizado para la Preparación del Examen de Certificación Project Management Professional (PMP) basado en un Large Language Model (LLM)”

## 1. Introducción
En los últimos años, los Modelos de Lenguaje Grande (LLM) han emergido como una fuerza transformadora en el campo del Procesamiento del Lenguaje Natural (NLP). Notablemente, GPT-3, desarrollado por OpenAI, marcó un hito en 2020 al exhibir un rendimiento excepcional en una diversidad de tareas relacionadas con el NLP (Brown et al., 2020). Más recientemente, OpenAI ha avanzado un paso más al lanzar GPT-4, un modelo que no solo procesa texto, sino también imágenes, alcanzando un nivel de desempeño comparable al humano en diversas tareas profesionales (OpenAI, 2023).
La educación es uno de los ámbitos donde los LLM han mostrado un potencial significativo para contribuir positivamente. En particular, en el contexto de la educación vietnamita, se han explorado y comparado modelos como ChatGPT, Bing Chat y Bard. Estos modelos han sido evaluados en función de su aplicabilidad y eficacia para facilitar procesos educativos, lo cual resalta la relevancia de explorar y entender más a fondo la capacidad y el potencial de los LLM en el ámbito educativo (Dao, 2023).
Ante este panorama, surge una pregunta inevitable: ¿Es posible fusionar la potencia y flexibilidad de los LLMs con la necesidad de formación y preparación para certificaciones profesionales? El presente trabajo busca responder precisamente a esta pregunta, proponiendo el desarrollo y evaluación de un asistente virtual basado en LLMs para la preparación del examen PMP.
A través de una metodología iterativa e incremental, fundamentada en el marco de trabajo Scrum, este estudio no solo aspira a ofrecer una herramienta innovadora para aspirantes al PMP, sino también a explorar y documentar el potencial y los desafíos de utilizar LLMs en contextos educativos específicos. Además, al situarse en la intersección de la ingeniería informática, la inteligencia artificial y la educación, este trabajo refleja la naturaleza interdisciplinaria de los desafíos y oportunidades del siglo XXI.

## 2. Planteamiento del problema
La certificación Project Management Professional (PMP) es una de las credenciales más valoradas en el campo de la gestión de proyectos. La preparación para el examen PMP requiere una comprensión sólida de los conceptos, herramientas y técnicas de gestión de proyectos, así como una preparación exhaustiva a través de la revisión de material educativo y la práctica de preguntas de examen.
Con el advenimiento de la Inteligencia Artificial (IA) y los Modelos de Lenguaje de Gran Escala (LLM), se ha abierto una vía para facilitar la preparación para el examen PMP. Los LLM, en particular, pueden ser utilizados para desarrollar plataformas educativas interactivas que proporcionen explicaciones detalladas de los conceptos de gestión de proyectos, así como retroalimentación inmediata sobre las respuestas de los usuarios a las preguntas de práctica. Además, los LLM pueden generar nuevas preguntas de práctica basadas en el contenido del examen PMP, proporcionando así una fuente inagotable de material de práctica para los aspirantes a la certificación.
La asistencia de IA también puede extenderse a la personalización del material de preparación basado en las áreas de fortaleza y debilidad de un individuo. Por ejemplo, un sistema asistido por IA podría identificar áreas en las que un aspirante necesita mejorar y, en consecuencia, proporcionar material educativo y preguntas de práctica adicionales enfocadas en esas áreas.
Sin embargo, es importante notar que, mientras que la IA y los LLM pueden ser herramientas poderosas para la preparación del examen PMP, también presentan desafíos. Por ejemplo, la calidad de la retroalimentación y las preguntas generadas por los LLM podría variar, y la personalización excesiva podría resultar en una sobre-especialización que podría no ser beneficiosa en el contexto del examen PMP, que busca evaluar una amplia gama de competencias en gestión de proyectos.
La exploración de cómo la IA y los LLM pueden ser integrados de manera efectiva en la preparación para el examen PMP, y cómo pueden superarse los desafíos asociados, representa un área de investigación emergente y prometedora en la intersección de la educación y la tecnología.

## 3. Antecedentes
En los últimos años, los Modelos de Lenguaje Grande (LLM) han emergido como una fuerza transformadora en el campo del Procesamiento del Lenguaje Natural (NLP). Notablemente, GPT-3, desarrollado por OpenAI, marcó un hito en 2020 al exhibir un rendimiento excepcional en una diversidad de tareas relacionadas con el NLP (Brown et al., 2020). Más recientemente, OpenAI ha avanzado un paso más al lanzar GPT-4, un modelo que no solo procesa texto, sino también imágenes, alcanzando un nivel de comprensión multimodal.
El dominio de la educación ha sido un foco particular de interés en la aplicación de los LLM. Los modelos como ChatGPT han mostrado ser herramientas valiosas para facilitar la interacción educativa y el aprendizaje autodidacta, proporcionando respuestas informativas y generando explicaciones detalladas para preguntas relacionadas con una variedad de temas educativos. Además, se ha explorado el uso de LLM para generar preguntas educativas, lo que podría ser instrumental en la creación de material de evaluación personalizado (Elkins et al., 2023).
La educación en programación, como un subdominio crítico dentro de la educación, ha sido particularmente impactada por los avances en los LLM. Se ha investigado cómo los LLM pueden ser utilizados para ayudar en la evaluación de los estudiantes en los cursos de programación. Los hallazgos indican que, mientras los LLM tienen un potencial significativo para asistir en la educación en programación, también presentan desafíos que necesitan ser abordados para garantizar una implementación efectiva y ética en el ámbito educativo (Savelka et al., 2023).
Además, los LLM han mostrado promesa en la facilitación de la evaluación educativa, especialmente en la evaluación de respuestas abiertas, proporcionando una retroalimentación rápida y coherente que puede ser crucial para el aprendizaje y la mejora continua de los estudiantes (Matelsky et al., 2023).
La integración efectiva de los LLM en el dominio educativo no solo tiene el potencial de enriquecer la experiencia de aprendizaje, sino también de transformar los métodos de evaluación y proporcionar un entorno de aprendizaje personalizado y adaptativo. Sin embargo, también plantea importantes cuestionamientos sobre cómo deberían ser diseñados y administrados los formatos de evaluación para garantizar una medición precisa y justa del aprendizaje de los estudiantes en un entorno potencialmente asistido por LLM.

## 4. Marco teórico

### 4.1. Gestión de Proyectos y la Certificación PMP
La gestión de proyectos se ha convertido en una disciplina fundamental para lograr el éxito en una amplia gama de industrias y organizaciones (Schwalbe, 2020). La certificación Project Management Professional (PMP) emitida por el Project Management Institute (PMI) es ampliamente reconocida como la certificación líder en gestión de proyectos en todo el mundo. Obtener la certificación PMP demuestra que el individuo posee conocimientos y habilidades esenciales en gestión de proyectos, liderazgo, comunicación y resolución de problemas, entre otras áreas clave (Mulcahy, 2021).
La certificación PMP se obtiene después de cumplir requisitos específicos de educación, experiencia y examinación. El examen PMP cubre un conjunto central de conceptos, terminología y procesos relacionados con la gestión de proyectos, como se detalla en la Guía del PMBOK (Project Management Institute, 2017). Prepararse adecuadamente para el exigente examen PMP es clave para aprobarlo y obtener la acreditación (Phillips, 2021).

### 4.2. Modelos de Lenguaje de Gran Escala (LLMs)
Los modelos de lenguaje de gran escala (Large Language Models, LLMs) son una clase emergente de modelos de IA entrenados en enormes conjuntos de datos textuales (Bommasani et al., 2021). LLMs como GPT-3 y BERT han demostrado capacidades impresionantes en tareas de procesamiento del lenguaje natural como completación de texto, traducción y respuesta a preguntas (Devlin et al., 2019; Brown et al., 2020).
Una característica clave de los LLMs es que siguen aprendiendo y mejorando su desempeño a medida que interactúan con más datos textuales. Varios estudios han explorado el uso de LLMs en aplicaciones educativas, mostrando su potencial para apoyar el aprendizaje personalizado y adaptativo. Sin embargo, la investigación sobre el uso de LLMs para ayudar específicamente en la preparación para exámenes de certificación es aún emergente (Qiu et al., 2020).

### 4.3. Aplicación de LLMs en Educación
La evolución de los Modelos de Lenguaje Grande (LLM) ha catalizado una serie de avances en diversos campos, incluyendo el ámbito académico. Un ejemplo prominente de esta evolución es ChatGPT, que ha mostrado ser una herramienta prometedora en el entorno académico, proporcionando oportunidades para enriquecer la enseñanza y el aprendizaje, así como enfrentando desafíos inherentes a su implementación (Meyer et al., 2023).
Los LLM como ChatGPT, poseen la capacidad de generar respuestas informativas y coherentes basadas en el texto proporcionado, lo que puede ser utilizado para facilitar la interacción y el engagement en un contexto educativo. Sin embargo, también se plantean desafíos, especialmente en lo que respecta a la ética y la privacidad, que son aspectos cruciales a considerar en la adopción de estas tecnologías en la educación (Meyer et al., 2023).
La implementación de LLM en el ámbito académico presenta un paisaje de oportunidades y desafíos que requieren una exploración cuidadosa para maximizar los beneficios mientras se mitigan los riesgos asociados. La comprensión profunda de estas dinámicas es esencial para diseñar estrategias efectivas que permitan la integración responsable y efectiva de los LLM en la educación.

## 5. Objetivos

### 5.1. Objetivo general
Desarrollar y evaluar un asistente virtual fundamentado en modelos de lenguaje de gran escala (LLM) que, al incorporar técnicas de estudio comprobadas y un conocimiento detallado del examen de certificación PMP, ofrezca soporte en la preparación para obtener dicha certificación.

### 5.2. Objetivos específicos
- Familiarización con la Certificación PMP: Profundizar en el examen de certificación PMP para adquirir un entendimiento claro de sus contenidos y estructura.
- Selección de LLM: Investigar y contrastar diversos modelos de lenguaje de gran escala disponibles en el mercado con el fin de seleccionar el que mejor se adapte a las necesidades del asistente virtual.
- Exploración de Técnicas de Estudio: Analizar y comprender las técnicas de estudio más efectivas que se pueden aplicar en la preparación para el examen PMP.
- Diseño Centrado en el Usuario: Crear una experiencia de usuario que refleje las técnicas de estudio identificadas, garantizando una interacción intuitiva y productiva.
- Adaptación del LLM: Modificar y entrenar el LLM seleccionado para que pueda responder de manera efectiva a preguntas y escenarios concretos vinculados al examen PMP.
- Implementación de la Interfaz: Desarrollar una interfaz de usuario amigable junto con un sistema de retroalimentación que potencie el aprendizaje y la preparación de los usuarios.
- Ejecución de Casos de Estudio: Llevar a cabo dos estudios detallados: el primero con un individuo que se encuentra en proceso de preparación para el examen y el segundo con una persona que ya ha obtenido la certificación PMP.
- Evaluación de la Herramienta: Medir la eficacia y utilidad del asistente desarrollado mediante la retroalimentación obtenida en los casos de estudio y a través de pruebas adicionales con otros aspirantes al examen PMP.

## 6. Justificación
La ingeniería informática, como disciplina, se ha consolidado como una pieza clave en la configuración de la sociedad moderna. Se encarga del diseño, desarrollo, implementación y gestión de sistemas informáticos que solucionan problemas complejos y facilitan la operatividad en múltiples sectores. Dada esta amplitud de campo, es esencial que un ingeniero en informática no solo posea habilidades técnicas, sino también competencias en gestión y coordinación de proyectos.
En un mundo globalizado y en constante evolución tecnológica, la gestión de proyectos se ha establecido como una habilidad esencial para asegurar la implementación efectiva de soluciones informáticas. La certificación Project Management Professional (PMP) valida precisamente estas competencias, siendo una distinción que refrenda la capacidad de los profesionales para liderar proyectos complejos.
La preparación para el examen PMP, sin embargo, presenta desafíos inherentes. Aunque existen recursos para esta tarea, muchos aspirantes buscan soluciones más adaptativas y personalizadas. Aquí es donde la ingeniería informática puede desempeñar un papel crucial. El desarrollo de herramientas basadas en modelos de lenguaje de gran escala (LLMs) es un claro reflejo de la confluencia entre la informática y la educación, y representa una oportunidad para demostrar cómo las competencias técnicas pueden traducirse en soluciones prácticas y vanguardistas.
El diseño y creación de un asistente basado en LLMs para la preparación del examen PMP no solo es una muestra del potencial de la ingeniería informática en la educación, sino que también refuerza la relevancia de combinar habilidades técnicas con competencias de gestión. Además, este proyecto aborda directamente una de las principales incumbencias de la titulación: el desarrollo y aplicación de tecnologías informáticas innovadoras para resolver problemas reales y actuales.
En este sentido, este proyecto no solo busca ofrecer una herramienta valiosa para los aspirantes al PMP, sino también demostrar cómo la ingeniería informática puede ser instrumental en la transformación y mejora de procesos educativos y formativos. Así, la justificación de esta investigación radica en la oportunidad de combinar tecnologías emergentes con necesidades educativas actuales, a la vez que se refrendan y ponen en práctica las competencias y habilidades adquiridas durante la formación como ingeniero en informática.

## 7. Metodología
Para el desarrollo y evaluación del asistente virtual basado en modelos de lenguaje de gran escala (LLMs), se adoptará una metodología con un ciclo de vida iterativo e incremental a través del uso del marco de trabajo Scrum. Cada iteración representará un sprint de Scrum, permitiendo un desarrollo ágil y adaptativo del proyecto. Esta elección se fundamenta en la necesidad de refinar y mejorar continuamente el asistente, incorporando aprendizajes y retroalimentación en cada fase del proyecto.

### 7.1. Sprint 1: Adquisición de habilidades tecnológicas
1.	Curso de programación en Python: Completar un curso en línea de programación en Python que cubra los fundamentos del lenguaje, estructuras de datos y programación orientada a objetos.
2.	Familiarización con el framework Langchain: Estudiar la documentación oficial de Langchain y completar tutoriales para entender cómo se puede utilizar para desarrollar asistentes educativos.

### 7.2. Sprint 2: Prototipo inicial y familiarización con la certificación PMP
1.	Inmersión en la Certificación PMP: Durante esta fase, se llevará a cabo una profunda investigación y familiarización con la certificación PMP, abarcando sus contenidos, estructura y requisitos.
2.	Diseño Inicial del Asistente: Con base en el conocimiento adquirido y en un LLM previamente seleccionado, se realizará el diseño inicial del asistente y se establecerán las bases de la experiencia de usuario.
3.	Implementación del Prototipo: Se procederá a la creación del prototipo inicial del asistente, incorporando las características y funciones diseñadas en la fase anterior.
4.	Evaluación y Ajuste: Tras las pruebas piloto, se evaluará el desempeño y funcionalidad del prototipo, recolectando retroalimentación que permita realizar ajustes y mejoras.

### 7.3. Sprint 3: Refinamiento del asistente y profundización en técnicas de estudio
1.	Estudio de Técnicas de Estudio: Se investigarán y analizarán en detalle diversas técnicas de estudio que resulten efectivas para la preparación del examen PMP.
2.	Diseño Mejorado del Asistente: Con base en las técnicas de estudio identificadas, se procederá a refinar el diseño del asistente y a mejorar la experiencia de usuario.
3.	Implementación y Pruebas: Se desarrollará una versión mejorada del asistente y se realizarán pruebas con el primer caso de estudio, que involucra a una persona en proceso de preparación para la certificación.
4.	Evaluación y Ajustes: Se evaluarán los resultados obtenidos, recolectando retroalimentación del caso de estudio para realizar ajustes pertinentes.

### 7.4. Sprint 4: Optimización final y evaluación con un profesional certificado
1.	Diseño Final del Asistente: Se consolidarán todos los aprendizajes y retroalimentación recibida en las iteraciones previas para establecer el diseño final del asistente.
2.	Implementación del Sistema Final: Con el diseño ya optimizado, se procederá a implementar la versión final del asistente y se realizarán pruebas con el segundo caso de estudio, que involucra a una persona ya certificada.
3.	Evaluación General y Redacción: Se llevará a cabo una evaluación exhaustiva del asistente en su conjunto, analizando los resultados y realizando la redacción de la tesis.
4.	Ajustes Finales y Preparación: Con base en la evaluación final, se realizarán ajustes finales al asistente y se preparará todo lo necesario para la presentación y defensa de la tesis.

## Cronograma de actividades
- Sprint 1: Adquisición de habilidades tecnológicas: del mes 1 al mes 2
- Sprint 2: Prototipo inicial y familiarización con la certificación PMP: del mes 3 al mes 4								
- Sprint 3: Refinamiento del asistente y profundización en técnicas de estudio: del mes 5 al mes 6								
- Sprint 4: Optimización final y evaluación con un profesional certificado: del mes 7 al mes 8

Referencias
- Bommasani, R., et al. (2021). On the Opportunities and Risks of Foundation Models. arXiv preprint arXiv:2108.07258.
- Brown, T., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhariwal, P., ... & Agarwal, S. (2020). Language Models are Few-Shot Learners. OpenAI Blog. Recuperado de https://openai.com/blog/language-models-are-few-shot-learners/
- Dao, X. Q. (2023). Which Large Language Model should You Use in Vietnamese Education: ChatGPT, Bing Chat, or Bard? Eastern International University.
- Devlin, J., et al. (2019). BERT: Pre-training of deep bidirectional transformers for language understanding. Proceedings of NAACL-HLT (pp. 4171-4186).
- Elkins, S., Kochmar, E., Serban, I., & Cheung, J. C. K. (2023). How Useful are Educational Questions Generated by Large Language Models? McGill University & MILA (Quebec Artificial Intelligence Institute), Korbit Technologies Inc., MBZUAI, Canada CIFAR AI Chair. https://arxiv.org/abs/2304.06638
- Matelsky, J. K., Parodi, F., Liu, T., Lange, R. D., & Kording, K. P. (2023). A large language model-assisted education tool to provide feedback on open-ended responses. arXiv preprint arXiv:2308.02439.
- Meyer, J. G., Urbanowicz, R. J., Martin, P. C. N., O’Connor, K., Li, R., Peng, P.-C., Bright, T. J., Tatonetti, N., Won, K. J., Gonzalez-Hernandez, G., & Moore, J. H. (2023). ChatGPT and large language models in academia: opportunities and challenges. BioData Mining, 16(20). https://doi.org/10.1186/s13040-023-00339-9
- Mulcahy, R. (2021). PMP Exam Prep: Accelerated Learning to Pass PMIs PMP Exam. RMC Publications.
- OpenAI. (2023). GPT-4: Advanced Language Model. Recuperado de https://openai.com/research/gpt-4
- Phillips, J. (2021). PMP Project Management Professional All-in-One Exam Guide. McGraw-Hill Education.
- Project Management Institute (2017). A Guide to the Project Management Body of Knowledge (PMBOK Guide). Sixth Edition. Project Management Institute.
- Qiu, X., et al. (2020). Pre-trained models for natural language processing: A survey. Science China Technological Sciences, 63(10), 1872–1897.
- Savelka, J., Agarwal, A., Song, Y., Bogart, C., & Sakr, M. (2023). Can Generative Pre-trained Transformers (GPT) Pass Assessments in Higher Education Programming Courses? arXiv preprint arXiv:2303.09325.
- Schwalbe, K. (2020). Information technology project management. Cengage Learning.