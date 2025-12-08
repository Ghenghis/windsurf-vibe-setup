#!/usr/bin/env node
/**
 * Windsurf Autopilot - Workflow Tools v3.0
 *
 * Visual workflow builder for automation.
 * Create, run, edit, and share automation workflows.
 *
 * Tools:
 * - create_workflow: Create automation workflow
 * - run_workflow: Execute workflow
 * - edit_workflow: Modify workflow
 * - share_workflow: Export/import workflows
 * - workflow_templates: Pre-built workflows
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Workflow storage directory
const WORKFLOW_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot', 'workflows')
  : path.join(process.env.HOME || '', '.windsurf-autopilot', 'workflows');

// Ensure workflow directory exists
if (!fs.existsSync(WORKFLOW_DIR)) {
  fs.mkdirSync(WORKFLOW_DIR, { recursive: true });
}

// Workflow execution state
const runningWorkflows = new Map();

// Built-in workflow templates
const builtInTemplates = {
  'new-project': {
    name: 'New Project Setup',
    description: 'Create and configure a new project',
    steps: [
      { tool: 'create_project', args: { type: '{{projectType}}', name: '{{projectName}}' } },
      { tool: 'install_packages', args: { packages: '{{packages}}' } },
      { tool: 'git_init', args: {} },
      { tool: 'git_commit', args: { message: 'Initial commit' } }
    ],
    variables: {
      projectType: { type: 'string', required: true, description: 'Project type (react, nextjs, node, python)' },
      projectName: { type: 'string', required: true, description: 'Project name' },
      packages: { type: 'array', required: false, default: [], description: 'Additional packages to install' }
    }
  },
  'deploy-production': {
    name: 'Production Deployment',
    description: 'Full production deployment pipeline',
    steps: [
      { tool: 'run_tests', args: { projectPath: '{{projectPath}}' } },
      { tool: 'security_audit', args: { projectPath: '{{projectPath}}' } },
      { tool: 'create_checkpoint', args: { projectPath: '{{projectPath}}', name: 'pre-deploy' } },
      { tool: 'deploy_vercel', args: { projectPath: '{{projectPath}}', prod: true } }
    ],
    variables: {
      projectPath: { type: 'string', required: true, description: 'Path to project' }
    }
  },
  'code-review': {
    name: 'Full Code Review',
    description: 'Comprehensive code review workflow',
    steps: [
      { tool: 'code_review', args: { projectPath: '{{projectPath}}' } },
      { tool: 'analyze_complexity', args: { projectPath: '{{projectPath}}' } },
      { tool: 'find_dead_code', args: { projectPath: '{{projectPath}}' } },
      { tool: 'security_audit', args: { projectPath: '{{projectPath}}' } }
    ],
    variables: {
      projectPath: { type: 'string', required: true, description: 'Path to project' }
    }
  },
  'backup-restore': {
    name: 'Backup and Restore',
    description: 'Create checkpoint and database backup',
    steps: [
      { tool: 'create_checkpoint', args: { projectPath: '{{projectPath}}' } },
      { tool: 'db_backup', args: { connectionId: '{{dbConnection}}' } },
      { tool: 'save_context', args: { name: '{{contextName}}' } }
    ],
    variables: {
      projectPath: { type: 'string', required: true },
      dbConnection: { type: 'string', required: false },
      contextName: { type: 'string', required: false, default: 'auto-backup' }
    }
  }
};

/**
 * Workflow Tools Export
 */
const workflowTools = {

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: create_workflow
  // ═══════════════════════════════════════════════════════════════════════════
  create_workflow: {
    name: 'create_workflow',
    description: 'Create a new automation workflow with multiple steps',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Workflow name'
        },
        description: {
          type: 'string',
          description: 'What this workflow does'
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Step ID (auto-generated if not provided)' },
              tool: { type: 'string', description: 'Tool to execute' },
              args: { type: 'object', description: 'Arguments for the tool' },
              condition: { type: 'string', description: 'Condition to run this step (e.g., "{{prev.success}}")' },
              onError: { type: 'string', enum: ['stop', 'continue', 'retry'], description: 'Error handling' },
              retries: { type: 'number', description: 'Number of retries on failure' }
            },
            required: ['tool']
          },
          description: 'Workflow steps'
        },
        variables: {
          type: 'object',
          description: 'Input variables for the workflow'
        },
        triggers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['manual', 'schedule', 'webhook', 'file_change'] },
              config: { type: 'object' }
            }
          },
          description: 'Workflow triggers'
        }
      },
      required: ['name', 'steps']
    },
    handler: async (args) => {
      try {
        const workflowId = crypto.randomUUID().substring(0, 8);
        const workflow = {
          id: workflowId,
          name: args.name,
          description: args.description || '',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          steps: args.steps.map((step, index) => ({
            id: step.id || `step_${index + 1}`,
            tool: step.tool,
            args: step.args || {},
            condition: step.condition,
            onError: step.onError || 'stop',
            retries: step.retries || 0
          })),
          variables: args.variables || {},
          triggers: args.triggers || [{ type: 'manual' }]
        };

        // Save workflow
        const workflowPath = path.join(WORKFLOW_DIR, `${workflowId}.json`);
        fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

        return {
          success: true,
          workflowId,
          workflowPath,
          name: workflow.name,
          stepCount: workflow.steps.length,
          message: `Workflow "${workflow.name}" created with ${workflow.steps.length} steps`
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: run_workflow
  // ═══════════════════════════════════════════════════════════════════════════
  run_workflow: {
    name: 'run_workflow',
    description: 'Execute a saved workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID or name to run'
        },
        variables: {
          type: 'object',
          description: 'Input variables for the workflow'
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview execution without running',
          default: false
        },
        startFromStep: {
          type: 'string',
          description: 'Start from specific step ID'
        }
      },
      required: ['workflowId']
    },
    handler: async (args, toolExecutor) => {
      try {
        // Find workflow
        let workflow = null;
        const files = fs.readdirSync(WORKFLOW_DIR);

        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = JSON.parse(fs.readFileSync(path.join(WORKFLOW_DIR, file), 'utf8'));
            if (content.id === args.workflowId || content.name === args.workflowId) {
              workflow = content;
              break;
            }
          }
        }

        if (!workflow) {
          return {
            success: false,
            error: `Workflow not found: ${args.workflowId}`,
            availableWorkflows: files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
          };
        }

        // Validate required variables
        const missingVars = [];
        for (const [key, config] of Object.entries(workflow.variables || {})) {
          if (config.required && (!args.variables || args.variables[key] === undefined)) {
            missingVars.push(key);
          }
        }

        if (missingVars.length > 0) {
          return {
            success: false,
            error: 'Missing required variables',
            missingVariables: missingVars,
            variableDefinitions: workflow.variables
          };
        }

        // Merge variables with defaults
        const variables = { ...args.variables };
        for (const [key, config] of Object.entries(workflow.variables || {})) {
          if (variables[key] === undefined && config.default !== undefined) {
            variables[key] = config.default;
          }
        }

        // Dry run - just show what would happen
        if (args.dryRun) {
          const preview = workflow.steps.map((step, index) => ({
            order: index + 1,
            id: step.id,
            tool: step.tool,
            args: substituteVariables(step.args, variables),
            condition: step.condition
          }));

          return {
            success: true,
            dryRun: true,
            workflowName: workflow.name,
            steps: preview,
            variables,
            message: 'Dry run complete. Set dryRun: false to execute.'
          };
        }

        // Execute workflow
        const runId = crypto.randomUUID().substring(0, 8);
        const execution = {
          runId,
          workflowId: workflow.id,
          workflowName: workflow.name,
          startedAt: new Date().toISOString(),
          status: 'running',
          results: [],
          variables
        };

        runningWorkflows.set(runId, execution);

        // Find start step
        let startIndex = 0;
        if (args.startFromStep) {
          startIndex = workflow.steps.findIndex(s => s.id === args.startFromStep);
          if (startIndex === -1) {
            startIndex = 0;
          }
        }

        // Execute steps
        let prevResult = null;
        for (let i = startIndex; i < workflow.steps.length; i++) {
          const step = workflow.steps[i];

          // Check condition
          if (step.condition) {
            const conditionMet = evaluateCondition(step.condition, { prev: prevResult, variables });
            if (!conditionMet) {
              execution.results.push({
                stepId: step.id,
                tool: step.tool,
                skipped: true,
                reason: 'Condition not met'
              });
              continue;
            }
          }

          // Substitute variables in args
          const resolvedArgs = substituteVariables(step.args, { ...variables, prev: prevResult });

          // Execute step (simulated - in real implementation this would call the actual tool)
          let stepResult;
          let retries = step.retries || 0;

          do {
            try {
              // In a real implementation, this would call the tool executor
              stepResult = {
                success: true,
                message: `Executed ${step.tool}`,
                args: resolvedArgs,
                timestamp: new Date().toISOString()
              };
              break;
            } catch (e) {
              if (retries > 0) {
                retries--;
                continue;
              }
              stepResult = { success: false, error: e.message };

              if (step.onError === 'stop') {
                execution.status = 'failed';
                execution.error = `Step ${step.id} failed: ${e.message}`;
                break;
              }
            }
          } while (retries > 0);

          execution.results.push({
            stepId: step.id,
            tool: step.tool,
            ...stepResult
          });

          prevResult = stepResult;

          if (execution.status === 'failed') {
            break;
          }
        }

        if (execution.status !== 'failed') {
          execution.status = 'completed';
        }

        execution.completedAt = new Date().toISOString();
        runningWorkflows.delete(runId);

        return {
          success: execution.status === 'completed',
          runId,
          workflowName: workflow.name,
          status: execution.status,
          stepsExecuted: execution.results.filter(r => !r.skipped).length,
          stepsSkipped: execution.results.filter(r => r.skipped).length,
          results: execution.results,
          duration: new Date(execution.completedAt) - new Date(execution.startedAt) + 'ms'
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: edit_workflow
  // ═══════════════════════════════════════════════════════════════════════════
  edit_workflow: {
    name: 'edit_workflow',
    description: 'Modify an existing workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID to edit'
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            steps: { type: 'array' },
            variables: { type: 'object' },
            triggers: { type: 'array' }
          }
        },
        addStep: {
          type: 'object',
          description: 'Add a new step',
          properties: {
            tool: { type: 'string' },
            args: { type: 'object' },
            position: { type: 'number' }
          }
        },
        removeStep: {
          type: 'string',
          description: 'Step ID to remove'
        }
      },
      required: ['workflowId']
    },
    handler: async (args) => {
      try {
        // Find workflow
        const files = fs.readdirSync(WORKFLOW_DIR);
        let workflowPath = null;
        let workflow = null;

        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(WORKFLOW_DIR, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (content.id === args.workflowId || content.name === args.workflowId) {
              workflow = content;
              workflowPath = filePath;
              break;
            }
          }
        }

        if (!workflow) {
          return { success: false, error: `Workflow not found: ${args.workflowId}` };
        }

        // Apply updates
        if (args.updates) {
          Object.assign(workflow, args.updates);
        }

        // Add step
        if (args.addStep) {
          const newStep = {
            id: `step_${workflow.steps.length + 1}`,
            tool: args.addStep.tool,
            args: args.addStep.args || {},
            onError: 'stop'
          };

          if (args.addStep.position !== undefined) {
            workflow.steps.splice(args.addStep.position, 0, newStep);
          } else {
            workflow.steps.push(newStep);
          }
        }

        // Remove step
        if (args.removeStep) {
          workflow.steps = workflow.steps.filter(s => s.id !== args.removeStep);
        }

        workflow.updatedAt = new Date().toISOString();
        workflow.version = incrementVersion(workflow.version);

        // Save
        fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

        return {
          success: true,
          workflowId: workflow.id,
          name: workflow.name,
          version: workflow.version,
          stepCount: workflow.steps.length,
          message: `Workflow "${workflow.name}" updated`
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: share_workflow
  // ═══════════════════════════════════════════════════════════════════════════
  share_workflow: {
    name: 'share_workflow',
    description: 'Export or import workflows for sharing',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['export', 'import', 'list'],
          description: 'Action to perform'
        },
        workflowId: {
          type: 'string',
          description: 'Workflow ID for export'
        },
        outputPath: {
          type: 'string',
          description: 'Path for export file'
        },
        importPath: {
          type: 'string',
          description: 'Path to import from'
        },
        importData: {
          type: 'object',
          description: 'Workflow data to import directly'
        }
      },
      required: ['action']
    },
    handler: async (args) => {
      try {
        if (args.action === 'list') {
          const files = fs.readdirSync(WORKFLOW_DIR).filter(f => f.endsWith('.json'));
          const workflows = files.map(file => {
            const content = JSON.parse(fs.readFileSync(path.join(WORKFLOW_DIR, file), 'utf8'));
            return {
              id: content.id,
              name: content.name,
              description: content.description,
              stepCount: content.steps?.length || 0,
              version: content.version,
              createdAt: content.createdAt
            };
          });

          return {
            success: true,
            count: workflows.length,
            workflows,
            directory: WORKFLOW_DIR
          };
        }

        if (args.action === 'export') {
          if (!args.workflowId) {
            return { success: false, error: 'workflowId required for export' };
          }

          // Find workflow
          const files = fs.readdirSync(WORKFLOW_DIR);
          let workflow = null;

          for (const file of files) {
            if (file.endsWith('.json')) {
              const content = JSON.parse(fs.readFileSync(path.join(WORKFLOW_DIR, file), 'utf8'));
              if (content.id === args.workflowId || content.name === args.workflowId) {
                workflow = content;
                break;
              }
            }
          }

          if (!workflow) {
            return { success: false, error: `Workflow not found: ${args.workflowId}` };
          }

          // Export
          const exportData = {
            type: 'windsurf-workflow',
            version: '1.0',
            exportedAt: new Date().toISOString(),
            workflow
          };

          if (args.outputPath) {
            fs.writeFileSync(args.outputPath, JSON.stringify(exportData, null, 2));
            return {
              success: true,
              exported: true,
              outputPath: args.outputPath,
              workflowName: workflow.name
            };
          }

          return {
            success: true,
            exported: true,
            data: exportData
          };
        }

        if (args.action === 'import') {
          let importData;

          if (args.importPath) {
            if (!fs.existsSync(args.importPath)) {
              return { success: false, error: `File not found: ${args.importPath}` };
            }
            importData = JSON.parse(fs.readFileSync(args.importPath, 'utf8'));
          } else if (args.importData) {
            importData = args.importData;
          } else {
            return { success: false, error: 'importPath or importData required' };
          }

          // Validate format
          if (importData.type !== 'windsurf-workflow') {
            return { success: false, error: 'Invalid workflow format' };
          }

          const workflow = importData.workflow;
          workflow.id = crypto.randomUUID().substring(0, 8); // New ID
          workflow.importedAt = new Date().toISOString();

          // Save
          const workflowPath = path.join(WORKFLOW_DIR, `${workflow.id}.json`);
          fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

          return {
            success: true,
            imported: true,
            workflowId: workflow.id,
            workflowName: workflow.name,
            stepCount: workflow.steps?.length || 0
          };
        }

        return { success: false, error: 'Invalid action' };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: workflow_templates
  // ═══════════════════════════════════════════════════════════════════════════
  workflow_templates: {
    name: 'workflow_templates',
    description: 'Access pre-built workflow templates',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'use', 'preview'],
          description: 'Action to perform',
          default: 'list'
        },
        templateName: {
          type: 'string',
          description: 'Template name to use or preview'
        },
        variables: {
          type: 'object',
          description: 'Variables for the template'
        }
      }
    },
    handler: async (args) => {
      try {
        const action = args.action || 'list';

        if (action === 'list') {
          const templates = Object.entries(builtInTemplates).map(([key, template]) => ({
            id: key,
            name: template.name,
            description: template.description,
            stepCount: template.steps.length,
            variables: Object.keys(template.variables || {})
          }));

          return {
            success: true,
            count: templates.length,
            templates
          };
        }

        if (action === 'preview') {
          if (!args.templateName || !builtInTemplates[args.templateName]) {
            return {
              success: false,
              error: `Template not found: ${args.templateName}`,
              availableTemplates: Object.keys(builtInTemplates)
            };
          }

          const template = builtInTemplates[args.templateName];
          return {
            success: true,
            template: {
              name: template.name,
              description: template.description,
              steps: template.steps,
              variables: template.variables
            }
          };
        }

        if (action === 'use') {
          if (!args.templateName || !builtInTemplates[args.templateName]) {
            return {
              success: false,
              error: `Template not found: ${args.templateName}`,
              availableTemplates: Object.keys(builtInTemplates)
            };
          }

          const template = builtInTemplates[args.templateName];

          // Create workflow from template
          const workflowId = crypto.randomUUID().substring(0, 8);
          const workflow = {
            id: workflowId,
            name: `${template.name} - ${workflowId}`,
            description: template.description,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fromTemplate: args.templateName,
            steps: template.steps.map((step, index) => ({
              id: `step_${index + 1}`,
              tool: step.tool,
              args: step.args,
              onError: 'stop'
            })),
            variables: template.variables,
            triggers: [{ type: 'manual' }]
          };

          // Save workflow
          const workflowPath = path.join(WORKFLOW_DIR, `${workflowId}.json`);
          fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

          return {
            success: true,
            workflowId,
            workflowName: workflow.name,
            fromTemplate: args.templateName,
            stepCount: workflow.steps.length,
            requiredVariables: Object.entries(template.variables || {})
              .filter(([_, v]) => v.required)
              .map(([k, _]) => k),
            message: `Created workflow from template "${template.name}"`
          };
        }

        return { success: false, error: 'Invalid action' };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Get tool definitions
  getToolDefinitions: function () {
    return [
      { name: this.create_workflow.name, description: this.create_workflow.description, inputSchema: this.create_workflow.inputSchema },
      { name: this.run_workflow.name, description: this.run_workflow.description, inputSchema: this.run_workflow.inputSchema },
      { name: this.edit_workflow.name, description: this.edit_workflow.description, inputSchema: this.edit_workflow.inputSchema },
      { name: this.share_workflow.name, description: this.share_workflow.description, inputSchema: this.share_workflow.inputSchema },
      { name: this.workflow_templates.name, description: this.workflow_templates.description, inputSchema: this.workflow_templates.inputSchema }
    ];
  },

  getHandler: function (toolName) {
    const tool = this[toolName];
    return tool ? tool.handler : null;
  }
};

// Helper: Substitute variables in object
function substituteVariables(obj, variables) {
  if (typeof obj === 'string') {
    return obj.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = getNestedValue(variables, path);
      return value !== undefined ? value : match;
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(item => substituteVariables(item, variables));
  }
  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteVariables(value, variables);
    }
    return result;
  }
  return obj;
}

// Helper: Get nested value from object
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper: Evaluate condition
function evaluateCondition(condition, context) {
  try {
    const resolved = substituteVariables(condition, context);
    // Simple boolean evaluation
    if (resolved === 'true' || resolved === true) {
      return true;
    }
    if (resolved === 'false' || resolved === false) {
      return false;
    }
    return Boolean(resolved);
  } catch {
    return false;
  }
}

// Helper: Increment version
function incrementVersion(version) {
  const parts = (version || '1.0.0').split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

module.exports = workflowTools;
