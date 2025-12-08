/**
 * AI Pair Programming Tools - v3.2 Vibe Coder Experience
 * 
 * Real-time AI assistance, suggestions, and collaborative coding.
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME || '/tmp';
const DATA_DIR = path.join(HOME, '.windsurf-autopilot', 'pair');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Start AI pair programming session
 */
const pair_start = {
  name: 'pair_start',
  description: 'Start an AI pair programming session. Your AI coding partner is ready to help.',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: { type: 'string', description: 'Project directory to work on' },
      focus: { type: 'string', description: 'What are you working on today?' },
      mode: { 
        type: 'string', 
        enum: ['mentor', 'collaborator', 'reviewer', 'learner'],
        default: 'collaborator',
        description: 'Pairing mode'
      },
      experience: { 
        type: 'string', 
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
      }
    },
    required: []
  },
  handler: async ({ projectPath, focus, mode = 'collaborator', experience = 'intermediate' }) => {
    try {
      const targetPath = projectPath || process.cwd();
      
      // Create session
      const session = {
        id: `pair-${Date.now()}`,
        startTime: new Date().toISOString(),
        projectPath: targetPath,
        focus: focus || 'General development',
        mode,
        experience,
        interactions: [],
        suggestions: [],
        learnings: []
      };
      
      // Save session
      const sessionFile = path.join(DATA_DIR, 'current-session.json');
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
      
      // Analyze project context
      let projectContext = { type: 'unknown', files: 0, hasPackageJson: false };
      if (fs.existsSync(targetPath)) {
        const files = fs.readdirSync(targetPath);
        projectContext.files = files.length;
        projectContext.hasPackageJson = files.includes('package.json');
        
        if (files.includes('package.json')) {
          try {
            const pkg = JSON.parse(fs.readFileSync(path.join(targetPath, 'package.json'), 'utf8'));
            projectContext.type = pkg.dependencies?.next ? 'Next.js' :
                                  pkg.dependencies?.react ? 'React' :
                                  pkg.dependencies?.express ? 'Express' :
                                  pkg.dependencies?.vue ? 'Vue' : 'Node.js';
            projectContext.name = pkg.name;
          } catch {}
        }
      }
      
      const modeDescriptions = {
        mentor: '🎓 I\'ll guide you step-by-step, explaining concepts as we go.',
        collaborator: '🤝 We\'ll work together as equals, bouncing ideas off each other.',
        reviewer: '🔍 I\'ll review your code and suggest improvements.',
        learner: '📚 Tell me what you want to learn, and I\'ll create exercises.'
      };
      
      return {
        success: true,
        session,
        projectContext,
        greeting: `👋 Pair programming session started!`,
        modeDescription: modeDescriptions[mode],
        tips: {
          mentor: [
            'Ask me to explain any concept',
            'I\'ll break down complex tasks into steps',
            'Feel free to ask "why" at any point'
          ],
          collaborator: [
            'Share your ideas and I\'ll build on them',
            'We can brainstorm solutions together',
            'I\'ll suggest alternatives when relevant'
          ],
          reviewer: [
            'Share code snippets for review',
            'I\'ll point out potential issues',
            'I\'ll suggest best practices'
          ],
          learner: [
            'Tell me what you want to learn',
            'I\'ll create practice exercises',
            'We\'ll build something to reinforce learning'
          ]
        }[mode],
        quickActions: [
          'pair_suggest - Get suggestions for current task',
          'pair_review - Review a piece of code',
          'pair_explain - Get explanation of code/concept',
          'pair_refactor - Get refactoring suggestions'
        ],
        message: `🚀 Session started in ${mode} mode. Let's build something great!`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Get real-time suggestions
 */
const pair_suggest = {
  name: 'pair_suggest',
  description: 'Get AI suggestions for your current coding task.',
  inputSchema: {
    type: 'object',
    properties: {
      context: { type: 'string', description: 'What you\'re currently working on' },
      code: { type: 'string', description: 'Current code (optional)' },
      stuck: { type: 'boolean', description: 'Are you stuck?', default: false },
      type: { 
        type: 'string', 
        enum: ['next-step', 'improvement', 'alternative', 'completion'],
        default: 'next-step'
      }
    },
    required: ['context']
  },
  handler: async ({ context, code, stuck = false, type = 'next-step' }) => {
    try {
      const contextLower = context.toLowerCase();
      const suggestions = [];
      
      // Load current session for context
      const sessionFile = path.join(DATA_DIR, 'current-session.json');
      let session = null;
      if (fs.existsSync(sessionFile)) {
        session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      }
      
      // Generate suggestions based on context
      if (stuck) {
        suggestions.push({
          type: 'unstuck',
          suggestion: 'Let\'s break this down into smaller pieces',
          steps: [
            'What\'s the smallest part you can tackle?',
            'Is there a simpler version that would work?',
            'What do you know works vs what doesn\'t?'
          ]
        });
      }
      
      if (contextLower.includes('api') || contextLower.includes('fetch') || contextLower.includes('request')) {
        suggestions.push({
          type: 'api',
          suggestion: 'Working with APIs',
          tips: [
            'Always handle errors with try/catch',
            'Add loading and error states',
            'Consider caching responses'
          ],
          example: `try {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed');
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
}`
        });
      }
      
      if (contextLower.includes('form') || contextLower.includes('input') || contextLower.includes('validation')) {
        suggestions.push({
          type: 'form',
          suggestion: 'Form handling best practices',
          tips: [
            'Validate on both client and server',
            'Show inline error messages',
            'Disable submit while processing'
          ]
        });
      }
      
      if (contextLower.includes('state') || contextLower.includes('data') || contextLower.includes('store')) {
        suggestions.push({
          type: 'state',
          suggestion: 'State management',
          tips: [
            'Keep state as close to where it\'s used',
            'Consider if you really need global state',
            'Avoid deeply nested state objects'
          ]
        });
      }
      
      if (contextLower.includes('style') || contextLower.includes('css') || contextLower.includes('design')) {
        suggestions.push({
          type: 'styling',
          suggestion: 'Styling approaches',
          tips: [
            'Use CSS variables for consistent theming',
            'Consider Tailwind for rapid development',
            'Keep styles modular and reusable'
          ]
        });
      }
      
      // Add next step suggestions based on type
      if (type === 'next-step') {
        suggestions.push({
          type: 'next-step',
          suggestion: 'Suggested next actions',
          actions: [
            'Write a test for what you just built',
            'Add error handling for edge cases',
            'Document what this code does',
            'Consider refactoring for clarity'
          ]
        });
      }
      
      if (type === 'improvement' && code) {
        suggestions.push({
          type: 'improvement',
          suggestion: 'Code improvement ideas',
          ideas: [
            'Extract repeated logic into functions',
            'Add meaningful variable names',
            'Consider early returns for cleaner logic',
            'Add comments for complex sections'
          ]
        });
      }
      
      // Save to session
      if (session) {
        session.interactions.push({
          time: new Date().toISOString(),
          type: 'suggestion',
          context,
          suggestionsCount: suggestions.length
        });
        fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
      }
      
      return {
        success: true,
        suggestions,
        encouragement: stuck 
          ? '💪 Everyone gets stuck. Let\'s figure this out together!'
          : '🎯 Looking good! Here are some suggestions.',
        quickTips: [
          'Take a short break if frustrated',
          'Rubber duck debugging: explain the problem out loud',
          'Check if there\'s a library that solves this'
        ],
        message: `💡 Generated ${suggestions.length} suggestions for your task`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Live code review
 */
const pair_review = {
  name: 'pair_review',
  description: 'Get real-time code review with constructive feedback.',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to review' },
      filePath: { type: 'string', description: 'Or path to file to review' },
      focus: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Focus areas: bugs, performance, readability, security'
      }
    },
    required: []
  },
  handler: async ({ code, filePath, focus = ['bugs', 'readability'] }) => {
    try {
      let codeToReview = code;
      
      if (!code && filePath && fs.existsSync(filePath)) {
        codeToReview = fs.readFileSync(filePath, 'utf8');
      }
      
      if (!codeToReview) {
        return { 
          success: false, 
          error: 'Please provide code or a valid file path to review' 
        };
      }
      
      const feedback = [];
      const lines = codeToReview.split('\n');
      
      // Basic code analysis
      if (focus.includes('bugs')) {
        // Check for common issues
        if (codeToReview.includes('console.log')) {
          feedback.push({
            type: 'info',
            category: 'cleanup',
            message: 'Found console.log statements - remember to remove for production',
            severity: 'low'
          });
        }
        
        if (codeToReview.includes('TODO') || codeToReview.includes('FIXME')) {
          feedback.push({
            type: 'warning',
            category: 'incomplete',
            message: 'Found TODO/FIXME comments - make sure to address these',
            severity: 'medium'
          });
        }
        
        if (codeToReview.match(/catch\s*\([^)]*\)\s*{\s*}/)) {
          feedback.push({
            type: 'warning',
            category: 'error-handling',
            message: 'Empty catch block found - errors should be handled',
            severity: 'high'
          });
        }
      }
      
      if (focus.includes('readability')) {
        // Check line length
        const longLines = lines.filter(l => l.length > 100).length;
        if (longLines > 0) {
          feedback.push({
            type: 'suggestion',
            category: 'formatting',
            message: `${longLines} lines exceed 100 characters - consider breaking up`,
            severity: 'low'
          });
        }
        
        // Check function length
        const functionCount = (codeToReview.match(/function\s+\w+/g) || []).length;
        if (lines.length > 100 && functionCount < 2) {
          feedback.push({
            type: 'suggestion',
            category: 'structure',
            message: 'Large file with few functions - consider breaking into smaller pieces',
            severity: 'medium'
          });
        }
      }
      
      if (focus.includes('security')) {
        if (codeToReview.includes('eval(')) {
          feedback.push({
            type: 'warning',
            category: 'security',
            message: 'eval() is dangerous - avoid if possible',
            severity: 'high'
          });
        }
        
        if (codeToReview.match(/innerHTML\s*=/)) {
          feedback.push({
            type: 'warning',
            category: 'security',
            message: 'innerHTML can lead to XSS - use textContent or sanitize',
            severity: 'high'
          });
        }
      }
      
      if (focus.includes('performance')) {
        if (codeToReview.match(/document\.querySelector.*for|while.*document\.querySelector/)) {
          feedback.push({
            type: 'suggestion',
            category: 'performance',
            message: 'DOM queries in loops are slow - cache the result',
            severity: 'medium'
          });
        }
      }
      
      // Calculate score
      const highIssues = feedback.filter(f => f.severity === 'high').length;
      const mediumIssues = feedback.filter(f => f.severity === 'medium').length;
      const score = Math.max(0, 100 - (highIssues * 15) - (mediumIssues * 5));
      
      return {
        success: true,
        review: {
          linesReviewed: lines.length,
          score: `${score}/100`,
          rating: score >= 80 ? '✅ Looking good!' : score >= 60 ? '👍 Some improvements needed' : '⚠️ Needs attention',
          feedback,
          issueCount: feedback.length
        },
        positives: [
          lines.length < 200 ? '✅ Reasonable file size' : null,
          !codeToReview.includes('var ') ? '✅ Using modern variable declarations' : null,
          codeToReview.includes('async') ? '✅ Using async/await' : null
        ].filter(Boolean),
        message: `📝 Reviewed ${lines.length} lines - Score: ${score}/100`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Explain code/concepts as you go
 */
const pair_explain = {
  name: 'pair_explain',
  description: 'Get explanations of code or programming concepts in plain English.',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to explain' },
      concept: { type: 'string', description: 'Or concept to explain' },
      depth: { 
        type: 'string', 
        enum: ['brief', 'detailed', 'in-depth'],
        default: 'detailed'
      }
    },
    required: []
  },
  handler: async ({ code, concept, depth = 'detailed' }) => {
    try {
      if (code) {
        // Analyze and explain code
        const analysis = {
          language: 'JavaScript', // Would detect actual language
          purpose: 'General code',
          components: []
        };
        
        // Detect patterns
        if (code.includes('async') || code.includes('await')) {
          analysis.components.push({
            pattern: 'Async/Await',
            explanation: 'This code handles operations that take time (like fetching data). "await" pauses execution until the operation completes.'
          });
        }
        
        if (code.includes('map(') || code.includes('filter(') || code.includes('reduce(')) {
          analysis.components.push({
            pattern: 'Array Methods',
            explanation: 'These transform arrays: map changes each item, filter keeps matching items, reduce combines items into one value.'
          });
        }
        
        if (code.includes('=>')) {
          analysis.components.push({
            pattern: 'Arrow Functions',
            explanation: 'Shorthand way to write functions. (x) => x * 2 is the same as function(x) { return x * 2; }'
          });
        }
        
        if (code.includes('...')) {
          analysis.components.push({
            pattern: 'Spread Operator',
            explanation: 'The ... "spreads" items. [...array] copies array, {...obj} copies object.'
          });
        }
        
        if (code.includes('useState') || code.includes('useEffect')) {
          analysis.components.push({
            pattern: 'React Hooks',
            explanation: 'useState stores data that can change. useEffect runs code when things change (like component loading).'
          });
        }
        
        return {
          success: true,
          explanation: {
            ...analysis,
            lineByLine: depth === 'in-depth',
            summary: `This ${analysis.language} code ${analysis.components.length > 0 ? 'uses ' + analysis.components.map(c => c.pattern).join(', ') : 'performs basic operations'}.`
          },
          components: analysis.components,
          relatedConcepts: [
            'Functions', 'Variables', 'Control Flow', 'Error Handling'
          ],
          message: `📖 Explained code with ${analysis.components.length} patterns identified`
        };
      }
      
      if (concept) {
        // Explain programming concept
        const concepts = {
          'api': {
            simple: 'An API is like a waiter - you tell it what you want, it gets it from the kitchen (server).',
            detailed: 'API (Application Programming Interface) is a set of rules that allows different software to communicate. You send a request, the server processes it, and sends back a response.',
            example: 'fetch("https://api.example.com/data") asks a server for data and returns it to your app.'
          },
          'async': {
            simple: 'Async means "don\'t wait here" - the code keeps running while slow tasks complete.',
            detailed: 'Asynchronous code allows your program to start a slow operation (like fetching data) and continue doing other things instead of freezing.',
            example: 'Instead of freezing while downloading an image, async code lets the page stay responsive.'
          },
          'component': {
            simple: 'Components are like LEGO blocks - reusable pieces you combine to build something bigger.',
            detailed: 'In React/Vue, components are self-contained pieces of UI. Each has its own logic and appearance, and can be reused throughout your app.',
            example: 'A Button component can be used many times with different text and colors.'
          },
          'state': {
            simple: 'State is your app\'s memory - it remembers things that can change.',
            detailed: 'State holds data that changes over time. When state changes, the UI updates automatically to reflect the new data.',
            example: 'A shopping cart\'s item count is state - it changes as you add/remove items.'
          }
        };
        
        const conceptLower = concept.toLowerCase();
        let explanation = null;
        
        for (const [key, value] of Object.entries(concepts)) {
          if (conceptLower.includes(key)) {
            explanation = value;
            break;
          }
        }
        
        if (!explanation) {
          explanation = {
            simple: `${concept} is a programming concept.`,
            detailed: `I'd be happy to explain ${concept} in more detail. Could you provide more context about what aspect you'd like to understand?`,
            example: `Search for "${concept} tutorial" for practical examples.`
          };
        }
        
        return {
          success: true,
          concept,
          explanation: {
            simple: explanation.simple,
            detailed: depth !== 'brief' ? explanation.detailed : undefined,
            example: depth === 'in-depth' ? explanation.example : undefined
          },
          learnMore: [
            `MDN Web Docs: https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(concept)}`,
            `freeCodeCamp: https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(concept)}`
          ],
          message: `📖 Here's an explanation of "${concept}"`
        };
      }
      
      return { success: false, error: 'Please provide code or a concept to explain' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Suggest refactors live
 */
const pair_refactor = {
  name: 'pair_refactor',
  description: 'Get refactoring suggestions to improve your code.',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to refactor' },
      filePath: { type: 'string', description: 'Or path to file' },
      goal: { 
        type: 'string', 
        enum: ['readability', 'performance', 'simplify', 'modernize'],
        default: 'readability'
      }
    },
    required: []
  },
  handler: async ({ code, filePath, goal = 'readability' }) => {
    try {
      let codeToRefactor = code;
      
      if (!code && filePath && fs.existsSync(filePath)) {
        codeToRefactor = fs.readFileSync(filePath, 'utf8');
      }
      
      if (!codeToRefactor) {
        return { success: false, error: 'Please provide code to refactor' };
      }
      
      const suggestions = [];
      
      // Check for refactoring opportunities
      if (codeToRefactor.includes('var ')) {
        suggestions.push({
          type: 'modernize',
          current: 'Using var',
          suggestion: 'Replace var with const/let',
          reason: 'const and let have better scoping and prevent accidental reassignment',
          priority: 'high'
        });
      }
      
      if (codeToRefactor.match(/function\s+\w+\s*\([^)]*\)\s*{/)) {
        suggestions.push({
          type: 'modernize',
          current: 'Traditional function syntax',
          suggestion: 'Consider arrow functions for short functions',
          reason: 'Arrow functions are more concise and don\'t rebind "this"',
          priority: 'low'
        });
      }
      
      if (codeToRefactor.includes('.then(')) {
        suggestions.push({
          type: 'modernize',
          current: 'Promise .then() chains',
          suggestion: 'Convert to async/await',
          reason: 'async/await is more readable, especially with error handling',
          priority: 'medium'
        });
      }
      
      if (codeToRefactor.match(/if.*else.*if.*else/s)) {
        suggestions.push({
          type: 'readability',
          current: 'Multiple if-else chains',
          suggestion: 'Consider switch statement or object lookup',
          reason: 'Object lookups are often cleaner for many conditions',
          priority: 'medium'
        });
      }
      
      const longFunctions = codeToRefactor.match(/function[^}]+}/g) || [];
      if (longFunctions.some(f => f.split('\n').length > 30)) {
        suggestions.push({
          type: 'readability',
          current: 'Long functions',
          suggestion: 'Break into smaller, focused functions',
          reason: 'Smaller functions are easier to test, read, and reuse',
          priority: 'high'
        });
      }
      
      if (codeToRefactor.includes('+ \'') || codeToRefactor.includes('\' +')) {
        suggestions.push({
          type: 'modernize',
          current: 'String concatenation with +',
          suggestion: 'Use template literals: `Hello ${name}`',
          reason: 'Template literals are more readable and allow multi-line strings',
          priority: 'low'
        });
      }
      
      if (goal === 'performance') {
        suggestions.push({
          type: 'performance',
          current: 'General',
          suggestion: 'Consider memoization for expensive calculations',
          reason: 'Caching results prevents redundant work',
          priority: 'medium'
        });
      }
      
      return {
        success: true,
        analysis: {
          goal,
          linesAnalyzed: codeToRefactor.split('\n').length,
          suggestionsCount: suggestions.length
        },
        suggestions: suggestions.sort((a, b) => 
          a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0
        ),
        generalTips: {
          readability: ['Use meaningful names', 'Add comments for complex logic', 'Keep functions small'],
          performance: ['Avoid unnecessary loops', 'Cache expensive operations', 'Use appropriate data structures'],
          simplify: ['Remove dead code', 'Combine similar functions', 'Use built-in methods'],
          modernize: ['Use ES6+ features', 'Replace callbacks with async/await', 'Use destructuring']
        }[goal],
        message: `🔧 Found ${suggestions.length} refactoring opportunities`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Voice-controlled operations
 */
const voice_command = {
  name: 'voice_command',
  description: 'Process voice commands for hands-free coding (simulated - maps voice to actions).',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Voice command text' },
      context: { type: 'string', description: 'Current context/file' }
    },
    required: ['command']
  },
  handler: async ({ command, context }) => {
    try {
      const commandLower = command.toLowerCase();
      let action = null;
      let params = {};
      
      // Parse voice commands
      if (commandLower.includes('create') && commandLower.includes('file')) {
        const nameMatch = command.match(/(?:called|named)\s+(\S+)/i);
        action = 'create_file';
        params = { name: nameMatch ? nameMatch[1] : 'new-file.js' };
      }
      else if (commandLower.includes('run') && commandLower.includes('test')) {
        action = 'run_tests';
      }
      else if (commandLower.includes('commit')) {
        const messageMatch = command.match(/(?:message|saying)\s+["']?(.+?)["']?$/i);
        action = 'git_commit';
        params = { message: messageMatch ? messageMatch[1] : 'Update' };
      }
      else if (commandLower.includes('explain')) {
        action = 'pair_explain';
        params = { code: context };
      }
      else if (commandLower.includes('review')) {
        action = 'pair_review';
        params = { code: context };
      }
      else if (commandLower.includes('refactor')) {
        action = 'pair_refactor';
        params = { code: context };
      }
      else if (commandLower.includes('suggest') || commandLower.includes('help')) {
        action = 'pair_suggest';
        params = { context: command };
      }
      else if (commandLower.includes('deploy')) {
        action = 'deploy';
      }
      else if (commandLower.includes('save')) {
        action = 'save_file';
      }
      else if (commandLower.includes('undo')) {
        action = 'undo';
      }
      
      if (!action) {
        return {
          success: true,
          parsed: false,
          command,
          suggestion: 'I didn\'t understand that command. Try:',
          examples: [
            '"Create a file called App.js"',
            '"Run the tests"',
            '"Commit with message fixed bug"',
            '"Explain this code"',
            '"Review this code"',
            '"Suggest next step"'
          ],
          message: '❓ Could not parse voice command'
        };
      }
      
      return {
        success: true,
        parsed: true,
        command,
        action,
        params,
        confirmation: `🎤 Understood: ${action}${Object.keys(params).length > 0 ? ' with ' + JSON.stringify(params) : ''}`,
        note: 'Voice recognition requires browser Speech API or external service',
        setupTip: 'Use browser\'s SpeechRecognition API or services like Whisper API',
        message: `🎤 Voice command parsed: ${action}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  pair_start,
  pair_suggest,
  pair_review,
  pair_explain,
  pair_refactor,
  voice_command
};
