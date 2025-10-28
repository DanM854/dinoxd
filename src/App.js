import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import DinoPortal from "./DinoPortal";
import Analisis from "./Analisis";
import Chat from "./Chat.jsx"

function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <h1>🦕 Isla de los Dinosaurios — Portal</h1>
      <button onClick={() => navigate("/")}>Volver al Portal</button>
      <button onClick={() => navigate("/analisis")}>Ir a Análisis</button>
      <button onClick={() => navigate("/chat")}>Ir al Chat</button>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/analisis" element={<Analisis />} />
        <Route path="/" element={<DinoPortal />} />
        <Route path= "/chat" element={<Chat />}/>
      </Routes>
    </Router>
  );
}
