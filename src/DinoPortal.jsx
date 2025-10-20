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

  // Valores fijos ya que quitamos los sliders
  const temperature = 1.0;
  const topK = 40;
  const topP = 0.9;

  const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

  useEffect(() => {
    async function loadExamples() {
      setLoadingExamples(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/examples`);
        if (!res.ok) throw new Error(`Failed to load examples: ${res.status}`);
        const data = await res.json();
        setExamples(data.examples || []);
      } catch (err) {
        setExamples([]);
        console.warn(err);
      } finally {
        setLoadingExamples(false);
      }
    }
    loadExamples();
  }, [API_BASE]);

  async function handleGenerateNew() {
    setGenerating(true);
    setError(null);
    setGeneratedName(null);
    setGeneratedDescription(null);
    setGeneratedImageUrl(null);

    try {
      const nameResp = await fetch(`${API_BASE}/generate-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature, topK, topP }),
      });
      if (!nameResp.ok) throw new Error(`Name generation failed: ${nameResp.status}`);
      const nameData = await nameResp.json();
      const name = nameData.name;
      setGeneratedName(name);

      const descriptionContext = `Rules: dinosaur names commonly include Greek/Latin prefixes and suffixes such as -saurus, -raptor, -odon, -long, -venator; prefixes describing size, shape, locality, era. Give a succinct (1-2 sentences) paleontological-sounding description for ${name}.`;

      const descResp = await fetch(`${API_BASE}/describe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, context: descriptionContext }),
      });
      if (!descResp.ok) throw new Error(`Description failed: ${descResp.status}`);
      const descData = await descResp.json();
      const description = descData.description || descData.text || "";
      setGeneratedDescription(description);

      const prompt = `"${name}", ${description}. Use concise visual cues only.`;
      const imgResp = await fetch(`${API_BASE}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, name }),
      });
      if (!imgResp.ok) throw new Error(`Image creation failed: ${imgResp.status}`);
      const imgData = await imgResp.json();
      setGeneratedImageUrl(imgData.image_url || imgData.url || null);

      try {
        await fetch(`${API_BASE}/examples`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            image_url: imgData.image_url,
          }),
        });
      } catch (e) {
        console.warn("Failed to persist example", e);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Isla de los Dinosaurios — Portal</h1>
        <p>Generación de nombres + Descripciones + Imágenes</p>
      </header>

      <section className="section">
        <h2>Descripción del modelo</h2>
        <p>
          Aquí puedes reemplazar este texto con tu resumen de métricas,
          arquitectura, gráficos, etc.
        </p>
      </section>

      <section className="section">
        <h2>Ejemplos Generados</h2>
        {loadingExamples ? (
          <div>Cargando ejemplos...</div>
        ) : examples.length === 0 ? (
          <div>No hay ejemplos guardados todavía.</div>
        ) : (
          <div className="example-grid">
            {examples.slice(0, 12).map((ex, i) => (
              <div key={i} className="example-card">
                <h4>{ex.name}</h4>
                <p>{ex.description}</p>
                {ex.image_url ? (
                  <img src={ex.image_url} alt={ex.name} />
                ) : (
                  <div className="placeholder-img">Sin imagen</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Nuevo Dinosaurio</h2>
        <button onClick={handleGenerateNew} disabled={generating}>
          {generating ? "Generando..." : "Nuevo Dinosaurio"}
        </button>

        {error && <div className="error">Error: {error}</div>}

        <div className="result-card">
          <h3>Resultado</h3>
          <p><strong>Nombre:</strong> {generatedName || "—"}</p>
          <p><strong>Descripción:</strong></p>
          <p>{generatedDescription || "—"}</p>
          <p><strong>Imagen:</strong></p>
          {generatedImageUrl ? (
            <img src={generatedImageUrl} alt={generatedName} />
          ) : (
            <div className="placeholder-img">Imagen no disponible</div>
          )}
        </div>
      </section>
    </div>
  );
}
