/**
 * Security Auditing System - v6.0
 * Comprehensive security monitoring, threat detection, and compliance auditing
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class SecurityAuditing extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      auditDir: options.auditDir || path.join(process.cwd(), 'vibe-data', 'security'),
      auditLevel: options.auditLevel || 'medium', // low, medium, high
      retentionDays: options.retentionDays || 90,
      enableRealTimeScanning: options.enableRealTimeScanning !== false,
    };

    // Security events and threats
    this.securityEvents = [];
    this.threats = new Map();
    this.vulnerabilities = new Map();

    // Access control audit
    this.accessLog = [];
    this.permissions = new Map();
    this.roleAssignments = new Map();

    // Compliance tracking
    this.complianceChecks = new Map();
    this.violations = [];

    // Security patterns
    this.suspiciousPatterns = new Map();
    this.whitelistedActions = new Set();
    this.blacklistedActions = new Set();

    // Statistics
    this.stats = {
      totalEvents: 0,
      threats: 0,
      violations: 0,
      blockedActions: 0,
      falsePositives: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('🔐 Initializing Security Auditing...');

    await fs.mkdir(this.config.auditDir, { recursive: true });
    await fs.mkdir(path.join(this.config.auditDir, 'events'), { recursive: true });
    await fs.mkdir(path.join(this.config.auditDir, 'threats'), { recursive: true });
    await fs.mkdir(path.join(this.config.auditDir, 'compliance'), { recursive: true });
    await fs.mkdir(path.join(this.config.auditDir, 'reports'), { recursive: true });

    // Load security patterns
    await this.loadSecurityPatterns();

    // Setup compliance checks
    this.setupComplianceChecks();

    // Start monitoring
    if (this.config.enableRealTimeScanning) {
      this.startMonitoring();
    }

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Security Auditing initialized');
  }

  /**
   * Audit security event
   */
  async auditEvent(event) {
    const auditEntry = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      type: event.type,
      severity: event.severity || 'info',
      source: event.source,
      action: event.action,
      user: event.user,
      resource: event.resource,
      outcome: event.outcome || 'success',
      metadata: event.metadata || {},
      threats: [],
    };

    // Check for threats
    const threats = await this.detectThreats(auditEntry);
    if (threats.length > 0) {
      auditEntry.threats = threats;
      auditEntry.severity = 'high';
      this.stats.threats += threats.length;

      // Handle threats
      await this.handleThreats(threats, auditEntry);
    }

    // Check compliance
    const violations = await this.checkCompliance(auditEntry);
    if (violations.length > 0) {
      auditEntry.violations = violations;
      this.violations.push(...violations);
      this.stats.violations += violations.length;
    }

    // Store event
    this.securityEvents.push(auditEntry);
    this.stats.totalEvents++;

    // Limit history
    if (this.securityEvents.length > 10000) {
      this.securityEvents.shift();
    }

    // Save event
    await this.saveEvent(auditEntry);

    this.emit('securityEvent', auditEntry);

    return auditEntry;
  }

  /**
   * Detect threats
   */
  async detectThreats(event) {
    const threats = [];

    // Check blacklist
    if (this.blacklistedActions.has(event.action)) {
      threats.push({
        type: 'blacklisted-action',
        severity: 'critical',
        action: event.action,
      });
    }

    // Check suspicious patterns
    for (const [patternId, pattern] of this.suspiciousPatterns) {
      if (this.matchesPattern(event, pattern)) {
        threats.push({
          type: 'suspicious-pattern',
          severity: pattern.severity,
          pattern: pattern.name,
          confidence: pattern.confidence,
        });
      }
    }

    // Check for privilege escalation
    if (event.type === 'permission-change' && event.action === 'elevate') {
      threats.push({
        type: 'privilege-escalation',
        severity: 'high',
        user: event.user,
      });
    }

    // Check for data exfiltration
    if (event.action === 'export' && event.metadata?.size > 100000000) {
      // 100MB
      threats.push({
        type: 'potential-data-exfiltration',
        severity: 'medium',
        size: event.metadata.size,
      });
    }

    // Check failed authentication attempts
    if (event.type === 'authentication' && event.outcome === 'failure') {
      const failureKey = `auth-fail:${event.user}`;
      const failures = this.getRecentFailures(failureKey);

      if (failures > 5) {
        threats.push({
          type: 'brute-force-attempt',
          severity: 'high',
          attempts: failures,
        });
      }
    }

    return threats;
  }

  matchesPattern(event, pattern) {
    for (const condition of pattern.conditions) {
      const eventValue = event[condition.field];

      switch (condition.operator) {
        case 'equals':
          if (eventValue !== condition.value) return false;
          break;
        case 'contains':
          if (!eventValue?.includes?.(condition.value)) return false;
          break;
        case 'regex':
          if (!new RegExp(condition.value).test(eventValue)) return false;
          break;
      }
    }

    return true;
  }

  getRecentFailures(key) {
    const recent = this.securityEvents
      .filter(e => e.timestamp > Date.now() - 300000) // Last 5 minutes
      .filter(e => e.type === 'authentication' && e.outcome === 'failure')
      .filter(e => e.user === key.split(':')[1]);

    return recent.length;
  }

  /**
   * Handle detected threats
   */
  async handleThreats(threats, event) {
    for (const threat of threats) {
      // Store threat
      this.threats.set(threat.id || crypto.randomBytes(8).toString('hex'), {
        ...threat,
        eventId: event.id,
        timestamp: Date.now(),
        handled: false,
      });

      // Take action based on severity
      if (threat.severity === 'critical') {
        await this.blockAction(event);
        this.stats.blockedActions++;

        // Alert
        this.emit('criticalThreat', threat);
      }
    }
  }

  async blockAction(event) {
    // In production, this would integrate with actual security systems
    console.error(`🚫 BLOCKED: ${event.action} by ${event.user}`);

    // Log blocked action
    await this.auditEvent({
      type: 'security-action',
      action: 'block',
      target: event.id,
      reason: 'threat-detected',
    });
  }

  /**
   * Compliance checking
   */
  async checkCompliance(event) {
    const violations = [];

    for (const [checkId, check] of this.complianceChecks) {
      if (!check.enabled) continue;

      const result = await check.validate(event);
      if (!result.compliant) {
        violations.push({
          id: crypto.randomBytes(8).toString('hex'),
          checkId,
          checkName: check.name,
          standard: check.standard,
          severity: check.severity,
          message: result.message,
          eventId: event.id,
        });
      }
    }

    return violations;
  }

  setupComplianceChecks() {
    // Data retention compliance
    this.complianceChecks.set('data-retention', {
      name: 'Data Retention Policy',
      standard: 'GDPR',
      severity: 'medium',
      enabled: true,
      validate: event => {
        if (event.type === 'data-deletion') {
          const age = Date.now() - event.metadata?.dataAge;
          const maxAge = this.config.retentionDays * 86400000;

          return {
            compliant: age <= maxAge,
            message: age > maxAge ? 'Data deleted after retention period' : null,
          };
        }
        return { compliant: true };
      },
    });

    // Access control compliance
    this.complianceChecks.set('access-control', {
      name: 'Access Control Policy',
      standard: 'SOC2',
      severity: 'high',
      enabled: true,
      validate: event => {
        if (event.type === 'access') {
          const hasPermission = this.checkPermission(event.user, event.resource, event.action);

          return {
            compliant: hasPermission,
            message: !hasPermission ? 'Unauthorized access attempt' : null,
          };
        }
        return { compliant: true };
      },
    });

    // Audit logging compliance
    this.complianceChecks.set('audit-logging', {
      name: 'Audit Logging Requirements',
      standard: 'ISO27001',
      severity: 'low',
      enabled: true,
      validate: event => {
        const requiredFields = ['timestamp', 'user', 'action', 'resource'];
        const hasAllFields = requiredFields.every(field => event[field] !== undefined);

        return {
          compliant: hasAllFields,
          message: !hasAllFields ? 'Missing required audit fields' : null,
        };
      },
    });
  }

  /**
   * Access control
   */
  checkPermission(user, resource, action) {
    const userPermissions = this.permissions.get(user) || new Set();
    const requiredPermission = `${resource}:${action}`;

    return (
      userPermissions.has(requiredPermission) ||
      userPermissions.has(`${resource}:*`) ||
      userPermissions.has('*:*')
    );
  }

  async grantPermission(user, permission) {
    if (!this.permissions.has(user)) {
      this.permissions.set(user, new Set());
    }

    this.permissions.get(user).add(permission);

    await this.auditEvent({
      type: 'permission-change',
      action: 'grant',
      user: 'system',
      target: user,
      permission,
    });
  }

  async revokePermission(user, permission) {
    if (this.permissions.has(user)) {
      this.permissions.get(user).delete(permission);
    }

    await this.auditEvent({
      type: 'permission-change',
      action: 'revoke',
      user: 'system',
      target: user,
      permission,
    });
  }

  /**
   * Vulnerability scanning
   */
  async scanForVulnerabilities() {
    const vulnerabilities = [];

    // Check for weak configurations
    if (this.config.auditLevel === 'low') {
      vulnerabilities.push({
        type: 'weak-audit-level',
        severity: 'low',
        message: 'Audit level set to low, may miss security events',
      });
    }

    // Check for missing security patterns
    if (this.suspiciousPatterns.size === 0) {
      vulnerabilities.push({
        type: 'no-security-patterns',
        severity: 'medium',
        message: 'No suspicious patterns configured',
      });
    }

    // Check for stale permissions
    for (const [user, perms] of this.permissions) {
      const lastActivity = this.getLastActivity(user);
      if (Date.now() - lastActivity > 30 * 86400000) {
        // 30 days
        vulnerabilities.push({
          type: 'stale-permissions',
          severity: 'low',
          user,
          message: 'User has permissions but no recent activity',
        });
      }
    }

    return vulnerabilities;
  }

  getLastActivity(user) {
    const userEvents = this.securityEvents
      .filter(e => e.user === user)
      .sort((a, b) => b.timestamp - a.timestamp);

    return userEvents.length > 0 ? userEvents[0].timestamp : 0;
  }

  /**
   * Generate security report
   */
  async generateSecurityReport() {
    const report = {
      generated: Date.now(),
      period: {
        start: Date.now() - 7 * 86400000, // Last 7 days
        end: Date.now(),
      },
      summary: {
        totalEvents: this.stats.totalEvents,
        threats: this.stats.threats,
        violations: this.stats.violations,
        blockedActions: this.stats.blockedActions,
      },
      topThreats: this.getTopThreats(),
      complianceStatus: this.getComplianceStatus(),
      vulnerabilities: await this.scanForVulnerabilities(),
      recommendations: this.generateRecommendations(),
    };

    await this.saveReport(report);

    return report;
  }

  getTopThreats() {
    const threatCounts = {};

    for (const threat of this.threats.values()) {
      threatCounts[threat.type] = (threatCounts[threat.type] || 0) + 1;
    }

    return Object.entries(threatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
  }

  getComplianceStatus() {
    const status = {};

    for (const [checkId, check] of this.complianceChecks) {
      const violations = this.violations.filter(v => v.checkId === checkId);

      status[check.standard] = {
        compliant: violations.length === 0,
        violations: violations.length,
        lastCheck: Date.now(),
      };
    }

    return status;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.stats.threats > 100) {
      recommendations.push({
        priority: 'high',
        message: 'High number of threats detected. Review security patterns.',
      });
    }

    if (this.stats.violations > 50) {
      recommendations.push({
        priority: 'medium',
        message: 'Multiple compliance violations. Review policies.',
      });
    }

    return recommendations;
  }

  /**
   * Monitoring
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.performSecurityCheck();
    }, 60000); // Every minute
  }

  async performSecurityCheck() {
    // Check for anomalies
    const recentEvents = this.securityEvents.filter(e => e.timestamp > Date.now() - 60000);

    // Check event rate
    if (recentEvents.length > 100) {
      this.emit('highEventRate', {
        count: recentEvents.length,
        message: 'Unusually high security event rate',
      });
    }
  }

  /**
   * Storage
   */
  async saveEvent(event) {
    const filepath = path.join(this.config.auditDir, 'events', `${event.id}.json`);
    await fs.writeFile(filepath, JSON.stringify(event, null, 2));
  }

  async saveReport(report) {
    const filepath = path.join(this.config.auditDir, 'reports', `report-${Date.now()}.json`);
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
  }

  async loadSecurityPatterns() {
    // Load default suspicious patterns
    this.suspiciousPatterns.set('rapid-access', {
      name: 'Rapid Access Pattern',
      severity: 'medium',
      confidence: 0.7,
      conditions: [{ field: 'type', operator: 'equals', value: 'access' }],
    });

    this.suspiciousPatterns.set('privilege-abuse', {
      name: 'Privilege Abuse',
      severity: 'high',
      confidence: 0.8,
      conditions: [{ field: 'action', operator: 'contains', value: 'admin' }],
    });
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      monitoring: !!this.monitoringInterval,
      events: this.securityEvents.length,
      threats: this.threats.size,
      violations: this.violations.length,
      permissions: this.permissions.size,
      complianceChecks: this.complianceChecks.size,
      statistics: this.stats,
    };
  }

  async shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Generate final report
    await this.generateSecurityReport();

    // Save statistics
    const statsPath = path.join(this.config.auditDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    this.emit('shutdown');
    console.log('✅ Security Auditing shutdown complete');
    console.log(`   Total events: ${this.stats.totalEvents}`);
    console.log(`   Threats detected: ${this.stats.threats}`);
  }
}

module.exports = SecurityAuditing;
