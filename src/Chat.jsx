import React, { useState } from "react";
import "./App.css";

export default function DinoChat() {
  const [selectedIndex, setSelectedIndex] = useState("");
  const [selectedDesc, setSelectedDesc] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📡 URL de la API
  const CHAT_API_URL = process.env.REACT_APP_CHAT_API_URL || "http://localhost:11435";

  // 🦕 Lista de dinosaurios
  const dinos = [
    "Austroraptor",
    "Iorosaursaurus",
    "Ianaurus",
    "Aoraurus",
    "Onoanaus",
    "Ianorausaurus",
    "Aosaurus",
    "Eonoraos",
    "Osausaus",
    "Aonasiar"
  ];

  // 📘 Descripciones
  const descs = [
    "Un dromeosaurido carnívoro de tamaño considerable (aprox. 8-10 metros de largo), caracterizado por robustas extremidades anteriores adaptadas para una poderosa mordida y un pico óseo en la boca...",
    "Un robusto terópodo mesozoico del Cretácico Superior con una espina cervical alta, especializado en presas grandes.",
    "Un gran saurópodo herbívoro de cuello extendido, adaptado para alcanzar las copas de los árboles.",
    "Un titán terópodo del Cretácico Superior, de hasta 35 metros de largo, con garras delanteras afiladas e indicios de ser un depredador apical.",
    "Herbívoro mediano del grupo de los titanosaurios con cuello largo y piel escamosa con posibles crestas óseas.",
    "Titanosaurio herbívoro gigante con cuello largo, cola robusta y escudo dorsal.",
    "Gigantesco terópodo carnívoro de 40 metros, con mandíbulas poderosas y una musculatura masiva.",
    "Depredador robusto con mandíbula fuerte y dientes adaptados a triturar huesos.",
    "Terópodo robusto de tamaño mediano, con huesos densos y fuerte musculatura.",
    "Terópodo herbívoro robusto con pico córneo óseo, adaptado a cortar vegetación densa."
  ];

  // 🎯 Manejar selección de dinosaurio
  function handleSelect(e) {
    const index = e.target.value;
    setSelectedIndex(index);
    setSelectedDesc(descs[index] || "");
    setChatHistory([]);
    console.log("🦖 Seleccionado:", dinos[index]);
  }

  // 💬 Enviar mensaje
  async function handleSend() {
    if (!selectedIndex) {
      setError("Selecciona un dinosaurio primero.");
      return;
    }
    if (!userMessage.trim()) return;

    const name = dinos[selectedIndex];
    const description = selectedDesc;
    const message = userMessage.trim();

    setError(null);
    setUserMessage("");
    setLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", text: message }]);

    try {
      console.log("📤 Enviando a API:", `${CHAT_API_URL}/ask`);
      console.log("🧾 Payload:", { name, desc: description, message });

      const res = await fetch(`${CHAT_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc: description, message }),
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = await res.json();

      console.log("📗 Respuesta recibida:", data);

      const reply = data.answer || data.response || "El dinosaurio no respondió...";
      setChatHistory((prev) => [...prev, { role: "dino", text: reply }]);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dino-chat-container">
      <header className="chat-header">
        <h1>🦕 Chat Jurásico</h1>
        <p>Habla con dinosaurios</p>
      </header>

      <section className="chat-section">
        <label>Selecciona un dinosaurio:</label>
        <select value={selectedIndex} onChange={handleSelect}>
          <option value="">— Elige uno —</option>
          {dinos.map((dino, i) => (
            <option key={i} value={i}>
              {dino}
            </option>
          ))}
        </select>

        {selectedDesc && (
          <div className="dino-desc">
            <h3>Descripción</h3>
            <p>{selectedDesc}</p>
          </div>
        )}
      </section>

      <section className="chat-box">
        <div className="chat-history">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              <strong>{msg.role === "user" ? "Tú:" : dinos[selectedIndex] + ":"}</strong>{" "}
              {msg.text}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <textarea
            rows="3"
            placeholder="Escribe tu mensaje..."
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? "🦖 Pensando..." : "Enviar"}
          </button>
        </div>

        {error && <div className="error">❌ {error}</div>}
      </section>
    </div>
  );
}
