/**
 * Intelligent Alerting System - v6.0
 * Smart notification and alert management with priority, deduplication, and routing
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class IntelligentAlerting extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      alertDir: options.alertDir || path.join(process.cwd(), 'vibe-data', 'alerts'),
      maxAlerts: options.maxAlerts || 10000,
      deduplicationWindow: options.deduplicationWindow || 300000, // 5 minutes
      escalationInterval: options.escalationInterval || 600000, // 10 minutes
      quietHours: options.quietHours || { start: 22, end: 6 },
      enableQuietHours: options.enableQuietHours || false,
    };

    // Alert management
    this.alerts = new Map();
    this.alertHistory = [];
    this.suppressedAlerts = new Map();

    // Alert rules and routing
    this.rules = new Map();
    this.channels = new Map();
    this.escalationPolicies = new Map();

    // Alert grouping and correlation
    this.alertGroups = new Map();
    this.correlations = new Map();

    // Statistics
    this.stats = {
      totalAlerts: 0,
      activeAlerts: 0,
      suppressedAlerts: 0,
      escalatedAlerts: 0,
      resolvedAlerts: 0,
      falsePositives: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('🔔 Initializing Intelligent Alerting...');

    await fs.mkdir(this.config.alertDir, { recursive: true });
    await fs.mkdir(path.join(this.config.alertDir, 'active'), { recursive: true });
    await fs.mkdir(path.join(this.config.alertDir, 'history'), { recursive: true });
    await fs.mkdir(path.join(this.config.alertDir, 'rules'), { recursive: true });

    // Load existing rules
    await this.loadRules();

    // Setup default channels
    this.setupDefaultChannels();

    // Start escalation checker
    this.escalationInterval = setInterval(() => {
      this.checkEscalations();
    }, 60000); // Every minute

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Intelligent Alerting initialized');
  }

  /**
   * Create an alert
   */
  async createAlert(data) {
    // Check deduplication
    const isDuplicate = await this.checkDuplication(data);
    if (isDuplicate) {
      this.stats.suppressedAlerts++;
      return null;
    }

    // Check quiet hours
    if (this.isQuietHours() && data.severity !== 'critical') {
      this.suppressAlert(data, 'quiet-hours');
      return null;
    }

    const alert = {
      id: crypto.randomBytes(8).toString('hex'),
      ...data,
      timestamp: Date.now(),
      status: 'active',
      acknowledgedAt: null,
      resolvedAt: null,
      escalationLevel: 0,
      notifications: [],
      correlatedAlerts: [],
    };

    // Apply rules
    await this.applyRules(alert);

    // Check grouping
    this.checkGrouping(alert);

    // Store alert
    this.alerts.set(alert.id, alert);
    this.stats.totalAlerts++;
    this.stats.activeAlerts++;

    // Send notifications
    await this.sendNotifications(alert);

    // Save alert
    await this.saveAlert(alert);

    this.emit('alertCreated', alert);

    return alert;
  }

  /**
   * Check for duplicate alerts
   */
  async checkDuplication(data) {
    const hash = this.generateAlertHash(data);
    const now = Date.now();

    // Check recent alerts
    for (const alert of this.alerts.values()) {
      if (now - alert.timestamp < this.config.deduplicationWindow) {
        const alertHash = this.generateAlertHash(alert);
        if (hash === alertHash) {
          // Update existing alert
          alert.count = (alert.count || 1) + 1;
          alert.lastOccurrence = now;
          return true;
        }
      }
    }

    return false;
  }

  generateAlertHash(data) {
    const key = `${data.source}:${data.type}:${data.message}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Apply alert rules
   */
  async applyRules(alert) {
    for (const [ruleId, rule] of this.rules) {
      if (this.matchesRule(alert, rule)) {
        // Apply actions
        if (rule.actions.setSeverity) {
          alert.severity = rule.actions.setSeverity;
        }

        if (rule.actions.addTags) {
          alert.tags = [...(alert.tags || []), ...rule.actions.addTags];
        }

        if (rule.actions.route) {
          alert.channel = rule.actions.route;
        }

        if (rule.actions.suppress) {
          this.suppressAlert(alert, 'rule');
          return false;
        }
      }
    }

    return true;
  }

  matchesRule(alert, rule) {
    // Check conditions
    for (const condition of rule.conditions) {
      const alertValue = this.getNestedValue(alert, condition.field);

      switch (condition.operator) {
        case 'equals':
          if (alertValue !== condition.value) return false;
          break;
        case 'contains':
          if (!alertValue?.includes?.(condition.value)) return false;
          break;
        case 'greater':
          if (!(alertValue > condition.value)) return false;
          break;
        case 'less':
          if (!(alertValue < condition.value)) return false;
          break;
        case 'regex':
          if (!new RegExp(condition.value).test(alertValue)) return false;
          break;
      }
    }

    return true;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Check alert grouping
   */
  checkGrouping(alert) {
    // Find related alerts
    const groupKey = `${alert.source}:${alert.type}`;

    if (!this.alertGroups.has(groupKey)) {
      this.alertGroups.set(groupKey, {
        id: crypto.randomBytes(8).toString('hex'),
        key: groupKey,
        alerts: [],
        created: Date.now(),
      });
    }

    const group = this.alertGroups.get(groupKey);
    group.alerts.push(alert.id);
    alert.groupId = group.id;

    // Check correlations
    this.findCorrelations(alert);
  }

  findCorrelations(alert) {
    const correlations = [];

    for (const [id, otherAlert] of this.alerts) {
      if (id !== alert.id && this.areCorrelated(alert, otherAlert)) {
        correlations.push(id);
      }
    }

    if (correlations.length > 0) {
      alert.correlatedAlerts = correlations;
      this.correlations.set(alert.id, correlations);
    }
  }

  areCorrelated(alert1, alert2) {
    // Check time proximity
    const timeDiff = Math.abs(alert1.timestamp - alert2.timestamp);
    if (timeDiff > 60000) return false; // More than 1 minute apart

    // Check common attributes
    if (alert1.source === alert2.source) return true;
    if (alert1.host === alert2.host) return true;
    if (alert1.service === alert2.service) return true;

    return false;
  }

  /**
   * Send notifications
   */
  async sendNotifications(alert) {
    const channel = this.channels.get(alert.channel || 'default');
    if (!channel) return;

    const notification = {
      id: crypto.randomBytes(8).toString('hex'),
      alertId: alert.id,
      channel: channel.name,
      timestamp: Date.now(),
      status: 'pending',
    };

    try {
      await channel.send(alert);
      notification.status = 'sent';
      alert.notifications.push(notification);
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
    }

    this.emit('notificationSent', notification);
  }

  /**
   * Alert actions
   */
  async acknowledgeAlert(alertId, userId = 'system') {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = userId;

    await this.saveAlert(alert);

    this.emit('alertAcknowledged', alert);

    return alert;
  }

  async resolveAlert(alertId, resolution = '') {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    alert.resolution = resolution;

    this.stats.activeAlerts--;
    this.stats.resolvedAlerts++;

    // Move to history
    this.alertHistory.push(alert);
    this.alerts.delete(alertId);

    await this.saveAlert(alert);

    this.emit('alertResolved', alert);

    return alert;
  }

  async escalateAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.escalationLevel++;
    alert.lastEscalation = Date.now();

    // Get escalation policy
    const policy =
      this.escalationPolicies.get(alert.severity) || this.escalationPolicies.get('default');

    if (policy) {
      const level = Math.min(alert.escalationLevel, policy.levels.length - 1);
      const escalation = policy.levels[level];

      // Send to escalation channel
      if (escalation.channel) {
        alert.channel = escalation.channel;
        await this.sendNotifications(alert);
      }
    }

    this.stats.escalatedAlerts++;

    this.emit('alertEscalated', alert);

    return alert;
  }

  /**
   * Suppress alert
   */
  suppressAlert(alert, reason) {
    const suppression = {
      alert,
      reason,
      timestamp: Date.now(),
    };

    this.suppressedAlerts.set(alert.id || crypto.randomBytes(8).toString('hex'), suppression);
    this.stats.suppressedAlerts++;

    this.emit('alertSuppressed', suppression);
  }

  /**
   * Check for escalations
   */
  async checkEscalations() {
    const now = Date.now();

    for (const alert of this.alerts.values()) {
      if (alert.status === 'active' && !alert.acknowledgedAt) {
        const timeSinceCreation = now - alert.timestamp;
        const timeSinceLastEscalation = now - (alert.lastEscalation || alert.timestamp);

        if (timeSinceLastEscalation >= this.config.escalationInterval) {
          await this.escalateAlert(alert.id);
        }
      }
    }
  }

  /**
   * Check quiet hours
   */
  isQuietHours() {
    if (!this.config.enableQuietHours) return false;

    const now = new Date();
    const hour = now.getHours();

    const { start, end } = this.config.quietHours;

    if (start < end) {
      return hour >= start && hour < end;
    } else {
      return hour >= start || hour < end;
    }
  }

  /**
   * Setup default channels
   */
  setupDefaultChannels() {
    // Console channel
    this.channels.set('console', {
      name: 'console',
      send: async alert => {
        console.log(`🚨 ALERT: [${alert.severity}] ${alert.message}`);
      },
    });

    // File channel
    this.channels.set('file', {
      name: 'file',
      send: async alert => {
        const logPath = path.join(this.config.alertDir, 'alert.log');
        const entry = `${new Date().toISOString()} [${alert.severity}] ${alert.message}\n`;
        await fs.appendFile(logPath, entry);
      },
    });

    // Default channel
    this.channels.set('default', this.channels.get('console'));
  }

  /**
   * Rule management
   */
  async addRule(rule) {
    const ruleId = rule.id || crypto.randomBytes(8).toString('hex');

    this.rules.set(ruleId, {
      id: ruleId,
      name: rule.name,
      conditions: rule.conditions || [],
      actions: rule.actions || {},
      enabled: rule.enabled !== false,
      created: Date.now(),
    });

    await this.saveRule(ruleId, this.rules.get(ruleId));

    return ruleId;
  }

  /**
   * Storage
   */
  async saveAlert(alert) {
    const dir = alert.status === 'resolved' ? 'history' : 'active';
    const filepath = path.join(this.config.alertDir, dir, `${alert.id}.json`);
    await fs.writeFile(filepath, JSON.stringify(alert, null, 2));
  }

  async saveRule(ruleId, rule) {
    const filepath = path.join(this.config.alertDir, 'rules', `${ruleId}.json`);
    await fs.writeFile(filepath, JSON.stringify(rule, null, 2));
  }

  async loadRules() {
    try {
      const rulesDir = path.join(this.config.alertDir, 'rules');
      const files = await fs.readdir(rulesDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(rulesDir, file), 'utf8');
          const rule = JSON.parse(content);
          this.rules.set(rule.id, rule);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      alerts: {
        active: this.alerts.size,
        history: this.alertHistory.length,
        suppressed: this.suppressedAlerts.size,
      },
      rules: this.rules.size,
      channels: this.channels.size,
      groups: this.alertGroups.size,
      statistics: this.stats,
    };
  }

  async shutdown() {
    if (this.escalationInterval) {
      clearInterval(this.escalationInterval);
    }

    // Save all active alerts
    for (const alert of this.alerts.values()) {
      await this.saveAlert(alert);
    }

    // Save statistics
    const statsPath = path.join(this.config.alertDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    this.emit('shutdown');
    console.log('✅ Intelligent Alerting shutdown complete');
    console.log(`   Total alerts: ${this.stats.totalAlerts}`);
    console.log(`   Resolved: ${this.stats.resolvedAlerts}`);
  }
}

module.exports = IntelligentAlerting;
