/**
 * Open Interpreter Adapter for Anthropic Harness
 * Integrates Open Interpreter for computer control and validation
 */

const EventEmitter = require('events');

class OpenInterpreterHarnessAdapter extends EventEmitter {
  constructor() {
    super();
    this.isIntegrated = false;
    this.sessions = new Map();
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════
  
  async integrate(harness) {
    if (this.isIntegrated) {
      console.log('⚠️ Open Interpreter already integrated');
      return;
    }
    
    console.log('🖥️ Integrating Open Interpreter with harness...');
    
    // Check if Open Interpreter integration exists
    try {
      const OI = require('../integrations/open-interpreter');
      this.interpreter = new OI({
        safeMode: 'ask',
        contextWindow: 128000,
        model: 'ollama/qwen2.5-coder:32b'
      });
      
      await this.interpreter.initialize();
    } catch (error) {
      console.log('⚠️ Open Interpreter integration not available, using mock');
      this.interpreter = this.createMockInterpreter();
    }
    
    // Subscribe to harness events
    this.subscribeToHarnessEvents(harness);
    
    this.isIntegrated = true;
    
    console.log('✅ Open Interpreter integrated with harness');
  }
  
  subscribeToHarnessEvents(harness) {
    // Project initialization
    harness.on('projectSetup', async (data) => {
      await this.setupProject(data);
    });
    
    // Visual validation
    harness.on('visualValidation', async (data) => {
      return await this.validateVisually(data);
    });
    
    // Code execution
    harness.on('executeCode', async (data) => {
      return await this.executeCode(data);
    });
    
    // Browser automation
    harness.on('browserAutomation', async (data) => {
      return await this.automateBrowser(data);
    });
    
    // Test execution
    harness.on('runTests', async (data) => {
      return await this.runTests(data);
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PROJECT SETUP
  // ═══════════════════════════════════════════════════════════════════════
  
  async setupProject(data) {
    console.log('🔧 Setting up project with Open Interpreter...');
    
    const setupPrompt = `
      Create a new ${data.framework || 'React'} project with the following specifications:
      
      Project Name: ${data.name}
      Description: ${data.description}
      
      Requirements:
      - Modern tech stack with TypeScript
      - Testing setup with Jest and Playwright
      - ESLint and Prettier configuration
      - Git initialization
      - Docker setup for containerization
      - CI/CD configuration (GitHub Actions)
      
      Directory: ${data.projectDir}
      
      Please set up the complete project structure and install all dependencies.
    `;
    
    try {
      const result = await this.interpreter.chat(setupPrompt);
      console.log('✅ Project setup complete');
      return result;
    } catch (error) {
      console.error('❌ Project setup failed:', error.message);
      throw error;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // VISUAL VALIDATION
  // ═══════════════════════════════════════════════════════════════════════
  
  async validateVisually(data) {
    console.log(`👁️ Validating feature visually: ${data.feature.name}`);
    
    const validationSteps = [];
    
    for (const step of data.feature.validationSteps) {
      const result = await this.validateStep(step);
      validationSteps.push(result);
    }
    
    const allPassing = validationSteps.every(s => s.success);
    
    return {
      feature: data.feature.name,
      passes: allPassing,
      steps: validationSteps
    };
  }
  
  async validateStep(step) {
    console.log(`  Validating: ${step}`);
    
    try {
      // Take screenshot
      const screenshot = await this.interpreter.computerUse('screenshot');
      
      // Analyze screenshot for validation
      const validationPrompt = `
        Analyze this screenshot and verify:
        ${step}
        
        Return true if the validation passes, false otherwise.
        Also explain what you see.
      `;
      
      const result = await this.interpreter.chat(validationPrompt);
      
      // Parse result
      const passes = result.toLowerCase().includes('true') || 
                     result.toLowerCase().includes('passes') ||
                     result.toLowerCase().includes('correct');
      
      return {
        step,
        success: passes,
        details: result
      };
    } catch (error) {
      return {
        step,
        success: false,
        error: error.message
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // BROWSER AUTOMATION
  // ═══════════════════════════════════════════════════════════════════════
  
  async automateBrowser(data) {
    console.log('🌐 Automating browser actions...');
    
    const actions = data.actions || [];
    const results = [];
    
    for (const action of actions) {
      const result = await this.performBrowserAction(action);
      results.push(result);
      
      // Wait between actions
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
      success: results.every(r => r.success),
      results
    };
  }
  
  async performBrowserAction(action) {
    try {
      let result;
      
      switch (action.type) {
        case 'navigate':
          result = await this.interpreter.chat(
            `Navigate to URL: ${action.url}`
          );
          break;
          
        case 'click':
          result = await this.interpreter.computerUse('click', {
            x: action.x,
            y: action.y
          });
          break;
          
        case 'type':
          result = await this.interpreter.computerUse('type', {
            text: action.text
          });
          break;
          
        case 'screenshot':
          result = await this.interpreter.computerUse('screenshot');
          break;
          
        case 'scroll':
          result = await this.interpreter.computerUse('scroll', {
            direction: action.direction || 'down',
            amount: action.amount || 3
          });
          break;
          
        default:
          result = await this.interpreter.chat(
            `Perform browser action: ${JSON.stringify(action)}`
          );
      }
      
      return {
        action,
        success: true,
        result
      };
    } catch (error) {
      return {
        action,
        success: false,
        error: error.message
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CODE EXECUTION
  // ═══════════════════════════════════════════════════════════════════════
  
  async executeCode(data) {
    console.log('💻 Executing code...');
    
    const { code, language = 'auto', timeout = 60000 } = data;
    
    try {
      const result = await this.interpreter.run(code, language, timeout);
      
      return {
        success: true,
        output: result.output,
        stderr: result.stderr,
        duration: result.duration
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // TEST EXECUTION
  // ═══════════════════════════════════════════════════════════════════════
  
  async runTests(data) {
    console.log('🧪 Running tests...');
    
    const testCommand = data.command || 'npm test';
    const projectDir = data.projectDir;
    
    const testPrompt = `
      Navigate to directory: ${projectDir}
      Run the test command: ${testCommand}
      
      Return the test results including:
      - Number of tests passed
      - Number of tests failed
      - Any error messages
      - Coverage percentage if available
    `;
    
    try {
      const result = await this.interpreter.chat(testPrompt);
      
      // Parse test results
      const passes = this.parseTestResults(result);
      
      return {
        success: passes,
        details: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  parseTestResults(output) {
    const outputLower = output.toLowerCase();
    
    // Check for common test failure indicators
    const failureIndicators = [
      'failed',
      'error',
      'failing',
      '✗',
      '✖',
      'fail:',
      'failures:'
    ];
    
    const successIndicators = [
      'passed',
      'passing',
      '✓',
      '✔',
      'pass:',
      'success',
      'all tests passed'
    ];
    
    // Count indicators
    const hasFailure = failureIndicators.some(ind => outputLower.includes(ind));
    const hasSuccess = successIndicators.some(ind => outputLower.includes(ind));
    
    // If we have success indicators and no failure indicators, tests passed
    return hasSuccess && !hasFailure;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // MOCK INTERPRETER
  // ═══════════════════════════════════════════════════════════════════════
  
  createMockInterpreter() {
    console.log('📦 Creating mock Open Interpreter...');
    
    return {
      async initialize() {
        console.log('Mock interpreter initialized');
      },
      
      async chat(prompt) {
        console.log('Mock chat:', prompt.substring(0, 100));
        return 'Mock response: Action completed successfully';
      },
      
      async computerUse(action, params = {}) {
        console.log(`Mock computer use: ${action}`, params);
        return { success: true, action };
      },
      
      async run(code, language, timeout) {
        console.log(`Mock run ${language} code (${timeout}ms timeout)`);
        return {
          output: 'Mock output',
          stderr: '',
          duration: 100
        };
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════
  
  getStatus() {
    return {
      integrated: this.isIntegrated,
      interpreterAvailable: !!this.interpreter,
      sessions: this.sessions.size
    };
  }
}

// Export singleton instance
const adapter = new OpenInterpreterHarnessAdapter();

module.exports = {
  OpenInterpreterHarnessAdapter,
  adapter,
  
  // Convenience functions
  async integrateOpenInterpreter(harness) {
    return adapter.integrate(harness);
  },
  
  getOpenInterpreterStatus() {
    return adapter.getStatus();
  }
};
