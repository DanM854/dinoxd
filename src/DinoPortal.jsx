import React, { useState, useEffect } from "react";
import "./DinoPortal.css";

export default function DinoPortal() {
  const [examples, setExamples] = useState([]);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedName, setGeneratedName] = useState(null);
  const [generatedDescription, setGeneratedDescription] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [error, setError] = useState(null);

  // Parámetros fijos
  const temperature = 1.0;
  const topK = 5;
  const topP = 0.9;

  // URLs desde el .env
  const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
  const DESC_API_URL = process.env.REACT_APP_DESC_API_URL || "http://localhost:11434";
  const IMG_API_URL = process.env.REACT_APP_IMG_API_URL || "http://localhost:8001";

  // Cargar ejemplos al iniciar
  

  // Generar nombre + descripción + imagen
  async function handleGenerateNew() {
    setGenerating(true);
    setError(null);
    setGeneratedName(null);
    setGeneratedDescription(null);
    setGeneratedImageUrl(null);

    try {
      // 🔹 1. Generar nombre desde el backend principal
      const nameResp = await fetch(`${API_BASE}/generate-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature, topK, topP }),
      });
      if (!nameResp.ok) throw new Error(`Error generando nombre: ${nameResp.status}`);
      const nameData = await nameResp.json();
      const name = nameData.name;
      setGeneratedName(name);

      // 🔹 2. Generar descripción desde el endpoint de Ollama
      const prompt = `Eres un paleontólogo experto en nuevas especies que descubriste. Tu objetivo es darle una descripción al nombre del dinosaurio que se te enviará. Debes respetar o añadir los sufijos como -saurus, -raptor, -odon, -long o -venator, y prefijos de origen griego o latino que describen forma, tamaño o lugar. El dinosaurio al que describirás es el siguiente: ${name}. "NO ME DES MAS TEXTOS", sé conciso pero detallado.`;

      const descResp = await fetch(`${DESC_API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:4b",
          prompt,
          stream: false,
        }),
      });
      if (!descResp.ok) throw new Error(`Error generando descripción: ${descResp.status}`);
      const descData = await descResp.json();
      const description =
        descData.response || descData.text || descData.description || "Sin descripción generada";
      setGeneratedDescription(description);

      // 🔹 3. Generar imagen con tu API de difusión (FastAPI)
      const imgResp = await fetch(`${IMG_API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc: description }),
      });
      if (!imgResp.ok) throw new Error(`Error generando imagen: ${imgResp.status}`);

      // Convertir la respuesta binaria (FileResponse) a URL temporal
      const blob = await imgResp.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImageUrl(imageUrl);

    } catch (err) {
      console.error("Error generando dinosaurio completo:", err);
      setError(err.message || String(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🦕 Isla de los Dinosaurios — Portal</h1>
      </header>

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

      <section className="section">
        <h2>Nuevo Dinosaurio</h2>
        <button onClick={handleGenerateNew} disabled={generating}>
          {generating ? "Generando..." : "🦖 Generar Dinosaurio Completo"}
        </button>

        {error && <div className="error">Error: {error}</div>}

        <div className="result-card">
          <h3>Resultado</h3>
          <p><strong>Nombre:</strong> {generatedName || "—"}</p>
          <p><strong>Descripción:</strong></p>
          <p>{generatedDescription || "—"}</p>
          <p><strong>Imagen:</strong></p>
          {generatedImageUrl ? (
            <img
              src={generatedImageUrl}
              alt={generatedName}
              style={{ width: "300px", borderRadius: "8px", marginTop: "10px" }}
            />
          ) : (
            <div className="placeholder-img">Imagen no disponible</div>
          )}
        </div>
      </section>
    </div>
  );
}
