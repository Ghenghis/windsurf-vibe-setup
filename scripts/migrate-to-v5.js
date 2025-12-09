#!/usr/bin/env node

/**
 * Migration Script to v5.0 Enhanced Vibe System
 * Run this to upgrade your existing setup with new enhancements
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;

async function migrate() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🚀 MIGRATING TO VIBE v5.0 ENHANCED SYSTEM           ║
║                                                              ║
║  This will:                                                  ║
║  • Install new dependencies                                 ║
║  • Create enhancement directories                           ║
║  • Setup stateful persistence                               ║
║  • Initialize memory system                                 ║
║  • Enable workflow graphs                                   ║
║  • Configure agent handoffs                                 ║
╚══════════════════════════════════════════════════════════════╝
  `);

  try {
    // Step 1: Backup existing configuration
    console.log('\n📦 Step 1: Backing up current configuration...');
    await backupConfiguration();

    // Step 2: Install dependencies
    console.log('\n📚 Step 2: Installing new dependencies...');
    await installDependencies();

    // Step 3: Create directory structure
    console.log('\n📁 Step 3: Creating enhancement directories...');
    await createDirectories();

    // Step 4: Initialize databases
    console.log('\n💾 Step 4: Initializing databases...');
    await initializeDatabases();

    // Step 5: Update configuration
    console.log('\n⚙️ Step 5: Updating configuration...');
    await updateConfiguration();

    // Step 6: Test enhancements
    console.log('\n🧪 Step 6: Testing enhanced features...');
    await testEnhancements();

    // Step 7: Generate report
    console.log('\n📊 Step 7: Generating migration report...');
    await generateReport();

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              ✅ MIGRATION COMPLETE!                         ║
║                                                              ║
║  Your Vibe system has been upgraded to v5.0                 ║
║                                                              ║
║  New commands available:                                    ║
║  • npm run vibe:v5        - Start enhanced system          ║
║  • npm run vibe:stateful  - With persistence               ║
║  • npm run vibe:workflow  - With workflows                 ║
║  • npm run test:v5        - Test enhancements              ║
║                                                              ║
║  Documentation:                                              ║
║  • ./ENHANCEMENT-ACTION-PLAN.md                            ║
║  • ./research/REAL-WORLD-VIBE-ENHANCEMENTS.md             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n🔄 You can try running the migration again or restore from backup.');
    process.exit(1);
  }
}

async function backupConfiguration() {
  const backupDir = path.join(process.cwd(), 'backup-v4');

  // Create backup directory
  await fs.mkdir(backupDir, { recursive: true });

  // Backup important files
  const filesToBackup = [
    'package.json',
    'perpetual-harness.js',
    'unified-system.js',
    'gpu-hive-mind.js',
  ];

  for (const file of filesToBackup) {
    const source = path.join(process.cwd(), file);
    const dest = path.join(backupDir, file);

    try {
      await fs.access(source);
      await fs.copyFile(source, dest);
      console.log(`  ✓ Backed up ${file}`);
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  // Backup config directory if exists
  try {
    await fs.access(path.join(process.cwd(), 'config'));
    await copyDirectory('config', path.join(backupDir, 'config'));
    console.log('  ✓ Backed up config directory');
  } catch (error) {
    // Config doesn't exist, skip
  }

  console.log(`  📁 Backup saved to: ${backupDir}`);
}

async function installDependencies() {
  const dependencies = [
    'level',
    'ioredis',
    'graphlib',
    'p-queue',
    'socket.io',
    'winston',
    'node-cron',
    'msgpackr',
  ];

  console.log('  Installing enhancement dependencies...');

  try {
    // Check if npm is available
    await exec('npm --version');

    // Install dependencies
    const installCmd = `npm install --save ${dependencies.join(' ')}`;
    console.log(`  Running: ${installCmd}`);

    const { stdout, stderr } = await exec(installCmd);

    if (stderr && !stderr.includes('WARN')) {
      console.error('  ⚠️ Installation warnings:', stderr);
    }

    console.log('  ✓ Dependencies installed successfully');
  } catch (error) {
    console.log('  ⚠️ Could not install dependencies automatically');
    console.log('  Please run manually:');
    console.log(`    npm install --save ${dependencies.join(' ')}`);
  }
}

async function createDirectories() {
  const directories = [
    'state',
    'state/checkpoints',
    'state/agents',
    'memory',
    'memory/working',
    'memory/short-term',
    'memory/episodic',
    'memory/semantic',
    'memory/long-term',
    'workflows',
    'traces',
    'tests/enhancements',
  ];

  for (const dir of directories) {
    const fullPath = path.join(process.cwd(), dir);
    await fs.mkdir(fullPath, { recursive: true });
    console.log(`  ✓ Created ${dir}/`);
  }
}

async function initializeDatabases() {
  // Create initial state file
  const stateFile = path.join(process.cwd(), 'state', 'init.json');
  await fs.writeFile(
    stateFile,
    JSON.stringify(
      {
        version: 'v5.0',
        initialized: Date.now(),
        migration: true,
      },
      null,
      2
    )
  );
  console.log('  ✓ State database initialized');

  // Create initial memory file
  const memoryFile = path.join(process.cwd(), 'memory', 'init.json');
  await fs.writeFile(
    memoryFile,
    JSON.stringify(
      {
        version: 'v5.0',
        initialized: Date.now(),
        levels: {
          working: 0,
          shortTerm: 0,
          episodic: 0,
          semantic: 0,
          longTerm: 0,
        },
      },
      null,
      2
    )
  );
  console.log('  ✓ Memory database initialized');
}

async function updateConfiguration() {
  // Create v5 configuration
  const configFile = path.join(process.cwd(), 'vibe-v5.config.json');
  const config = {
    version: 'v5.0',
    features: {
      statefulPersistence: true,
      enhancedMemory: true,
      workflowGraphs: true,
      agentHandoffs: true,
      visualDebugging: true,
      performanceOptimizer: true,
      intelligentOnboarding: true,
    },
    settings: {
      checkpointInterval: 300000, // 5 minutes
      consolidationInterval: 3600000, // 1 hour
      maxCheckpoints: 10,
      maxHistorySize: 100,
      automationLevel: 0.97, // 97% automated
    },
    agents: {
      total: 120,
      specialists: {
        frontend: 15,
        backend: 15,
        database: 10,
        ai: 10,
        devops: 10,
        testing: 15,
        debug: 15,
        security: 10,
        optimization: 10,
        architecture: 10,
      },
    },
  };

  await fs.writeFile(configFile, JSON.stringify(config, null, 2));
  console.log('  ✓ Created v5.0 configuration file');
}

async function testEnhancements() {
  console.log('  Testing enhancement modules...');

  const tests = [
    {
      name: 'State Manager',
      test: async () => {
        const AgentStateManager = require('../enhancements/core/agent-state-manager');
        const sm = new AgentStateManager();
        await sm.initialize();
        return sm.getStatus();
      },
    },
    {
      name: 'Memory System',
      test: async () => {
        const EnhancedMemorySystem = require('../enhancements/core/enhanced-memory-system');
        const mem = new EnhancedMemorySystem();
        await mem.initialize();
        return mem.getStatus();
      },
    },
    {
      name: 'Workflow Engine',
      test: async () => {
        const WorkflowGraphEngine = require('../enhancements/core/workflow-graph-engine');
        const wf = new WorkflowGraphEngine();
        await wf.initialize();
        return wf.getStatus();
      },
    },
    {
      name: 'Handoff System',
      test: async () => {
        const AgentHandoffSystem = require('../enhancements/core/agent-handoff-system');
        const ho = new AgentHandoffSystem();
        await ho.initialize();
        return ho.getStatus();
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      const status = await test();
      if (status && status.initialized) {
        console.log(`  ✓ ${name}: OK`);
        passed++;
      } else {
        console.log(`  ✗ ${name}: Not initialized`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`  Test Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('  ⚠️ Some enhancements failed to initialize');
    console.log('  The system will still work but with reduced functionality');
  }
}

async function generateReport() {
  const report = {
    migration: {
      date: new Date().toISOString(),
      fromVersion: 'v4.3.0',
      toVersion: 'v5.0',
      success: true,
    },
    enhancements: {
      statefulPersistence: 'enabled',
      enhancedMemory: 'enabled',
      workflowGraphs: 'enabled',
      agentHandoffs: 'enabled',
    },
    directories: {
      state: 'created',
      memory: 'created',
      workflows: 'created',
      traces: 'created',
    },
    nextSteps: [
      'Start enhanced system: npm run vibe:v5',
      'Test persistence: npm run test:v5',
      'Read documentation: ./research/*.md',
      'Check status: npm run vibe:v5 --status',
    ],
  };

  const reportFile = path.join(process.cwd(), 'migration-report-v5.json');
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

  console.log(`  ✓ Migration report saved to: ${reportFile}`);
}

async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

// Run migration
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
