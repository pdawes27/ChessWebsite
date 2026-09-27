import { useState } from 'react';
import { Routes, Route, useNavigate, BrowserRouter, Link } from 'react-router-dom';
import './App.css';
import Chess from './chesspages/Chess.jsx';
import Settings from './Settings/Settings.jsx';
import ImpressiveChess from './chesspages/ImpressiveChess.jsx';
import logo from './assets/react.svg';

function Home() {
  return (
    <div className="else">
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
    </div>
  );
}

function App() {
  const [boardColor, setBoardColor] = useState(() => {
    return localStorage.getItem('boardColor') || 'classic';
  });

  return (
    <BrowserRouter>
      <div>
        <h1 className="heading"><img src={logo} alt="Hero " /> <Link to="/">Chess Website</Link> </h1>
        <nav className="navigation">
          <Link to="/chess">Local Play</Link>{" | "}
          <Link to ="/impressivechess">Chess Games</Link>
        </nav>
        <div className="footer">
          <nav>
            <Link to="/settings">Settings</Link>
          </nav>
        </div>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chess" element={<Chess boardColor={boardColor}/>} />
        <Route path="/impressivechess" element={<ImpressiveChess boardColor={boardColor}/>} />
        <Route path="/settings" element={<Settings boardColor={boardColor} setBoardColor={setBoardColor}/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;