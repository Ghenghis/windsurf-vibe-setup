#!/usr/bin/env node
/**
 * Windsurf Autopilot - Context Tools v2.6
 *
 * Session context persistence across restarts.
 * Remembers project state, conversation history, and user preferences.
 *
 * Tools:
 * - save_context: Save current session context
 * - load_context: Load previous session context
 * - clear_context: Clear session data
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Data directory for context
const DATA_DIR =
  process.platform === 'win32'
    ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot', 'context')
    : path.join(process.env.HOME || '', '.windsurf-autopilot', 'context');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Current session context (in-memory)
let currentContext = {
  version: '2.6.0',
  session: {
    id: crypto.randomUUID(),
    started: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  },
  project: {
    path: null,
    name: null,
    techStack: [],
    recentFiles: [],
    gitBranch: null,
    lastCommand: null,
  },
  conversation: {
    history: [],
    pendingTasks: [],
    completedTasks: [],
  },
  preferences: {
    codingStyle: {},
    favoriteTools: [],
    customSettings: {},
    shortcuts: {},
  },
  memory: {
    learnedPatterns: [],
    frequentActions: {},
    errorRecoveries: [],
  },
};

// Auto-save timer
let autoSaveTimer = null;

/**
 * Context Tools Export
 */
const contextTools = {
  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: save_context
  // ═══════════════════════════════════════════════════════════════════════════
  save_context: {
    name: 'save_context',
    description:
      'Save current session context to persistent storage. Includes project state, conversation history, and preferences.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Context name/identifier (default: auto-generated from project)',
        },
        includeHistory: {
          type: 'boolean',
          description: 'Include conversation history',
          default: true,
        },
        includePreferences: {
          type: 'boolean',
          description: 'Include user preferences',
          default: true,
        },
        project: {
          type: 'object',
          description: 'Project information to save',
          properties: {
            path: { type: 'string' },
            name: { type: 'string' },
            techStack: { type: 'array' },
            gitBranch: { type: 'string' },
          },
        },
        message: {
          type: 'string',
          description: 'Add a message to conversation history',
        },
        task: {
          type: 'object',
          description: 'Add a task to pending/completed list',
          properties: {
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] },
          },
        },
        preference: {
          type: 'object',
          description: 'Save a user preference',
          properties: {
            key: { type: 'string' },
            value: {},
          },
        },
      },
    },
    handler: async args => {
      try {
        // Update last active
        currentContext.session.lastActive = new Date().toISOString();

        // Update project info if provided
        if (args.project) {
          if (args.project.path) {
            currentContext.project.path = args.project.path;
          }
          if (args.project.name) {
            currentContext.project.name = args.project.name;
          }
          if (args.project.techStack) {
            currentContext.project.techStack = args.project.techStack;
          }
          if (args.project.gitBranch) {
            currentContext.project.gitBranch = args.project.gitBranch;
          }
        }

        // Add message to history
        if (args.message) {
          currentContext.conversation.history.push({
            timestamp: new Date().toISOString(),
            content: args.message,
            type: 'user',
          });

          // Keep only last 100 messages
          if (currentContext.conversation.history.length > 100) {
            currentContext.conversation.history = currentContext.conversation.history.slice(-100);
          }
        }

        // Add or update task
        if (args.task) {
          const task = {
            id: crypto.randomUUID(),
            description: args.task.description,
            status: args.task.status || 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (task.status === 'completed') {
            currentContext.conversation.completedTasks.push(task);
            // Keep only last 50 completed tasks
            if (currentContext.conversation.completedTasks.length > 50) {
              currentContext.conversation.completedTasks =
                currentContext.conversation.completedTasks.slice(-50);
            }
          } else {
            currentContext.conversation.pendingTasks.push(task);
          }
        }

        // Save preference
        if (args.preference && args.preference.key) {
          currentContext.preferences.customSettings[args.preference.key] = args.preference.value;
        }

        // Determine context file name
        const contextName =
          args.name ||
          (currentContext.project.name ? `project_${currentContext.project.name}` : 'default');
        const contextFile = path.join(DATA_DIR, `${sanitizeFileName(contextName)}.json`);

        // Prepare context for saving
        const contextToSave = {
          ...currentContext,
          conversation:
            args.includeHistory !== false
              ? currentContext.conversation
              : {
                  history: [],
                  pendingTasks: currentContext.conversation.pendingTasks,
                  completedTasks: [],
                },
          preferences: args.includePreferences !== false ? currentContext.preferences : {},
        };

        // Save to file
        fs.writeFileSync(contextFile, JSON.stringify(contextToSave, null, 2));

        // Also save to a "latest" file for quick access
        const latestFile = path.join(DATA_DIR, 'latest.json');
        fs.writeFileSync(
          latestFile,
          JSON.stringify(
            {
              contextName,
              contextFile,
              savedAt: new Date().toISOString(),
              projectPath: currentContext.project.path,
            },
            null,
            2
          )
        );

        return {
          success: true,
          contextName,
          contextFile,
          savedAt: currentContext.session.lastActive,
          stats: {
            historyMessages: currentContext.conversation.history.length,
            pendingTasks: currentContext.conversation.pendingTasks.length,
            completedTasks: currentContext.conversation.completedTasks.length,
            preferences: Object.keys(currentContext.preferences.customSettings).length,
          },
          message: `Context saved successfully to ${contextFile}`,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: load_context
  // ═══════════════════════════════════════════════════════════════════════════
  load_context: {
    name: 'load_context',
    description:
      'Load a previously saved session context. Restores project state, conversation history, and preferences.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Context name to load (omit to load latest)',
        },
        merge: {
          type: 'boolean',
          description: 'Merge with current context instead of replacing',
          default: false,
        },
        loadHistory: {
          type: 'boolean',
          description: 'Load conversation history',
          default: true,
        },
        loadPreferences: {
          type: 'boolean',
          description: 'Load user preferences',
          default: true,
        },
      },
    },
    handler: async args => {
      try {
        let contextFile;

        if (args.name) {
          // Load specific context
          contextFile = path.join(DATA_DIR, `${sanitizeFileName(args.name)}.json`);
        } else {
          // Load latest context
          const latestFile = path.join(DATA_DIR, 'latest.json');
          if (fs.existsSync(latestFile)) {
            const latest = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
            contextFile = latest.contextFile;
          } else {
            // Try default
            contextFile = path.join(DATA_DIR, 'default.json');
          }
        }

        if (!fs.existsSync(contextFile)) {
          // List available contexts
          const availableContexts = fs
            .readdirSync(DATA_DIR)
            .filter(f => f.endsWith('.json') && f !== 'latest.json')
            .map(f => f.replace('.json', ''));

          return {
            success: false,
            error: `Context not found: ${contextFile}`,
            availableContexts,
            suggestion:
              availableContexts.length > 0
                ? `Try loading one of: ${availableContexts.join(', ')}`
                : 'No saved contexts found. Use save_context first.',
          };
        }

        const loadedContext = JSON.parse(fs.readFileSync(contextFile, 'utf8'));

        if (args.merge) {
          // Merge with current context
          if (loadedContext.project) {
            Object.assign(currentContext.project, loadedContext.project);
          }
          if (args.loadHistory !== false && loadedContext.conversation) {
            currentContext.conversation.history = [
              ...currentContext.conversation.history,
              ...loadedContext.conversation.history,
            ].slice(-100);
            currentContext.conversation.pendingTasks = [
              ...currentContext.conversation.pendingTasks,
              ...loadedContext.conversation.pendingTasks,
            ];
          }
          if (args.loadPreferences !== false && loadedContext.preferences) {
            Object.assign(
              currentContext.preferences.customSettings,
              loadedContext.preferences.customSettings
            );
          }
        } else {
          // Replace current context
          currentContext = {
            ...loadedContext,
            session: {
              ...loadedContext.session,
              id: crypto.randomUUID(), // New session ID
              lastActive: new Date().toISOString(),
            },
            conversation:
              args.loadHistory !== false
                ? loadedContext.conversation
                : {
                    history: [],
                    pendingTasks: loadedContext.conversation?.pendingTasks || [],
                    completedTasks: [],
                  },
            preferences:
              args.loadPreferences !== false
                ? loadedContext.preferences
                : currentContext.preferences,
          };
        }

        return {
          success: true,
          contextFile,
          loadedAt: new Date().toISOString(),
          merged: args.merge || false,
          context: {
            projectPath: currentContext.project.path,
            projectName: currentContext.project.name,
            techStack: currentContext.project.techStack,
            historyMessages: currentContext.conversation.history.length,
            pendingTasks: currentContext.conversation.pendingTasks.length,
            preferences: Object.keys(currentContext.preferences.customSettings),
          },
          message: `Context loaded successfully from ${contextFile}`,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: clear_context
  // ═══════════════════════════════════════════════════════════════════════════
  clear_context: {
    name: 'clear_context',
    description: 'Clear session context data. Can clear all or specific parts.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['all', 'history', 'tasks', 'preferences', 'memory', 'file'],
          description: 'What to clear (default: all)',
          default: 'all',
        },
        name: {
          type: 'string',
          description: 'Context file name to delete (when target is "file")',
        },
        confirm: {
          type: 'boolean',
          description: 'Confirm clearing (required for safety)',
          default: false,
        },
      },
    },
    handler: async args => {
      if (!args.confirm) {
        return {
          success: false,
          error: 'Clearing requires confirmation',
          message: 'Set confirm: true to proceed. This action cannot be undone.',
          target: args.target || 'all',
        };
      }

      try {
        const target = args.target || 'all';
        const cleared = [];

        switch (target) {
          case 'all':
            // Reset to initial state
            currentContext = {
              version: '2.6.0',
              session: {
                id: crypto.randomUUID(),
                started: new Date().toISOString(),
                lastActive: new Date().toISOString(),
              },
              project: {
                path: null,
                name: null,
                techStack: [],
                recentFiles: [],
                gitBranch: null,
                lastCommand: null,
              },
              conversation: {
                history: [],
                pendingTasks: [],
                completedTasks: [],
              },
              preferences: {
                codingStyle: {},
                favoriteTools: [],
                customSettings: {},
                shortcuts: {},
              },
              memory: {
                learnedPatterns: [],
                frequentActions: {},
                errorRecoveries: [],
              },
            };
            cleared.push('session', 'project', 'conversation', 'preferences', 'memory');
            break;

          case 'history':
            currentContext.conversation.history = [];
            cleared.push('conversation history');
            break;

          case 'tasks':
            currentContext.conversation.pendingTasks = [];
            currentContext.conversation.completedTasks = [];
            cleared.push('pending tasks', 'completed tasks');
            break;

          case 'preferences':
            currentContext.preferences = {
              codingStyle: {},
              favoriteTools: [],
              customSettings: {},
              shortcuts: {},
            };
            cleared.push('preferences');
            break;

          case 'memory':
            currentContext.memory = {
              learnedPatterns: [],
              frequentActions: {},
              errorRecoveries: [],
            };
            cleared.push('memory');
            break;

          case 'file':
            if (!args.name) {
              return { success: false, error: 'Context name required when target is "file"' };
            }
            const contextFile = path.join(DATA_DIR, `${sanitizeFileName(args.name)}.json`);
            if (fs.existsSync(contextFile)) {
              fs.unlinkSync(contextFile);
              cleared.push(`file: ${contextFile}`);
            } else {
              return { success: false, error: `Context file not found: ${args.name}` };
            }
            break;
        }

        return {
          success: true,
          cleared,
          newSessionId: currentContext.session.id,
          message: `Cleared: ${cleared.join(', ')}`,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: get_context (Bonus - view current context)
  // ═══════════════════════════════════════════════════════════════════════════
  get_context: {
    name: 'get_context',
    description: 'Get current session context information',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['all', 'session', 'project', 'conversation', 'preferences', 'memory'],
          description: 'Which section to retrieve',
          default: 'all',
        },
      },
    },
    handler: async args => {
      const section = args.section || 'all';

      if (section === 'all') {
        return {
          success: true,
          context: {
            session: currentContext.session,
            project: currentContext.project,
            conversation: {
              historyCount: currentContext.conversation.history.length,
              pendingTasks: currentContext.conversation.pendingTasks,
              completedTasksCount: currentContext.conversation.completedTasks.length,
              recentHistory: currentContext.conversation.history.slice(-5),
            },
            preferences: currentContext.preferences,
            memory: {
              patternsCount: currentContext.memory.learnedPatterns.length,
              frequentActions: Object.keys(currentContext.memory.frequentActions).length,
            },
          },
        };
      }

      return {
        success: true,
        section,
        data: currentContext[section] || null,
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: list_contexts (Bonus - list saved contexts)
  // ═══════════════════════════════════════════════════════════════════════════
  list_contexts: {
    name: 'list_contexts',
    description: 'List all saved context files',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      try {
        const files = fs
          .readdirSync(DATA_DIR)
          .filter(f => f.endsWith('.json') && f !== 'latest.json');

        const contexts = files.map(f => {
          const filePath = path.join(DATA_DIR, f);
          const stats = fs.statSync(filePath);
          try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return {
              name: f.replace('.json', ''),
              projectPath: content.project?.path || null,
              savedAt: content.session?.lastActive || stats.mtime.toISOString(),
              size: formatBytes(stats.size),
            };
          } catch (e) {
            return {
              name: f.replace('.json', ''),
              savedAt: stats.mtime.toISOString(),
              size: formatBytes(stats.size),
              error: 'Could not parse',
            };
          }
        });

        // Get latest info
        let latest = null;
        const latestFile = path.join(DATA_DIR, 'latest.json');
        if (fs.existsSync(latestFile)) {
          try {
            latest = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
          } catch (e) {}
        }

        return {
          success: true,
          count: contexts.length,
          latest: latest?.contextName || null,
          contexts,
          dataDirectory: DATA_DIR,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // Get current context (for internal use)
  getCurrentContext: function () {
    return currentContext;
  },

  // Update current context (for internal use)
  updateContext: function (updates) {
    Object.assign(currentContext, updates);
  },

  // Get all tool definitions for registration
  getToolDefinitions: function () {
    return [
      {
        name: this.save_context.name,
        description: this.save_context.description,
        inputSchema: this.save_context.inputSchema,
      },
      {
        name: this.load_context.name,
        description: this.load_context.description,
        inputSchema: this.load_context.inputSchema,
      },
      {
        name: this.clear_context.name,
        description: this.clear_context.description,
        inputSchema: this.clear_context.inputSchema,
      },
      {
        name: this.get_context.name,
        description: this.get_context.description,
        inputSchema: this.get_context.inputSchema,
      },
      {
        name: this.list_contexts.name,
        description: this.list_contexts.description,
        inputSchema: this.list_contexts.inputSchema,
      },
    ];
  },

  // Get handler for a tool
  getHandler: function (toolName) {
    const tool = this[toolName];
    return tool ? tool.handler : null;
  },

  // Start auto-save (call on server start)
  startAutoSave: function (intervalMs = 60000) {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
    }
    autoSaveTimer = setInterval(() => {
      if (currentContext.project.path) {
        this.save_context.handler({ includeHistory: true }).catch(() => {});
      }
    }, intervalMs);
  },

  // Stop auto-save
  stopAutoSave: function () {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  },
};

// Helper function to sanitize file names
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
}

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

module.exports = contextTools;
