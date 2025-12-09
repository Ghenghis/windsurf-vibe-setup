/**
 * Anthropic Harness Integration
 * Main entry point for long-running agent harness
 */

const {
  harness,
  startHarness,
  stopHarness,
  getHarnessStatus,
  toggleHarness,
} = require('./controller');
const { harnessTools, harnessHandlers, registerHarnessTools } = require('./tools');
const { integrateHiveMind } = require('./hive-mind-adapter');
const { integrateOpenInterpreter } = require('./open-interpreter-adapter');

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

let isInitialized = false;

async function initializeHarness(config = {}) {
  if (isInitialized) {
    console.log('⚠️ Harness already initialized');
    return;
  }

  console.log('🎯 Initializing Anthropic Harness System...');
  console.log('💰 Using Claude SUBSCRIPTION ONLY - NO API KEYS ALLOWED!');

  // BLOCK any API key configuration
  if (config.apiKey || config.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
    throw new Error('❌ API KEYS NOT ALLOWED! Use Claude subscription only ($20/month)');
  }

  // Configure harness
  if (config) {
    Object.assign(harness.config, config);
  }

  // Setup Claude subscription
  const { setupClaudeSubscription, getSubscriptionStatus } = require('./claude-subscription');
  const status = getSubscriptionStatus();

  if (!status.hasToken) {
    console.log('📝 Setting up Claude subscription token...');
    await setupClaudeSubscription();
  }

  // Integrate with Hive Mind
  try {
    await integrateHiveMind(harness);
    console.log('✅ Hive Mind integrated');
  } catch (error) {
    console.error('⚠️ Hive Mind integration failed:', error.message);
  }

  // Integrate with Open Interpreter
  try {
    await integrateOpenInterpreter(harness);
    console.log('✅ Open Interpreter integrated');
  } catch (error) {
    console.error('⚠️ Open Interpreter integration failed:', error.message);
  }

  // Set up event listeners for monitoring
  setupEventListeners();

  isInitialized = true;

  console.log('✅ Anthropic Harness initialized');
  console.log(`   Enabled: ${harness.config.enabled}`);
  console.log(`   Max Sessions: ${harness.config.maxSessions}`);
  console.log(`   Max Runtime: ${harness.config.maxHoursRuntime} hours`);
  console.log(`   Target Pass Rate: ${harness.config.targetTestPassRate * 100}%`);

  return harness;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
  // Log major events
  harness.on('initialized', data => {
    console.log('📍 Harness initialized:', data.projectDir);
  });

  harness.on('initializerComplete', data => {
    console.log(`📝 Initializer complete: ${data.features} features generated`);
  });

  harness.on('codingSessionComplete', data => {
    console.log(
      `🤖 Session ${data.session} complete: ${data.feature} (${data.success ? '✅' : '❌'})`
    );
  });

  harness.on('checkpoint', data => {
    console.log(`💾 Checkpoint created at session ${data.session}`);
  });

  harness.on('healthCheck', data => {
    console.log(`❤️ Health check: ${data.hoursRunning}h runtime, session ${data.session}`);
  });

  harness.on('error', error => {
    console.error('❌ Harness error:', error);
  });

  harness.on('stopped', data => {
    console.log(`🛑 Harness stopped at session ${data.session}`);
    console.log(`   Features implemented: ${data.metrics.featuresImplemented}`);
    console.log(`   Pass rate: ${(data.metrics.testsPassingRate * 100).toFixed(1)}%`);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK START FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function quickStartProject(template, maxHours = 12) {
  // Ensure harness is initialized
  if (!isInitialized) {
    await initializeHarness();
  }

  // Enable harness
  toggleHarness(true);

  // Use the quick start tool
  const { handler } = harnessTools.find(t => t.name === 'harness_quick_start');

  return await handler({ template, maxHours });
}

async function startClaudeClone(maxHours = 24) {
  return quickStartProject('claude-clone', maxHours);
}

async function startSaaSDashboard(maxHours = 12) {
  return quickStartProject('saas-dashboard', maxHours);
}

// ═══════════════════════════════════════════════════════════════════════════
// MONITORING
// ═══════════════════════════════════════════════════════════════════════════

function getDetailedStatus() {
  const status = getHarnessStatus();

  if (!status.running) {
    return {
      message: 'Harness is not running',
      enabled: status.config?.enabled || false,
    };
  }

  const runtime = status.metrics.startTime
    ? ((Date.now() - new Date(status.metrics.startTime).getTime()) / 3600000).toFixed(1)
    : 0;

  const features = status.metrics.featuresImplemented || 0;
  const passRate = (status.metrics.testsPassingRate * 100).toFixed(1);

  return {
    running: true,
    session: status.session,
    runtime: `${runtime} hours`,
    progress: `${features} features implemented (${passRate}% passing)`,
    projectDir: status.projectDir,
    errors: status.metrics.errorsEncountered,
    config: {
      maxHours: status.config.maxHoursRuntime,
      targetPassRate: status.config.targetTestPassRate,
      maxSessions: status.config.maxSessions,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Core harness
  harness,
  initializeHarness,

  // Control functions
  startHarness,
  stopHarness,
  toggleHarness,
  getHarnessStatus,
  getDetailedStatus,

  // Quick starts
  quickStartProject,
  startClaudeClone,
  startSaaSDashboard,

  // Tools for MCP
  harnessTools,
  harnessHandlers,
  registerHarnessTools,

  // Event emitter for custom integrations
  harnessEvents: harness,

  // Check if ready
  isInitialized: () => isInitialized,
};
