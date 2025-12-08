#!/usr/bin/env node
/**
 * Windsurf Autopilot - Plugin Tools v2.6
 * 
 * Plugin system for extending autopilot with custom tools.
 * Install plugins from npm, GitHub, or local directories.
 * 
 * Tools:
 * - install_plugin: Install a plugin
 * - list_plugins: List installed plugins
 * - uninstall_plugin: Remove a plugin
 * - create_plugin: Create a new plugin template
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Plugin directory
const PLUGIN_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot', 'plugins')
  : path.join(process.env.HOME || '', '.windsurf-autopilot', 'plugins');

// Ensure plugin directory exists
if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

// Loaded plugins
const loadedPlugins = new Map();

// Plugin registry (metadata)
const pluginRegistry = new Map();

/**
 * Load plugin registry from disk
 */
function loadRegistry() {
  const registryPath = path.join(PLUGIN_DIR, 'registry.json');
  if (fs.existsSync(registryPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      for (const [name, info] of Object.entries(data)) {
        pluginRegistry.set(name, info);
      }
    } catch (e) {
      // Ignore errors
    }
  }
}

/**
 * Save plugin registry to disk
 */
function saveRegistry() {
  const registryPath = path.join(PLUGIN_DIR, 'registry.json');
  const data = Object.fromEntries(pluginRegistry);
  fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));
}

// Load registry on startup
loadRegistry();

/**
 * Plugin Tools Export
 */
const pluginTools = {

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: install_plugin
  // ═══════════════════════════════════════════════════════════════════════════
  install_plugin: {
    name: 'install_plugin',
    description: 'Install a plugin from npm, GitHub, or a local path. Plugins add custom tools to the autopilot.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'Plugin source: npm package name, GitHub URL, or local path'
        },
        name: {
          type: 'string',
          description: 'Custom name for the plugin (auto-detected if not provided)'
        },
        version: {
          type: 'string',
          description: 'Version to install (for npm packages)',
          default: 'latest'
        },
        force: {
          type: 'boolean',
          description: 'Force reinstall if already exists',
          default: false
        }
      },
      required: ['source']
    },
    handler: async (args) => {
      const source = args.source;
      
      try {
        let pluginPath;
        let pluginName = args.name;
        let installType;
        
        // Determine source type
        if (source.startsWith('http') || source.includes('github.com')) {
          // GitHub URL
          installType = 'github';
          pluginName = pluginName || source.split('/').pop().replace('.git', '');
          pluginPath = path.join(PLUGIN_DIR, pluginName);
          
          if (fs.existsSync(pluginPath) && !args.force) {
            return {
              success: false,
              error: `Plugin ${pluginName} already exists. Use force: true to reinstall.`
            };
          }
          
          // Clone from GitHub
          if (fs.existsSync(pluginPath)) {
            fs.rmSync(pluginPath, { recursive: true, force: true });
          }
          
          execSync(`git clone ${source} ${pluginPath}`, { stdio: 'pipe' });
          
          // Install dependencies if package.json exists
          if (fs.existsSync(path.join(pluginPath, 'package.json'))) {
            execSync('npm install --production', { cwd: pluginPath, stdio: 'pipe' });
          }
          
        } else if (fs.existsSync(source)) {
          // Local path
          installType = 'local';
          pluginName = pluginName || path.basename(source);
          pluginPath = path.join(PLUGIN_DIR, pluginName);
          
          if (fs.existsSync(pluginPath) && !args.force) {
            return {
              success: false,
              error: `Plugin ${pluginName} already exists. Use force: true to reinstall.`
            };
          }
          
          // Copy local directory
          if (fs.existsSync(pluginPath)) {
            fs.rmSync(pluginPath, { recursive: true, force: true });
          }
          
          fs.mkdirSync(pluginPath, { recursive: true });
          copyDir(source, pluginPath);
          
        } else {
          // Assume npm package
          installType = 'npm';
          pluginName = pluginName || source.replace(/^@/, '').replace(/\//g, '-');
          pluginPath = path.join(PLUGIN_DIR, pluginName);
          
          if (fs.existsSync(pluginPath) && !args.force) {
            return {
              success: false,
              error: `Plugin ${pluginName} already exists. Use force: true to reinstall.`
            };
          }
          
          // Create directory and install via npm
          fs.mkdirSync(pluginPath, { recursive: true });
          
          // Create minimal package.json
          fs.writeFileSync(path.join(pluginPath, 'package.json'), JSON.stringify({
            name: `autopilot-plugin-${pluginName}`,
            version: '1.0.0',
            dependencies: {
              [source]: args.version || 'latest'
            }
          }, null, 2));
          
          execSync('npm install', { cwd: pluginPath, stdio: 'pipe' });
          
          // Create index.js that re-exports the package
          fs.writeFileSync(path.join(pluginPath, 'index.js'), 
            `module.exports = require('${source}');`
          );
        }
        
        // Validate plugin structure
        const validation = validatePlugin(pluginPath);
        if (!validation.valid) {
          // Cleanup on validation failure
          fs.rmSync(pluginPath, { recursive: true, force: true });
          return {
            success: false,
            error: `Invalid plugin structure: ${validation.error}`,
            expectedStructure: {
              required: ['index.js or main file'],
              exports: ['name', 'tools (array)', 'optional: init(), cleanup()']
            }
          };
        }
        
        // Load and register the plugin
        const plugin = loadPlugin(pluginPath);
        
        // Save to registry
        pluginRegistry.set(pluginName, {
          name: pluginName,
          path: pluginPath,
          source,
          installType,
          version: plugin.version || '1.0.0',
          installedAt: new Date().toISOString(),
          tools: plugin.tools?.map(t => t.name) || []
        });
        saveRegistry();
        
        return {
          success: true,
          pluginName,
          pluginPath,
          installType,
          version: plugin.version || '1.0.0',
          tools: plugin.tools?.map(t => ({ name: t.name, description: t.description })) || [],
          message: `Plugin ${pluginName} installed successfully with ${plugin.tools?.length || 0} tools`
        };
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: list_plugins
  // ═══════════════════════════════════════════════════════════════════════════
  list_plugins: {
    name: 'list_plugins',
    description: 'List all installed plugins and their tools',
    inputSchema: {
      type: 'object',
      properties: {
        includeTools: {
          type: 'boolean',
          description: 'Include tool details',
          default: true
        }
      }
    },
    handler: async (args) => {
      try {
        const plugins = [];
        
        for (const [name, info] of pluginRegistry) {
          const pluginInfo = {
            name: info.name,
            version: info.version,
            source: info.source,
            installType: info.installType,
            installedAt: info.installedAt,
            toolCount: info.tools?.length || 0
          };
          
          // Check if plugin is loaded
          pluginInfo.loaded = loadedPlugins.has(name);
          
          // Include tool details if requested
          if (args.includeTools !== false && info.tools) {
            pluginInfo.tools = info.tools;
          }
          
          // Check if plugin path still exists
          pluginInfo.exists = fs.existsSync(info.path);
          
          plugins.push(pluginInfo);
        }
        
        return {
          success: true,
          count: plugins.length,
          plugins,
          pluginDirectory: PLUGIN_DIR
        };
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: uninstall_plugin
  // ═══════════════════════════════════════════════════════════════════════════
  uninstall_plugin: {
    name: 'uninstall_plugin',
    description: 'Uninstall a plugin',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Plugin name to uninstall'
        },
        confirm: {
          type: 'boolean',
          description: 'Confirm uninstallation',
          default: false
        }
      },
      required: ['name']
    },
    handler: async (args) => {
      if (!args.confirm) {
        return {
          success: false,
          error: 'Uninstallation requires confirmation',
          message: 'Set confirm: true to proceed'
        };
      }

      try {
        const pluginName = args.name;
        const info = pluginRegistry.get(pluginName);
        
        if (!info) {
          return {
            success: false,
            error: `Plugin not found: ${pluginName}`,
            availablePlugins: Array.from(pluginRegistry.keys())
          };
        }
        
        // Cleanup if plugin has cleanup function
        if (loadedPlugins.has(pluginName)) {
          const plugin = loadedPlugins.get(pluginName);
          if (plugin.cleanup) {
            try {
              await plugin.cleanup();
            } catch (e) {
              // Ignore cleanup errors
            }
          }
          loadedPlugins.delete(pluginName);
        }
        
        // Remove plugin directory
        if (fs.existsSync(info.path)) {
          fs.rmSync(info.path, { recursive: true, force: true });
        }
        
        // Remove from registry
        pluginRegistry.delete(pluginName);
        saveRegistry();
        
        return {
          success: true,
          pluginName,
          message: `Plugin ${pluginName} uninstalled successfully`
        };
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: create_plugin
  // ═══════════════════════════════════════════════════════════════════════════
  create_plugin: {
    name: 'create_plugin',
    description: 'Create a new plugin template with example tools',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Plugin name'
        },
        outputPath: {
          type: 'string',
          description: 'Where to create the plugin (default: current directory)'
        },
        tools: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tool names to include in template'
        }
      },
      required: ['name']
    },
    handler: async (args) => {
      try {
        const pluginName = args.name.replace(/[^a-zA-Z0-9-_]/g, '-');
        const outputPath = args.outputPath || process.cwd();
        const pluginPath = path.join(outputPath, `autopilot-plugin-${pluginName}`);
        
        if (fs.existsSync(pluginPath)) {
          return {
            success: false,
            error: `Directory already exists: ${pluginPath}`
          };
        }
        
        fs.mkdirSync(pluginPath, { recursive: true });
        
        // Create package.json
        const packageJson = {
          name: `autopilot-plugin-${pluginName}`,
          version: '1.0.0',
          description: `Windsurf Autopilot plugin: ${pluginName}`,
          main: 'index.js',
          keywords: ['windsurf', 'autopilot', 'plugin', 'mcp'],
          author: '',
          license: 'MIT',
          peerDependencies: {
            '@modelcontextprotocol/sdk': '^1.0.0'
          }
        };
        fs.writeFileSync(
          path.join(pluginPath, 'package.json'),
          JSON.stringify(packageJson, null, 2)
        );
        
        // Create tool templates
        const toolNames = args.tools || ['example_tool'];
        const toolTemplates = toolNames.map(name => `
  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: ${name}
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: '${name}',
    description: 'Description of what ${name} does',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Input parameter description'
        }
      },
      required: ['input']
    },
    handler: async (args) => {
      try {
        // TODO: Implement ${name} logic
        return {
          success: true,
          result: 'Tool executed successfully',
          input: args.input
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }`).join(',\n');
        
        // Create index.js
        const indexJs = `#!/usr/bin/env node
/**
 * Windsurf Autopilot Plugin: ${pluginName}
 * 
 * This plugin adds custom tools to the Windsurf Autopilot.
 */

const plugin = {
  // Plugin metadata
  name: '${pluginName}',
  version: '1.0.0',
  description: 'Custom plugin for Windsurf Autopilot',
  
  // Plugin tools
  tools: [${toolTemplates}
  ],
  
  // Called when plugin is loaded (optional)
  init: async (context) => {
    console.log(\`Plugin ${pluginName} initialized\`);
    // Access context.dataDir for persistent storage
    // Access context.config for configuration
  },
  
  // Called when plugin is unloaded (optional)
  cleanup: async () => {
    console.log(\`Plugin ${pluginName} cleanup\`);
  },
  
  // Get tool definitions for registration
  getToolDefinitions: function() {
    return this.tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));
  },
  
  // Get handler for a tool
  getHandler: function(toolName) {
    const tool = this.tools.find(t => t.name === toolName);
    return tool ? tool.handler : null;
  }
};

module.exports = plugin;
`;
        fs.writeFileSync(path.join(pluginPath, 'index.js'), indexJs);
        
        // Create README
        const readme = `# Autopilot Plugin: ${pluginName}

## Description

Custom plugin for Windsurf Autopilot.

## Installation

\`\`\`bash
# Install from local path
autopilot install_plugin --source "${pluginPath}"
\`\`\`

## Tools

${toolNames.map(t => `- \`${t}\`: Description`).join('\n')}

## Development

1. Edit \`index.js\` to implement your tools
2. Test locally with \`node index.js\`
3. Install to autopilot

## License

MIT
`;
        fs.writeFileSync(path.join(pluginPath, 'README.md'), readme);
        
        return {
          success: true,
          pluginName,
          pluginPath,
          files: ['package.json', 'index.js', 'README.md'],
          tools: toolNames,
          message: `Plugin template created at ${pluginPath}`,
          nextSteps: [
            'Edit index.js to implement your tools',
            `Run: install_plugin with source: "${pluginPath}"`
          ]
        };
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Get all tool definitions for registration
  getToolDefinitions: function() {
    return [
      { name: this.install_plugin.name, description: this.install_plugin.description, inputSchema: this.install_plugin.inputSchema },
      { name: this.list_plugins.name, description: this.list_plugins.description, inputSchema: this.list_plugins.inputSchema },
      { name: this.uninstall_plugin.name, description: this.uninstall_plugin.description, inputSchema: this.uninstall_plugin.inputSchema },
      { name: this.create_plugin.name, description: this.create_plugin.description, inputSchema: this.create_plugin.inputSchema }
    ];
  },

  // Get handler for a tool
  getHandler: function(toolName) {
    const tool = this[toolName];
    return tool ? tool.handler : null;
  },

  // Get all loaded plugins
  getLoadedPlugins: function() {
    return loadedPlugins;
  },

  // Get all plugin tools for registration with main server
  getAllPluginTools: function() {
    const allTools = [];
    for (const [name, plugin] of loadedPlugins) {
      if (plugin.tools) {
        for (const tool of plugin.tools) {
          allTools.push({
            ...tool,
            plugin: name
          });
        }
      }
    }
    return allTools;
  },

  // Load all installed plugins
  loadAllPlugins: async function() {
    const loaded = [];
    const failed = [];
    
    for (const [name, info] of pluginRegistry) {
      if (fs.existsSync(info.path)) {
        try {
          const plugin = loadPlugin(info.path);
          loaded.push(name);
        } catch (e) {
          failed.push({ name, error: e.message });
        }
      }
    }
    
    return { loaded, failed };
  }
};

/**
 * Validate plugin structure
 */
function validatePlugin(pluginPath) {
  // Check for index.js or package.json main
  let mainFile = path.join(pluginPath, 'index.js');
  
  if (!fs.existsSync(mainFile)) {
    const pkgPath = path.join(pluginPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.main) {
          mainFile = path.join(pluginPath, pkg.main);
        }
      } catch (e) {}
    }
  }
  
  if (!fs.existsSync(mainFile)) {
    return { valid: false, error: 'No index.js or main file found' };
  }
  
  // Try to load and check exports
  try {
    const plugin = require(mainFile);
    
    if (!plugin.name) {
      return { valid: false, error: 'Plugin must export a name' };
    }
    
    if (!plugin.tools || !Array.isArray(plugin.tools)) {
      return { valid: false, error: 'Plugin must export a tools array' };
    }
    
    // Validate each tool
    for (const tool of plugin.tools) {
      if (!tool.name || !tool.handler) {
        return { valid: false, error: `Tool missing name or handler: ${tool.name || 'unknown'}` };
      }
    }
    
    return { valid: true };
    
  } catch (e) {
    return { valid: false, error: `Failed to load plugin: ${e.message}` };
  }
}

/**
 * Load a plugin
 */
function loadPlugin(pluginPath) {
  let mainFile = path.join(pluginPath, 'index.js');
  
  const pkgPath = path.join(pluginPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.main) {
        mainFile = path.join(pluginPath, pkg.main);
      }
    } catch (e) {}
  }
  
  // Clear require cache
  delete require.cache[require.resolve(mainFile)];
  
  const plugin = require(mainFile);
  
  // Call init if exists
  if (plugin.init) {
    plugin.init({
      dataDir: path.join(PLUGIN_DIR, plugin.name, 'data'),
      config: {}
    });
  }
  
  loadedPlugins.set(plugin.name, plugin);
  return plugin;
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = pluginTools;
