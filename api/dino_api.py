import os
import random
import json
from datetime import datetime
from typing import List, Dict

import torch
from diffusers import DiffusionPipeline
from PIL import Image
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware



RUN_TAG = datetime.now().strftime("%Y%m%d-%H%M%S")
OUT_DIR = f"./outputs_{RUN_TAG}"
os.makedirs(OUT_DIR, exist_ok=True)

SEED = 42  


def set_seed(seed: int | None): 
    if seed is None:
        return
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


set_seed(SEED)
print("Carpeta de salida:", OUT_DIR)

# CARGA DEL MODELO

model_id = "amused/amused-512"
use_cuda = torch.cuda.is_available()
dtype = torch.float16 if use_cuda else torch.float32
device = "cuda" if use_cuda else "cpu"

print(f"Cargando modelo '{model_id}' en {device} con dtype={dtype}...")

pipe = DiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=dtype,
    safety_checker=None  #Desactiva el filtro
)
pipe = pipe.to(device)

#Optimizacion para VRAM
if hasattr(pipe, "enable_attention_slicing"):
    pipe.enable_attention_slicing()
if hasattr(pipe, "enable_vae_slicing"):
    pipe.enable_vae_slicing()
if hasattr(pipe, "enable_model_cpu_offload") and use_cuda:
    pipe.enable_model_cpu_offload()

print("Modelo cargado correctamente.")


# PARÁMETROS DE DIFUSIÓN

NUM_STEPS = 25
GUIDANCE_SCALE = 7.0
WIDTH, HEIGHT = 512, 512

NEGATIVE_PROMPT = (
    "blurry, low quality, low resolution, watermark, text artifacts, extra limbs, "
    "deformed, worst quality, cropped, jpeg artifacts, logo"
)


def build_prompt(name: str, desc: str) -> str:
    """Construye el prompt de entrada para el modelo de difusión."""
    return (
        f"Un dinosaurio llamado {name}. {desc}. "
        "Ambientación natural prehistórica, iluminación realista, detalle anatómico plausible, "
        "fotografía de naturaleza, fondo ligeramente desenfocado, composición equilibrada."
    )


# API FASTAPI


app = FastAPI(title="Dino Diffusion API", version="1.0")
# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  #React dev server
    allow_credentials=True,
    allow_methods=["*"],  #POST, GET, OPTIONS, etc
    allow_headers=["*"],
)

class DinoRequest(BaseModel):
    name: str
    desc: str


@app.post("/generate")
def generate_dino(req: DinoRequest):
    """Genera una imagen de dinosaurio a partir del nombre y descripción."""
    name = req.name.strip().replace("/", "-")
    desc = req.desc.strip()
    prompt = build_prompt(name, desc)

    print(f"Generando imagen para: {name}")

    image = pipe(
        prompt,
        negative_prompt=NEGATIVE_PROMPT,
        num_inference_steps=NUM_STEPS,
        guidance_scale=GUIDANCE_SCALE,
        width=WIDTH,
        height=HEIGHT
    ).images[0]

    out_path = os.path.join(OUT_DIR, f"{name}.png")
    image.save(out_path)

    print(f"Imagen guardada en: {out_path}")
    return FileResponse(out_path, media_type="image/png")


@app.get("/")
def home():
    """Ruta de prueba."""
    return {"status": "ok", "message": "Dino Diffusion API is running"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
