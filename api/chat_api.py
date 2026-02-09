from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import uvicorn

app = FastAPI(title="Dino Chat API")

# CORS (permite peticiones desde localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de entrada
class ChatInput(BaseModel):
    name: str
    desc: str
    message: str


@app.post("/ask")
def ask_dino(input_data: ChatInput):
    """
    Recibe:
      - name: nombre del dinosaurio
      - desc: descripción científica
      - message: texto del usuario
    Devuelve: respuesta generada por el modelo
    """

    #Configurar modelo Ollama
    model = ChatOllama(
        base_url='https://unfalsifiable-unpolemically-kenda.ngrok-free.dev',
        model='gemma3:4b',
        temperature=0.7,
        num_ctx=512,
        num_predict=256,
        keep_alive='5m'
    )

    #Crear prompt personalizado con el dinosaurio generado
    system_prompt = (
        f"Eres un dinosaurio recién descubierto llamado {input_data.name}. "
        f"Tu descripción científica es la siguiente:\n\n"
        f"{input_data.desc}\n\n"
        f"Responde las preguntas del humano manteniendo tu personalidad de dinosaurio. "
        f"Debes hablar en primera persona, con un tono divertido pero coherente con tu especie. "
        f"Instrucciones:\n"
        f"- Siempre inicia y termina tus respuestas con 'Rawr 🦖'.\n"
        f"- Añade emojis de dinosaurios 🦕🦖 de forma natural.\n"
        f"- No repitas la descripción textual completa, pero puedes hacer referencias a ella.\n"
        f"- Si el humano te pregunta sobre ti, responde con detalles basados en tu descripción.\n"
    )

    #Crear plantilla LangChain
    chat_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{user_input}")
    ])

    chain = chat_template | model | StrOutputParser()

    #Generar respuesta (streaming)
    response = ""
    for chunk in chain.stream({"user_input": input_data.message}):
        response += chunk

    return {"answer": response}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=11435)