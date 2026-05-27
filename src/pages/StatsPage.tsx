import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { db, TypingResult } from '../utils/db';
import KeyboardHeatmap from '../components/KeyboardHeatmap';
import './StatsPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AggregatedErrorKeys {
  [key: string]: number;
}

const StatsPage = () => {
  const [results, setResults] = useState<TypingResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await db.results.orderBy('date').toArray();
      setResults(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="stats-page">Загрузка...</div>;

  // Общая статистика
  const totalSessions = results.length;
  const averageWpm =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.wpm, 0) / results.length)
      : 0;
  const averageAccuracy =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / results.length)
      : 0;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  // Данные для графика WPM и точности
  const chartData = {
    labels: results.map((r) =>
      new Date(r.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Скорость (зн/мин)',
        data: results.map((r) => r.wpm),
        borderColor: '#00d2ff',
        backgroundColor: 'rgba(0, 210, 255, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'Точность (%)',
        data: results.map((r) => r.accuracy),
        borderColor: '#7b2ff7',
        backgroundColor: 'rgba(123, 47, 247, 0.1)',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'WPM' },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Точность %' },
        grid: { drawOnChartArea: false },
      },
    },
  };

  // Агрегация ошибок по клавишам
  const errorKeysAgg: AggregatedErrorKeys = {};
  results.forEach((r) => {
    if (r.errorKeys) {
      Object.entries(r.errorKeys).forEach(([key, count]) => {
        errorKeysAgg[key] = (errorKeysAgg[key] || 0) + count;
      });
    }
  });

  return (
    <div className="stats-page">
      <h1>Статистика</h1>
      <div className="summary-cards">
        <div className="card">
          <span className="card-value">{totalSessions}</span>
          <span className="card-label">Сессий</span>
        </div>
        <div className="card">
          <span className="card-value">{averageWpm}</span>
          <span className="card-label">Средн. WPM</span>
        </div>
        <div className="card">
          <span className="card-value">{averageAccuracy}%</span>
          <span className="card-label">Средн. точность</span>
        </div>
        <div className="card">
          <span className="card-value">{Math.round(totalDuration / 60)}</span>
          <span className="card-label">Минут практики</span>
        </div>
      </div>

      <div className="chart-container">
        <h2>Прогресс по сессиям</h2>
        {results.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p>Нет данных для графика</p>
        )}
      </div>

      <div className="heatmap-container">
        <h2>Тепловая карта ошибок</h2>
        <KeyboardHeatmap errorKeys={errorKeysAgg} />
      </div>
    </div>
  );
};

export default StatsPage;