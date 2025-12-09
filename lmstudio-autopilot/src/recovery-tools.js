#!/usr/bin/env node
/**
 * Windsurf Autopilot - Recovery Tools v2.6
 *
 * Error recovery and rollback capabilities.
 * Create checkpoints, rollback changes, and auto-recover from errors.
 *
 * Tools:
 * - create_checkpoint: Create a rollback checkpoint
 * - rollback: Rollback to a previous checkpoint
 * - auto_recover: Automatic error recovery with pattern matching
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, exec } = require('child_process');

// Data directory for checkpoints
const DATA_DIR =
  process.platform === 'win32'
    ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot', 'checkpoints')
    : path.join(process.env.HOME || '', '.windsurf-autopilot', 'checkpoints');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Active checkpoints in memory
const checkpoints = new Map();

// Error recovery patterns
const recoveryPatterns = {
  // NPM errors
  npm_install_failed: {
    patterns: [/ERESOLVE/, /npm ERR!/, /ENOENT.*package\.json/, /EACCES/],
    recovery: [
      { action: 'command', cmd: 'npm cache clean --force', description: 'Clear npm cache' },
      { action: 'delete', path: 'node_modules', description: 'Remove node_modules' },
      { action: 'delete', path: 'package-lock.json', description: 'Remove package-lock.json' },
      { action: 'command', cmd: 'npm install', description: 'Reinstall packages' },
    ],
  },

  // Git errors
  git_push_rejected: {
    patterns: [/rejected/, /non-fast-forward/, /failed to push/],
    recovery: [
      { action: 'command', cmd: 'git pull --rebase origin', description: 'Pull with rebase' },
      { action: 'command', cmd: 'git push', description: 'Push again' },
    ],
  },

  git_merge_conflict: {
    patterns: [/CONFLICT/, /Automatic merge failed/],
    recovery: [
      { action: 'notify', message: 'Merge conflict detected. Manual resolution required.' },
      { action: 'command', cmd: 'git status', description: 'Show conflicting files' },
    ],
  },

  // Permission errors
  permission_denied: {
    patterns: [/EACCES/, /Permission denied/, /EPERM/],
    recovery: [
      { action: 'notify', message: 'Permission denied. Try running with elevated privileges.' },
    ],
  },

  // Port in use
  port_in_use: {
    patterns: [/EADDRINUSE/, /address already in use/, /port.*in use/i],
    recovery: [
      {
        action: 'command',
        cmd: process.platform === 'win32' ? 'netstat -ano | findstr :${PORT}' : 'lsof -i :${PORT}',
        description: 'Find process using port',
      },
      { action: 'notify', message: 'Port is in use. Kill the process or use a different port.' },
    ],
  },

  // Module not found
  module_not_found: {
    patterns: [/Cannot find module/, /Module not found/, /Error: Cannot resolve/],
    recovery: [
      { action: 'command', cmd: 'npm install', description: 'Install missing dependencies' },
    ],
  },

  // TypeScript errors
  typescript_error: {
    patterns: [/TS\d{4}:/, /TypeScript error/],
    recovery: [
      { action: 'command', cmd: 'npx tsc --noEmit', description: 'Check TypeScript errors' },
    ],
  },

  // Python errors
  python_module_not_found: {
    patterns: [/ModuleNotFoundError/, /No module named/],
    recovery: [
      {
        action: 'command',
        cmd: 'pip install -r requirements.txt',
        description: 'Install Python dependencies',
      },
    ],
  },

  // Docker errors
  docker_not_running: {
    patterns: [/Cannot connect to the Docker daemon/, /docker daemon is not running/],
    recovery: [
      { action: 'notify', message: 'Docker is not running. Please start Docker Desktop.' },
    ],
  },

  // Build errors
  build_failed: {
    patterns: [/Build failed/, /Compilation failed/, /ERROR in/],
    recovery: [
      { action: 'command', cmd: 'npm run build 2>&1', description: 'Retry build with output' },
    ],
  },
};

/**
 * Recovery Tools Export
 */
const recoveryTools = {
  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: create_checkpoint
  // ═══════════════════════════════════════════════════════════════════════════
  create_checkpoint: {
    name: 'create_checkpoint',
    description:
      'Create a rollback checkpoint. Saves the current state of files and git for potential rollback.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Checkpoint name (auto-generated if not provided)',
        },
        projectPath: {
          type: 'string',
          description: 'Project path to checkpoint',
        },
        includeGit: {
          type: 'boolean',
          description: 'Include git state (stash current changes)',
          default: true,
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to checkpoint (default: all tracked files)',
        },
        description: {
          type: 'string',
          description: 'Description of what this checkpoint represents',
        },
      },
      required: ['projectPath'],
    },
    handler: async args => {
      const projectPath = args.projectPath;

      if (!fs.existsSync(projectPath)) {
        return { success: false, error: `Project path not found: ${projectPath}` };
      }

      try {
        const checkpointId = crypto.randomUUID().substring(0, 8);
        const checkpointName = args.name || `checkpoint_${checkpointId}`;
        const timestamp = new Date().toISOString();

        const checkpointDir = path.join(DATA_DIR, checkpointName);
        fs.mkdirSync(checkpointDir, { recursive: true });

        const checkpoint = {
          id: checkpointId,
          name: checkpointName,
          projectPath,
          timestamp,
          description: args.description || 'Manual checkpoint',
          files: [],
          gitState: null,
        };

        // Save git state if requested
        if (args.includeGit !== false) {
          const gitDir = path.join(projectPath, '.git');
          if (fs.existsSync(gitDir)) {
            try {
              // Get current branch
              const branch = execSync('git rev-parse --abbrev-ref HEAD', {
                cwd: projectPath,
                encoding: 'utf8',
              }).trim();

              // Get current commit
              const commit = execSync('git rev-parse HEAD', {
                cwd: projectPath,
                encoding: 'utf8',
              }).trim();

              // Check for uncommitted changes
              const status = execSync('git status --porcelain', {
                cwd: projectPath,
                encoding: 'utf8',
              });

              checkpoint.gitState = {
                branch,
                commit,
                hasChanges: status.length > 0,
                status: status.substring(0, 500),
              };

              // Stash changes if any
              if (status.length > 0) {
                try {
                  execSync(`git stash push -m "autopilot_checkpoint_${checkpointId}"`, {
                    cwd: projectPath,
                  });
                  checkpoint.gitState.stashed = true;
                } catch (e) {
                  checkpoint.gitState.stashed = false;
                }
              }
            } catch (e) {
              checkpoint.gitState = { error: e.message };
            }
          }
        }

        // Backup specific files or all tracked files
        const filesToBackup = args.files || [];

        if (filesToBackup.length === 0) {
          // Get list of important files (not node_modules, etc.)
          const collectFiles = (dir, base = '') => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const relativePath = path.join(base, entry.name);
              const fullPath = path.join(dir, entry.name);

              // Skip common large/generated directories
              if (
                ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv'].includes(
                  entry.name
                )
              ) {
                continue;
              }

              if (entry.isDirectory()) {
                collectFiles(fullPath, relativePath);
              } else if (entry.isFile()) {
                // Only backup source files
                const ext = path.extname(entry.name);
                if (
                  [
                    '.js',
                    '.ts',
                    '.jsx',
                    '.tsx',
                    '.py',
                    '.java',
                    '.json',
                    '.md',
                    '.yml',
                    '.yaml',
                    '.env',
                    '.sql',
                  ].includes(ext) ||
                  ['package.json', 'requirements.txt', 'Dockerfile', '.gitignore'].includes(
                    entry.name
                  )
                ) {
                  filesToBackup.push(relativePath);
                }
              }
            }
          };
          collectFiles(projectPath);
        }

        // Copy files to checkpoint
        for (const file of filesToBackup.slice(0, 100)) {
          // Limit to 100 files
          const sourcePath = path.join(projectPath, file);
          const destPath = path.join(checkpointDir, 'files', file);

          if (fs.existsSync(sourcePath)) {
            try {
              fs.mkdirSync(path.dirname(destPath), { recursive: true });
              fs.copyFileSync(sourcePath, destPath);
              checkpoint.files.push(file);
            } catch (e) {
              // Skip files that can't be copied
            }
          }
        }

        // Save checkpoint metadata
        const metadataPath = path.join(checkpointDir, 'checkpoint.json');
        fs.writeFileSync(metadataPath, JSON.stringify(checkpoint, null, 2));

        // Store in memory
        checkpoints.set(checkpointName, checkpoint);

        return {
          success: true,
          checkpointId,
          checkpointName,
          checkpointPath: checkpointDir,
          timestamp,
          filesBackedUp: checkpoint.files.length,
          gitState: checkpoint.gitState,
          message: `Checkpoint created: ${checkpointName} with ${checkpoint.files.length} files`,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: rollback
  // ═══════════════════════════════════════════════════════════════════════════
  rollback: {
    name: 'rollback',
    description: 'Rollback to a previous checkpoint. Restores files and optionally git state.',
    inputSchema: {
      type: 'object',
      properties: {
        checkpointName: {
          type: 'string',
          description: 'Name of checkpoint to rollback to',
        },
        restoreGit: {
          type: 'boolean',
          description: 'Restore git state (unstash, reset)',
          default: true,
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to restore (default: all)',
        },
        confirm: {
          type: 'boolean',
          description: 'Confirm rollback (required)',
          default: false,
        },
      },
      required: ['checkpointName'],
    },
    handler: async args => {
      if (!args.confirm) {
        return {
          success: false,
          error: 'Rollback requires confirmation',
          message: 'Set confirm: true to proceed. This will overwrite current files!',
        };
      }

      try {
        const checkpointDir = path.join(DATA_DIR, args.checkpointName);
        const metadataPath = path.join(checkpointDir, 'checkpoint.json');

        if (!fs.existsSync(metadataPath)) {
          // List available checkpoints
          const available = fs
            .readdirSync(DATA_DIR)
            .filter(d => fs.existsSync(path.join(DATA_DIR, d, 'checkpoint.json')));

          return {
            success: false,
            error: `Checkpoint not found: ${args.checkpointName}`,
            availableCheckpoints: available,
          };
        }

        const checkpoint = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const projectPath = checkpoint.projectPath;

        if (!fs.existsSync(projectPath)) {
          return {
            success: false,
            error: `Project path no longer exists: ${projectPath}`,
          };
        }

        const restored = [];
        const failed = [];

        // Determine which files to restore
        const filesToRestore = args.files || checkpoint.files;

        // Restore files
        for (const file of filesToRestore) {
          const sourcePath = path.join(checkpointDir, 'files', file);
          const destPath = path.join(projectPath, file);

          if (fs.existsSync(sourcePath)) {
            try {
              fs.mkdirSync(path.dirname(destPath), { recursive: true });
              fs.copyFileSync(sourcePath, destPath);
              restored.push(file);
            } catch (e) {
              failed.push({ file, error: e.message });
            }
          }
        }

        // Restore git state if requested
        let gitRestored = null;
        if (args.restoreGit !== false && checkpoint.gitState) {
          try {
            if (checkpoint.gitState.stashed) {
              // Try to pop the stash
              const stashes = execSync('git stash list', {
                cwd: projectPath,
                encoding: 'utf8',
              });

              const stashMatch = stashes.match(
                new RegExp(`(stash@\\{\\d+\\}).*autopilot_checkpoint_${checkpoint.id}`)
              );
              if (stashMatch) {
                execSync(`git stash pop ${stashMatch[1]}`, { cwd: projectPath });
                gitRestored = { stashPopped: true };
              }
            }

            // Optionally reset to the commit
            if (checkpoint.gitState.commit) {
              gitRestored = {
                ...gitRestored,
                originalCommit: checkpoint.gitState.commit,
                message: 'Git stash restored. Use git reset if needed.',
              };
            }
          } catch (e) {
            gitRestored = { error: e.message };
          }
        }

        return {
          success: true,
          checkpointName: args.checkpointName,
          projectPath,
          restoredFiles: restored.length,
          failedFiles: failed.length,
          restored,
          failed: failed.length > 0 ? failed : undefined,
          gitRestored,
          message: `Rolled back to checkpoint: ${args.checkpointName}. Restored ${restored.length} files.`,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: auto_recover
  // ═══════════════════════════════════════════════════════════════════════════
  auto_recover: {
    name: 'auto_recover',
    description: 'Automatically attempt to recover from an error using predefined patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'Error message to analyze and recover from',
        },
        projectPath: {
          type: 'string',
          description: 'Project path for recovery actions',
        },
        dryRun: {
          type: 'boolean',
          description: 'Only suggest recovery steps without executing',
          default: false,
        },
        maxRetries: {
          type: 'number',
          description: 'Maximum retry attempts',
          default: 3,
        },
      },
      required: ['error'],
    },
    handler: async args => {
      const errorMessage = args.error;
      const projectPath = args.projectPath || process.cwd();
      const dryRun = args.dryRun || false;

      try {
        // Find matching recovery pattern
        let matchedPattern = null;
        let patternName = null;

        for (const [name, pattern] of Object.entries(recoveryPatterns)) {
          for (const regex of pattern.patterns) {
            if (regex.test(errorMessage)) {
              matchedPattern = pattern;
              patternName = name;
              break;
            }
          }
          if (matchedPattern) {
            break;
          }
        }

        if (!matchedPattern) {
          return {
            success: false,
            error: 'No matching recovery pattern found',
            errorMessage: errorMessage.substring(0, 200),
            suggestion: 'This error type is not recognized. Try manual recovery.',
            knownPatterns: Object.keys(recoveryPatterns),
          };
        }

        const recoverySteps = matchedPattern.recovery;
        const results = [];

        if (dryRun) {
          // Just return the suggested steps
          return {
            success: true,
            dryRun: true,
            patternMatched: patternName,
            suggestedSteps: recoverySteps.map((step, i) => ({
              step: i + 1,
              action: step.action,
              description: step.description || step.message || step.cmd,
            })),
            message: 'Dry run - no actions taken. Set dryRun: false to execute.',
          };
        }

        // Execute recovery steps
        for (const step of recoverySteps) {
          const result = { action: step.action, description: step.description };

          try {
            switch (step.action) {
              case 'command':
                const cmd = step.cmd.replace('${PORT}', '3000'); // Replace variables
                const output = execSync(cmd, {
                  cwd: projectPath,
                  encoding: 'utf8',
                  timeout: 60000,
                });
                result.success = true;
                result.output = output.substring(0, 500);
                break;

              case 'delete':
                const targetPath = path.join(projectPath, step.path);
                if (fs.existsSync(targetPath)) {
                  fs.rmSync(targetPath, { recursive: true, force: true });
                  result.success = true;
                  result.deleted = targetPath;
                } else {
                  result.success = true;
                  result.note = 'Path did not exist';
                }
                break;

              case 'notify':
                result.success = true;
                result.message = step.message;
                break;

              default:
                result.success = false;
                result.error = 'Unknown action type';
            }
          } catch (e) {
            result.success = false;
            result.error = e.message;
          }

          results.push(result);

          // Stop if a step fails (unless it's a notification)
          if (!result.success && step.action !== 'notify') {
            break;
          }
        }

        const allSucceeded = results.every(r => r.success);

        return {
          success: allSucceeded,
          patternMatched: patternName,
          stepsExecuted: results.length,
          results,
          message: allSucceeded
            ? `Recovery successful using pattern: ${patternName}`
            : 'Recovery partially failed. Check results for details.',
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: list_checkpoints
  // ═══════════════════════════════════════════════════════════════════════════
  list_checkpoints: {
    name: 'list_checkpoints',
    description: 'List all available checkpoints',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Filter by project path',
        },
      },
    },
    handler: async args => {
      try {
        const dirs = fs.readdirSync(DATA_DIR);
        const checkpointList = [];

        for (const dir of dirs) {
          const metadataPath = path.join(DATA_DIR, dir, 'checkpoint.json');
          if (fs.existsSync(metadataPath)) {
            try {
              const checkpoint = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

              // Filter by project path if specified
              if (args.projectPath && checkpoint.projectPath !== args.projectPath) {
                continue;
              }

              checkpointList.push({
                name: checkpoint.name,
                id: checkpoint.id,
                projectPath: checkpoint.projectPath,
                timestamp: checkpoint.timestamp,
                filesCount: checkpoint.files?.length || 0,
                description: checkpoint.description,
                hasGitState: !!checkpoint.gitState,
              });
            } catch (e) {
              // Skip invalid checkpoints
            }
          }
        }

        // Sort by timestamp descending
        checkpointList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return {
          success: true,
          count: checkpointList.length,
          checkpoints: checkpointList,
          dataDirectory: DATA_DIR,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // Get all tool definitions for registration
  getToolDefinitions: function () {
    return [
      {
        name: this.create_checkpoint.name,
        description: this.create_checkpoint.description,
        inputSchema: this.create_checkpoint.inputSchema,
      },
      {
        name: this.rollback.name,
        description: this.rollback.description,
        inputSchema: this.rollback.inputSchema,
      },
      {
        name: this.auto_recover.name,
        description: this.auto_recover.description,
        inputSchema: this.auto_recover.inputSchema,
      },
      {
        name: this.list_checkpoints.name,
        description: this.list_checkpoints.description,
        inputSchema: this.list_checkpoints.inputSchema,
      },
    ];
  },

  // Get handler for a tool
  getHandler: function (toolName) {
    const tool = this[toolName];
    return tool ? tool.handler : null;
  },

  // Get recovery patterns (for customization)
  getRecoveryPatterns: function () {
    return recoveryPatterns;
  },

  // Add custom recovery pattern
  addRecoveryPattern: function (name, pattern) {
    recoveryPatterns[name] = pattern;
  },
};

module.exports = recoveryTools;
