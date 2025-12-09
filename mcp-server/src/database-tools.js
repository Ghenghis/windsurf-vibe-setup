#!/usr/bin/env node
/**
 * Windsurf Autopilot - Database Tools v2.6
 *
 * Persistent database integration for the autopilot system.
 * Supports SQLite (default), PostgreSQL, and MySQL.
 *
 * Tools:
 * - db_connect: Connect to database
 * - db_schema: View/create/modify schemas
 * - db_backup: Backup database
 * - db_restore: Restore from backup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Database connections store
const connections = new Map();

// Default data directory
const DATA_DIR =
  process.platform === 'win32'
    ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot', 'databases')
    : path.join(process.env.HOME || '', '.windsurf-autopilot', 'databases');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Database Tools Export
 */
const databaseTools = {
  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: db_connect
  // ═══════════════════════════════════════════════════════════════════════════
  db_connect: {
    name: 'db_connect',
    description:
      'Connect to a database (SQLite, PostgreSQL, or MySQL). SQLite is the default and requires no setup.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['sqlite', 'postgres', 'mysql'],
          description: 'Database type (default: sqlite)',
          default: 'sqlite',
        },
        name: {
          type: 'string',
          description: 'Database name or file path for SQLite',
        },
        host: {
          type: 'string',
          description: 'Database host (for postgres/mysql)',
          default: 'localhost',
        },
        port: {
          type: 'number',
          description: 'Database port (postgres: 5432, mysql: 3306)',
        },
        user: {
          type: 'string',
          description: 'Database user (for postgres/mysql)',
        },
        password: {
          type: 'string',
          description: 'Database password (for postgres/mysql)',
        },
      },
      required: ['name'],
    },
    handler: async args => {
      const dbType = args.type || 'sqlite';
      const dbName = args.name;

      try {
        let connection = null;
        const connectionId = `${dbType}_${dbName}`;

        if (dbType === 'sqlite') {
          // SQLite - use better-sqlite3 if available, fallback to file-based
          const dbPath = dbName.includes(path.sep) ? dbName : path.join(DATA_DIR, `${dbName}.db`);

          try {
            const Database = require('better-sqlite3');
            connection = new Database(dbPath);
            connections.set(connectionId, { type: 'sqlite', db: connection, path: dbPath });
          } catch (e) {
            // Fallback: create empty file and track it
            if (!fs.existsSync(dbPath)) {
              fs.writeFileSync(dbPath, '');
            }
            connections.set(connectionId, { type: 'sqlite-file', path: dbPath });
          }

          return {
            success: true,
            connectionId,
            type: 'sqlite',
            path: dbPath,
            message: `Connected to SQLite database: ${dbPath}`,
          };
        } else if (dbType === 'postgres') {
          const { Pool } = require('pg');
          const pool = new Pool({
            host: args.host || 'localhost',
            port: args.port || 5432,
            database: dbName,
            user: args.user,
            password: args.password,
          });

          // Test connection
          await pool.query('SELECT NOW()');
          connections.set(connectionId, { type: 'postgres', pool });

          return {
            success: true,
            connectionId,
            type: 'postgres',
            host: args.host || 'localhost',
            database: dbName,
            message: `Connected to PostgreSQL database: ${dbName}`,
          };
        } else if (dbType === 'mysql') {
          const mysql = require('mysql2/promise');
          const pool = await mysql.createPool({
            host: args.host || 'localhost',
            port: args.port || 3306,
            database: dbName,
            user: args.user,
            password: args.password,
          });

          // Test connection
          await pool.query('SELECT 1');
          connections.set(connectionId, { type: 'mysql', pool });

          return {
            success: true,
            connectionId,
            type: 'mysql',
            host: args.host || 'localhost',
            database: dbName,
            message: `Connected to MySQL database: ${dbName}`,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          suggestion:
            dbType === 'sqlite'
              ? 'SQLite should work out of the box. Try: npm install better-sqlite3'
              : `Make sure ${dbType} is running and credentials are correct`,
        };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: db_schema
  // ═══════════════════════════════════════════════════════════════════════════
  db_schema: {
    name: 'db_schema',
    description: 'View, create, or modify database schemas',
    inputSchema: {
      type: 'object',
      properties: {
        connectionId: {
          type: 'string',
          description: 'Connection ID from db_connect',
        },
        action: {
          type: 'string',
          enum: ['view', 'create', 'modify', 'drop'],
          description: 'Action to perform',
        },
        table: {
          type: 'string',
          description: 'Table name',
        },
        schema: {
          type: 'object',
          description: 'Schema definition for create/modify',
          properties: {
            columns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  primaryKey: { type: 'boolean' },
                  notNull: { type: 'boolean' },
                  default: { type: 'string' },
                  unique: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
      required: ['connectionId', 'action'],
    },
    handler: async args => {
      const conn = connections.get(args.connectionId);
      if (!conn) {
        return { success: false, error: 'Connection not found. Use db_connect first.' };
      }

      try {
        if (args.action === 'view') {
          // View schema
          if (conn.type === 'sqlite' && conn.db) {
            const tables = conn.db
              .prepare("SELECT name FROM sqlite_master WHERE type='table'")
              .all();

            const schema = {};
            for (const t of tables) {
              const info = conn.db.prepare(`PRAGMA table_info(${t.name})`).all();
              schema[t.name] = info.map(col => ({
                name: col.name,
                type: col.type,
                notNull: col.notnull === 1,
                default: col.dflt_value,
                primaryKey: col.pk === 1,
              }));
            }

            return { success: true, schema, tableCount: tables.length };
          } else if (conn.type === 'postgres') {
            const result = await conn.pool.query(`
              SELECT table_name, column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_schema = 'public'
              ORDER BY table_name, ordinal_position
            `);

            const schema = {};
            for (const row of result.rows) {
              if (!schema[row.table_name]) {
                schema[row.table_name] = [];
              }
              schema[row.table_name].push({
                name: row.column_name,
                type: row.data_type,
                notNull: row.is_nullable === 'NO',
                default: row.column_default,
              });
            }

            return { success: true, schema, tableCount: Object.keys(schema).length };
          }
        } else if (args.action === 'create') {
          if (!args.table || !args.schema) {
            return { success: false, error: 'Table name and schema required for create' };
          }

          const columns = args.schema.columns
            .map(col => {
              let def = `${col.name} ${col.type}`;
              if (col.primaryKey) {
                def += ' PRIMARY KEY';
              }
              if (col.notNull) {
                def += ' NOT NULL';
              }
              if (col.unique) {
                def += ' UNIQUE';
              }
              if (col.default) {
                def += ` DEFAULT ${col.default}`;
              }
              return def;
            })
            .join(', ');

          const sql = `CREATE TABLE IF NOT EXISTS ${args.table} (${columns})`;

          if (conn.type === 'sqlite' && conn.db) {
            conn.db.exec(sql);
          } else if (conn.type === 'postgres') {
            await conn.pool.query(sql);
          } else if (conn.type === 'mysql') {
            await conn.pool.query(sql);
          }

          return { success: true, message: `Table ${args.table} created`, sql };
        } else if (args.action === 'drop') {
          if (!args.table) {
            return { success: false, error: 'Table name required for drop' };
          }

          const sql = `DROP TABLE IF EXISTS ${args.table}`;

          if (conn.type === 'sqlite' && conn.db) {
            conn.db.exec(sql);
          } else if (conn.type === 'postgres') {
            await conn.pool.query(sql);
          }

          return { success: true, message: `Table ${args.table} dropped` };
        }

        return { success: false, error: 'Invalid action or unsupported operation' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: db_backup
  // ═══════════════════════════════════════════════════════════════════════════
  db_backup: {
    name: 'db_backup',
    description: 'Create a backup of the database',
    inputSchema: {
      type: 'object',
      properties: {
        connectionId: {
          type: 'string',
          description: 'Connection ID from db_connect',
        },
        outputPath: {
          type: 'string',
          description: 'Output path for backup file (optional)',
        },
        compress: {
          type: 'boolean',
          description: 'Compress the backup (default: true)',
          default: true,
        },
      },
      required: ['connectionId'],
    },
    handler: async args => {
      const conn = connections.get(args.connectionId);
      if (!conn) {
        return { success: false, error: 'Connection not found. Use db_connect first.' };
      }

      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(DATA_DIR, 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        if (conn.type === 'sqlite' || conn.type === 'sqlite-file') {
          const sourcePath = conn.path;
          const backupName = `backup_${path.basename(sourcePath, '.db')}_${timestamp}.db`;
          const backupPath = args.outputPath || path.join(backupDir, backupName);

          // Copy the database file
          fs.copyFileSync(sourcePath, backupPath);

          const stats = fs.statSync(backupPath);

          return {
            success: true,
            backupPath,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            timestamp,
            message: `SQLite backup created: ${backupPath}`,
          };
        } else if (conn.type === 'postgres') {
          // For PostgreSQL, we'd need pg_dump - provide instructions
          return {
            success: true,
            message: 'PostgreSQL backup requires pg_dump utility',
            command: `pg_dump -h ${conn.host || 'localhost'} -U ${conn.user} ${conn.database} > backup.sql`,
            suggestion: 'Run the command above in your terminal',
          };
        }

        return { success: false, error: 'Unsupported database type for backup' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: db_restore
  // ═══════════════════════════════════════════════════════════════════════════
  db_restore: {
    name: 'db_restore',
    description: 'Restore database from a backup',
    inputSchema: {
      type: 'object',
      properties: {
        connectionId: {
          type: 'string',
          description: 'Connection ID for target database',
        },
        backupPath: {
          type: 'string',
          description: 'Path to backup file',
        },
        confirm: {
          type: 'boolean',
          description: 'Confirm restoration (will overwrite current data)',
          default: false,
        },
      },
      required: ['connectionId', 'backupPath'],
    },
    handler: async args => {
      if (!args.confirm) {
        return {
          success: false,
          error: 'Restoration requires confirmation',
          message: 'Set confirm: true to proceed. WARNING: This will overwrite existing data!',
        };
      }

      const conn = connections.get(args.connectionId);
      if (!conn) {
        return { success: false, error: 'Connection not found. Use db_connect first.' };
      }

      if (!fs.existsSync(args.backupPath)) {
        return { success: false, error: `Backup file not found: ${args.backupPath}` };
      }

      try {
        if (conn.type === 'sqlite' || conn.type === 'sqlite-file') {
          const targetPath = conn.path;

          // Create a safety backup first
          const safetyBackup = `${targetPath}.pre-restore.bak`;
          if (fs.existsSync(targetPath)) {
            fs.copyFileSync(targetPath, safetyBackup);
          }

          // Restore from backup
          fs.copyFileSync(args.backupPath, targetPath);

          return {
            success: true,
            restoredFrom: args.backupPath,
            restoredTo: targetPath,
            safetyBackup,
            message: `Database restored successfully. Safety backup at: ${safetyBackup}`,
          };
        }

        return { success: false, error: 'Only SQLite restore is currently supported' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: db_query (Bonus tool for direct queries)
  // ═══════════════════════════════════════════════════════════════════════════
  db_query_direct: {
    name: 'db_query_direct',
    description: 'Execute a direct SQL query on the connected database',
    inputSchema: {
      type: 'object',
      properties: {
        connectionId: {
          type: 'string',
          description: 'Connection ID from db_connect',
        },
        sql: {
          type: 'string',
          description: 'SQL query to execute',
        },
        params: {
          type: 'array',
          description: 'Query parameters for prepared statements',
        },
      },
      required: ['connectionId', 'sql'],
    },
    handler: async args => {
      const conn = connections.get(args.connectionId);
      if (!conn) {
        return { success: false, error: 'Connection not found. Use db_connect first.' };
      }

      try {
        const isSelect = args.sql.trim().toLowerCase().startsWith('select');

        if (conn.type === 'sqlite' && conn.db) {
          if (isSelect) {
            const stmt = conn.db.prepare(args.sql);
            const rows = args.params ? stmt.all(...args.params) : stmt.all();
            return { success: true, rows, rowCount: rows.length };
          } else {
            const stmt = conn.db.prepare(args.sql);
            const result = args.params ? stmt.run(...args.params) : stmt.run();
            return {
              success: true,
              changes: result.changes,
              lastInsertRowid: result.lastInsertRowid,
            };
          }
        } else if (conn.type === 'postgres') {
          const result = await conn.pool.query(args.sql, args.params);
          return {
            success: true,
            rows: result.rows,
            rowCount: result.rowCount,
          };
        } else if (conn.type === 'mysql') {
          const [rows, fields] = await conn.pool.query(args.sql, args.params);
          return {
            success: true,
            rows: Array.isArray(rows) ? rows : [],
            rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows,
          };
        }

        return { success: false, error: 'Unsupported database type' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // Get all tool definitions for registration
  getToolDefinitions: function () {
    return [
      {
        name: this.db_connect.name,
        description: this.db_connect.description,
        inputSchema: this.db_connect.inputSchema,
      },
      {
        name: this.db_schema.name,
        description: this.db_schema.description,
        inputSchema: this.db_schema.inputSchema,
      },
      {
        name: this.db_backup.name,
        description: this.db_backup.description,
        inputSchema: this.db_backup.inputSchema,
      },
      {
        name: this.db_restore.name,
        description: this.db_restore.description,
        inputSchema: this.db_restore.inputSchema,
      },
      {
        name: this.db_query_direct.name,
        description: this.db_query_direct.description,
        inputSchema: this.db_query_direct.inputSchema,
      },
    ];
  },

  // Get handler for a tool
  getHandler: function (toolName) {
    const tool = this[toolName];
    return tool ? tool.handler : null;
  },

  // Close all connections
  closeAll: function () {
    for (const [id, conn] of connections) {
      try {
        if (conn.type === 'sqlite' && conn.db) {
          conn.db.close();
        } else if (conn.pool) {
          conn.pool.end();
        }
      } catch (e) {
        // Ignore close errors
      }
    }
    connections.clear();
  },
};

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = databaseTools;
