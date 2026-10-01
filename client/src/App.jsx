import { NavLink, Route, Routes } from "react-router-dom"
import Desk from "./pages/Desk.jsx"
import Model from "./pages/Model.jsx"
import Plans from "./pages/Plans.jsx"

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>GRIDLOCK</strong>
          <span>Bengaluru patrol desk</span>
        </div>
        <nav>
          <NavLink to="/" end>Desk</NavLink>
          <NavLink to="/plans">Saved</NavLink>
          <NavLink to="/model">Model</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Desk />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/model" element={<Model />} />
      </Routes>
    </div>
  )
}
