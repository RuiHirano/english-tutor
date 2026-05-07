import { app } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import schemaSql from './schema.sql?raw';

let db: DatabaseSync | null = null;

function resolveDbPath(): string {
  if (!app.isPackaged) {
    return path.resolve(app.getAppPath(), '..', 'data', 'learning.db');
  }
  const userDb = path.join(app.getPath('userData'), 'learning.db');
  if (!fs.existsSync(userDb)) {
    const seed = path.join(process.resourcesPath, 'seed', 'learning.db');
    if (fs.existsSync(seed)) {
      fs.mkdirSync(path.dirname(userDb), { recursive: true });
      fs.copyFileSync(seed, userDb);
    }
  }
  return userDb;
}

export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(schemaSql);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
