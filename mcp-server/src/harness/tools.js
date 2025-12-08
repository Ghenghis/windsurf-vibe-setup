/**
 * Harness MCP Tools
 * Provides tools for controlling the Anthropic Harness
 */

const harnessTools = [
  // ═══════════════════════════════════════════════════════════════════════
  // CONTROL TOOLS
  // ═══════════════════════════════════════════════════════════════════════
  
  {
    name: 'harness_toggle',
    description: 'Enable or disable the Anthropic Harness feature for long-running autonomous development',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Enable (true) or disable (false) the harness'
        }
      },
      required: ['enabled']
    },
    handler: async ({ enabled }) => {
      const { toggleHarness } = require('./controller');
      const status = toggleHarness(enabled);
      
      return {
        enabled: status,
        message: status ? 
          '✅ Harness enabled - Ready for long-running sessions' : 
          '❌ Harness disabled'
      };
    }
  },
  
  {
    name: 'harness_start',
    description: 'Start a long-running autonomous development session (24-48 hours)',
    inputSchema: {
      type: 'object',
      properties: {
        spec: {
          type: 'string',
          description: 'Project specification or description'
        },
        name: {
          type: 'string',
          description: 'Project name'
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of features to implement'
        },
        framework: {
          type: 'string',
          description: 'Framework to use (React, Vue, Angular, etc.)',
          default: 'React'
        },
        maxHours: {
          type: 'number',
          description: 'Maximum hours to run (1-48)',
          default: 24
        },
        targetPassRate: {
          type: 'number',
          description: 'Target test pass rate (0.5-1.0)',
          default: 0.95
        }
      }
    },
    handler: async (params) => {
      const { startHarness } = require('./controller');
      
      // Build spec from parameters if not provided directly
      let spec = params.spec;
      
      if (!spec && (params.name || params.features)) {
        spec = {
          name: params.name || 'Harness Project',
          description: params.spec || 'Autonomous development project',
          features: params.features || [],
          framework: params.framework || 'React',
          database: 'PostgreSQL',
          testing: 'Jest + Playwright'
        };
      }
      
      if (!spec) {
        throw new Error('Project specification required (spec, or name + features)');
      }
      
      // Start the harness
      const projectDir = await startHarness(spec, {
        maxHoursRuntime: params.maxHours || 24,
        targetTestPassRate: params.targetPassRate || 0.95
      });
      
      return {
        success: true,
        message: `🚀 Harness started! Will run for up to ${params.maxHours || 24} hours`,
        projectDir,
        targetPassRate: params.targetPassRate || 0.95
      };
    }
  },
  
  {
    name: 'harness_stop',
    description: 'Stop the currently running harness session',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const { stopHarness, getHarnessStatus } = require('./controller');
      const status = getHarnessStatus();
      
      if (!status.running) {
        return {
          success: false,
          message: 'No harness session is currently running'
        };
      }
      
      await stopHarness();
      
      return {
        success: true,
        message: '🛑 Harness stopped',
        finalSession: status.session,
        metrics: status.metrics
      };
    }
  },
  
  {
    name: 'harness_status',
    description: 'Get current status and metrics of the harness',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const { getHarnessStatus } = require('./controller');
      const status = getHarnessStatus();
      
      if (!status.running) {
        return {
          running: false,
          message: 'Harness is not currently running',
          enabled: status.config?.enabled || false
        };
      }
      
      const runtime = status.metrics.startTime ? 
        ((Date.now() - new Date(status.metrics.startTime).getTime()) / 3600000).toFixed(1) : 0;
      
      return {
        running: true,
        session: status.session,
        runtime: `${runtime} hours`,
        metrics: {
          featuresImplemented: status.metrics.featuresImplemented,
          testsPassingRate: `${(status.metrics.testsPassingRate * 100).toFixed(1)}%`,
          totalSessions: status.metrics.totalSessions,
          errorsEncountered: status.metrics.errorsEncountered
        },
        projectDir: status.projectDir,
        config: {
          maxHours: status.config.maxHoursRuntime,
          targetPassRate: status.config.targetTestPassRate,
          maxSessions: status.config.maxSessions
        }
      };
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // QUICK START TOOLS
  // ═══════════════════════════════════════════════════════════════════════
  
  {
    name: 'harness_quick_start',
    description: 'Quick start templates for common projects',
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          enum: [
            'claude-clone',
            'saas-dashboard',
            'ecommerce',
            'social-media',
            'task-manager',
            'blog-platform',
            'chat-app'
          ],
          description: 'Project template to use'
        },
        maxHours: {
          type: 'number',
          description: 'Maximum hours to run',
          default: 12
        }
      },
      required: ['template']
    },
    handler: async ({ template, maxHours = 12 }) => {
      const { startHarness } = require('./controller');
      
      const templates = {
        'claude-clone': {
          name: 'Claude.ai Clone',
          description: 'Full-featured clone of Claude.ai interface',
          features: [
            'Chat interface with markdown support',
            'File upload and management',
            'Project organization',
            'Conversation history',
            'Artifact creation and management',
            'Settings and preferences',
            'Code syntax highlighting',
            'Export conversations',
            'Dark/light theme toggle',
            'Responsive mobile design'
          ],
          framework: 'React + TypeScript',
          database: 'PostgreSQL',
          testing: 'Jest + Playwright'
        },
        'saas-dashboard': {
          name: 'SaaS Admin Dashboard',
          description: 'Modern SaaS administration dashboard',
          features: [
            'User authentication and authorization',
            'Analytics dashboard with charts',
            'User management interface',
            'Billing and subscription management',
            'Real-time notifications',
            'Settings and configuration',
            'API key management',
            'Activity logs and audit trail',
            'Multi-tenant support',
            'Responsive design'
          ],
          framework: 'React + Node.js',
          database: 'PostgreSQL',
          testing: 'Jest + Cypress'
        },
        'ecommerce': {
          name: 'E-Commerce Platform',
          description: 'Full-featured e-commerce platform',
          features: [
            'Product catalog with search',
            'Shopping cart functionality',
            'User authentication',
            'Payment processing',
            'Order management',
            'Admin panel',
            'Product reviews and ratings',
            'Wishlist functionality',
            'Email notifications',
            'Mobile responsive'
          ],
          framework: 'Next.js',
          database: 'PostgreSQL',
          testing: 'Jest + Playwright'
        },
        'social-media': {
          name: 'Social Media Platform',
          description: 'Social media application with core features',
          features: [
            'User profiles and authentication',
            'Post creation with media',
            'Like and comment system',
            'Follow/unfollow functionality',
            'Real-time feed',
            'Direct messaging',
            'Notifications',
            'Search users and posts',
            'Trending topics',
            'Mobile responsive'
          ],
          framework: 'React + Node.js',
          database: 'MongoDB',
          testing: 'Jest + Cypress'
        },
        'task-manager': {
          name: 'Task Management System',
          description: 'Project and task management application',
          features: [
            'Task creation and management',
            'Project organization',
            'Team collaboration',
            'Kanban board view',
            'Calendar integration',
            'File attachments',
            'Comments and activity feed',
            'Time tracking',
            'Reports and analytics',
            'Mobile app support'
          ],
          framework: 'Vue.js + Express',
          database: 'PostgreSQL',
          testing: 'Jest + Playwright'
        },
        'blog-platform': {
          name: 'Blog Publishing Platform',
          description: 'Modern blog platform with CMS',
          features: [
            'Article creation with rich editor',
            'Category and tag management',
            'User authentication',
            'Comment system',
            'Search functionality',
            'RSS feed',
            'Social media sharing',
            'Admin dashboard',
            'SEO optimization',
            'Mobile responsive'
          ],
          framework: 'Next.js',
          database: 'PostgreSQL',
          testing: 'Jest + Cypress'
        },
        'chat-app': {
          name: 'Real-Time Chat Application',
          description: 'Real-time messaging application',
          features: [
            'User authentication',
            'Real-time messaging',
            'Group chats',
            'Direct messages',
            'File sharing',
            'Voice/video calls',
            'Message reactions',
            'Online status',
            'Push notifications',
            'Message search'
          ],
          framework: 'React + Socket.io',
          database: 'MongoDB',
          testing: 'Jest + Cypress'
        }
      };
      
      const spec = templates[template];
      
      if (!spec) {
        throw new Error(`Unknown template: ${template}`);
      }
      
      const projectDir = await startHarness(spec, {
        maxHoursRuntime: maxHours,
        targetTestPassRate: 0.9
      });
      
      return {
        success: true,
        message: `🚀 Started ${spec.name} development`,
        template,
        projectDir,
        features: spec.features.length,
        maxHours
      };
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // CONFIGURATION TOOLS
  // ═══════════════════════════════════════════════════════════════════════
  
  {
    name: 'harness_configure',
    description: 'Configure harness settings',
    inputSchema: {
      type: 'object',
      properties: {
        maxSessions: {
          type: 'number',
          description: 'Maximum number of sessions'
        },
        maxHoursRuntime: {
          type: 'number',
          description: 'Maximum hours to run'
        },
        targetTestPassRate: {
          type: 'number',
          description: 'Target test pass rate (0-1)'
        },
        checkpointInterval: {
          type: 'number',
          description: 'Sessions between checkpoints'
        },
        regressTestCount: {
          type: 'number',
          description: 'Number of features to regression test'
        }
      }
    },
    handler: async (config) => {
      const { harness } = require('./controller');
      
      // Update configuration
      Object.assign(harness.config, config);
      
      return {
        success: true,
        message: 'Configuration updated',
        config: harness.config
      };
    }
  },
  
  {
    name: 'harness_checkpoint',
    description: 'Create a checkpoint of current harness state',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const { harness } = require('./controller');
      
      if (!harness.isRunning) {
        return {
          success: false,
          message: 'No harness session is running'
        };
      }
      
      await harness.checkpoint();
      
      return {
        success: true,
        message: `💾 Checkpoint created at session ${harness.currentSession}`,
        session: harness.currentSession,
        metrics: harness.metrics
      };
    }
  },
  
  {
    name: 'harness_report',
    description: 'Generate a report of harness execution',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const { harness } = require('./controller');
      
      const report = await harness.generateFinalReport();
      
      return {
        success: true,
        report,
        projectDir: harness.projectDir
      };
    }
  }
];

// Handler functions for integration with MCP server
const harnessHandlers = {};

harnessTools.forEach(tool => {
  harnessHandlers[tool.name] = tool.handler;
});

module.exports = {
  harnessTools,
  harnessHandlers,
  
  // Register tools with MCP server
  registerHarnessTools(server) {
    harnessTools.forEach(tool => {
      server.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        handler: tool.handler
      });
    });
    
    console.log(`📦 Registered ${harnessTools.length} harness tools`);
  }
};
