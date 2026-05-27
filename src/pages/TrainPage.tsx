import { useState, useEffect, useRef, useCallback } from 'react';
import Keyboard from '../components/Keyboard';
import { db, TypingResult } from '../utils/db';
import './TrainPage.css';

const sampleText = "The quick brown fox jumps over the lazy dog.";

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
  // Считаем слова по пробелам
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Сброс
  const handleReset = useCallback(() => {
    setInputText('');
    setActiveKey(null);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    startTimeRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Функция обновления метрик (будет вызываться и по таймеру, и при завершении)
  const updateMetrics = useCallback(() => {
    if (isFinished) return;
    const metrics = computeMetrics(inputText, startTimeRef.current, targetText);
    setWpm(metrics.wpm);
    setAccuracy(metrics.accuracy);
  }, [inputText, targetText, isFinished]);

  // Запускаем интервал для обновления метрик
  useEffect(() => {
    if (isFinished) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(updateMetrics, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isFinished, updateMetrics]);

  // Завершение упражнения
  const finish = useCallback(
    (finalInput: string) => {
      if (isFinished) return;
      if (intervalRef.current) clearInterval(intervalRef.current);
      const duration = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;
      const metrics = computeMetrics(finalInput, startTimeRef.current, targetText);

      const errorKeys: Record<string, number> = {};
      for (let i = 0; i < finalInput.length; i++) {
        if (finalInput[i] !== targetText[i]) {
          const key = targetText[i].toLowerCase();
          errorKeys[key] = (errorKeys[key] || 0) + 1;
        }
      }

      const result: TypingResult = {
        date: new Date(),
        mode: 'train',
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        duration,
        errorKeys: Object.keys(errorKeys).length > 0 ? errorKeys : undefined,
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
        setInputText(newInput);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const newInput = inputText + e.key;
        if (!startTimeRef.current) startTimeRef.current = Date.now();
        setInputText(newInput);
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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Очистка интервала при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const expectedChar =
    inputText.length < targetText.length ? targetText[inputText.length] : null;

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