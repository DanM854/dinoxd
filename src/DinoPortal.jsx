import React, { useState } from "react";
import "./DinoPortal.css";

export default function DinoPortal() {
  const [generating, setGenerating] = useState(false);
  const [generatedName, setGeneratedName] = useState(null);
  const [generatedDescription, setGeneratedDescription] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [error, setError] = useState(null);

  // 🔹 Chat
  const [userMessage, setUserMessage] = useState("");
  const [dinoResponse, setDinoResponse] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  // Parámetros fijos
  const temperature = 1.0;
  const topK = 5;
  const topP = 0.9;

  // URLs desde el .env
  const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
  const DESC_API_URL = process.env.REACT_APP_DESC_API_URL || "http://localhost:11434";
  const IMG_API_URL = process.env.REACT_APP_IMG_API_URL || "http://localhost:8001";
  const CHAT_API_URL = process.env.REACT_APP_CHAT_API_URL || "http://localhost:11435";

  // 🔹 Generar nombre + descripción + imagen
  async function handleGenerateNew() {
    setGenerating(true);
    setError(null);
    setGeneratedName(null);
    setGeneratedDescription(null);
    setGeneratedImageUrl(null);
    setChatHistory([]);
    setDinoResponse("");

    try {
      // 1️⃣ Generar nombre
      const nameResp = await fetch(`${API_BASE}/generate-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature, topK, topP }),
      });
      if (!nameResp.ok) throw new Error(`Error generando nombre: ${nameResp.status}`);
      const nameData = await nameResp.json();
      const name = nameData.name;
      setGeneratedName(name);

      // 2️⃣ Generar descripción
      const prompt = `Eres un paleontólogo experto en nuevas especies que descubriste. Tu objetivo es escribir una descripción breve y científica del dinosaurio cuyo nombre te proporcionaré. Reglas estrictas: 1. Respeta o añade los sufijos -saurus, -raptor, -odon, -long o -venator según corresponda. 2. Usa prefijos de origen griego o latino que describan forma, tamaño o lugar. 3. No incluyas ningún formato de markdown, comillas, paréntesis, guiones, asteriscos o caracteres especiales. 4. Entrega solo texto plano. 5. No incluyas traducciones ni explicaciones etimológicas. 6. Sé conciso pero detallado. Dinosaurio a describir: ${name}`;

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
        descData.response?.trim() ||
        descData.text?.trim() ||
        descData.description?.trim() ||
        "Sin descripción generada";
      setGeneratedDescription(description);

      // 3️⃣ Generar imagen
      const imgResp = await fetch(`${IMG_API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc: description }),
      });
      if (!imgResp.ok) throw new Error(`Error generando imagen: ${imgResp.status}`);
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

  // 🔹 Enviar pregunta al dinosaurio
  async function handleAskDino() {
    if (!userMessage.trim()) return;
    if (!generatedName || !generatedDescription) {
      alert("Primero genera un dinosaurio antes de hablar con él 🦕");
      return;
    }

    const msg = userMessage.trim();
    setUserMessage("");
    setDinoResponse("🦖 Pensando...");

    try {
      const res = await fetch(`${CHAT_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generatedName,
          desc: generatedDescription,
          message: msg,
        }),
      });

      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();

      setChatHistory((prev) => [
        ...prev,
        { role: "user", text: msg },
        { role: "dino", text: data.answer },
      ]);

      setDinoResponse("");
    } catch (err) {
      console.error("Error hablando con el dinosaurio:", err);
      setDinoResponse("Error comunicando con el dinosaurio 🦖");
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🦕 Isla de los Dinosaurios — Portal</h1>
      </header>

      {/* 🧬 Generador */}
      <section className="section">
        <h2>Nuevo Dinosaurio</h2>
        <button onClick={handleGenerateNew} disabled={generating}>
          {generating ? "Generando..." : "🦖 Generar Dinosaurio Completo"}
        </button>

        {error && <div className="error">❌ {error}</div>}

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
              style={{
                maxWidth: "100%",
                width: "512px",
                height: "512px",
                borderRadius: "8px",
                marginTop: "10px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="placeholder-img">Imagen no disponible</div>
          )}
        </div>
      </section>

      {/* 💬 Chat */}
      {generatedName && generatedDescription && (
      <section className="section dino-chat-container">
          <h2>Habla con {generatedName} 🦕</h2>

          <div className="chat-box">
            <div className="chat-history">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  <strong>{msg.role === "user" ? "Tú:" : `${generatedName}:`}</strong>{" "}
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="chat-input">
              <textarea
                rows="3"
                placeholder={`Escribe tu mensaje para ${generatedName}...`}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                disabled={!!dinoResponse && dinoResponse.includes("Pensando")}
              />
              <button
                onClick={handleAskDino}
                disabled={!userMessage.trim() || (dinoResponse && dinoResponse.includes("Pensando"))}
              >
                {dinoResponse && dinoResponse.includes("Pensando")
                  ? "🦖 Pensando..."
                  : "Enviar"}
              </button>
            </div>

            {dinoResponse && !dinoResponse.includes("Pensando") && (
              <div className="dino-reply">
                <em>{dinoResponse}</em>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
