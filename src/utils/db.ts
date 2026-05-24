import Dexie, { Table } from 'dexie';

export interface TypingResult {
  id?: number;
  date: Date;
  mode: 'train' | 'survival';
  wpm: number;
  accuracy: number;
  duration: number; // в секундах
  errorKeys?: Record<string, number>; // буква -> количество ошибок
}

class TypingDatabase extends Dexie {
  results!: Table<TypingResult, number>;

  constructor() {
    super('TypingTrainerDB');
    this.version(1).stores({
      results: '++id, date, mode',
    });
  }
}

export const db = new TypingDatabase();