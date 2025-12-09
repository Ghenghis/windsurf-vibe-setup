/**
 * Agent State Manager - v5.0
 * Provides persistent state management for all agents
 * Enables checkpoint/restore, crash recovery, and session persistence
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class AgentStateManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.stateDir = options.stateDir || path.join(process.cwd(), 'state');
    this.checkpointInterval = options.checkpointInterval || 300000; // 5 minutes
    this.maxCheckpoints = options.maxCheckpoints || 10;
    this.autoRecover = options.autoRecover !== false;

    this.states = new Map();
    this.checkpoints = [];
    this.activeAgents = new Map();
    this.isInitialized = false;

    // Auto-checkpoint timer
    this.checkpointTimer = null;
  }

  /**
   * Initialize the state manager
   */
  async initialize() {
    try {
      // Create state directory if it doesn't exist
      await fs.mkdir(this.stateDir, { recursive: true });
      await fs.mkdir(path.join(this.stateDir, 'checkpoints'), { recursive: true });
      await fs.mkdir(path.join(this.stateDir, 'agents'), { recursive: true });

      // Load existing checkpoints
      await this.loadCheckpoints();

      // Start auto-checkpoint timer
      this.startAutoCheckpoint();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Agent State Manager initialized');
      console.log(`   - State directory: ${this.stateDir}`);
      console.log(`   - Checkpoints loaded: ${this.checkpoints.length}`);
    } catch (error) {
      console.error('❌ Failed to initialize Agent State Manager:', error);
      throw error;
    }
  }

  /**
   * Save agent state
   */
  async saveAgentState(agentId, state) {
    try {
      const stateData = {
        agentId,
        state,
        timestamp: Date.now(),
        version: '5.0',
        metadata: {
          tasksCompleted: state.tasksCompleted || 0,
          lastActivity: state.lastActivity || null,
          specialization: state.specialization || 'general',
          performance: state.performance || {},
        },
      };

      // Store in memory
      this.states.set(agentId, stateData);

      // Persist to disk
      const statePath = path.join(this.stateDir, 'agents', `${agentId}.json`);
      await fs.writeFile(statePath, JSON.stringify(stateData, null, 2));

      this.emit('stateSaved', { agentId, timestamp: stateData.timestamp });

      return stateData;
    } catch (error) {
      console.error(`❌ Failed to save state for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Load agent state
   */
  async loadAgentState(agentId) {
    try {
      // Check memory first
      if (this.states.has(agentId)) {
        return this.states.get(agentId);
      }

      // Load from disk
      const statePath = path.join(this.stateDir, 'agents', `${agentId}.json`);

      try {
        const data = await fs.readFile(statePath, 'utf8');
        const stateData = JSON.parse(data);

        // Cache in memory
        this.states.set(agentId, stateData);

        return stateData;
      } catch (error) {
        // No existing state, return default
        return {
          agentId,
          state: {},
          timestamp: Date.now(),
          version: '5.0',
          metadata: {
            tasksCompleted: 0,
            lastActivity: null,
            specialization: 'general',
            performance: {},
          },
        };
      }
    } catch (error) {
      console.error(`❌ Failed to load state for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Create a checkpoint of all agent states
   */
  async createCheckpoint(metadata = {}) {
    try {
      const checkpointId = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();

      const checkpoint = {
        id: checkpointId,
        timestamp,
        metadata: {
          ...metadata,
          agentCount: this.states.size,
          version: '5.0',
        },
        states: {},
      };

      // Capture all agent states
      for (const [agentId, stateData] of this.states) {
        checkpoint.states[agentId] = { ...stateData };
      }

      // Save checkpoint to disk
      const checkpointPath = path.join(
        this.stateDir,
        'checkpoints',
        `checkpoint-${timestamp}-${checkpointId}.json`
      );

      await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));

      // Add to checkpoint list
      this.checkpoints.push({
        id: checkpointId,
        timestamp,
        path: checkpointPath,
        metadata: checkpoint.metadata,
      });

      // Limit checkpoint count
      await this.pruneCheckpoints();

      this.emit('checkpointCreated', { id: checkpointId, timestamp });

      console.log(`✅ Checkpoint created: ${checkpointId}`);

      return checkpoint;
    } catch (error) {
      console.error('❌ Failed to create checkpoint:', error);
      throw error;
    }
  }

  /**
   * Restore from checkpoint
   */
  async restoreFromCheckpoint(checkpointId) {
    try {
      // Find checkpoint
      const checkpointInfo = this.checkpoints.find(cp => cp.id === checkpointId);

      if (!checkpointInfo) {
        // Try to find by loading from disk
        const checkpointFiles = await fs.readdir(path.join(this.stateDir, 'checkpoints'));
        const checkpointFile = checkpointFiles.find(f => f.includes(checkpointId));

        if (!checkpointFile) {
          throw new Error(`Checkpoint not found: ${checkpointId}`);
        }

        checkpointInfo.path = path.join(this.stateDir, 'checkpoints', checkpointFile);
      }

      // Load checkpoint data
      const data = await fs.readFile(checkpointInfo.path, 'utf8');
      const checkpoint = JSON.parse(data);

      // Restore all agent states
      this.states.clear();

      for (const [agentId, stateData] of Object.entries(checkpoint.states)) {
        this.states.set(agentId, stateData);

        // Also save to individual files
        await this.saveAgentState(agentId, stateData.state);
      }

      this.emit('checkpointRestored', {
        id: checkpointId,
        agentCount: Object.keys(checkpoint.states).length,
      });

      console.log(`✅ Restored from checkpoint: ${checkpointId}`);
      console.log(`   - Agents restored: ${Object.keys(checkpoint.states).length}`);

      return checkpoint;
    } catch (error) {
      console.error(`❌ Failed to restore from checkpoint ${checkpointId}:`, error);
      throw error;
    }
  }

  /**
   * Get last checkpoint
   */
  async getLastCheckpoint() {
    if (this.checkpoints.length === 0) {
      return null;
    }

    // Sort by timestamp descending
    const sorted = [...this.checkpoints].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0];
  }

  /**
   * Auto-recovery from last checkpoint
   */
  async autoRecover() {
    try {
      const lastCheckpoint = await this.getLastCheckpoint();

      if (!lastCheckpoint) {
        console.log('ℹ️ No checkpoints found for recovery');
        return null;
      }

      console.log(`🔄 Auto-recovering from checkpoint: ${lastCheckpoint.id}`);
      return await this.restoreFromCheckpoint(lastCheckpoint.id);
    } catch (error) {
      console.error('❌ Auto-recovery failed:', error);
      throw error;
    }
  }

  /**
   * Load existing checkpoints
   */
  async loadCheckpoints() {
    try {
      const checkpointDir = path.join(this.stateDir, 'checkpoints');
      const files = await fs.readdir(checkpointDir);

      for (const file of files) {
        if (file.startsWith('checkpoint-') && file.endsWith('.json')) {
          const filePath = path.join(checkpointDir, file);

          try {
            const data = await fs.readFile(filePath, 'utf8');
            const checkpoint = JSON.parse(data);

            this.checkpoints.push({
              id: checkpoint.id,
              timestamp: checkpoint.timestamp,
              path: filePath,
              metadata: checkpoint.metadata,
            });
          } catch (error) {
            console.warn(`⚠️ Failed to load checkpoint ${file}:`, error.message);
          }
        }
      }

      // Sort by timestamp
      this.checkpoints.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      // Directory might not exist yet
      if (error.code !== 'ENOENT') {
        console.error('❌ Failed to load checkpoints:', error);
      }
    }
  }

  /**
   * Prune old checkpoints
   */
  async pruneCheckpoints() {
    try {
      if (this.checkpoints.length <= this.maxCheckpoints) {
        return;
      }

      // Sort by timestamp ascending
      this.checkpoints.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest checkpoints
      while (this.checkpoints.length > this.maxCheckpoints) {
        const oldest = this.checkpoints.shift();

        try {
          await fs.unlink(oldest.path);
          console.log(`🗑️ Pruned old checkpoint: ${oldest.id}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete checkpoint file:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Failed to prune checkpoints:', error);
    }
  }

  /**
   * Start auto-checkpoint timer
   */
  startAutoCheckpoint() {
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
    }

    this.checkpointTimer = setInterval(async () => {
      try {
        await this.createCheckpoint({ auto: true });
      } catch (error) {
        console.error('❌ Auto-checkpoint failed:', error);
      }
    }, this.checkpointInterval);

    console.log(`⏰ Auto-checkpoint enabled (every ${this.checkpointInterval / 1000}s)`);
  }

  /**
   * Stop auto-checkpoint timer
   */
  stopAutoCheckpoint() {
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
      this.checkpointTimer = null;
      console.log('⏰ Auto-checkpoint disabled');
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      stateDir: this.stateDir,
      agentStates: this.states.size,
      checkpoints: this.checkpoints.length,
      oldestCheckpoint: this.checkpoints[0]?.timestamp || null,
      newestCheckpoint: this.checkpoints[this.checkpoints.length - 1]?.timestamp || null,
      autoCheckpoint: this.checkpointTimer !== null,
      autoRecover: this.autoRecover,
    };
  }

  /**
   * Clean shutdown
   */
  async shutdown() {
    try {
      // Create final checkpoint
      await this.createCheckpoint({ reason: 'shutdown' });

      // Stop auto-checkpoint
      this.stopAutoCheckpoint();

      // Clear memory
      this.states.clear();
      this.activeAgents.clear();

      this.emit('shutdown');
      console.log('✅ Agent State Manager shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

module.exports = AgentStateManager;
