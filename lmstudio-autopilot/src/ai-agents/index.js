/**
 * ============================================================================
 * WINDSURF VIBE SETUP - AI AGENTS MODULE INDEX
 * ============================================================================
 * Exports all AI agent components for use in the MCP server
 * ============================================================================
 */

const { AGENT_CATEGORIES, AGENT_REGISTRY, AGENT_COUNT, getAgentsByCategory, getAgentById, getAllAgents } = require('./agent-registry');
const { MultiAgentOrchestrator, orchestrator, createOrchestrator } = require('./orchestrator');

module.exports = {
  // Registry exports
  AGENT_CATEGORIES,
  AGENT_REGISTRY,
  AGENT_COUNT,
  getAgentsByCategory,
  getAgentById,
  getAllAgents,
  
  // Orchestrator exports
  MultiAgentOrchestrator,
  orchestrator,
  createOrchestrator,
  
  // Convenience method
  initializeAgents: async (options = {}) => {
    const orch = createOrchestrator(options);
    await orch.initialize();
    return orch;
  }
};
