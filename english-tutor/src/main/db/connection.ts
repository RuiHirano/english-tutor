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

function backfillMastery(database: DatabaseSync): void {
  // 過去に正解しているのに mastery_level = 0 のままのアイテムを 認識 (1) に昇格。
  // 自動昇格ロジック追加前に蓄積した記録への一回限りの整合化。idempotent。
  database.exec(`
    UPDATE vocabulary_items
       SET mastery_level = 1
     WHERE mastery_level = 0
       AND id IN (
         SELECT DISTINCT vocabulary_item_id
           FROM questions
          WHERE is_correct = 1 AND vocabulary_item_id IS NOT NULL
       );
  `);
}

export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(schemaSql);
  backfillMastery(db);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
