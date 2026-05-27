// src/game/SurvivalGame.ts
import * as PIXI from 'pixi.js';

export interface SurvivalGameOptions {
  container: HTMLElement;   // DOM-элемент, куда монтируется Canvas
  onGameOver: (score: number) => void;
}

interface FallingWord {
  text: string;
  container: PIXI.Container;
  targetY: number;          // Y-координата, при достижении которой слово считается "упавшим"
  speed: number;            // пикселей в секунду
  active: boolean;
}

const WORDS = [
  'apple', 'banana', 'cherry', 'dragon', 'elephant',
  'forest', 'galaxy', 'horizon', 'island', 'jungle',
  'knight', 'legend', 'mountain', 'nebula', 'ocean',
  'puzzle', 'quest', 'rocket', 'shadow', 'temple',
  'umbrella', 'vortex', 'wizard', 'zenith', 'falcon',
];

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const WORD_FONT_SIZE = 24;
const BASE_SPEED = 60;      // пикселей в секунду
const SPEED_INCREASE = 5;   // ускорение за каждое правильно набранное слово
const INITIAL_LIVES = 3;

export class SurvivalGame {
  private app: PIXI.Application;
  private words: FallingWord[] = [];
  private score = 0;
  private lives = INITIAL_LIVES;
  private currentInput = '';
  private currentSpeed = BASE_SPEED;
  private gameOver = false;
  private onGameOver: (score: number) => void;

  // UI-элементы PixiJS (текстовые объекты)
  private scoreText!: PIXI.Text;
  private livesText!: PIXI.Text;
  private inputText!: PIXI.Text;

  constructor(options: SurvivalGameOptions) {
    this.onGameOver = options.onGameOver;

    this.app = new PIXI.Application();
    this.initApp(options.container);
  }

  private async initApp(container: HTMLElement) {
    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    container.appendChild(this.app.canvas as HTMLCanvasElement);

    this.createUI();
    this.startGameLoop();
    this.spawnWord(); // первое слово
    this.setupKeyboard();
  }

  private createUI() {
    // Счёт
    this.scoreText = new PIXI.Text({
      text: `Score: ${this.score}`,
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 24,
        fill: 0xffffff,
      },
    });
    this.scoreText.x = 10;
    this.scoreText.y = 10;
    this.app.stage.addChild(this.scoreText);

    // Жизни
    this.livesText = new PIXI.Text({
      text: `Lives: ${'❤'.repeat(this.lives)}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xff4444,
      },
    });
    this.livesText.x = GAME_WIDTH - 150;
    this.livesText.y = 10;
    this.app.stage.addChild(this.livesText);

    // Текущий ввод
    this.inputText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 28,
        fill: 0x00d2ff,
      },
    });
    this.inputText.anchor.set(0.5);
    this.inputText.x = GAME_WIDTH / 2;
    this.inputText.y = GAME_HEIGHT - 50;
    this.app.stage.addChild(this.inputText);
  }

  private setupKeyboard() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.gameOver) return;
    e.preventDefault();

    if (e.key === 'Backspace') {
      this.currentInput = this.currentInput.slice(0, -1);
    } else if (e.key === 'Enter') {
      this.checkWord();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.currentInput += e.key;
    }
    this.inputText.text = this.currentInput;
  };

  private checkWord() {
    const matchedIndex = this.words.findIndex(
      (w) => w.active && w.text === this.currentInput
    );
    if (matchedIndex !== -1) {
      // Удаляем слово
      const word = this.words[matchedIndex];
      this.app.stage.removeChild(word.container);
      word.active = false;
      this.words.splice(matchedIndex, 1);
      this.score += 10;
      this.currentSpeed += SPEED_INCREASE;
    }
    this.currentInput = '';
    this.inputText.text = '';
    this.scoreText.text = `Score: ${this.score}`;
  }

  private spawnWord() {
    if (this.gameOver) return;

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
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: WORD_FONT_SIZE,
        fill: 0xffffff,
      },
    });
    label.x = 15;
    label.y = 8;
    container.addChild(label);

    container.x = Math.random() * (GAME_WIDTH - 200) + 20;
    container.y = -40; // начинаем чуть выше экрана

    const fallingWord: FallingWord = {
      text,
      container,
      targetY: GAME_HEIGHT - 60, // красная зона
      speed: this.currentSpeed,
      active: true,
    };
    this.words.push(fallingWord);
    this.app.stage.addChild(container);
  }

  private gameLoop = () => {
    if (this.gameOver) return;

    const dt = this.app.ticker.deltaMS / 1000; // дельта в секундах
    for (const word of this.words) {
      if (!word.active) continue;
      word.container.y += word.speed * dt;

      // Если слово достигло красной зоны
      if (word.container.y >= word.targetY) {
        this.loseLife(word);
      }
    }

    // Спавн новых слов случайно
    if (Math.random() < 0.02) { // примерно каждые 50 кадров (при 60 fps)
      this.spawnWord();
    }

    this.updateUI();
  };

  private loseLife(word: FallingWord) {
    word.active = false;
    this.app.stage.removeChild(word.container);
    this.words = this.words.filter(w => w !== word);

    this.lives--;
    this.livesText.text = `Lives: ${'❤'.repeat(this.lives)}`;

    if (this.lives <= 0) {
      this.endGame();
    }
  }

  private updateUI() {
    this.scoreText.text = `Score: ${this.score}`;
    this.livesText.text = `Lives: ${'❤'.repeat(this.lives)}`;
  }

  private endGame() {
    this.gameOver = true;
    window.removeEventListener('keydown', this.onKeyDown);
    // Остановим тикер
    this.app.ticker.stop();
    this.onGameOver(this.score);
  }

  private startGameLoop() {
    this.app.ticker.add(this.gameLoop);
  }

  // Метод для корректного уничтожения при размонтировании компонента
  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    this.app.destroy(true, { children: true, texture: true });
  }
}