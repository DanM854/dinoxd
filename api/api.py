#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
api.py — Servidor FastAPI con ngrok para generar nombres desde dinos.py
"""

import os
import json
import numpy as np
import tensorflow as tf
from fastapi import FastAPI
from pyngrok import ngrok
import uvicorn

# -------------------------
# Configuración
# -------------------------
MODEL_DIR = "./model"
T = 24

SOS = "<sos>"
EOS = "<eos>"
PAD = "<pad>"

# -------------------------
# Funciones auxiliares
# -------------------------
def _softmax(logits):
    exp = np.exp(logits - np.max(logits))
    return exp / exp.sum()


def sample_token(logits, temperature=1.0, top_k=0, top_p=0.0):
    l = logits.copy()
    if top_k > 0 and top_k < len(l):
        idxs = np.argpartition(-l, top_k-1)[:top_k]
        mask = np.full_like(l, -1e10)
        mask[idxs] = l[idxs]
        l = mask
    if 0.0 < top_p < 1.0:
        sorted_idx = np.argsort(-l)
        sorted_logits = l[sorted_idx]
        probs = _softmax(sorted_logits)
        cumsum = np.cumsum(probs)
        keep = cumsum <= top_p
        if not keep.any():
            keep[0] = True
        keep_idx = sorted_idx[keep]
        mask = np.full_like(l, -1e10)
        mask[keep_idx] = l[keep_idx]
        l = mask
    if temperature > 0:
        l = l / temperature
    probs = _softmax(l)
    return int(np.random.choice(len(probs), p=probs))


def build_model(vocab_size, embed_dim=64, rnn_units=128):
    from tensorflow.keras import layers
    inputs = layers.Input(shape=(None,), dtype="int32")
    x = layers.Embedding(vocab_size, embed_dim, mask_zero=True)(inputs)
    x = layers.LSTM(rnn_units, return_sequences=True)(x)
    logits = layers.Dense(vocab_size)(x)
    model = tf.keras.Model(inputs, logits)
    return model


def generate_one(model, char2idx, idx2char, T, temperature, top_k, top_p):
    sos_idx = char2idx[SOS]
    eos_idx = char2idx[EOS]
    cur = [sos_idx]
    for _ in range(T):
        x = np.array(cur)[None, :]
        logits = model.predict(x, verbose=0)[0, -1]
        nxt = sample_token(logits, temperature, top_k, top_p)
        cur.append(nxt)
        if nxt == eos_idx:
            break
    chars = [idx2char[i] for i in cur if i in idx2char]
    name = "".join([c for c in chars if c not in {SOS, EOS, PAD}])
    return name.capitalize()

# -------------------------
# Carga de modelo entrenado
# -------------------------
def load_model_and_dicts():
    char2idx_path = os.path.join(MODEL_DIR, "char2idx.json")
    idx2char_path = os.path.join(MODEL_DIR, "idx2char.json")
    weights_path = os.path.join(MODEL_DIR, "dino_model.h5")

    if not (os.path.exists(char2idx_path) and os.path.exists(idx2char_path) and os.path.exists(weights_path)):
        raise FileNotFoundError("❌ No se encontró el modelo entrenado. Ejecuta primero dinos.py")

    with open(char2idx_path) as f:
        char2idx = json.load(f)
    with open(idx2char_path) as f:
        idx2char = {int(k): v for k, v in json.load(f).items()}

    model = build_model(len(char2idx))
    model.load_weights(weights_path)
    print("✅ Modelo cargado correctamente desde ./model/")
    return model, char2idx, idx2char


# -------------------------
# Servidor FastAPI + ngrok
# -------------------------
app = FastAPI(title="🦖 DinoName API")
model, char2idx, idx2char = load_model_and_dicts()

@app.get("/generate")
def generate_name(temp: float = 1.0, top_k: int = 5, top_p: float = 0.8):
    """Genera un solo nombre nuevo"""
    name = generate_one(model, char2idx, idx2char, T, temp, top_k, top_p)
    return {"nombre_generado": name}


if __name__ == "__main__":
    public_url = ngrok.connect(8000)
    print(f"🌍 API pública disponible en: {public_url.public_url}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
