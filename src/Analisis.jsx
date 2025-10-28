import React from "react";
import dino_10 from './dino_10.jpeg'
import curva from './curva.jpeg'
import comparacion from './comparacion.jpeg'

export default function Analisis() {
  return (
    <div className="container">
      <h1>📊 Página de Análisis</h1>
	  <div className="two-column">
        <div>
          <p>Tipo de modelo: Red neuronal recurrente (decoder-only) basada en LSTM</p>
          <p>Objetivo: Modelado de secuencia a nivel de carácter</p>
          <p>Tarea: Predicción del siguiente carácter dado el historial previo</p>
          <p>Datos: dinos.csv — 1536 nombres de dinosaurios</p>
          <p>Preprocesamiento:</p>
          <ul>
            <li>Normalización a minúsculas</li>
            <li>Inserción de tokens sos y eos</li>
            <li>Padding a longitud máxima T = 24</li>
            <li>Secuencias X = [x₀, …, xₜ₋₁], Y = [x₁, …, xₜ]</li>
          </ul>
        </div>

        <div>
          <p>Tipo: LSTM autoregresivo (decoder-only, character-level)</p>
          <ul>
            <li>Embedding(vocab_size, 64)</li>
            <li>LSTM(128, return_sequences=True)</li>
            <li>Dense(vocab_size)</li>
            <li>Loss: SparseCategoricalCrossentropy(from_logits=True)</li>
            <li>Optimizador: Adam</li>
            <li>Batch: 128 — Épocas: 5 — T: 24</li>
            <li>Tokens especiales: sos, eos, pad</li>
            <li>Muestreo: Temperature, Top-k, Top-p</li>
          </ul>
        </div>
      </div>
	   <div className="two-column">
			<div>
				<p>Las LSTM son un tipo especial de red neuronal que recuerda información importante de secuencias largas, algo que las RNN normales suelen olvidar. Gracias a sus “puertas” internas, pueden decidir qué recordar, qué olvidar y qué usar para predecir el siguiente elemento de la secuencia. Esto las hace ideales para generar nombres de dinosaurios, porque pueden captar tanto patrones cortos como prefijos y sufijos, como la estructura completa del nombre, sin necesitar enormes cantidades de datos.</p>
				<p>Además, el modelo permite definir funciones de puntuación o penalización específicas (por ejemplo, castigar vocales repetidas o premiar proporciones equilibradas de vocales y consonantes), lo que ofrece un control fino sobre el estilo de salida sin necesidad de modificar la arquitectura base.
					Esta capacidad de ajustar los “premios y castigos” facilita que el generador se alinee con criterios lingüísticos o paleontológicos definidos por el usuario.</p>


				<p>Interpretación de resultados</p>

				<p>1. Tendencia general</p>

				<p>Se observa una tendencia clara de degradación del puntaje a medida que aumenta la temperatura.</p>

				<p>Las configuraciones con T=0.7 o T=1.0 muestran los mejores puntajes, acercándose más al eje derecho (valores cercanos a 0).</p>

				<p>A medida que T aumenta a 2.5 o 4.0, los puntajes se vuelven mucho más negativos (barras más largas hacia la izquierda), indicando una pérdida significativa de coherencia fonética y estructura lingüística.</p>

				<p>2. Efecto de Top-k</p>

				<p>El parámetro top-k regula cuántas opciones probables se consideran en cada paso de generación:</p>

				<p>Configuraciones con k=5 tienden a mantener mejor rendimiento, evitando tanto la repetición como la aleatoriedad excesiva.</p>

				<p>Con k=10, el puntaje se deteriora en la mayoría de los casos, especialmente con temperaturas altas, lo que sugiere que una mayor diversidad sin control amplifica los errores en la secuencia generada.</p>

				<p>3. Efecto de Top-p</p>

				<p>El parámetro top-p (muestreo por núcleo) muestra un impacto moderado pero consistente:</p>

				<p>p=0.9 o p=0.95 suele acompañar las configuraciones más estables y con menor penalización.</p>

				<p>En cambio, p=0.8 o p=0.0 (sin restricción) produce puntajes más negativos, lo que indica falta de equilibrio entre diversidad y coherencia.</p>

				<p>4. Configuraciones óptimas</p>

				<p>Los mejores desempeños se concentran en:</p>

				<p>T=0.7, k=5, p=0.9–0.95</p>

				<p>T=1.0, k=5, p=0.9</p>

				<p>Estas combinaciones obtienen los puntajes más altos (más cercanos a cero), evidenciando nombres fonéticamente más naturales y consistentes.</p>

				<p>5. Configuraciones problemáticas</p>

				<p>Las peores configuraciones corresponden a:</p>

				<p>T=4.0, k=10, p=0.95</p>

				<p>T=4.0, k=10, p=0.8</p>

				<p>T=2.5, k=10, p=0.95</p>

				<p>En estos casos, las barras son las más extensas hacia la izquierda (puntajes inferiores a -500), mostrando que la combinación de alta temperatura y alta diversidad genera ruido lingüístico y pérdida total de estructura.</p>

				<p>Conclusión</p>

				<p>El gráfico confirma empíricamente que:</p>

				<p>La temperatura es el factor más determinante en la calidad del texto generado.</p>

				<p>Un top-k moderado (5) y un top-p ajustado (0.9–0.95) mejoran la estabilidad del modelo.</p>

				<p>Las configuraciones más estables se concentran en el rango <code>T=0.7–1.0</code>, con <code>top-k</code> bajo y <code>top-p</code> moderado, mientras que los valores extremos (<code>T&gt;2.5</code> o <code>k&gt;10</code>) degradan el rendimiento de forma notoria.</p>
	
			</div>
			<div>
				<p>La temperatura controla la aleatoriedad del muestreo de caracteres:</p>

				<p>Temperaturas bajas (0.7 – 1.0) producen nombres más estables, fonéticamente consistentes y cercanos a los patrones aprendidos.
					En los resultados observados, estas temperaturas generaron los nombres con mayor puntuación, como Ausaurus o Aoraurus, con un score medio positivo (~13.1).</p>

				<p>Temperaturas altas (2.5 – 4.0) introducen demasiada variabilidad, lo que provoca combinaciones menos coherentes o fonéticamente inusuales, reflejadas en puntajes promedio negativos (hasta -162.26).</p>

				<p>Conclusión: el rango óptimo de temperatura se encuentra entre 0.7 y 1.0, donde el modelo mantiene creatividad sin perder coherencia fonética.</p>

				<p>El parámetro top-k restringe el muestreo a las k opciones más probables en cada paso:</p>

				<p>Con valores moderados (k=5 o k=10), el modelo equilibra diversidad y calidad, evitando repeticiones excesivas o combinaciones inverosímiles.</p>

				<p>Cuando top-k=0 (sin restricción), la distribución de probabilidad completa se usa y los resultados se degradan, generando nombres inconsistentes y de baja puntuación.</p>

				<p>Conclusión: top-k=5 proporcionó el mejor balance entre creatividad y coherencia estructural.</p>
				<p>El parámetro top-p ajusta dinámicamente el rango de probabilidad acumulada a considerar:</p>

				<p>Valores moderados (0.8–0.95) produjeron buenos resultados en combinación con temperatura baja, mostrando ligeras variaciones morfológicas sin perder estructura (Aoraurus, Ianoraus).</p>

				<p>En contraste, top-p=0.0 (sin filtrado) o combinaciones extremas con alta temperatura resultaron inestables y con puntajes promedio muy negativos.</p>

				<p>Conclusión: el uso de top-p entre 0.8 y 0.95, combinado con temperaturas bajas y top-k medio, mejora la diversidad sin comprometer la calidad fonética.</p>
			</div>
	   </div>
	  <div className="two-column">
			<div>
				<img
				src={curva}
				alt="a"
				style={{
					maxWidth: "100%",
					width: "512px",
					borderRadius: "8px",
					marginTop: "10px"
				}}
				/>
			</div>
			<div>
				<img
				src={comparacion}
				alt="a"
				style={{
					maxWidth: "100%",
					width: "512px",
					borderRadius: "8px",
					marginTop: "10px"
				}}
				/>
			</div>	
	  </div>
	  <div className="two-column">
		<div>
			<li>Ausaurus -- score=13.1, temp=0.7, top-k=5, top-p=0.0</li>
			<li>Iorosaus -- score=13.1, temp=0.7, top-k=5, top-p=0.0</li>
			<li>Ianaurus -- score=13.1, temp=0.7, top-k=5, top-p=0.8</li>
			<li>Aoraurus -- score=13.1, temp=0.7, top-k=5, top-p=0.8</li>
			<li>Onoanaus -- score=13.1, temp=0.7, top-k=5, top-p=0.8</li>
			<li>Ianoraus -- score=13.1, temp=0.7, top-k=5, top-p=0.8</li>
			<li>Aosaurus -- score=13.1, temp=1.0, top-k=5, top-p=0.8</li>
			<li>Eonoraos -- score=13.1, temp=1.0, top-k=5, top-p=0.95</li>
			<li>Osausaus -- score=13.1, temp=1.0, top-k=5, top-p=0.95</li>
			<li>Aosaurus -- score=13.1, temp=1.0, top-k=10, top-p=0.8</li>
		</div>
		<div>
			<img
				src={dino_10}
				alt="a"
				style={{
					maxWidth: "100%",
					width: "512px",
					borderRadius: "8px",
					marginTop: "10px"
				}}
				/>
		</div>
		 
	  </div>
	  <div>
		<ul>
			<li>
				<strong>Austroraptor magnus</strong>: "Rapaz del Este Grande". Un dromeosaurido carnívoro de tamaño considerable (aprox. 8-10 metros de largo), caracterizado por robustas extremidades anteriores adaptadas para una poderosa mordida y un pico óseo en la boca. Poseía un perfil craneal liso y ligeramente redondeado, con una cresta nasal prominente. La musculatura de las patas posteriores sugiere una gran velocidad y agilidad, aunque su tamaño indicaría un estilo de caza más oportunista que depredador activo. El nombre "Magnus" refleja su tamaño considerable.
			</li>
			
			<li>
				<strong>Iorosaursaurus magnus</strong>: Un robusto terópodo mesozoico del Cretácico Superior. "Iorosaus" se traduce como "fuerte espina", aludiendo a la notable espina cervical, excepcionalmente alta. Se estima que medía entre 8 y 10 metros de largo, con robustas extremidades posteriores y una cola corta. La dentición sugiere una dieta carnívora especializada en presas grandes. Comparte rasgos con Tyrannosaurus y Gorgosaurus, aunque su espina cervical distintiva lo diferencia.
			</li>

			<li>
				<strong>Ianaurus magnus</strong>: Un gran saurópodo herbívoro de tamaño considerable, derivado del latín iana, posiblemente refiriéndose al río Iano en Crimea. La terminación "-aurus" indica su clasificación como saurópodo. Se caracterizó por una alta columna vertebral y un cuello extendido, adaptado para alcanzar las copas de los árboles.
			</li>

			<li>
				<strong>Aoraurus maximus</strong>: Un titán terópodo del Cretácico Superior. "Aoraurus" deriva del griego auro (oro, brillante) y oura (cola), sugiriendo una cola dorada y robusta. Maximus indica un tamaño excepcional, estimado en 30-35 metros de longitud y un peso superior a 80 toneladas. Presenta un cuello extremadamente largo y garras delanteras grandes y afiladas, indicativas de un depredador apical.
			</li>

			<li>
				<strong>Onoanaus robustus</strong>: Herbívoro mediano del grupo de los titanosaurios. Tamaño estimado: 8-10 metros de largo, 3-4 metros de altura. Posee robusta estructura ósea, especialmente en extremidades posteriores y fémur, cuello largo y flexible, piel escamosa con posibles crestas óseas en el cuello.
			</li>

			<li>
				<strong>Ianorausaurus magnus</strong>: Titanosaurio herbívoro de gran tamaño del Cretácico Superior. "Iano" (sol) y "raus" (derivado de "radius") enfatizan el tamaño. Longitud estimada: 30-35 metros; peso: 60-70 toneladas. Cola robusta y cuello largo, con posibles crestas óseas en el escafus. Presenta robusto pisarón y marcado escudo en la espalda.
			</li>

			<li>
				<strong>Aosaurus magnus</strong>: Gigantesco terópodo carnívoro del Cretácico Superior. "Aosaurus" deriva de "auro" (oro) y "saurus" (lizard). Magnus enfatiza su tamaño, estimado en 35-40 metros y 80-100 toneladas. Cabeza robusta, mandíbulas poderosas, cuello largo y flexible, cola larga y musculosa.
			</li>

			<li>
				<strong>Eonoraos</strong>: Del griego “eon” (tiempo, era) y “ora” (boca, pico), sugiriendo un depredador de rasgos distintivos y potente mandíbula. Estimado 12-14 metros, robusto, con características dentales adaptadas a trituración de huesos.
			</li>

			<li>
				<strong>Osausaus robustus</strong>: Terópodo robusto de tamaño mediano, probablemente del Cretácico Superior. Huesos óseos gruesos y musculosos. Longitud estimada: 7-8 metros.
			</li>

			<li>
				<strong>Aonasiar robustus</strong>: Terópodo herbívoro robusto, Cretácico Superior (Maastrichtiano). Tamaño aproximado: 8 metros de longitud, 3 metros de altura. Pico córneo óseo distintivo para cortar vegetación densa, musculatura potente y esqueleto denso.
			</li>
		</ul>
	  </div>
    </div>
  );
}
