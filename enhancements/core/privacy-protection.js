/**
 * Privacy Protection System - v6.0
 * Data privacy, PII management, encryption, and compliance
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class PrivacyProtection extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      privacyDir: options.privacyDir || path.join(process.cwd(), 'vibe-data', 'privacy'),
      encryptionAlgorithm: options.encryptionAlgorithm || 'aes-256-gcm',
      dataRetentionDays: options.dataRetentionDays || 90,
      anonymizationLevel: options.anonymizationLevel || 'medium', // low, medium, high
      consentRequired: options.consentRequired !== false,
    };

    // PII detection and management
    this.piiPatterns = new Map();
    this.piiInventory = new Map();
    this.dataClassifications = new Map();

    // Consent management
    this.consents = new Map();
    this.consentHistory = [];

    // Encryption keys
    this.encryptionKeys = new Map();
    this.masterKey = null;

    // Data anonymization
    this.anonymizationRules = new Map();
    this.pseudonyms = new Map();

    // Privacy policies
    this.policies = new Map();
    this.dataFlows = new Map();

    // Statistics
    this.stats = {
      piiDetected: 0,
      dataEncrypted: 0,
      dataAnonymized: 0,
      consentsGranted: 0,
      consentsRevoked: 0,
      dataDeleted: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('🔒 Initializing Privacy Protection...');

    await fs.mkdir(this.config.privacyDir, { recursive: true });
    await fs.mkdir(path.join(this.config.privacyDir, 'encrypted'), { recursive: true });
    await fs.mkdir(path.join(this.config.privacyDir, 'consents'), { recursive: true });
    await fs.mkdir(path.join(this.config.privacyDir, 'policies'), { recursive: true });

    // Initialize encryption
    await this.initializeEncryption();

    // Load PII patterns
    this.loadPIIPatterns();

    // Load anonymization rules
    this.loadAnonymizationRules();

    // Start retention checker
    this.retentionInterval = setInterval(() => {
      this.checkDataRetention();
    }, 86400000); // Daily

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Privacy Protection initialized');
  }

  /**
   * Initialize encryption
   */
  async initializeEncryption() {
    // Generate master key (in production, use key management service)
    this.masterKey = crypto.randomBytes(32);

    // Store encrypted master key (simplified for demo)
    const keyPath = path.join(this.config.privacyDir, '.master.key');
    try {
      const encryptedKey = await fs.readFile(keyPath);
      // In production, decrypt with hardware security module
      this.masterKey = Buffer.from(encryptedKey);
    } catch {
      // Save new key
      await fs.writeFile(keyPath, this.masterKey);
    }
  }

  /**
   * PII Detection
   */
  detectPII(data) {
    const detected = [];
    const text = typeof data === 'string' ? data : JSON.stringify(data);

    for (const [type, pattern] of this.piiPatterns) {
      if (pattern.regex.test(text)) {
        detected.push({
          type,
          confidence: pattern.confidence,
          found: text.match(pattern.regex),
        });
      }
    }

    if (detected.length > 0) {
      this.stats.piiDetected++;
      this.emit('piiDetected', { data, detected });
    }

    return detected;
  }

  loadPIIPatterns() {
    // Email
    this.piiPatterns.set('email', {
      regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      confidence: 0.95,
    });

    // Phone numbers
    this.piiPatterns.set('phone', {
      regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      confidence: 0.8,
    });

    // Social Security Numbers
    this.piiPatterns.set('ssn', {
      regex: /\d{3}-\d{2}-\d{4}/g,
      confidence: 0.9,
    });

    // Credit card numbers
    this.piiPatterns.set('creditCard', {
      regex: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
      confidence: 0.85,
    });

    // IP addresses
    this.piiPatterns.set('ipAddress', {
      regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      confidence: 0.9,
    });
  }

  /**
   * Data encryption
   */
  async encryptData(data, classification = 'confidential') {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    // Generate data key
    const dataKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    // Encrypt data
    const cipher = crypto.createCipheriv(this.config.encryptionAlgorithm, dataKey, iv);
    const encrypted = Buffer.concat([cipher.update(dataStr, 'utf8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Encrypt data key with master key
    const keyCipher = crypto.createCipheriv(this.config.encryptionAlgorithm, this.masterKey, iv);
    const encryptedKey = Buffer.concat([keyCipher.update(dataKey), keyCipher.final()]);

    const result = {
      id: crypto.randomBytes(8).toString('hex'),
      encrypted,
      encryptedKey,
      iv,
      authTag,
      algorithm: this.config.encryptionAlgorithm,
      classification,
      timestamp: Date.now(),
    };

    this.stats.dataEncrypted++;

    return result;
  }

  async decryptData(encryptedData) {
    // Decrypt data key
    const keyDecipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      this.masterKey,
      encryptedData.iv
    );

    const dataKey = Buffer.concat([
      keyDecipher.update(encryptedData.encryptedKey),
      keyDecipher.final(),
    ]);

    // Decrypt data
    const decipher = crypto.createDecipheriv(encryptedData.algorithm, dataKey, encryptedData.iv);

    decipher.setAuthTag(encryptedData.authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedData.encrypted), decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Data anonymization
   */
  anonymizeData(data, level = null) {
    level = level || this.config.anonymizationLevel;

    let anonymized = JSON.parse(JSON.stringify(data));

    // Apply anonymization based on level
    switch (level) {
      case 'low':
        anonymized = this.maskData(anonymized);
        break;
      case 'medium':
        anonymized = this.pseudonymizeData(anonymized);
        break;
      case 'high':
        anonymized = this.generalizeData(anonymized);
        break;
    }

    this.stats.dataAnonymized++;

    return anonymized;
  }

  maskData(data) {
    if (typeof data === 'string') {
      // Mask middle portion
      const len = data.length;
      if (len > 4) {
        return data.substr(0, 2) + '*'.repeat(len - 4) + data.substr(-2);
      }
      return '*'.repeat(len);
    }

    if (typeof data === 'object') {
      for (const key in data) {
        if (this.isSensitiveField(key)) {
          data[key] = this.maskData(data[key]);
        }
      }
    }

    return data;
  }

  pseudonymizeData(data) {
    if (typeof data === 'string') {
      // Generate consistent pseudonym
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      const pseudonym = `USER_${hash.substr(0, 8)}`;
      this.pseudonyms.set(data, pseudonym);
      return pseudonym;
    }

    if (typeof data === 'object') {
      for (const key in data) {
        if (this.isSensitiveField(key)) {
          data[key] = this.pseudonymizeData(data[key]);
        }
      }
    }

    return data;
  }

  generalizeData(data) {
    if (typeof data === 'number') {
      // Round to nearest 10
      return Math.round(data / 10) * 10;
    }

    if (typeof data === 'string') {
      // Return only category
      if (this.piiPatterns.get('email').regex.test(data)) {
        return '[EMAIL]';
      }
      if (this.piiPatterns.get('phone').regex.test(data)) {
        return '[PHONE]';
      }
      return '[DATA]';
    }

    if (typeof data === 'object') {
      for (const key in data) {
        if (this.isSensitiveField(key)) {
          data[key] = this.generalizeData(data[key]);
        }
      }
    }

    return data;
  }

  isSensitiveField(fieldName) {
    const sensitiveFields = [
      'email',
      'phone',
      'ssn',
      'password',
      'creditCard',
      'name',
      'address',
      'dob',
      'ip',
      'userId',
    ];

    return sensitiveFields.some(field => fieldName.toLowerCase().includes(field.toLowerCase()));
  }

  loadAnonymizationRules() {
    // Default rules
    this.anonymizationRules.set('email', {
      method: 'pseudonymize',
      preserveFormat: true,
    });

    this.anonymizationRules.set('phone', {
      method: 'mask',
      preserveFormat: true,
    });

    this.anonymizationRules.set('ssn', {
      method: 'generalize',
      preserveFormat: false,
    });
  }

  /**
   * Consent management
   */
  async grantConsent(userId, purpose, scope = 'all') {
    const consent = {
      id: crypto.randomBytes(8).toString('hex'),
      userId,
      purpose,
      scope,
      granted: true,
      timestamp: Date.now(),
      expiresAt: Date.now() + 365 * 86400000, // 1 year
    };

    this.consents.set(`${userId}:${purpose}`, consent);
    this.consentHistory.push(consent);

    this.stats.consentsGranted++;

    await this.saveConsent(consent);

    this.emit('consentGranted', consent);

    return consent;
  }

  async revokeConsent(userId, purpose) {
    const key = `${userId}:${purpose}`;
    const consent = this.consents.get(key);

    if (consent) {
      consent.granted = false;
      consent.revokedAt = Date.now();

      this.consents.delete(key);
      this.consentHistory.push({ ...consent, action: 'revoked' });

      this.stats.consentsRevoked++;

      await this.saveConsent(consent);

      // Trigger data deletion if required
      await this.handleConsentRevocation(userId, purpose);

      this.emit('consentRevoked', consent);
    }

    return consent;
  }

  hasConsent(userId, purpose) {
    if (!this.config.consentRequired) return true;

    const consent = this.consents.get(`${userId}:${purpose}`);

    return consent && consent.granted && consent.expiresAt > Date.now();
  }

  async handleConsentRevocation(userId, purpose) {
    // Delete user data related to revoked consent
    const userDataPath = path.join(this.config.privacyDir, 'userdata', userId);

    try {
      await fs.rmdir(userDataPath, { recursive: true });
      this.stats.dataDeleted++;
    } catch (error) {
      // Directory might not exist
    }
  }

  /**
   * Data retention
   */
  async checkDataRetention() {
    const now = Date.now();
    const retentionMs = this.config.dataRetentionDays * 86400000;

    // Check PII inventory
    for (const [dataId, info] of this.piiInventory) {
      if (now - info.timestamp > retentionMs) {
        await this.deleteData(dataId);
      }
    }
  }

  async deleteData(dataId) {
    const info = this.piiInventory.get(dataId);
    if (!info) return;

    // Delete actual data
    if (info.location) {
      try {
        await fs.unlink(info.location);
      } catch (error) {
        // File might not exist
      }
    }

    // Remove from inventory
    this.piiInventory.delete(dataId);

    this.stats.dataDeleted++;

    this.emit('dataDeleted', { dataId, reason: 'retention-policy' });
  }

  /**
   * Right to be forgotten
   */
  async forgetUser(userId) {
    console.log(`🗑️ Processing right to be forgotten for user: ${userId}`);

    // Delete all user data
    const deletedItems = [];

    // Delete from PII inventory
    for (const [dataId, info] of this.piiInventory) {
      if (info.userId === userId) {
        await this.deleteData(dataId);
        deletedItems.push(dataId);
      }
    }

    // Revoke all consents
    for (const [key, consent] of this.consents) {
      if (consent.userId === userId) {
        await this.revokeConsent(userId, consent.purpose);
      }
    }

    // Remove from pseudonyms
    for (const [original, pseudonym] of this.pseudonyms) {
      if (pseudonym.includes(userId)) {
        this.pseudonyms.delete(original);
      }
    }

    this.emit('userForgotten', { userId, deletedItems: deletedItems.length });

    return {
      userId,
      deletedItems: deletedItems.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Data portability
   */
  async exportUserData(userId, format = 'json') {
    const userData = {
      userId,
      exported: Date.now(),
      consents: [],
      data: [],
    };

    // Gather consents
    for (const consent of this.consentHistory) {
      if (consent.userId === userId) {
        userData.consents.push(consent);
      }
    }

    // Gather user data
    for (const [dataId, info] of this.piiInventory) {
      if (info.userId === userId) {
        userData.data.push({
          id: dataId,
          type: info.type,
          created: info.timestamp,
        });
      }
    }

    // Format output
    if (format === 'json') {
      return JSON.stringify(userData, null, 2);
    }

    return userData;
  }

  /**
   * Privacy impact assessment
   */
  async performPrivacyAssessment() {
    const assessment = {
      timestamp: Date.now(),
      risks: [],
      recommendations: [],
    };

    // Check PII exposure
    if (this.stats.piiDetected > 100) {
      assessment.risks.push({
        level: 'high',
        type: 'pii-exposure',
        message: 'High volume of PII detected',
      });
    }

    // Check encryption usage
    if (this.stats.dataEncrypted < this.stats.piiDetected * 0.5) {
      assessment.risks.push({
        level: 'medium',
        type: 'insufficient-encryption',
        message: 'Less than 50% of PII is encrypted',
      });
    }

    // Check consent compliance
    const unconsentedData = this.piiInventory.size - this.stats.consentsGranted;
    if (unconsentedData > 0) {
      assessment.risks.push({
        level: 'high',
        type: 'consent-compliance',
        message: `${unconsentedData} data items without consent`,
      });
    }

    // Generate recommendations
    if (assessment.risks.length > 0) {
      assessment.recommendations.push('Increase encryption coverage');
      assessment.recommendations.push('Review consent collection process');
      assessment.recommendations.push('Implement stricter data classification');
    }

    return assessment;
  }

  /**
   * Storage
   */
  async saveConsent(consent) {
    const filepath = path.join(this.config.privacyDir, 'consents', `${consent.id}.json`);
    await fs.writeFile(filepath, JSON.stringify(consent, null, 2));
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      piiPatterns: this.piiPatterns.size,
      piiInventory: this.piiInventory.size,
      consents: {
        active: this.consents.size,
        granted: this.stats.consentsGranted,
        revoked: this.stats.consentsRevoked,
      },
      encryption: {
        algorithm: this.config.encryptionAlgorithm,
        dataEncrypted: this.stats.dataEncrypted,
      },
      statistics: this.stats,
    };
  }

  async shutdown() {
    if (this.retentionInterval) {
      clearInterval(this.retentionInterval);
    }

    // Perform final assessment
    const assessment = await this.performPrivacyAssessment();

    // Save assessment
    const assessmentPath = path.join(this.config.privacyDir, `assessment-${Date.now()}.json`);
    await fs.writeFile(assessmentPath, JSON.stringify(assessment, null, 2));

    // Save statistics
    const statsPath = path.join(this.config.privacyDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    this.emit('shutdown');
    console.log('✅ Privacy Protection shutdown complete');
    console.log(`   PII detected: ${this.stats.piiDetected}`);
    console.log(`   Data encrypted: ${this.stats.dataEncrypted}`);
  }
}

module.exports = PrivacyProtection;
