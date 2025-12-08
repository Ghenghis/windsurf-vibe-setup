#!/usr/bin/env node
/**
 * Autopilot Intelligence Module v1.0
 * 
 * Provides:
 * 1. AUTOPILOT STATUS INDICATOR - Visual feedback when autopilot is active
 * 2. AI/ML LEARNING ENGINE - Learn from interactions, remember preferences
 * 3. CONTEXT PERSISTENCE - Remember project state across sessions
 * 4. PATTERN RECOGNITION - Learn common error patterns and solutions
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const IS_WINDOWS = process.platform === 'win32';

// ==============================================================================
// AUTOPILOT STATE - Persistent storage location
// ==============================================================================
const AUTOPILOT_DATA_DIR = IS_WINDOWS 
  ? path.join(process.env.APPDATA || HOME, 'WindsurfAutopilot')
  : path.join(HOME, '.windsurf-autopilot');

const DATA_FILES = {
  memory: path.join(AUTOPILOT_DATA_DIR, 'memory.json'),
  preferences: path.join(AUTOPILOT_DATA_DIR, 'preferences.json'),
  patterns: path.join(AUTOPILOT_DATA_DIR, 'learned-patterns.json'),
  history: path.join(AUTOPILOT_DATA_DIR, 'action-history.json'),
  projects: path.join(AUTOPILOT_DATA_DIR, 'project-contexts.json')
};

// Initialize data directory
function initDataDir() {
  if (!fs.existsSync(AUTOPILOT_DATA_DIR)) {
    fs.mkdirSync(AUTOPILOT_DATA_DIR, { recursive: true });
  }
  
  // Initialize data files with defaults
  const defaults = {
    memory: { 
      version: '1.0',
      createdAt: new Date().toISOString(),
      interactions: [],
      insights: []
    },
    preferences: {
      version: '1.0',
      userPreferences: {},
      projectDefaults: {},
      autoActions: []
    },
    patterns: {
      version: '1.0',
      errorPatterns: [],
      successPatterns: [],
      workflows: []
    },
    history: {
      version: '1.0',
      sessions: [],
      totalActions: 0
    },
    projects: {
      version: '1.0',
      contexts: {}
    }
  };
  
  Object.entries(DATA_FILES).forEach(([key, filepath]) => {
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(defaults[key], null, 2));
    }
  });
}

// Load data file
function loadData(file) {
  try {
    initDataDir();
    if (fs.existsSync(DATA_FILES[file])) {
      return JSON.parse(fs.readFileSync(DATA_FILES[file], 'utf8'));
    }
  } catch (e) {
    console.error(`Error loading ${file}:`, e.message);
  }
  return null;
}

// Save data file
function saveData(file, data) {
  try {
    initDataDir();
    fs.writeFileSync(DATA_FILES[file], JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error(`Error saving ${file}:`, e.message);
    return false;
  }
}

// ==============================================================================
// 1. AUTOPILOT STATUS INDICATOR
// ==============================================================================

// Current autopilot state
let autopilotState = {
  active: false,
  currentAction: null,
  startTime: null,
  actionsInSession: 0,
  lastActionTime: null
};

/**
 * Get autopilot status with visual indicator
 */
function getAutopilotStatus() {
  const history = loadData('history') || { totalActions: 0, sessions: [] };
  const memory = loadData('memory') || { interactions: [], insights: [] };
  
  const indicator = autopilotState.active 
    ? '🤖 AUTO-PILOT ACTIVE'
    : '🔵 Auto-Pilot Ready';
  
  return {
    indicator,
    active: autopilotState.active,
    currentAction: autopilotState.currentAction,
    sessionStats: {
      actionsThisSession: autopilotState.actionsInSession,
      sessionDuration: autopilotState.startTime 
        ? Math.round((Date.now() - autopilotState.startTime) / 1000) + 's'
        : null
    },
    lifetimeStats: {
      totalActions: history.totalActions,
      totalSessions: history.sessions.length,
      totalInteractions: memory.interactions.length,
      insightsLearned: memory.insights.length
    },
    status: autopilotState.active 
      ? `Currently executing: ${autopilotState.currentAction}`
      : 'Waiting for your request...',
    message: getAutopilotMessage()
  };
}

/**
 * Get contextual autopilot message
 */
function getAutopilotMessage() {
  const memory = loadData('memory') || { interactions: [] };
  const prefs = loadData('preferences') || { userPreferences: {} };
  
  const totalInteractions = memory.interactions.length;
  
  if (totalInteractions === 0) {
    return "👋 Welcome! I'm your AI Autopilot. Just tell me what you want to build!";
  } else if (totalInteractions < 10) {
    return `🚀 Learning your preferences... (${totalInteractions} interactions so far)`;
  } else if (totalInteractions < 50) {
    return `📈 Getting better at helping you! (${totalInteractions} interactions learned)`;
  } else {
    return `🧠 AI fully trained on your workflow! (${totalInteractions}+ patterns learned)`;
  }
}

/**
 * Start autopilot action (call this when starting any tool)
 */
function startAction(actionName, params = {}) {
  autopilotState.active = true;
  autopilotState.currentAction = actionName;
  autopilotState.lastActionTime = Date.now();
  autopilotState.actionsInSession++;
  
  if (!autopilotState.startTime) {
    autopilotState.startTime = Date.now();
    
    // Record new session
    const history = loadData('history') || { sessions: [], totalActions: 0 };
    history.sessions.push({
      startTime: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version
    });
    saveData('history', history);
  }
  
  // Record interaction for learning
  recordInteraction(actionName, params, 'started');
  
  return {
    indicator: '🤖 AUTO-PILOT ACTIVE',
    action: actionName,
    message: `Executing: ${actionName}...`
  };
}

/**
 * End autopilot action
 */
function endAction(actionName, result, success = true) {
  autopilotState.active = false;
  autopilotState.currentAction = null;
  
  // Update total actions
  const history = loadData('history') || { sessions: [], totalActions: 0 };
  history.totalActions++;
  saveData('history', history);
  
  // Record result for learning
  recordInteraction(actionName, { result }, success ? 'completed' : 'failed');
  
  // Learn from the interaction
  if (success) {
    learnFromSuccess(actionName, result);
  } else {
    learnFromFailure(actionName, result);
  }
  
  return {
    indicator: '✅ Action Complete',
    action: actionName,
    success
  };
}

// ==============================================================================
// 2. AI/ML LEARNING ENGINE
// ==============================================================================

/**
 * Record an interaction for learning
 */
function recordInteraction(action, params, status) {
  const memory = loadData('memory') || { interactions: [], insights: [] };
  
  memory.interactions.push({
    timestamp: new Date().toISOString(),
    action,
    params: sanitizeParams(params),
    status,
    platform: process.platform
  });
  
  // Keep last 1000 interactions
  if (memory.interactions.length > 1000) {
    memory.interactions = memory.interactions.slice(-1000);
  }
  
  saveData('memory', memory);
}

/**
 * Sanitize params (remove sensitive data)
 */
function sanitizeParams(params) {
  const sanitized = { ...params };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Learn from successful actions
 */
function learnFromSuccess(action, result) {
  const patterns = loadData('patterns') || { successPatterns: [], errorPatterns: [], workflows: [] };
  
  // Record success pattern
  const existingPattern = patterns.successPatterns.find(p => p.action === action);
  if (existingPattern) {
    existingPattern.count++;
    existingPattern.lastSuccess = new Date().toISOString();
  } else {
    patterns.successPatterns.push({
      action,
      count: 1,
      firstSuccess: new Date().toISOString(),
      lastSuccess: new Date().toISOString()
    });
  }
  
  saveData('patterns', patterns);
}

/**
 * Learn from failed actions
 */
function learnFromFailure(action, result) {
  const patterns = loadData('patterns') || { successPatterns: [], errorPatterns: [], workflows: [] };
  
  const errorMessage = typeof result === 'string' ? result : result?.error || result?.message || 'Unknown error';
  
  // Record error pattern
  const existingPattern = patterns.errorPatterns.find(p => 
    p.action === action && p.errorType === categorizeError(errorMessage)
  );
  
  if (existingPattern) {
    existingPattern.count++;
    existingPattern.lastOccurrence = new Date().toISOString();
  } else {
    patterns.errorPatterns.push({
      action,
      errorType: categorizeError(errorMessage),
      errorSample: errorMessage.substring(0, 200),
      count: 1,
      firstOccurrence: new Date().toISOString(),
      lastOccurrence: new Date().toISOString(),
      suggestedFix: suggestFix(errorMessage)
    });
  }
  
  saveData('patterns', patterns);
}

/**
 * Categorize error type
 */
function categorizeError(error) {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('enoent') || errorLower.includes('not found')) return 'FILE_NOT_FOUND';
  if (errorLower.includes('permission') || errorLower.includes('eacces')) return 'PERMISSION_DENIED';
  if (errorLower.includes('network') || errorLower.includes('econnrefused')) return 'NETWORK_ERROR';
  if (errorLower.includes('timeout')) return 'TIMEOUT';
  if (errorLower.includes('syntax')) return 'SYNTAX_ERROR';
  if (errorLower.includes('npm err')) return 'NPM_ERROR';
  if (errorLower.includes('git')) return 'GIT_ERROR';
  if (errorLower.includes('python') || errorLower.includes('pip')) return 'PYTHON_ERROR';
  
  return 'UNKNOWN';
}

/**
 * Suggest fix based on error type
 */
function suggestFix(error) {
  const errorType = categorizeError(error);
  
  const fixes = {
    'FILE_NOT_FOUND': 'Check if the file/directory exists. Create it if needed.',
    'PERMISSION_DENIED': 'Run with elevated permissions or check file ownership.',
    'NETWORK_ERROR': 'Check internet connection. Verify URLs and ports.',
    'TIMEOUT': 'Increase timeout or check for slow operations.',
    'SYNTAX_ERROR': 'Check code syntax. Run linter for details.',
    'NPM_ERROR': 'Try: npm cache clean --force, then npm install',
    'GIT_ERROR': 'Check git status. Resolve conflicts if any.',
    'PYTHON_ERROR': 'Check Python version and virtual environment.',
    'UNKNOWN': 'Check error details and logs for more information.'
  };
  
  return fixes[errorType] || fixes['UNKNOWN'];
}

// ==============================================================================
// 3. CONTEXT PERSISTENCE - Remember project state
// ==============================================================================

/**
 * Save project context
 */
function saveProjectContext(projectPath, context) {
  const projects = loadData('projects') || { contexts: {} };
  
  projects.contexts[projectPath] = {
    ...context,
    lastAccessed: new Date().toISOString(),
    accessCount: (projects.contexts[projectPath]?.accessCount || 0) + 1
  };
  
  saveData('projects', projects);
}

/**
 * Get project context
 */
function getProjectContext(projectPath) {
  const projects = loadData('projects') || { contexts: {} };
  return projects.contexts[projectPath] || null;
}

/**
 * Remember user preference
 */
function rememberPreference(key, value) {
  const prefs = loadData('preferences') || { userPreferences: {} };
  prefs.userPreferences[key] = {
    value,
    setAt: new Date().toISOString()
  };
  saveData('preferences', prefs);
}

/**
 * Get user preference
 */
function getPreference(key, defaultValue = null) {
  const prefs = loadData('preferences') || { userPreferences: {} };
  return prefs.userPreferences[key]?.value ?? defaultValue;
}

// ==============================================================================
// 4. INTELLIGENT SUGGESTIONS
// ==============================================================================

/**
 * Get suggestions based on learned patterns
 */
function getSuggestions(currentAction, projectPath) {
  const patterns = loadData('patterns') || { successPatterns: [], workflows: [] };
  const projects = loadData('projects') || { contexts: {} };
  const prefs = loadData('preferences') || { userPreferences: {} };
  
  const suggestions = [];
  
  // Suggest based on common success patterns
  const topPatterns = patterns.successPatterns
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  if (topPatterns.length > 0) {
    suggestions.push({
      type: 'frequent_actions',
      message: 'Your most used actions:',
      actions: topPatterns.map(p => p.action)
    });
  }
  
  // Suggest based on project context
  if (projectPath && projects.contexts[projectPath]) {
    const ctx = projects.contexts[projectPath];
    suggestions.push({
      type: 'project_context',
      message: `Last worked on: ${ctx.lastAccessed}`,
      context: ctx
    });
  }
  
  return suggestions;
}

/**
 * Get learned insights
 */
function getInsights() {
  const memory = loadData('memory') || { interactions: [], insights: [] };
  const patterns = loadData('patterns') || { successPatterns: [], errorPatterns: [] };
  
  return {
    totalInteractions: memory.interactions.length,
    successfulPatterns: patterns.successPatterns.length,
    errorPatternsLearned: patterns.errorPatterns.length,
    topActions: patterns.successPatterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(p => ({ action: p.action, count: p.count })),
    commonErrors: patterns.errorPatterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(p => ({ 
        action: p.action, 
        errorType: p.errorType, 
        count: p.count,
        suggestedFix: p.suggestedFix
      }))
  };
}

/**
 * Clear all learned data (reset)
 */
function clearAllData() {
  Object.values(DATA_FILES).forEach(filepath => {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  });
  initDataDir();
  return { success: true, message: 'All autopilot learning data cleared.' };
}

// ==============================================================================
// EXPORTS
// ==============================================================================

module.exports = {
  // Status Indicator
  getAutopilotStatus,
  startAction,
  endAction,
  
  // Learning Engine
  recordInteraction,
  learnFromSuccess,
  learnFromFailure,
  getInsights,
  
  // Context Persistence
  saveProjectContext,
  getProjectContext,
  rememberPreference,
  getPreference,
  
  // Suggestions
  getSuggestions,
  
  // Data Management
  clearAllData,
  loadData,
  saveData,
  
  // Constants
  AUTOPILOT_DATA_DIR,
  DATA_FILES
};
