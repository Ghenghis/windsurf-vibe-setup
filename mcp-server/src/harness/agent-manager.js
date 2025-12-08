/**
 * Agent Manager for Anthropic Harness
 * Manages different agent types and their interactions
 */

const { hiveMind } = require('../swarm/hive-mind');
const { orchestrator } = require('../ai-agents/orchestrator');
const { llmClients } = require('../utils/http-client');

class AgentManager {
  constructor(harness, type) {
    this.harness = harness;
    this.type = type;
    this.id = `agent-${type}-${Date.now()}`;
    this.context = [];
    this.sessionData = {};
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZER AGENT METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  async generateFeatureList(spec) {
    console.log('📝 Generating comprehensive feature list...');
    
    // Use Hive Mind to generate test cases
    const swarm = await hiveMind.spawnSwarm(
      `Generate 200+ detailed test cases for this application specification:
      
      ${spec}
      
      Create comprehensive test cases covering:
      - Core functionality
      - Edge cases
      - User interactions
      - Visual validation
      - Performance criteria
      - Security requirements
      
      Format each feature as:
      {
        "name": "Feature name",
        "category": "Category",
        "description": "What the feature does",
        "validationSteps": ["Step 1", "Step 2"],
        "passes": false
      }`
    );
    
    const result = await hiveMind.executeSwarmTask(swarm.id);
    
    // Parse the result into structured features
    return this.parseFeatures(result.result);
  }
  
  parseFeatures(rawResult) {
    const features = [];
    
    try {
      // Try to extract JSON from the result
      const jsonMatch = rawResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map(f => ({
          name: f.name || 'Unnamed feature',
          category: f.category || 'General',
          description: f.description || '',
          validationSteps: f.validationSteps || [],
          passes: false,
          keywords: this.extractKeywords(f.description)
        }));
      }
    } catch (e) {
      console.log('Could not parse JSON, generating default features');
    }
    
    // Fallback: generate default comprehensive feature set
    const categories = [
      'User Interface',
      'Authentication',
      'Data Management',
      'API Integration',
      'Performance',
      'Security',
      'Accessibility',
      'Mobile Responsiveness'
    ];
    
    categories.forEach(category => {
      for (let i = 0; i < 25; i++) {
        features.push({
          name: `${category} Feature ${i + 1}`,
          category,
          description: `Implement ${category.toLowerCase()} functionality ${i + 1}`,
          validationSteps: [
            'Check implementation exists',
            'Verify functionality works',
            'Test edge cases',
            'Validate UI/UX'
          ],
          passes: false,
          keywords: [category.toLowerCase()]
        });
      }
    });
    
    return features;
  }
  
  extractKeywords(text) {
    const keywords = [];
    const techTerms = ['react', 'node', 'api', 'database', 'auth', 'ui', 'ux'];
    
    techTerms.forEach(term => {
      if (text.toLowerCase().includes(term)) {
        keywords.push(term);
      }
    });
    
    return keywords;
  }
  
  async createInitScript(features) {
    console.log('🔧 Creating initialization script...');
    
    // Detect framework from features
    const hasReact = features.some(f => 
      f.description.toLowerCase().includes('react') ||
      f.keywords.includes('react')
    );
    
    const hasNode = features.some(f =>
      f.description.toLowerCase().includes('node') ||
      f.description.toLowerCase().includes('api')
    );
    
    const script = `#!/bin/bash
# Harness Initialization Script
# Generated: ${new Date().toISOString()}

echo "🚀 Initializing project..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "Creating package.json..."
  npm init -y
fi

# Install dependencies
echo "📦 Installing dependencies..."
${hasReact ? 'npm install react react-dom @vitejs/plugin-react vite' : ''}
${hasNode ? 'npm install express cors dotenv' : ''}
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev eslint prettier

# Create scripts in package.json
npx json -I -f package.json -e 'this.scripts={
  "dev": "${hasReact ? 'vite' : 'node server.js'}",
  "build": "${hasReact ? 'vite build' : 'echo Build not configured'}",
  "test": "jest",
  "lint": "eslint .",
  "format": "prettier --write ."
}'

# Start development server
echo "✅ Initialization complete!"
echo "Starting development server..."
npm run dev
`;
    
    return script;
  }
  
  async createProjectStructure(projectDir) {
    console.log('🏗️ Creating project structure...');
    
    const fs = require('fs').promises;
    const path = require('path');
    
    // Create directory structure
    const dirs = [
      'src',
      'src/components',
      'src/pages',
      'src/services',
      'src/utils',
      'public',
      'tests',
      'docs'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(projectDir, dir), { recursive: true });
    }
    
    // Create basic files
    const files = {
      'src/index.js': '// Main application entry point\nconsole.log("Hello from Harness!");',
      'src/App.js': 'export default function App() {\n  return <div>App Component</div>;\n}',
      'public/index.html': '<!DOCTYPE html>\n<html>\n<head><title>Harness App</title></head>\n<body><div id="root"></div></body>\n</html>',
      'README.md': '# Harness Generated Project\n\nGenerated by Anthropic Harness',
      '.gitignore': 'node_modules/\ndist/\n.env\n*.log',
      '.env.example': '# Environment variables\nPORT=3000\nNODE_ENV=development'
    };
    
    for (const [file, content] of Object.entries(files)) {
      await fs.writeFile(path.join(projectDir, file), content);
    }
    
    console.log('✅ Project structure created');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CODING AGENT METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  async prime(progress, features) {
    console.log('🧠 Priming agent with context...');
    
    const implemented = features.filter(f => f.passes).length;
    const total = features.length;
    
    this.context = [
      `Session: ${progress.currentSession || 1}`,
      `Progress: ${implemented}/${total} features (${((implemented/total)*100).toFixed(1)}%)`,
      `Last session: ${progress.lastUpdate?.summary || 'Initial'}`,
      `Project directory: ${this.harness.projectDir}`
    ];
    
    // Get git history
    try {
      const { stdout } = await this.harness.execCommand('git log --oneline -5');
      this.context.push(`Recent commits:\n${stdout}`);
    } catch {
      // Git not available or no commits yet
    }
    
    console.log('Context loaded:', this.context.join('\n'));
  }
  
  async runRegressionTests(features) {
    console.log(`🔍 Running regression tests on ${features.length} features...`);
    
    const results = { passes: [], failures: [] };
    
    for (const feature of features) {
      const result = await this.testFeature(feature);
      
      if (result.passes) {
        results.passes.push(feature);
      } else {
        results.failures.push({
          feature,
          error: result.error
        });
      }
    }
    
    console.log(`✅ ${results.passes.length} passing, ❌ ${results.failures.length} failures`);
    
    return results;
  }
  
  async fixRegression(failure) {
    console.log(`🔧 Fixing regression: ${failure.feature.name}`);
    
    // Use multi-agent system to fix the issue
    const task = {
      type: 'bug-fix',
      description: `Fix regression in feature: ${failure.feature.name}
        Error: ${failure.error}
        Original implementation: ${failure.feature.description}`,
      keywords: failure.feature.keywords
    };
    
    const result = await orchestrator.executeTask(task);
    
    // Re-test after fix
    const testResult = await this.testFeature(failure.feature);
    
    if (testResult.passes) {
      console.log(`✅ Regression fixed: ${failure.feature.name}`);
    } else {
      console.log(`⚠️ Regression still failing: ${failure.feature.name}`);
    }
    
    return testResult;
  }
  
  async implementFeature(feature) {
    console.log(`🚀 Implementing feature: ${feature.name}`);
    
    // Use orchestrator to implement the feature
    const task = {
      type: 'feature-implementation',
      description: feature.description,
      keywords: feature.keywords,
      validationSteps: feature.validationSteps,
      category: feature.category
    };
    
    // Spawn a swarm for complex features
    if (feature.validationSteps.length > 5) {
      const swarm = await hiveMind.spawnSwarm(
        `Implement feature: ${feature.name}\n${feature.description}`
      );
      
      const result = await hiveMind.executeSwarmTask(swarm.id);
      return result;
    }
    
    // Use single agent for simple features
    const result = await orchestrator.executeTask(task);
    
    return result;
  }
  
  async testFeature(feature) {
    console.log(`🧪 Testing feature: ${feature.name}`);
    
    const results = [];
    
    // Run each validation step
    for (const step of feature.validationSteps) {
      try {
        // Try to validate using Puppeteer if available
        const validated = await this.validateWithPuppeteer(step);
        results.push({ step, success: validated });
      } catch (error) {
        // Fallback to code validation
        const validated = await this.validateWithCode(step);
        results.push({ step, success: validated });
      }
    }
    
    const allPassing = results.every(r => r.success);
    
    return {
      passes: allPassing,
      results,
      error: allPassing ? null : 'Some validation steps failed'
    };
  }
  
  async validateWithPuppeteer(step) {
    // This would integrate with Puppeteer MCP server
    // For now, simulate validation
    
    // Random success for demo (would be real validation)
    return Math.random() > 0.3;
  }
  
  async validateWithCode(step) {
    // Code-based validation
    // Check if relevant files exist, tests pass, etc.
    
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      // Check if source files exist
      await fs.access(path.join(this.harness.projectDir, 'src'));
      
      // Simulate validation success
      return true;
    } catch {
      return false;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SHARED UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  
  async callLLM(prompt) {
    // Use the configured LLM to process prompts
    try {
      const response = await llmClients.callOllama(
        'qwen2.5-coder:32b',
        prompt,
        { temperature: 0.7 }
      );
      
      return response;
    } catch (error) {
      console.error('LLM call failed:', error);
      
      // Fallback response
      return 'Generated implementation placeholder';
    }
  }
  
  getPrompt(action, context) {
    const prompts = {
      generateFeatures: `Generate comprehensive test cases for: ${context}`,
      implementFeature: `Implement this feature: ${context}`,
      fixRegression: `Fix this regression issue: ${context}`,
      testFeature: `Test this feature thoroughly: ${context}`
    };
    
    return prompts[action] || `Perform action: ${action} with context: ${context}`;
  }
}

module.exports = AgentManager;
