import { useState, useEffect, useRef, useCallback } from 'react';
import Keyboard from '../components/Keyboard';
import { db, TypingResult } from '../utils/db';
import './TrainPage.css';

const sampleText = "The quick brown fox jumps over the lazy dog.";

// Чистая функция вычисления метрик
function computeMetrics(
  input: string,
  startTime: number | null,
  target: string
): { wpm: number; accuracy: number } {
  if (input.length === 0 || !startTime) {
    return { wpm: 0, accuracy: 100 };
  }
  const now = Date.now();
  const elapsedMinutes = (now - startTime) / 60000;
  const wordsTyped = input.trim().split(/\s+/).length;
  const currentWpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;

  let correct = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === target[i]) correct++;
  }
  const currentAccuracy = Math.round((correct / input.length) * 100);
  return { wpm: currentWpm, accuracy: currentAccuracy };
}

const TrainPage = () => {
  const [targetText] = useState(sampleText);
  const [inputText, setInputText] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const startTimeRef = useRef<number | null>(null);

  // Сброс всего состояния
  const handleReset = useCallback(() => {
    setInputText('');
    setActiveKey(null);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    startTimeRef.current = null;
  }, []);

  // Фиксация результата и завершение
  const finish = useCallback(
    (finalInput: string) => {
      if (isFinished) return;
      const duration = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;
      const metrics = computeMetrics(finalInput, startTimeRef.current, targetText);
      const result: TypingResult = {
        date: new Date(),
        mode: 'train',
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        duration,
      };
      db.results.add(result);
      setIsFinished(true);
      setWpm(metrics.wpm);
      setAccuracy(metrics.accuracy);
    },
    [isFinished, targetText]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished) return;
      setActiveKey(e.key);

      if (e.key === 'Backspace') {
        e.preventDefault();
        const newInput = inputText.slice(0, -1);
        if (newInput === inputText) return;
        if (newInput.length === 0) startTimeRef.current = null;
        const metrics = computeMetrics(newInput, startTimeRef.current, targetText);
        setInputText(newInput);
        setWpm(metrics.wpm);
        setAccuracy(metrics.accuracy);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const newInput = inputText + e.key;
        if (!startTimeRef.current) startTimeRef.current = Date.now();
        const metrics = computeMetrics(newInput, startTimeRef.current, targetText);
        setInputText(newInput);
        setWpm(metrics.wpm);
        setAccuracy(metrics.accuracy);
        if (newInput.length >= targetText.length) {
          finish(newInput);
        }
      }
    },
    [inputText, isFinished, targetText, finish]
  );

  const handleKeyUp = useCallback(() => {
    setActiveKey(null);
  }, []);

  // Подписка на клавиатурные события
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const expectedChar =
    inputText.length < targetText.length ? targetText[inputText.length] : null;

  // Подсветка текста
  const renderHighlightedText = () =>
    targetText.split('').map((char, index) => {
      let className = 'char';
      if (index < inputText.length) {
        className += inputText[index] === char ? ' correct' : ' incorrect';
      } else if (index === inputText.length) {
        className += ' current';
      }
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });

  return (
    <div className="train-page">
      <h1>Тренировка слепой печати</h1>
      <div className="stats-bar">
        <span>Скорость: {wpm} зн/мин</span>
        <span>Точность: {accuracy}%</span>
      </div>
      <div className="text-display">
        <div className="highlighted-text">{renderHighlightedText()}</div>
      </div>
      <Keyboard activeKey={activeKey} expectedKey={expectedChar} />
      {isFinished && (
        <div className="result-overlay">
          <p>Упражнение завершено!</p>
          <button onClick={handleReset}>Повторить</button>
        </div>
      )}
      <button className="reset-btn" onClick={handleReset}>
        Сбросить
      </button>
    </div>
  );
};

export default TrainPage;