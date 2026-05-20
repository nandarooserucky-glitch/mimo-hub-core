import * as fs from 'node:fs';
import * as path from 'node:path';
import Database = require('better-sqlite3');
import { encrypt, decrypt } from '../security/crypto.js';

export class CredentialStore {
  private db: Database.Database;
  constructor(dbPath: string, private encryptionKey: string) {
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(dbPath);
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, provider)
      );
    `);
  }

  upsertConnection(userId: string, provider: string, accessToken: string, refreshToken?: string) {
    const encAccess = encrypt(accessToken, this.encryptionKey);
    const encRefresh = refreshToken ? encrypt(refreshToken, this.encryptionKey) : null;
    const stmt = this.db.prepare(`
      INSERT INTO oauth_connections (user_id, provider, access_token, refresh_token)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, provider) DO UPDATE SET
      access_token=excluded.access_token, refresh_token=excluded.refresh_token;
    `);
    stmt.run(userId, provider, encAccess, encRefresh);
  }

  getConnection(userId: string, provider: string) {
    const row = this.db.prepare('SELECT * FROM oauth_connections WHERE user_id=? AND provider=?').get(userId, provider) as any;
    if (!row) return null;
    return {
      provider: row.provider,
      accessToken: decrypt(row.access_token, this.encryptionKey),
      refreshToken: row.refresh_token ? decrypt(row.refresh_token, this.encryptionKey) : undefined,
    };
  }
}
