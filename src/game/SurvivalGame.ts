import * as PIXI from 'pixi.js';

export interface SurvivalGameOptions {
  container: HTMLElement;
  onGameOver: (score: number) => void;
}

interface FallingWord {
  text: string;
  container: PIXI.Container;
  targetY: number;
  speed: number;
  active: boolean;
}

const WORDS = [
  // Простые (короткие, высокочастотные)
  'apple', 'banana', 'cherry', 'dragon', 'elephant',
  'forest', 'galaxy', 'horizon', 'island', 'jungle',
  'knight', 'legend', 'mountain', 'nebula', 'ocean',
  'puzzle', 'quest', 'rocket', 'shadow', 'temple',
  'umbrella', 'vortex', 'wizard', 'zenith', 'falcon',
  'cat', 'dog', 'sun', 'moon', 'star',
  'rain', 'snow', 'wind', 'fire', 'water',
  'book', 'code', 'data', 'key', 'map',
  'pen', 'cup', 'hat', 'bed', 'car',
  // Средние
  'harmony', 'crystal', 'thunder', 'diamond', 'serpent',
  'crimson', 'phantom', 'blossom', 'glacier', 'ember',
  'voyage', 'summit', 'meadow', 'talon', 'shimmer',
  'fable', 'ember', 'frost', 'storm', 'reef',
  'silk', 'pearl', 'flame', 'echo', 'riddle',
  // Сложные (длинные, менее привычные)
  'labyrinth', 'paradox', 'quicksilver', 'obsidian', 'enigma',
  'solitude', 'cascade', 'mirage', 'zenith', 'twilight',
  'crescent', 'symphony', 'oasis', 'nebula', 'vanguard',
  'whisper', 'fractal', 'cipher', 'ember', 'horizon',
  'sonic', 'vertex', 'arcanum', 'aurora', 'monsoon',
];

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const INITIAL_LIVES = 3;

const BASE_SPEED = 30;
const TARGET_SPEED = 60;            // к 3 минутам
const BASE_SPAWN_PROB = 0.0013;
const TARGET_SPAWN_PROB = 0.002;
const SPEED_RAMP_TIME = 360;
const SPAWN_RAMP_TIME = 180;

//const GAME_DURATION_TARGET = 180;   // 3 минуты в секундах
const SPEED_INCREASE = 0;


export class SurvivalGame {
  private app: PIXI.Application | null = null;
  private words: FallingWord[] = [];
  private score = 0;
  private lives = INITIAL_LIVES;
  private currentInput = '';
  private currentSpeed = BASE_SPEED;
  private gameOver = false;
  private onGameOver: (score: number) => void;
  private destroyed = false;
  private scoreText?: PIXI.Text;
  private livesText?: PIXI.Text;
  private inputText?: PIXI.Text;
  private timerText?: PIXI.Text;
  private startTime: number = 0;
  private container: HTMLElement;
  private gameContainer?: PIXI.Container;
  private uiContainer?: PIXI.Container;

  constructor(options: SurvivalGameOptions) {
    this.onGameOver = options.onGameOver;
    this.container = options.container;
  }

  async initialize() {
    if (this.destroyed) return;

    this.app = new PIXI.Application();
    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    if (this.destroyed) {
      this.app.destroy(true);
      return;
    }

    this.container.appendChild(this.app.canvas as HTMLCanvasElement);

    this.createUI();
    this.startTime = Date.now();
    this.startGameLoop();
    this.spawnWord();
    this.setupKeyboard();
  }

  private createUI() {
    if (!this.app) return;

    // Создаём слои: сначала игровой (слова), потом интерфейс
    this.gameContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);
    this.app.stage.addChild(this.uiContainer);

    // Счёт
    this.scoreText = new PIXI.Text({
      text: `Score: ${this.score}`,
      style: { fontFamily: 'Courier New, monospace', fontSize: 24, fill: 0xffffff },
    });
    this.scoreText.x = 10;
    this.scoreText.y = 10;
    this.uiContainer.addChild(this.scoreText);

    // Таймер
    this.timerText = new PIXI.Text({
      text: '00:00',
      style: { fontFamily: 'Courier New, monospace', fontSize: 24, fill: 0xffaa00 },
    });
    this.timerText.x = 160;
    this.timerText.y = 10;
    this.uiContainer.addChild(this.timerText);

    // Жизни
    this.livesText = new PIXI.Text({
      text: `Lives: ${'❤'.repeat(this.lives)}`,
      style: { fontFamily: 'Arial', fontSize: 24, fill: 0xff4444 },
    });
    this.livesText.x = GAME_WIDTH - 150;
    this.livesText.y = 10;
    this.uiContainer.addChild(this.livesText);

    // Текущий ввод
    this.inputText = new PIXI.Text({
      text: '',
      style: { fontFamily: 'Courier New, monospace', fontSize: 28, fill: 0x00d2ff },
    });
    this.inputText.anchor.set(0.5);
    this.inputText.x = GAME_WIDTH / 2;
    this.inputText.y = GAME_HEIGHT - 50;
    this.uiContainer.addChild(this.inputText);
  }

  private setupKeyboard() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.gameOver || this.destroyed) return;
    e.preventDefault();

    if (e.key === 'Backspace') {
      this.currentInput = this.currentInput.slice(0, -1);
    } else if (e.key === 'Enter') {
      this.checkWord();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.currentInput += e.key;
    }
    if (this.inputText) {
      this.inputText.text = this.currentInput;
    }
  };

  private checkWord() {
    const matchedIndex = this.words.findIndex(
      (w) => w.active && w.text === this.currentInput
    );
    if (matchedIndex !== -1) {
      const word = this.words[matchedIndex];
      word.container.removeFromParent();
      word.active = false;

      const len = word.text.length;
      let multiplier = 2;
      if (len >= 5 && len < 8) multiplier = 3;
      else if (len >= 8 && len < 12) multiplier = 4;
      else if (len >= 12) multiplier = 6;

      this.score += len * multiplier;
      this.currentSpeed += SPEED_INCREASE; // можно оставить, если нужен бонус за слова
      this.words.splice(matchedIndex, 1);
    }
    this.currentInput = '';
    if (this.inputText) this.inputText.text = '';
  }

  private spawnWord() {
    if (this.gameOver || !this.app || !this.gameContainer) return;

    const text = WORDS[Math.floor(Math.random() * WORDS.length)];
    const container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0f3460);
    bg.lineStyle(2, 0x7b2ff7);
    bg.drawRoundedRect(0, 0, text.length * 18 + 30, 40, 10);
    bg.endFill();
    container.addChild(bg);

    const label = new PIXI.Text({
      text,
      style: { fontFamily: 'Courier New, monospace', fontSize: 24, fill: 0xffffff },
    });
    label.x = 15;
    label.y = 8;
    container.addChild(label);

    container.x = Math.random() * (GAME_WIDTH - 200) + 20;
    container.y = -40;

    const fallingWord: FallingWord = {
      text,
      container,
      targetY: GAME_HEIGHT - 60,
      speed: this.currentSpeed,
      active: true,
    };
    this.words.push(fallingWord);
    this.gameContainer.addChild(container); // добавляем в игровой слой
  }

  private gameLoop = () => {
    if (this.gameOver || !this.app) return;

    // Текущее время игры в секундах
    const elapsed = (Date.now() - this.startTime) / 1000;

    // Прогресс для скорости (от 0 до 1 за SPEED_RAMP_TIME секунд)
    const speedProgress = Math.min(elapsed / SPEED_RAMP_TIME, 1);
    this.currentSpeed = BASE_SPEED + speedProgress * (TARGET_SPEED - BASE_SPEED);

    // Прогресс для вероятности спавна (от 0 до 1 за SPAWN_RAMP_TIME секунд)
    const spawnProgress = Math.min(elapsed / SPAWN_RAMP_TIME, 1);
    const spawnProb = BASE_SPAWN_PROB + spawnProgress * (TARGET_SPAWN_PROB - BASE_SPAWN_PROB);

    // Дельта времени в секундах
    const dt = this.app.ticker.deltaMS / 1000;

    // Двигаем слова
    for (const word of this.words) {
      if (!word.active) continue;
      word.container.y += this.currentSpeed * dt;
      if (word.container.y >= word.targetY) {
        this.loseLife(word);
      }
    }

    // Спавн новых слов
    if (Math.random() < spawnProb) {
      this.spawnWord();
    }

    // Обновление интерфейса
    if (this.scoreText) this.scoreText.text = `Score: ${this.score}`;
    if (this.livesText) this.livesText.text = `Lives: ${'❤'.repeat(this.lives)}`;

    if (this.timerText) {
      const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const secs = Math.floor(elapsed % 60).toString().padStart(2, '0');
      this.timerText.text = `${mins}:${secs}`;
    }
  };

  private loseLife(word: FallingWord) {
    word.active = false;
    word.container.removeFromParent();
    this.words = this.words.filter(w => w !== word);
    this.lives--;
    if (this.lives <= 0) {
      this.endGame();
    }
  }

  private endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.app) this.app.ticker.stop();
    this.onGameOver(this.score);
  }

  private startGameLoop() {
    if (this.app) this.app.ticker.add(this.gameLoop);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.app) {
      try {
        this.app.destroy(true, { children: true, texture: true });
      } catch {
        // игнорируем
      }
      this.app = null;
    }
  }
}