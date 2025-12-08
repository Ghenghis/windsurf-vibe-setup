/**
 * Hive Mind Adapter for Anthropic Harness
 * Integrates the Hive Mind swarm system with the harness
 */

const { hiveMind } = require('../swarm/hive-mind');
const EventEmitter = require('events');

class HiveMindHarnessAdapter extends EventEmitter {
  constructor() {
    super();
    this.swarms = new Map();
    this.sessionSwarms = new Map();
    this.isIntegrated = false;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════
  
  async integrate(harness) {
    if (this.isIntegrated) {
      console.log('⚠️ Hive Mind already integrated with harness');
      return;
    }
    
    console.log('🐝 Integrating Hive Mind with Anthropic Harness...');
    
    // Initialize Hive Mind if not already done
    if (!hiveMind.isRunning) {
      await hiveMind.initialize();
    }
    
    // Subscribe to harness events
    this.subscribeToHarnessEvents(harness);
    
    this.isIntegrated = true;
    
    console.log('✅ Hive Mind integrated with harness');
  }
  
  subscribeToHarnessEvents(harness) {
    // When initializer starts, prepare swarm
    harness.on('initializerStart', async (data) => {
      console.log('🐝 Spawning initializer swarm...');
      
      const swarm = await this.spawnInitializerSwarm(data);
      this.sessionSwarms.set('initializer', swarm);
    });
    
    // When coding session starts, prepare specialized swarm
    harness.on('codingSessionStart', async (data) => {
      console.log(`🐝 Spawning swarm for session ${data.session}...`);
      
      const swarm = await this.spawnCodingSwarm(data);
      this.sessionSwarms.set(data.session, swarm);
    });
    
    // When feature implementation needed
    harness.on('featureImplementation', async (data) => {
      const swarm = this.sessionSwarms.get(data.session);
      if (swarm) {
        return await this.implementWithSwarm(swarm, data.feature);
      }
    });
    
    // When regression testing needed
    harness.on('regressionTesting', async (data) => {
      const testSwarm = await this.spawnTestSwarm(data.features);
      return await this.runSwarmTests(testSwarm, data.features);
    });
    
    // When session completes
    harness.on('sessionComplete', async (data) => {
      await this.cleanupSessionSwarm(data.session);
    });
    
    // When harness stops
    harness.on('stopped', async () => {
      await this.cleanupAllSwarms();
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SWARM MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  async spawnInitializerSwarm(data) {
    const task = `
      Initialize project for long-running harness execution.
      
      Requirements:
      - Generate 200+ comprehensive test cases
      - Create project structure
      - Set up development environment
      - Configure testing framework
      
      Project Spec:
      ${data.spec}
    `;
    
    const swarm = await hiveMind.spawnSwarm(task, {
      maxAgents: 10,
      roles: ['architect', 'developer', 'tester']
    });
    
    this.swarms.set(swarm.id, swarm);
    
    return swarm;
  }
  
  async spawnCodingSwarm(data) {
    const task = `
      Coding Session #${data.session}
      
      Context:
      - Previous sessions: ${data.previousSessions || 0}
      - Features completed: ${data.featuresCompleted || 0}
      - Target: Implement next features from feature list
      
      Requirements:
      - Follow test-driven development
      - Ensure backward compatibility
      - Write clean, maintainable code
      - Add appropriate documentation
    `;
    
    const swarm = await hiveMind.spawnSwarm(task, {
      maxAgents: 15,
      roles: ['developer', 'tester', 'reviewer', 'documenter']
    });
    
    this.swarms.set(swarm.id, swarm);
    
    return swarm;
  }
  
  async spawnTestSwarm(features) {
    const task = `
      Run comprehensive regression tests.
      
      Features to test:
      ${features.map(f => `- ${f.name}: ${f.description}`).join('\n')}
      
      Requirements:
      - Verify all validation steps
      - Check for regressions
      - Test edge cases
      - Validate UI/UX
    `;
    
    const swarm = await hiveMind.spawnSwarm(task, {
      maxAgents: 8,
      roles: ['tester', 'validator', 'analyzer']
    });
    
    this.swarms.set(swarm.id, swarm);
    
    return swarm;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // TASK EXECUTION
  // ═══════════════════════════════════════════════════════════════════════
  
  async implementWithSwarm(swarm, feature) {
    console.log(`🐝 Swarm implementing: ${feature.name}`);
    
    // Add feature details to swarm context
    swarm.sharedContext = {
      ...swarm.sharedContext,
      feature: {
        name: feature.name,
        description: feature.description,
        validationSteps: feature.validationSteps,
        keywords: feature.keywords,
        category: feature.category
      }
    };
    
    // Execute implementation with swarm
    const result = await hiveMind.executeSwarmTask(swarm.id);
    
    // Extract implementation details
    const implementation = {
      success: result.success,
      code: result.result,
      files: this.extractFiles(result),
      tests: this.extractTests(result),
      documentation: this.extractDocs(result)
    };
    
    console.log(`✅ Swarm completed: ${feature.name}`);
    
    return implementation;
  }
  
  async runSwarmTests(testSwarm, features) {
    console.log(`🧪 Swarm testing ${features.length} features...`);
    
    const results = [];
    
    for (const feature of features) {
      testSwarm.sharedContext.currentFeature = feature;
      
      const testResult = await hiveMind.executeSwarmTask(testSwarm.id);
      
      results.push({
        feature: feature.name,
        passes: this.parseTestResult(testResult),
        details: testResult.result
      });
    }
    
    return {
      passes: results.filter(r => r.passes),
      failures: results.filter(r => !r.passes)
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // RESULT PROCESSING
  // ═══════════════════════════════════════════════════════════════════════
  
  extractFiles(result) {
    // Extract file changes from swarm result
    const files = [];
    
    // Look for code blocks in the result
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(result.result)) !== null) {
      const language = match[1] || 'text';
      const code = match[2];
      
      // Try to extract filename from comments
      const filenameMatch = code.match(/\/\/\s*File:\s*(.+)|#\s*File:\s*(.+)/);
      const filename = filenameMatch ? (filenameMatch[1] || filenameMatch[2]) : null;
      
      if (filename) {
        files.push({
          path: filename,
          content: code,
          language
        });
      }
    }
    
    return files;
  }
  
  extractTests(result) {
    // Extract test cases from swarm result
    const tests = [];
    
    // Look for test patterns
    const testRegex = /(?:test|it|describe)\(['"`](.+?)['"`]/g;
    let match;
    
    while ((match = testRegex.exec(result.result)) !== null) {
      tests.push({
        name: match[1],
        type: 'unit'
      });
    }
    
    return tests;
  }
  
  extractDocs(result) {
    // Extract documentation from swarm result
    const docs = [];
    
    // Look for markdown sections
    const sectionRegex = /^#{1,3}\s+(.+)$/gm;
    let match;
    
    while ((match = sectionRegex.exec(result.result)) !== null) {
      docs.push({
        title: match[1],
        content: ''  // Would extract following content
      });
    }
    
    return docs;
  }
  
  parseTestResult(result) {
    // Parse test results to determine pass/fail
    const resultText = result.result.toLowerCase();
    
    // Check for failure indicators
    const failureIndicators = [
      'failed',
      'error',
      'broken',
      'not working',
      'regression',
      'issue found'
    ];
    
    const hasFailure = failureIndicators.some(indicator => 
      resultText.includes(indicator)
    );
    
    return !hasFailure;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════
  
  async cleanupSessionSwarm(session) {
    const swarm = this.sessionSwarms.get(session);
    
    if (swarm) {
      console.log(`🧹 Cleaning up swarm for session ${session}`);
      
      // Archive swarm results
      swarm.state = 'archived';
      
      // Remove from active sessions
      this.sessionSwarms.delete(session);
    }
  }
  
  async cleanupAllSwarms() {
    console.log('🧹 Cleaning up all harness swarms...');
    
    // Archive all active swarms
    for (const [id, swarm] of this.swarms) {
      swarm.state = 'archived';
    }
    
    // Clear maps
    this.swarms.clear();
    this.sessionSwarms.clear();
    
    console.log('✅ All swarms cleaned up');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════
  
  getStatus() {
    return {
      integrated: this.isIntegrated,
      activeSwarms: this.swarms.size,
      sessionSwarms: this.sessionSwarms.size,
      hiveMindStatus: hiveMind.getStatus()
    };
  }
}

// Export singleton instance
const adapter = new HiveMindHarnessAdapter();

module.exports = {
  HiveMindHarnessAdapter,
  adapter,
  
  // Convenience functions
  async integrateHiveMind(harness) {
    return adapter.integrate(harness);
  },
  
  getHiveMindStatus() {
    return adapter.getStatus();
  }
};
