import { Routes, Route, Link } from 'react-router-dom';
import TrainPage from './pages/TrainPage';
import SurvivalPage from './pages/SurvivalPage';
import StatsPage from './pages/StatsPage';

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Тренировка</Link>
        <Link to="/survival">Выживание</Link>
        <Link to="/stats">Статистика</Link>
      </nav>
      <Routes>
        <Route path="/" element={<TrainPage />} />
        <Route path="/survival" element={<SurvivalPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </div>
  );
}

export default App