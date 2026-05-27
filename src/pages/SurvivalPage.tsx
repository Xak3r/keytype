import { useEffect, useRef, useState, useCallback } from 'react';
import { SurvivalGame } from '../game/SurvivalGame';
import { db, TypingResult } from '../utils/db';
import './SurvivalPage.css';

const SurvivalPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<SurvivalGame | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const startGame = useCallback(async () => {
    if (!containerRef.current) return;

    // Уничтожаем предыдущую игру
    if (gameRef.current) {
      gameRef.current.destroy();
      gameRef.current = null;
    }

    setGameOver(false);
    setFinalScore(0);

    // Очищаем контейнер на всякий случай
    containerRef.current.innerHTML = '';

    const game = new SurvivalGame({
      container: containerRef.current,
      onGameOver: (score) => {
        setGameOver(true);
        setFinalScore(score);
        const result: TypingResult = {
          date: new Date(),
          mode: 'survival',
          wpm: 0,
          accuracy: 100,
          duration: 0,
        };
        db.results.add(result).catch(console.error);
      },
    });

    gameRef.current = game;
    await game.initialize();
  }, []);

  useEffect(() => {
    startGame();
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, [gameKey, startGame]);

  const handleRestart = () => {
    setGameKey((prev) => prev + 1);
  };

  return (
    <div className="survival-page">
      <h1>Режим «Выживание»</h1>
      <p className="survival-instructions">
        Набирайте слова и нажимайте Enter. Не дайте им упасть!
      </p>
      <div className="game-container" ref={containerRef}></div>
      {gameOver && (
        <div className="result-overlay">
          <p>Игра окончена! Ваш счёт: {finalScore}</p>
          <button onClick={handleRestart}>Играть снова</button>
        </div>
      )}
      <button className="reset-btn" onClick={handleRestart}>
        Новая игра
      </button>
    </div>
  );
};

export default SurvivalPage;