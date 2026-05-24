import { Routes, Route, Link } from 'react-router-dom';
import TrainPage from './pages/TrainPage';
import SurvivalPage from './pages/SurvivalPage';
import StatsPage from './pages/StatsPage';
import './App.css'; // создадим простые стили

function App() {
  return (
    <div className="app">
      <nav className="nav">
        <Link to="/" className="nav-link">Тренировка</Link>
        <Link to="/survival" className="nav-link">Выживание</Link>
        <Link to="/stats" className="nav-link">Статистика</Link>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TrainPage />} />
          <Route path="/survival" element={<SurvivalPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;