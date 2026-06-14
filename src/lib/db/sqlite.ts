/**
 * SQLite persistence layer for NeoVerse simulations.
 * Used as primary/fallback when MongoDB is unavailable.
 * Stores all simulation data locally in neoverse.db
 */

import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Lazy-load better-sqlite3 (it's a native module — only works server-side)
let _db: any = null;

function getDataDir(): string {
  const dir = join(process.cwd(), '.neoverse-data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function getDb(): any {
  if (_db) return _db;
  try {
    // Dynamic require to avoid issues with ESM
    const Database = require('better-sqlite3');
    const dbPath = join(getDataDir(), 'neoverse.db');
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
    console.log('[sqlite] Connected:', dbPath);
    return _db;
  } catch (err) {
    console.error('[sqlite] Failed to open DB:', err);
    return null;
  }
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS simulations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT    UNIQUE NOT NULL,
      idea        TEXT,
      mode        TEXT,
      data        TEXT    NOT NULL,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS boardroom_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT    NOT NULL,
      data        TEXT    NOT NULL,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS branches (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT    NOT NULL,
      branch_id   TEXT,
      data        TEXT    NOT NULL,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_memories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT    NOT NULL,
      data        TEXT    NOT NULL,
      created_at  TEXT    DEFAULT (datetime('now'))
    );
  `);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function saveSimulation(sessionId: string, data: object): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const json = JSON.stringify(data);
    const idea = (data as any).idea ?? '';
    const mode = (data as any).mode ?? '';
    db.prepare(`
      INSERT INTO simulations (session_id, idea, mode, data, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(session_id) DO UPDATE SET
        data       = excluded.data,
        idea       = excluded.idea,
        mode       = excluded.mode,
        updated_at = datetime('now')
    `).run(sessionId, idea, mode, json);
  } catch (err) {
    console.error('[sqlite] saveSimulation error:', err);
  }
}

export async function loadSimulation(sessionId: string): Promise<any> {
  const db = getDb();
  if (!db) return null;
  try {
    const row = db.prepare('SELECT data FROM simulations WHERE session_id = ?').get(sessionId);
    if (!row) return null;
    return JSON.parse(row.data);
  } catch (err) {
    console.error('[sqlite] loadSimulation error:', err);
    return null;
  }
}

export async function updateSimulation(sessionId: string, update: object): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const existing = await loadSimulation(sessionId);
    if (!existing) return;
    const merged = { ...existing, ...update };
    db.prepare(`
      UPDATE simulations SET data = ?, updated_at = datetime('now') WHERE session_id = ?
    `).run(JSON.stringify(merged), sessionId);
  } catch (err) {
    console.error('[sqlite] updateSimulation error:', err);
  }
}

export async function saveBoardroomLog(sessionId: string, log: object): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    db.prepare('INSERT INTO boardroom_logs (session_id, data) VALUES (?, ?)').run(sessionId, JSON.stringify(log));
  } catch (err) {
    console.error('[sqlite] saveBoardroomLog error:', err);
  }
}

export async function saveAgentMemory(sessionId: string, memory: object): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    db.prepare('INSERT INTO agent_memories (session_id, data) VALUES (?, ?)').run(sessionId, JSON.stringify(memory));
  } catch (err) {
    console.error('[sqlite] saveAgentMemory error:', err);
  }
}

export async function saveBranch(sessionId: string, branch: object): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const branchId = (branch as any).branch_id ?? '';
    db.prepare('INSERT INTO branches (session_id, branch_id, data) VALUES (?, ?, ?)').run(sessionId, branchId, JSON.stringify(branch));
    // Also merge branch timeline into the main simulation
    await mergeBranchIntoSimulation(sessionId, branch);
  } catch (err) {
    console.error('[sqlite] saveBranch error:', err);
  }
}

async function mergeBranchIntoSimulation(sessionId: string, branch: any): Promise<void> {
  try {
    const existing = await loadSimulation(sessionId);
    if (!existing) return;
    const merged = {
      ...existing,
      timeline: [
        ...(existing.timeline || []),
        ...(branch.timeline || [])
      ],
      outcome: branch.outcome || existing.outcome,
    };
    const db = getDb();
    if (db) {
      db.prepare(`UPDATE simulations SET data = ?, updated_at = datetime('now') WHERE session_id = ?`).run(JSON.stringify(merged), sessionId);
    }
  } catch (err) {
    console.error('[sqlite] mergeBranchIntoSimulation error:', err);
  }
}

export async function getAllSessions(): Promise<any[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT session_id, idea, mode, created_at
      FROM simulations
      ORDER BY created_at DESC
      LIMIT 20
    `).all();
    return rows;
  } catch (err) {
    console.error('[sqlite] getAllSessions error:', err);
    return [];
  }
}
