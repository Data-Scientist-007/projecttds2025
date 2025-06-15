import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CourseContent {
  id: number;
  title: string;
  content: string;
  url: string;
  type: string;
  created_at: string;
}

export interface DiscoursePost {
  id: number;
  title: string;
  content: string;
  url: string;
  author: string;
  category: string;
  created_at: string;
  scraped_at: string;
}

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, '../data/tds_virtual_ta.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS course_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          url TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS discourse_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          url TEXT UNIQUE NOT NULL,
          author TEXT NOT NULL,
          category TEXT,
          created_at DATETIME,
          scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_course_content_title ON course_content(title);
        CREATE INDEX IF NOT EXISTS idx_course_content_type ON course_content(type);
        CREATE INDEX IF NOT EXISTS idx_discourse_posts_title ON discourse_posts(title);
        CREATE INDEX IF NOT EXISTS idx_discourse_posts_category ON discourse_posts(category);
        CREATE INDEX IF NOT EXISTS idx_discourse_posts_created_at ON discourse_posts(created_at);
      `;

      this.db.exec(createTablesSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async insertCourseContent(content: Omit<CourseContent, 'id' | 'created_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        INSERT OR REPLACE INTO course_content (title, content, url, type)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(sql, [content.title, content.content, content.url, content.type], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async insertDiscoursePost(post: Omit<DiscoursePost, 'id' | 'scraped_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        INSERT OR REPLACE INTO discourse_posts (title, content, url, author, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [post.title, post.content, post.url, post.author, post.category, post.created_at], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async searchContent(query: string, limit: number = 10): Promise<Array<CourseContent | DiscoursePost>> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const results: Array<CourseContent | DiscoursePost> = [];
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
      
      if (searchTerms.length === 0) {
        resolve([]);
        return;
      }

      // Create LIKE conditions for each search term
      const likeConditions = searchTerms.map(() => '(LOWER(title) LIKE ? OR LOWER(content) LIKE ?)').join(' AND ');
      const likeParams = searchTerms.flatMap(term => [`%${term}%`, `%${term}%`]);

      // Search course content
      const courseContentSQL = `
        SELECT *, 'course' as source_type
        FROM course_content
        WHERE ${likeConditions}
        ORDER BY 
          CASE 
            WHEN LOWER(title) LIKE ? THEN 1
            ELSE 2
          END,
          title
        LIMIT ?
      `;

      // Search discourse posts
      const discoursePostsSQL = `
        SELECT *, 'discourse' as source_type
        FROM discourse_posts
        WHERE ${likeConditions}
        ORDER BY 
          CASE 
            WHEN LOWER(title) LIKE ? THEN 1
            ELSE 2
          END,
          created_at DESC
        LIMIT ?
      `;

      const courseParams = [...likeParams, `%${query.toLowerCase()}%`, Math.ceil(limit / 2)];
      const discourseParams = [...likeParams, `%${query.toLowerCase()}%`, Math.ceil(limit / 2)];

      // Execute both searches
      this.db.all(courseContentSQL, courseParams, (err, courseRows) => {
        if (err) {
          reject(err);
          return;
        }

        this.db!.all(discoursePostsSQL, discourseParams, (err, discourseRows) => {
          if (err) {
            reject(err);
            return;
          }

          // Combine and sort results
          const allResults = [...courseRows, ...discourseRows];
          resolve(allResults.slice(0, limit));
        });
      });
    });
  }

  getStats(): any {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const statsSQL = `
        SELECT 
          (SELECT COUNT(*) FROM course_content) as course_content_count,
          (SELECT COUNT(*) FROM discourse_posts) as discourse_posts_count,
          (SELECT COUNT(*) FROM discourse_posts WHERE created_at >= '2025-01-01' AND created_at <= '2025-04-14') as relevant_posts_count
      `;

      this.db.get(statsSQL, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}