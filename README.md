# 🦖Dino portal

Un proyecto para la materia Procesamiento de Lenguaje Natural pensado para entender modelos de lenguaje a nivel de caracteres con RNN (Redes Neuronales recurrentes) con tematica de dinosaurios.

## Contexto del trabajo

¡Bienvenido a la Isla de los Dinosaurios! Los principales investigadores en ingeniería genética están creando nuevas especies de dinosaurios y tenemos la misión de asignarles un nombre. En este momento contamos con una lista que contiene todos los nombres de dinosaurios conocidos. A partir de ese listado, tenemos la misión de entrenar un modelo de lenguaje a nivel de caracteres, usando RNN, que aprenda los patrones de los nombres y genere nuevas combinaciones para asignar un nombre a las nuevas especies. Se espera que los nombres generados sean originales, plausibles y variados.


* Generación de caracteres
* Generación de una descripcion para los nombres generados usando Ollama
* Text-to-Image usando modelos de difusión
* Integración en una aplicacion web
* Chat con los dinosaurios

En el archivo Generador de caracteres - Dino.pdf se encuentra toda la información

### Archivos

* En `src` se encuentran todos los componentes de React
* En `api` se encuentran las api's de las funciones de la aplicacion web
  * `names_api.py` Generación de nombres basandose en los datos de https://raw.githubusercontent.com/jpospinalo/MachineLearning/main/nlp/dinos.csv
  * `dino_api.py` Generación de imagenes basandose en el nombre y descripción generados
  * `chat_api.py` Chat para comunicarse con alguno de los dinosaurios

Realizado por:
  * Daniel Mora
  * Juan Londoño
  * Sebastian Sabogal
  * Tomas de Andreis
