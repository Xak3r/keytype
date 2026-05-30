import { useState, useEffect, useRef, useCallback } from 'react';
import Keyboard from '../components/Keyboard';
import { db, TypingResult } from '../utils/db';
import './TrainPage.css';

// Список предложений (36 штук)
const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "I have 2 apples, 3 oranges, and 5 bananas.",
  "She said: 'Hello, world! How are you today?'",
  "My phone number is 555-1234; call me at 9:00 AM.",
  "The formula (a + b)^2 = a^2 + 2ab + b^2 is fundamental.",
  "To be or not to be, that is the question...",
  "In 2023, the population reached 8 billion (approx).",
  "Price: $49.99 - 20% discount = $39.99!",
  "Let's meet at 5:30 PM near the café (Main St. & 1st Ave).",
  "Use the code: `npm install react-router-dom` to install.",
  "The temperature is -15°C; it's freezing outside!",
  "His email is user@example.com; website: https://site.org.",
  "Finish the task by Friday, or else!",
  "The speed of light is ~299,792,458 m/s.",
  "Remember: 'Practice makes perfect' (or so they say).",
  "Count: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.",
  "She was the 1st person to arrive, and the last to leave.",
  "A wise man once said: 'Knowledge is power.'",
  "In the year 1492, Columbus sailed the ocean blue.",
  "Functions: f(x) = x^2 + 3x - 7; g(x) = sin(x)/x.",
  "The price of gold is $1,800 per ounce (as of 2024).",
  "Call me at (555) 123-4567, ext. 42.",
  "The password must contain a-z, A-Z, 0-9, and a symbol.",
  "Let's go to the park @ 10:00am; bring snacks & drinks!",
  "3 out of 4 dentists recommend this toothpaste.",
  "This is a test: 50% of the work takes 20% of the time.",
  "He exclaimed: 'Eureka! I've found it!'",
  "The coordinates are 48°52.6'S, 123°23.6'W.",
  "Use keywords: #AI, #ML, #DataScience (trending).",
  "The recipe needs 1/2 cup sugar, 1/4 tsp salt, and 1 tbsp vanilla.",
  "Dinner cost $45.67, including 18% tip.",
  "Please, don't forget to buy: milk, eggs, bread & butter.",
  "It's a 5-minute walk to the station (2 blocks away).",
  "The event is on 31/12/2025 at 23:59 PM.",
  "As for me, I prefer tea; however, coffee is also fine.",
  "His motto: 'Carpe diem!' (Seize the day)."
];

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
  const [targetText, setTargetText] = useState(() =>
    SENTENCES[Math.floor(Math.random() * SENTENCES.length)]
  );
  const [inputText, setInputText] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [lastResult, setLastResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetInput = useCallback(() => {
    setInputText('');
    setActiveKey(null);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    startTimeRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const nextSentence = useCallback(() => {
    const newIndex = Math.floor(Math.random() * SENTENCES.length);
    setTargetText(SENTENCES[newIndex]);
    resetInput();
  }, [resetInput]);

  // updateMetrics, useEffect для таймера – без изменений

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

      // Сохраняем последний результат и сразу переходим к следующему предложению
      setLastResult({ wpm: metrics.wpm, accuracy: metrics.accuracy });
      nextSentence();
    },
    [isFinished, targetText, nextSentence]
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

      {lastResult && (
        <div className="last-result">
          Последнее упражнение: {lastResult.wpm} зн/мин, точность {lastResult.accuracy}%
        </div>
      )}

      <button className="reset-btn" onClick={resetInput}>
        Сбросить ввод
      </button>
    </div>
  );
};

export default TrainPage;