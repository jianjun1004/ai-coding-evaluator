import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export class Database {
  private db: sqlite3.Database;
  private static instance: Database;

  private constructor() {
    const dbPath = path.join(__dirname, '../../data/evaluator.db');
    
    // 确保数据目录存在
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async initializeTables(): Promise<void> {
    const createTables = `
      -- 评测任务表
      CREATE TABLE IF NOT EXISTS evaluation_tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        user_profile_id TEXT NOT NULL,
        programming_language_id TEXT NOT NULL,
        ai_products TEXT NOT NULL,
        question_types TEXT NOT NULL,
        max_follow_ups INTEGER DEFAULT 3,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 评测会话表
      CREATE TABLE IF NOT EXISTS evaluation_sessions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        user_profile TEXT NOT NULL,
        programming_language TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES evaluation_tasks(id)
      );

      -- 问题表
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        context TEXT,
        follow_up_level INTEGER DEFAULT 0,
        parent_question_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES evaluation_sessions(id),
        FOREIGN KEY (parent_question_id) REFERENCES questions(id)
      );

      -- AI回答表
      CREATE TABLE IF NOT EXISTS ai_responses (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        screenshot TEXT,
        timestamp DATETIME NOT NULL,
        duration INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id)
      );

      -- 评分结果表
      CREATE TABLE IF NOT EXISTS scoring_results (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        reasoning TEXT NOT NULL,
        criteria TEXT NOT NULL,
        analysis TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (response_id) REFERENCES ai_responses(id)
      );

      -- 配置表
      CREATE TABLE IF NOT EXISTS configurations (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(createTables, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  public async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 事务支持
  public async beginTransaction(): Promise<void> {
    await this.run('BEGIN TRANSACTION');
  }

  public async commit(): Promise<void> {
    await this.run('COMMIT');
  }

  public async rollback(): Promise<void> {
    await this.run('ROLLBACK');
  }
}

