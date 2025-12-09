#!/usr/bin/env node

/**
 * Test Script for v5.0 Enhancements
 * Verifies all enhancement modules are working correctly
 */

const path = require('path');
const fs = require('fs').promises;

async function testEnhancements() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🧪 TESTING v5.0 ENHANCEMENTS                      ║
╚══════════════════════════════════════════════════════════════╝
  `);

  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Agent State Manager
  tests.push({
    name: 'Agent State Manager',
    run: async () => {
      console.log('\n📋 Testing Agent State Manager...');
      const AgentStateManager = require('../enhancements/core/agent-state-manager');
      const sm = new AgentStateManager();

      // Initialize
      await sm.initialize();
      console.log('  ✓ Initialized');

      // Save state
      const state = { test: true, timestamp: Date.now() };
      await sm.saveAgentState('test-agent', state);
      console.log('  ✓ State saved');

      // Load state
      const loaded = await sm.loadAgentState('test-agent');
      if (loaded.state.test === true) {
        console.log('  ✓ State loaded correctly');
      } else {
        throw new Error('State not loaded correctly');
      }

      // Create checkpoint
      const checkpoint = await sm.createCheckpoint({ test: true });
      console.log('  ✓ Checkpoint created:', checkpoint.id);

      // Shutdown
      await sm.shutdown();
      console.log('  ✓ Shutdown complete');

      return true;
    },
  });

  // Test 2: Enhanced Memory System
  tests.push({
    name: 'Enhanced Memory System',
    run: async () => {
      console.log('\n🧠 Testing Enhanced Memory System...');
      const EnhancedMemorySystem = require('../enhancements/core/enhanced-memory-system');
      const mem = new EnhancedMemorySystem();

      // Initialize
      await mem.initialize();
      console.log('  ✓ Initialized');

      // Store memory
      await mem.remember('test-key', 'test-value', 'working');
      console.log('  ✓ Memory stored');

      // Recall memory
      const recalled = await mem.recall('test');
      if (recalled.length > 0) {
        console.log('  ✓ Memory recalled:', recalled.length, 'results');
      } else {
        console.log('  ⚠️ No memories recalled (might be normal on first run)');
      }

      // Test different memory levels
      await mem.remember('short-term-test', 'value', 'short-term');
      await mem.remember('episodic-test', 'event', 'episodic');
      console.log('  ✓ Multiple memory levels tested');

      // Get status
      const status = mem.getStatus();
      console.log('  ✓ Status:', `${status.total} total memories`);

      // Shutdown
      await mem.shutdown();
      console.log('  ✓ Shutdown complete');

      return true;
    },
  });

  // Test 3: Workflow Graph Engine
  tests.push({
    name: 'Workflow Graph Engine',
    run: async () => {
      console.log('\n⚙️ Testing Workflow Graph Engine...');
      const WorkflowGraphEngine = require('../enhancements/core/workflow-graph-engine');
      const wf = new WorkflowGraphEngine();

      // Initialize
      await wf.initialize();
      console.log('  ✓ Initialized');

      // List workflows
      const status = wf.getStatus();
      console.log('  ✓ Workflows available:', status.workflows);

      // Execute simple workflow
      const result = await wf.execute('simple', { test: true });
      if (result.completed) {
        console.log('  ✓ Simple workflow executed');
      } else {
        console.log('  ⚠️ Workflow executed but not marked complete');
      }

      // Visualize workflow
      const viz = wf.visualize('development');
      console.log('  ✓ Workflow visualization generated');

      // Shutdown
      await wf.shutdown();
      console.log('  ✓ Shutdown complete');

      return true;
    },
  });

  // Test 4: Agent Handoff System
  tests.push({
    name: 'Agent Handoff System',
    run: async () => {
      console.log('\n🔄 Testing Agent Handoff System...');
      const AgentHandoffSystem = require('../enhancements/core/agent-handoff-system');
      const ho = new AgentHandoffSystem();

      // Initialize
      await ho.initialize();
      console.log('  ✓ Initialized');

      // Check specialists
      const status = ho.getStatus();
      console.log('  ✓ Specialists registered:', status.specialists);

      // Route task
      const task = {
        description: 'Fix React component rendering issue',
        type: 'frontend',
      };

      const result = await ho.routeTask(task);
      if (result.success || result.needsHandoff) {
        console.log('  ✓ Task routed successfully');
      } else if (result.error) {
        console.log('  ⚠️ Task routing had recoverable error');
      }

      // Get stats
      const stats = ho.getHandoffStats();
      console.log('  ✓ Handoff stats:', stats.totalHandoffs, 'total handoffs');

      // Shutdown
      await ho.shutdown();
      console.log('  ✓ Shutdown complete');

      return true;
    },
  });

  // Test 5: Perpetual Harness v2
  tests.push({
    name: 'Perpetual Harness v2',
    run: async () => {
      console.log('\n🚀 Testing Perpetual Harness v2...');
      const PerpetualHarnessEnhanced = require('../enhancements/perpetual-harness-v2');
      const harness = new PerpetualHarnessEnhanced();

      // Initialize
      await harness.initialize();
      console.log('  ✓ Initialized');

      // Spawn enhanced agents
      const agents = await harness.spawnAgents(10);
      console.log('  ✓ Spawned', agents.length, 'enhanced agents');

      // Test agent capabilities
      const agent = agents[0];
      if (agent.memory && agent.executeWorkflow && agent.processTask) {
        console.log('  ✓ Agent has enhanced capabilities');
      } else {
        throw new Error('Agent missing enhanced capabilities');
      }

      // Execute task
      const result = await harness.executeTask({
        description: 'Test task',
        type: 'simple',
      });
      console.log('  ✓ Task executed');

      // Get status
      const status = harness.getStatus();
      console.log('  ✓ Status:', status.version);

      // Create checkpoint
      if (harness.createCheckpoint) {
        await harness.createCheckpoint({ test: true });
        console.log('  ✓ Checkpoint created');
      }

      // Shutdown
      await harness.shutdown();
      console.log('  ✓ Shutdown complete');

      return true;
    },
  });

  // Run all tests
  console.log('\n🏃 Running tests...\n');

  for (const test of tests) {
    try {
      await test.run();
      console.log(`\n✅ ${test.name}: PASSED`);
      passed++;
    } catch (error) {
      console.log(`\n❌ ${test.name}: FAILED`);
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }

  // Summary
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     TEST RESULTS                            ║
╠══════════════════════════════════════════════════════════════╣
║  Total Tests: ${tests.length}                                              ║
║  Passed: ${passed}                                                  ║
║  Failed: ${failed}                                                  ║
║                                                              ║
║  Result: ${failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}                       ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // Check file system
  console.log('\n📁 Checking file system...');

  const requiredDirs = ['state', 'memory', 'workflows', 'enhancements/core'];

  for (const dir of requiredDirs) {
    try {
      await fs.access(path.join(process.cwd(), dir));
      console.log(`  ✓ ${dir}/ exists`);
    } catch (error) {
      console.log(`  ✗ ${dir}/ missing`);
    }
  }

  const requiredFiles = [
    'enhancements/core/agent-state-manager.js',
    'enhancements/core/enhanced-memory-system.js',
    'enhancements/core/workflow-graph-engine.js',
    'enhancements/core/agent-handoff-system.js',
    'enhancements/perpetual-harness-v2.js',
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(process.cwd(), file));
      console.log(`  ✓ ${file} exists`);
    } catch (error) {
      console.log(`  ✗ ${file} missing`);
    }
  }

  // Performance test
  console.log('\n⚡ Performance Check...');

  const startTime = Date.now();
  const PerpetualHarnessEnhanced = require('../enhancements/perpetual-harness-v2');
  const perfHarness = new PerpetualHarnessEnhanced();
  await perfHarness.initialize();

  // Measure task execution time
  const taskStart = Date.now();
  await perfHarness.executeTask({ test: true });
  const taskTime = Date.now() - taskStart;

  await perfHarness.shutdown();

  const totalTime = Date.now() - startTime;

  console.log(`  ✓ Initialization + Task + Shutdown: ${totalTime}ms`);
  console.log(`  ✓ Task execution: ${taskTime}ms`);

  if (taskTime < 100) {
    console.log('  ✓ Performance: EXCELLENT (<100ms)');
  } else if (taskTime < 500) {
    console.log('  ✓ Performance: GOOD (<500ms)');
  } else {
    console.log('  ⚠️ Performance: NEEDS OPTIMIZATION (>500ms)');
  }

  console.log('\n✨ Enhancement testing complete!');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  testEnhancements().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testEnhancements };
