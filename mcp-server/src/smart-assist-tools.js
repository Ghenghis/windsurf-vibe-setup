/**
 * Smart Assistance Tools - v3.2 Vibe Coder Experience
 *
 * Tools designed to help non-technical users understand and work with code.
 * All output is in plain English, avoiding technical jargon.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Data directory for smart assistance
const HOME = process.env.USERPROFILE || process.env.HOME || '/tmp';
const DATA_DIR = path.join(HOME, '.windsurf-autopilot', 'smart-assist');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Explain code in plain English (ELI5 style)
 */
const explain_code = {
  name: 'explain_code',
  description:
    'Explain code in plain English - perfect for non-coders. Uses simple analogies and avoids jargon.',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'The code to explain' },
      level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
        description: 'Explanation complexity level',
      },
      focus: { type: 'string', description: 'Specific aspect to focus on (optional)' },
    },
    required: ['code'],
  },
  handler: async ({ code, level = 'beginner', focus }) => {
    try {
      const lines = code.split('\n').filter(l => l.trim());
      const lineCount = lines.length;

      // Detect language
      let language = 'unknown';
      if (code.includes('function') || code.includes('=>')) {
        language = 'JavaScript';
      } else if (code.includes('def ') || code.includes('import ')) {
        language = 'Python';
      } else if (code.includes('public class') || code.includes('void ')) {
        language = 'Java';
      } else if (code.includes('<?php')) {
        language = 'PHP';
      } else if (code.includes('<html') || code.includes('<div')) {
        language = 'HTML';
      } else if (code.includes('{') && code.includes(':')) {
        language = 'CSS/JSON';
      }

      // Generate explanation based on level
      const explanations = {
        beginner: {
          intro: "🎯 Here's what this code does in simple terms:",
          style: 'Think of it like giving instructions to a very literal friend.',
        },
        intermediate: {
          intro: '📋 Code breakdown:',
          style: 'This explains the logic and flow.',
        },
        advanced: {
          intro: '🔍 Technical analysis:',
          style: 'Detailed technical explanation with patterns.',
        },
      };

      // Identify key concepts
      const concepts = [];
      if (code.includes('if') || code.includes('else')) {
        concepts.push('Decision making (if/else)');
      }
      if (code.includes('for') || code.includes('while')) {
        concepts.push('Repetition (loops)');
      }
      if (code.includes('function') || code.includes('def ')) {
        concepts.push('Reusable actions (functions)');
      }
      if (code.includes('return')) {
        concepts.push('Giving back a result');
      }
      if (code.includes('async') || code.includes('await')) {
        concepts.push('Waiting for things (async)');
      }
      if (code.includes('try') || code.includes('catch')) {
        concepts.push('Error handling');
      }
      if (code.includes('class')) {
        concepts.push('Blueprints for objects (classes)');
      }
      if (code.includes('import') || code.includes('require')) {
        concepts.push('Using external tools');
      }

      // Generate analogies for beginners
      const analogies = [];
      if (level === 'beginner') {
        if (code.includes('function')) {
          analogies.push(
            'Functions are like recipes - you define the steps once, then use them whenever needed.'
          );
        }
        if (code.includes('if')) {
          analogies.push(
            "If statements are like asking 'Should I bring an umbrella?' - you check a condition and decide."
          );
        }
        if (code.includes('for') || code.includes('while')) {
          analogies.push('Loops are like doing laps - repeat the same action multiple times.');
        }
        if (code.includes('array') || code.includes('[')) {
          analogies.push('Arrays are like shopping lists - a collection of items in order.');
        }
      }

      // Suggested learning resources
      const resources = [
        { topic: language, url: `https://www.google.com/search?q=learn+${language}+for+beginners` },
        { topic: 'Coding basics', url: 'https://www.codecademy.com/' },
        { topic: 'Interactive learning', url: 'https://www.freecodecamp.org/' },
      ];

      return {
        success: true,
        explanation: {
          language,
          lineCount,
          ...explanations[level],
          concepts: concepts.length > 0 ? concepts : ['Basic instructions'],
          analogies:
            analogies.length > 0 ? analogies : ['This code performs a straightforward task.'],
          summary: `This ${language} code has ${lineCount} lines and ${concepts.length > 0 ? 'uses ' + concepts.join(', ').toLowerCase() : 'performs basic operations'}.`,
          focusedExplanation: focus
            ? `Regarding "${focus}": This aspect handles ${focus.toLowerCase()} in the code.`
            : null,
        },
        resources,
        nextSteps: [
          'Try changing small values to see what happens',
          'Add console.log/print statements to see data flow',
          'Break the code into smaller pieces to understand each part',
        ],
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Suggest next logical action based on context
 */
const suggest_next = {
  name: 'suggest_next',
  description:
    'AI suggests the next logical action based on your current context. Reduces decision paralysis.',
  inputSchema: {
    type: 'object',
    properties: {
      context: { type: 'string', description: 'What you are currently working on' },
      goal: { type: 'string', description: 'What you want to achieve (optional)' },
      blockers: { type: 'string', description: 'What is stopping you (optional)' },
    },
    required: ['context'],
  },
  handler: async ({ context, goal, blockers }) => {
    try {
      const contextLower = context.toLowerCase();
      const suggestions = [];

      // Analyze context and generate suggestions
      if (
        contextLower.includes('start') ||
        contextLower.includes('begin') ||
        contextLower.includes('new')
      ) {
        suggestions.push({
          action: 'Create project structure',
          reason: 'Every project needs a solid foundation',
          confidence: 0.95,
          command: 'Use project_wizard or quick_web_app',
        });
      }

      if (
        contextLower.includes('error') ||
        contextLower.includes('bug') ||
        contextLower.includes('fix')
      ) {
        suggestions.push({
          action: 'Use what_went_wrong tool',
          reason: 'Get a human-readable explanation of the error',
          confidence: 0.9,
          command: 'what_went_wrong',
        });
      }

      if (
        contextLower.includes('deploy') ||
        contextLower.includes('live') ||
        contextLower.includes('launch')
      ) {
        suggestions.push({
          action: 'Run pre-launch checklist',
          reason: 'Ensure everything is ready before going live',
          confidence: 0.85,
          command: 'Use seo_audit and lighthouse_report',
        });
      }

      if (contextLower.includes('test') || contextLower.includes('check')) {
        suggestions.push({
          action: 'Run automated tests',
          reason: 'Verify your code works correctly',
          confidence: 0.88,
          command: 'Use run_e2e_tests',
        });
      }

      if (
        contextLower.includes('design') ||
        contextLower.includes('ui') ||
        contextLower.includes('look')
      ) {
        suggestions.push({
          action: 'Generate visual assets',
          reason: 'Get professional-looking design elements',
          confidence: 0.82,
          command: 'Use generate_logo and optimize_assets',
        });
      }

      // Default suggestions if nothing specific matched
      if (suggestions.length === 0) {
        suggestions.push(
          {
            action: 'Document what you have',
            reason: 'Good documentation prevents future confusion',
            confidence: 0.75,
            command: 'generate_docs',
          },
          {
            action: 'Add tests',
            reason: 'Tests catch problems before users do',
            confidence: 0.7,
            command: 'generate_tests',
          },
          {
            action: 'Review code quality',
            reason: 'Clean code is easier to maintain',
            confidence: 0.68,
            command: 'code_review',
          }
        );
      }

      // Add goal-specific suggestions
      if (goal) {
        suggestions.unshift({
          action: `Work toward: ${goal}`,
          reason: 'This is your stated goal',
          confidence: 1.0,
          command: 'Focus on this first',
        });
      }

      // Add blocker-specific suggestions
      if (blockers) {
        suggestions.unshift({
          action: `Address blocker: ${blockers}`,
          reason: 'Removing blockers unlocks progress',
          confidence: 0.95,
          command: 'Solve this before continuing',
        });
      }

      return {
        success: true,
        suggestions: suggestions.slice(0, 5),
        recommendation: suggestions[0],
        message: `Based on "${context}", I suggest: ${suggestions[0].action}`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Preview any operation without executing
 */
const dry_run = {
  name: 'dry_run',
  description:
    'Preview what an operation will do WITHOUT actually doing it. Safe way to check before running.',
  inputSchema: {
    type: 'object',
    properties: {
      operation: { type: 'string', description: 'The operation/command to preview' },
      params: { type: 'object', description: 'Parameters for the operation' },
    },
    required: ['operation'],
  },
  handler: async ({ operation, params = {} }) => {
    try {
      const operationLower = operation.toLowerCase();
      const preview = {
        operation,
        params,
        wouldDo: [],
        risks: [],
        safe: true,
        reversible: true,
      };

      // Analyze operation for potential effects
      if (
        operationLower.includes('delete') ||
        operationLower.includes('remove') ||
        operationLower.includes('rm')
      ) {
        preview.wouldDo.push('DELETE files or data');
        preview.risks.push('Data will be permanently removed');
        preview.safe = false;
        preview.reversible = false;
      }

      if (
        operationLower.includes('deploy') ||
        operationLower.includes('push') ||
        operationLower.includes('publish')
      ) {
        preview.wouldDo.push('PUBLISH to external service');
        preview.risks.push('Changes will be visible to others');
        preview.safe = true;
        preview.reversible = true;
      }

      if (
        operationLower.includes('install') ||
        operationLower.includes('npm') ||
        operationLower.includes('pip')
      ) {
        preview.wouldDo.push('INSTALL packages/dependencies');
        preview.risks.push('Will modify node_modules or site-packages');
        preview.safe = true;
        preview.reversible = true;
      }

      if (operationLower.includes('git') || operationLower.includes('commit')) {
        preview.wouldDo.push('SAVE changes to version control');
        preview.risks.push('Changes will be recorded in history');
        preview.safe = true;
        preview.reversible = true;
      }

      if (operationLower.includes('format') || operationLower.includes('lint')) {
        preview.wouldDo.push('MODIFY code formatting');
        preview.risks.push('File contents will change');
        preview.safe = true;
        preview.reversible = true;
      }

      if (operationLower.includes('database') || operationLower.includes('migrate')) {
        preview.wouldDo.push('MODIFY database structure');
        preview.risks.push('Database schema may change');
        preview.safe = false;
        preview.reversible = false;
      }

      // Add general info if nothing specific matched
      if (preview.wouldDo.length === 0) {
        preview.wouldDo.push(`Execute: ${operation}`);
        preview.risks.push('Review the operation before running');
      }

      return {
        success: true,
        preview,
        recommendation: preview.safe
          ? '✅ This operation appears safe to run.'
          : '⚠️ This operation has risks. Make sure you have backups.',
        message: `Preview of "${operation}": ${preview.wouldDo.join(', ')}`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Convert technical output to plain English
 */
const simplify_output = {
  name: 'simplify_output',
  description:
    'Convert technical output, logs, or errors into plain English that anyone can understand.',
  inputSchema: {
    type: 'object',
    properties: {
      technical_output: { type: 'string', description: 'The technical output to simplify' },
      context: { type: 'string', description: 'What were you doing when this appeared (optional)' },
    },
    required: ['technical_output'],
  },
  handler: async ({ technical_output, context }) => {
    try {
      const output = technical_output.toLowerCase();
      let simple = '';
      const keyPoints = [];
      let actionNeeded = '';

      // Analyze and simplify common patterns
      if (output.includes('success') || output.includes('completed') || output.includes('done')) {
        simple = '✅ Everything worked! The operation completed successfully.';
        keyPoints.push('The task finished without problems');
        actionNeeded = 'You can continue with your next task.';
      } else if (
        output.includes('error') ||
        output.includes('failed') ||
        output.includes('exception')
      ) {
        simple = '❌ Something went wrong. There was a problem completing the operation.';
        keyPoints.push('An error occurred during the operation');
        actionNeeded = 'Use the what_went_wrong tool for more details.';
      } else if (output.includes('warning') || output.includes('warn')) {
        simple = '⚠️ It worked, but there are some concerns to be aware of.';
        keyPoints.push('The operation completed with warnings');
        actionNeeded = 'Review the warnings, but you can probably continue.';
      } else if (output.includes('not found') || output.includes('missing')) {
        simple = '🔍 Something is missing. A file, package, or resource could not be found.';
        keyPoints.push('A required item is missing');
        actionNeeded = 'Check that all files exist and dependencies are installed.';
      } else if (output.includes('permission') || output.includes('access denied')) {
        simple = "🔒 Permission problem. You don't have access to do this.";
        keyPoints.push('Access was denied');
        actionNeeded = 'Try running with administrator/sudo privileges.';
      } else if (output.includes('timeout') || output.includes('timed out')) {
        simple = '⏱️ Too slow. The operation took too long and was stopped.';
        keyPoints.push('The operation timed out');
        actionNeeded = 'Try again, or check your internet connection.';
      } else if (
        output.includes('install') ||
        output.includes('added') ||
        output.includes('packages')
      ) {
        simple = '📦 Packages were installed or updated.';
        keyPoints.push('Dependencies were modified');
        actionNeeded = 'No action needed - packages are ready to use.';
      } else {
        simple = "ℹ️ Technical output received. Here's a summary:";
        keyPoints.push('General system output');
        actionNeeded = 'Review the output to understand what happened.';
      }

      // Extract numbers/stats if present
      const numbers = technical_output.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        keyPoints.push(`Numbers found: ${numbers.slice(0, 5).join(', ')}`);
      }

      // Count lines
      const lineCount = technical_output.split('\n').length;
      keyPoints.push(`Output was ${lineCount} lines long`);

      return {
        success: true,
        simplified: {
          summary: simple,
          keyPoints,
          actionNeeded,
          originalLength: technical_output.length,
          context: context || 'No context provided',
        },
        message: simple,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Human-readable error explanations
 */
const what_went_wrong = {
  name: 'what_went_wrong',
  description: 'Get a human-readable explanation of what went wrong when you encounter an error.',
  inputSchema: {
    type: 'object',
    properties: {
      error: { type: 'string', description: 'The error message or stack trace' },
      context: { type: 'string', description: 'What were you trying to do' },
      file: { type: 'string', description: 'Which file was involved (optional)' },
    },
    required: ['error'],
  },
  handler: async ({ error, context, file }) => {
    try {
      const errorLower = error.toLowerCase();
      let explanation = '';
      let cause = '';
      let fixes = [];

      // Common error patterns
      if (errorLower.includes('cannot find module') || errorLower.includes('module not found')) {
        explanation = '📦 A required package is missing.';
        cause = "The code is trying to use something that isn't installed yet.";
        fixes = [
          'Run: npm install (or yarn install)',
          'Check if the package name is spelled correctly',
          "Make sure you're in the right project folder",
        ];
      } else if (errorLower.includes('syntax error') || errorLower.includes('unexpected token')) {
        explanation = "✏️ There's a typo or formatting error in the code.";
        cause = 'The code has incorrect punctuation or structure.';
        fixes = [
          'Look for missing brackets { } or parentheses ( )',
          'Check for missing commas or semicolons',
          'Make sure quotes are properly closed',
        ];
      } else if (errorLower.includes('undefined') || errorLower.includes('is not defined')) {
        explanation = "❓ The code is trying to use something that doesn't exist.";
        cause = "A variable or function is being used before it's created.";
        fixes = [
          'Check the spelling of variable names',
          "Make sure the variable is created before it's used",
          'Check if you need to import something',
        ];
      } else if (errorLower.includes('enoent') || errorLower.includes('no such file')) {
        explanation = '📁 A file or folder is missing.';
        cause = "The code is looking for something that doesn't exist at that location.";
        fixes = [
          'Check if the file path is correct',
          "Make sure the file hasn't been moved or deleted",
          'Create the missing file or folder',
        ];
      } else if (errorLower.includes('permission denied') || errorLower.includes('eacces')) {
        explanation = "🔒 You don't have permission to do this.";
        cause = 'The system is blocking access for security reasons.';
        fixes = [
          'Try running as administrator (Windows) or with sudo (Mac/Linux)',
          'Check file permissions',
          "Make sure the file isn't locked by another program",
        ];
      } else if (
        errorLower.includes('network') ||
        errorLower.includes('econnrefused') ||
        errorLower.includes('timeout')
      ) {
        explanation = '🌐 Network or connection problem.';
        cause = 'Cannot connect to a server or the internet.';
        fixes = [
          'Check your internet connection',
          'Make sure the server/service is running',
          'Check if a firewall is blocking the connection',
        ];
      } else if (errorLower.includes('out of memory') || errorLower.includes('heap')) {
        explanation = '💾 The program ran out of memory.';
        cause = 'Too much data is being processed at once.';
        fixes = [
          'Try processing less data at a time',
          'Close other programs to free up memory',
          'Increase the memory limit in settings',
        ];
      } else if (errorLower.includes('type error') || errorLower.includes('typeerror')) {
        explanation = '🔄 Data type mismatch.';
        cause = 'The code expected one type of data but got another.';
        fixes = [
          'Check what type of data is being passed',
          'Add checks for null/undefined values',
          'Make sure functions receive the right arguments',
        ];
      } else {
        explanation = '⚠️ An error occurred.';
        cause = 'Something unexpected happened during execution.';
        fixes = [
          'Search the error message online for solutions',
          'Check recent changes to the code',
          'Try restarting and running again',
        ];
      }

      // Extract line number if present
      const lineMatch = error.match(/line (\d+)/i) || error.match(/:(\d+):/);
      const lineNumber = lineMatch ? lineMatch[1] : null;

      return {
        success: true,
        analysis: {
          explanation,
          cause,
          fixes,
          lineNumber,
          file: file || 'Unknown file',
          context: context || 'Not provided',
          searchQuery: `${error.split('\n')[0].substring(0, 100)} solution`,
        },
        message: `${explanation} ${cause}`,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

/**
 * Interactive learning for specific concepts
 */
const teach_me = {
  name: 'teach_me',
  description: 'Interactive learning for specific programming concepts. Learn at your own pace.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'What do you want to learn about' },
      current_level: {
        type: 'string',
        enum: ['complete-beginner', 'some-experience', 'intermediate'],
        default: 'complete-beginner',
        description: 'Your current experience level',
      },
    },
    required: ['topic'],
  },
  handler: async ({ topic, current_level = 'complete-beginner' }) => {
    try {
      const topicLower = topic.toLowerCase();

      // Define lessons for common topics
      const lessons = {
        variables: {
          title: 'Understanding Variables',
          analogy:
            'Variables are like labeled boxes - you put a value in and can get it back later using the label.',
          example: 'let userName = "Alex"; // Creates a box labeled "userName" with "Alex" inside',
          exercises: [
            'Create a variable for your age',
            'Create a variable for your favorite color',
            'Try changing the value of a variable',
          ],
        },
        functions: {
          title: 'Understanding Functions',
          analogy:
            'Functions are like recipes - you write the steps once, then just say "make the recipe" whenever you need it.',
          example: 'function greet(name) { return "Hello, " + name; }',
          exercises: [
            'Create a function that adds two numbers',
            'Create a function that says hello to a name',
            'Try calling your function with different values',
          ],
        },
        loops: {
          title: 'Understanding Loops',
          analogy:
            'Loops are like doing laps around a track - you repeat the same path multiple times.',
          example: 'for (let i = 0; i < 5; i++) { console.log(i); }',
          exercises: [
            'Create a loop that counts to 10',
            'Create a loop that prints your name 5 times',
            'Try a while loop instead of a for loop',
          ],
        },
        arrays: {
          title: 'Understanding Arrays',
          analogy: 'Arrays are like a numbered list - each item has a position (starting from 0).',
          example: 'let fruits = ["apple", "banana", "orange"];',
          exercises: [
            'Create an array of your favorite foods',
            'Access the first and last items',
            'Add a new item to the array',
          ],
        },
        objects: {
          title: 'Understanding Objects',
          analogy:
            'Objects are like ID cards - they have multiple pieces of information about one thing.',
          example: 'let person = { name: "Alex", age: 25, city: "NYC" };',
          exercises: [
            'Create an object describing yourself',
            'Access different properties',
            'Add a new property to the object',
          ],
        },
      };

      // Find matching lesson or create generic one
      let lesson = null;
      for (const [key, value] of Object.entries(lessons)) {
        if (topicLower.includes(key)) {
          lesson = value;
          break;
        }
      }

      if (!lesson) {
        lesson = {
          title: `Learning about: ${topic}`,
          analogy: `${topic} is a concept in programming that helps you accomplish specific tasks.`,
          example: `Search for "${topic} tutorial" to find examples.`,
          exercises: [
            `Find a simple ${topic} example online`,
            'Try to recreate the example yourself',
            'Modify the example slightly to see what happens',
          ],
        };
      }

      // Add level-specific guidance
      const levelGuidance = {
        'complete-beginner': "Take your time! It's okay if this doesn't make sense immediately.",
        'some-experience': 'Connect this to concepts you already know.',
        intermediate: 'Focus on best practices and edge cases.',
      };

      // Suggested next topics
      const nextTopics = ['variables', 'functions', 'loops', 'arrays', 'objects', 'classes']
        .filter(t => !topicLower.includes(t))
        .slice(0, 3);

      return {
        success: true,
        lesson: {
          ...lesson,
          level: current_level,
          guidance: levelGuidance[current_level],
          estimatedTime: '15-30 minutes',
        },
        nextSteps: nextTopics.map(t => `Learn about ${t}`),
        resources: [
          { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org/' },
          { name: 'Codecademy', url: 'https://www.codecademy.com/' },
          { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
        ],
        message: `Here's a lesson on ${topic}. ${lesson.analogy}`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

module.exports = {
  explain_code,
  suggest_next,
  dry_run,
  simplify_output,
  what_went_wrong,
  teach_me,
};
