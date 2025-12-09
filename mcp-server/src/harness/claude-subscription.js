/**
 * Claude Subscription Integration (Cole Medin Method)
 * Use Claude subscription token instead of expensive API key
 * Based on Cole Medin's YouTube tutorial
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ClaudeSubscriptionClient {
  constructor() {
    this.token = null;
    this.isSetup = false;
  }

  /**
   * Setup Claude subscription token following Cole Medin's method
   * This avoids expensive API charges!
   */
  async setupToken() {
    console.log('🎯 Setting up Claude subscription token (Cole Medin method)...');
    console.log('This lets you use your $20/month Claude subscription instead of API credits!');

    // Check if token already exists
    if (process.env.CLAUDE_TOKEN) {
      this.token = process.env.CLAUDE_TOKEN;
      this.isSetup = true;
      console.log('✅ Claude token found in environment');
      return this.token;
    }

    // Check if .env has the token
    try {
      const envPath = path.join(process.cwd(), '.env');
      const envContent = await fs.readFile(envPath, 'utf8');
      const tokenMatch = envContent.match(/CLAUDE_TOKEN=(.+)/);

      if (tokenMatch) {
        this.token = tokenMatch[1];
        this.isSetup = true;
        console.log('✅ Claude token found in .env file');
        return this.token;
      }
    } catch {
      // .env doesn't exist or doesn't have token
    }

    // Guide user to get token
    console.log('\n📝 To get your Claude subscription token:');
    console.log('1. Install Claude CLI: npm install -g @anthropic-ai/claude-cli');
    console.log('2. Run: claude setup-token');
    console.log('3. Follow the OAuth flow in your browser');
    console.log('4. Copy the token it gives you');
    console.log('5. Add to .env file: CLAUDE_TOKEN=your_token_here');
    console.log('\nThis uses your $20/month subscription, NOT pay-per-token API!');

    // Try to run the setup command for the user
    await this.runSetupCommand();

    return null;
  }

  async runSetupCommand() {
    console.log('\n🚀 Running claude setup-token for you...');

    return new Promise(resolve => {
      const setupProcess = spawn('claude', ['setup-token'], {
        stdio: 'inherit',
        shell: true,
      });

      setupProcess.on('close', code => {
        if (code === 0) {
          console.log('✅ Setup complete! Token should be in your environment');
          console.log('Add it to .env: CLAUDE_TOKEN=<your_token>');
        } else {
          console.log('⚠️ Setup failed. Please run manually: claude setup-token');
        }
        resolve();
      });

      setupProcess.on('error', err => {
        console.log('⚠️ Claude CLI not found. Install it first:');
        console.log('npm install -g @anthropic-ai/claude-cli');
        resolve();
      });
    });
  }

  /**
   * Create client configuration for Claude Agent SDK
   * Based on Cole Medin's configuration
   */
  getClientConfig(projectDir) {
    if (!this.token && !process.env.CLAUDE_TOKEN) {
      throw new Error('Claude token not set. Run setupToken() first');
    }

    return {
      // Use subscription token instead of API key
      apiKey: this.token || process.env.CLAUDE_TOKEN,

      // Project directory restriction for security
      projectDirectory: projectDir,

      // Permissions - accept all edits for autonomous mode
      permissions: {
        acceptAllEdits: true,
        autoApprove: true,
      },

      // Model configuration
      model: 'claude-3-opus-20240229', // or claude-3.5-sonnet

      // System prompt
      systemPrompt: `You are an autonomous coding agent working in a long-running harness.
You have access to file operations, bash commands, and browser automation.
Work methodically through the feature list and validate each implementation.`,

      // Allowed tools (Cole's configuration)
      allowedTools: [
        'str_replace_editor',
        'read_file',
        'write_file',
        'list_directory',
        'run_bash_command',
        'puppeteer_navigate',
        'puppeteer_screenshot',
        'puppeteer_click',
        'puppeteer_type',
      ],

      // Security hooks
      hooks: {
        beforeToolUse: this.securityHook.bind(this),
      },

      // Sandbox environment
      sandbox: {
        enabled: true,
        rootDirectory: projectDir,
        allowedCommands: this.getAllowedCommands(),
      },
    };
  }

  /**
   * Security hook to validate tool usage
   * Based on Cole Medin's security implementation
   */
  async securityHook(tool, args) {
    // Block dangerous operations
    const dangerousPatterns = [
      /rm\s+-rf\s+\//, // Don't delete root
      /:(){ :|:& };:/, // Fork bomb
      />\s*\/dev\/sda/, // Don't write to disk directly
      /sudo/, // No sudo commands
      /chmod\s+777/, // No world-writable
      /curl.*\|.*sh/, // No curl pipe to shell
    ];

    if (tool === 'run_bash_command') {
      const command = args.command || '';

      for (const pattern of dangerousPatterns) {
        if (pattern.test(command)) {
          throw new Error(`Blocked dangerous command: ${command}`);
        }
      }

      // Ensure commands stay in project directory
      if (command.includes('cd ')) {
        const cdMatch = command.match(/cd\s+([^;]+)/);
        if (cdMatch && cdMatch[1].startsWith('/')) {
          throw new Error('Cannot cd to absolute paths outside project');
        }
      }
    }

    return args; // Return validated args
  }

  /**
   * Get list of allowed bash commands
   * Based on Cole's whitelist approach
   */
  getAllowedCommands() {
    return [
      'ls',
      'cat',
      'echo',
      'pwd',
      'mkdir',
      'touch',
      'npm',
      'node',
      'git',
      'python',
      'pip',
      'curl',
      'wget',
      'grep',
      'find',
      'sed',
      'awk',
      'docker',
      'docker-compose',
      'yarn',
      'pnpm',
      'bun',
      'jest',
      'vitest',
      'playwright',
      'tsc',
      'tsx',
      'vite',
      'webpack',
    ];
  }

  /**
   * Estimate token usage to track costs
   * Even though we're using subscription, good to know
   */
  estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  getStatus() {
    return {
      isSetup: this.isSetup,
      hasToken: !!this.token || !!process.env.CLAUDE_TOKEN,
      method: 'subscription',
      monthlyCost: '$20',
      apiCost: '$0 (using subscription)',
    };
  }
}

// Singleton instance
const claudeClient = new ClaudeSubscriptionClient();

module.exports = {
  ClaudeSubscriptionClient,
  claudeClient,

  // Setup helper
  async setupClaudeSubscription() {
    return await claudeClient.setupToken();
  },

  // Get configured client
  getClaudeClient(projectDir) {
    return claudeClient.getClientConfig(projectDir);
  },

  // Check status
  getSubscriptionStatus() {
    return claudeClient.getStatus();
  },
};
