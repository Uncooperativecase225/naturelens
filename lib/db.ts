import Dexie, { type Table } from 'dexie';
import type { Discovery, Exploration } from './types';

export class NatureLensDB extends Dexie {
  discoveries!: Table<Discovery, string>;
  explorations!: Table<Exploration, string>;

  constructor() {
    super('naturelens');
    this.version(1).stores({
      discoveries: 'id, date, category, title',
      explorations: 'id, startedAt, status'
    });
    this.version(2).stores({
      discoveries: 'id, date, category, title',
      explorations: 'id, startedAt, status'
    });
  }
}

export const db = new NatureLensDB();
