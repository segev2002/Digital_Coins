import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Reports from "./pages/Reports";
import AIRecommendation from "./pages/AIRecommendation";
import About from "./pages/About";
import "./App.css";

export default function App() {
  const [search, setSearch] = useState("");

  return (
    <div className="app">
      <Navbar search={search} onSearch={setSearch} />
      <main>
        <Routes>
          <Route path="/" element={<Home search={search} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai" element={<AIRecommendation />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
