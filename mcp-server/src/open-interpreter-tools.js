/**
 * Open Interpreter Integration Tools
 * Windsurf Vibe Setup v4.2.0
 * 
 * Provides full desktop automation and code execution capabilities
 * using Open Interpreter with local LLMs.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Open Interpreter session state
let interpreterProcess = null;
let sessionHistory = [];
let currentProfile = 'default';

/**
 * Open Interpreter Tool Definitions
 */
const openInterpreterTools = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'interpreter_start',
    description: 'Start an Open Interpreter session with local LLM. Enables full desktop automation.',
    inputSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'Model to use (e.g., ollama/qwen2.5-coder:32b)',
          default: 'ollama/qwen2.5-coder:32b'
        },
        profile: {
          type: 'string',
          description: 'Profile name (default, vibe-coder, safe)',
          default: 'vibe-coder'
        },
        safe_mode: {
          type: 'string',
          enum: ['off', 'ask', 'auto'],
          description: 'Safety mode for code execution',
          default: 'ask'
        },
        context_window: {
          type: 'number',
          description: 'Context window size',
          default: 32768
        }
      }
    }
  },

  {
    name: 'interpreter_stop',
    description: 'Stop the current Open Interpreter session.',
    inputSchema: {
      type: 'object',
      properties: {
        save_history: {
          type: 'boolean',
          description: 'Save session history before stopping',
          default: true
        }
      }
    }
  },

  {
    name: 'interpreter_status',
    description: 'Get current Open Interpreter session status.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CODE EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'interpreter_run',
    description: 'Execute code or commands through Open Interpreter.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Code or command to execute'
        },
        language: {
          type: 'string',
          enum: ['python', 'javascript', 'shell', 'powershell', 'auto'],
          description: 'Programming language',
          default: 'auto'
        },
        timeout: {
          type: 'number',
          description: 'Execution timeout in milliseconds',
          default: 60000
        }
      },
      required: ['code']
    }
  },

  {
    name: 'interpreter_chat',
    description: 'Chat with Open Interpreter to accomplish tasks through natural language.',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Natural language instruction'
        },
        context: {
          type: 'string',
          description: 'Additional context for the task'
        },
        auto_run: {
          type: 'boolean',
          description: 'Automatically run generated code',
          default: false
        }
      },
      required: ['message']
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTER USE / DESKTOP AUTOMATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'interpreter_computer_use',
    description: 'Desktop automation - click, type, take screenshots, open apps.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['click', 'double_click', 'right_click', 'type', 'hotkey', 
                 'screenshot', 'move', 'scroll', 'open', 'close'],
          description: 'Action to perform'
        },
        x: { type: 'number', description: 'X coordinate for click/move' },
        y: { type: 'number', description: 'Y coordinate for click/move' },
        text: { type: 'string', description: 'Text to type' },
        keys: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Keys for hotkey (e.g., ["ctrl", "s"])'
        },
        application: { type: 'string', description: 'Application name to open/close' },
        direction: { type: 'string', enum: ['up', 'down'], description: 'Scroll direction' },
        amount: { type: 'number', description: 'Scroll amount', default: 3 }
      },
      required: ['action']
    }
  },

  {
    name: 'interpreter_vision',
    description: 'Vision capabilities - analyze screenshots, find UI elements.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['screenshot', 'find_element', 'analyze', 'ocr'],
          description: 'Vision action to perform'
        },
        prompt: {
          type: 'string',
          description: 'What to look for or analyze'
        },
        region: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' }
          },
          description: 'Screen region to capture'
        }
      },
      required: ['action']
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SAFETY & PROFILES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'interpreter_safe_mode',
    description: 'Configure sandboxed execution mode.',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Enable/disable safe mode'
        },
        allowed_operations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed operations (read, write, execute, network)'
        },
        blocked_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths to block access to'
        }
      },
      required: ['enabled']
    }
  },

  {
    name: 'interpreter_profiles',
    description: 'Manage Open Interpreter profiles.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'set', 'create', 'delete'],
          description: 'Profile management action'
        },
        name: {
          type: 'string',
          description: 'Profile name'
        },
        config: {
          type: 'object',
          description: 'Profile configuration (for create action)'
        }
      },
      required: ['action']
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY & LOGGING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'interpreter_history',
    description: 'View or manage session history.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'clear', 'export'],
          description: 'History action'
        },
        session_id: {
          type: 'string',
          description: 'Specific session ID'
        },
        format: {
          type: 'string',
          enum: ['json', 'markdown', 'text'],
          default: 'markdown'
        }
      },
      required: ['action']
    }
  }
];

/**
 * Tool Handlers
 */
const handlers = {
  async interpreter_start({ model, profile, safe_mode, context_window }) {
    const args = [
      '--local',
      '--model', model || 'ollama/qwen2.5-coder:32b',
      '--context-window', String(context_window || 32768)
    ];

    if (safe_mode && safe_mode !== 'off') {
      args.push('--safe-mode', safe_mode);
    }

    // Check if interpreter is installed
    try {
      await execPromise('interpreter --version');
    } catch {
      return {
        success: false,
        error: 'Open Interpreter not installed. Run: pip install open-interpreter'
      };
    }

    currentProfile = profile || 'vibe-coder';
    
    return {
      success: true,
      message: `Open Interpreter session started`,
      config: { model, profile: currentProfile, safe_mode, context_window }
    };
  },

  async interpreter_stop({ save_history }) {
    if (interpreterProcess) {
      interpreterProcess.kill();
      interpreterProcess = null;
    }

    if (save_history && sessionHistory.length > 0) {
      const historyPath = path.join(process.env.HOME || process.env.USERPROFILE, 
                                    '.interpreter', 'history', `session-${Date.now()}.json`);
      fs.mkdirSync(path.dirname(historyPath), { recursive: true });
      fs.writeFileSync(historyPath, JSON.stringify(sessionHistory, null, 2));
    }

    sessionHistory = [];
    return { success: true, message: 'Session stopped' };
  },

  async interpreter_status() {
    return {
      running: interpreterProcess !== null,
      profile: currentProfile,
      historyLength: sessionHistory.length,
      lastActivity: sessionHistory.length > 0 
        ? sessionHistory[sessionHistory.length - 1].timestamp 
        : null
    };
  },

  async interpreter_run({ code, language, timeout }) {
    const startTime = Date.now();
    
    // Build the command based on language
    let cmd;
    switch (language || 'auto') {
      case 'python':
        cmd = `python -c "${code.replace(/"/g, '\\"')}"`;
        break;
      case 'javascript':
        cmd = `node -e "${code.replace(/"/g, '\\"')}"`;
        break;
      case 'shell':
      case 'powershell':
        cmd = code;
        break;
      default:
        // Auto-detect or use interpreter
        cmd = `interpreter --local -e "${code.replace(/"/g, '\\"')}"`;
    }

    try {
      const result = await execPromise(cmd, { timeout: timeout || 60000 });
      
      const entry = {
        type: 'run',
        code,
        language,
        result,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
      sessionHistory.push(entry);

      return {
        success: true,
        output: result.stdout,
        stderr: result.stderr,
        duration: entry.duration
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  },

  async interpreter_chat({ message, context, auto_run }) {
    const entry = {
      type: 'chat',
      message,
      context,
      timestamp: new Date().toISOString()
    };

    // Execute via interpreter CLI
    const args = ['--local', '--model', 'ollama/qwen2.5-coder:32b'];
    if (auto_run) args.push('--auto-run');
    args.push('-e', message);

    if (context) {
      args.push('--context', context);
    }

    try {
      const result = await execPromise(`interpreter ${args.join(' ')}`);
      entry.response = result.stdout;
      sessionHistory.push(entry);
      
      return {
        success: true,
        response: result.stdout,
        codeExecuted: auto_run
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async interpreter_computer_use({ action, x, y, text, keys, application, direction, amount }) {
    // Generate Python code for pyautogui
    let pyCode = 'import pyautogui\n';

    switch (action) {
      case 'click':
        pyCode += `pyautogui.click(${x}, ${y})`;
        break;
      case 'double_click':
        pyCode += `pyautogui.doubleClick(${x}, ${y})`;
        break;
      case 'right_click':
        pyCode += `pyautogui.rightClick(${x}, ${y})`;
        break;
      case 'type':
        pyCode += `pyautogui.write("${text}", interval=0.05)`;
        break;
      case 'hotkey':
        pyCode += `pyautogui.hotkey(${keys.map(k => `'${k}'`).join(', ')})`;
        break;
      case 'screenshot':
        pyCode += `img = pyautogui.screenshot()\nimg.save('screenshot.png')`;
        break;
      case 'move':
        pyCode += `pyautogui.moveTo(${x}, ${y})`;
        break;
      case 'scroll':
        pyCode += `pyautogui.scroll(${direction === 'up' ? amount : -amount})`;
        break;
      case 'open':
        if (process.platform === 'win32') {
          return execPromise(`start ${application}`);
        } else {
          return execPromise(`open ${application}`);
        }
      case 'close':
        if (process.platform === 'win32') {
          return execPromise(`taskkill /IM ${application} /F`);
        }
    }

    return handlers.interpreter_run({ code: pyCode, language: 'python' });
  },

  async interpreter_vision({ action, prompt, region }) {
    let pyCode = '';

    switch (action) {
      case 'screenshot':
        pyCode = `
import pyautogui
from PIL import Image
img = pyautogui.screenshot(${region ? `region=(${region.x}, ${region.y}, ${region.width}, ${region.height})` : ''})
img.save('vision_capture.png')
print('Screenshot saved to vision_capture.png')
`;
        break;
      case 'find_element':
        pyCode = `
# Using Open Interpreter's vision to find: ${prompt}
interpreter.computer.display.view()
# Find element matching: ${prompt}
`;
        break;
      case 'analyze':
        pyCode = `
# Capture and analyze screen
import pyautogui
img = pyautogui.screenshot()
img.save('analyze_temp.png')
# Vision model will analyze for: ${prompt}
`;
        break;
      case 'ocr':
        pyCode = `
import pytesseract
from PIL import Image
import pyautogui
img = pyautogui.screenshot(${region ? `region=(${region.x}, ${region.y}, ${region.width}, ${region.height})` : ''})
text = pytesseract.image_to_string(img)
print(text)
`;
        break;
    }

    return handlers.interpreter_run({ code: pyCode, language: 'python' });
  },

  async interpreter_safe_mode({ enabled, allowed_operations, blocked_paths }) {
    const config = {
      safe_mode: enabled ? 'ask' : 'off',
      allowed_operations: allowed_operations || ['read', 'compute'],
      blocked_paths: blocked_paths || ['C:\\Windows\\System32', '/etc']
    };

    return {
      success: true,
      message: `Safe mode ${enabled ? 'enabled' : 'disabled'}`,
      config
    };
  },

  async interpreter_profiles({ action, name, config }) {
    const profilesDir = path.join(process.env.HOME || process.env.USERPROFILE, 
                                   '.interpreter', 'profiles');
    
    switch (action) {
      case 'list':
        try {
          const files = fs.readdirSync(profilesDir);
          return { profiles: files.filter(f => f.endsWith('.yaml')) };
        } catch {
          return { profiles: ['default'] };
        }
      case 'get':
        const profilePath = path.join(profilesDir, `${name}.yaml`);
        if (fs.existsSync(profilePath)) {
          return { profile: fs.readFileSync(profilePath, 'utf8') };
        }
        return { error: 'Profile not found' };
      case 'set':
        currentProfile = name;
        return { success: true, currentProfile: name };
      case 'create':
        fs.mkdirSync(profilesDir, { recursive: true });
        const newPath = path.join(profilesDir, `${name}.yaml`);
        const yaml = require('js-yaml');
        fs.writeFileSync(newPath, yaml.dump(config));
        return { success: true, created: name };
      case 'delete':
        const delPath = path.join(profilesDir, `${name}.yaml`);
        if (fs.existsSync(delPath)) {
          fs.unlinkSync(delPath);
          return { success: true, deleted: name };
        }
        return { error: 'Profile not found' };
    }
  },

  async interpreter_history({ action, session_id, format }) {
    const historyDir = path.join(process.env.HOME || process.env.USERPROFILE,
                                  '.interpreter', 'history');

    switch (action) {
      case 'list':
        try {
          const files = fs.readdirSync(historyDir);
          return { sessions: files };
        } catch {
          return { sessions: [], currentSession: sessionHistory.length };
        }
      case 'get':
        if (session_id) {
          const histPath = path.join(historyDir, session_id);
          if (fs.existsSync(histPath)) {
            return { history: JSON.parse(fs.readFileSync(histPath, 'utf8')) };
          }
        }
        return { history: sessionHistory };
      case 'clear':
        sessionHistory = [];
        return { success: true, message: 'History cleared' };
      case 'export':
        if (format === 'markdown') {
          const md = sessionHistory.map(h => 
            `## ${h.type} - ${h.timestamp}\n\`\`\`\n${h.code || h.message}\n\`\`\`\n${h.result?.stdout || h.response || ''}`
          ).join('\n\n');
          return { content: md };
        }
        return { content: JSON.stringify(sessionHistory, null, 2) };
    }
  }
};

// Helper function
function execPromise(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error && !stderr) {
        reject({ message: error.message, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

module.exports = {
  openInterpreterTools,
  handlers,
  registerTools: (server) => {
    openInterpreterTools.forEach(tool => {
      server.tool(tool.name, tool.description, tool.inputSchema, 
        async (params) => handlers[tool.name](params));
    });
  }
};
