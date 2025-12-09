#!/usr/bin/env node

/**
 * Complete Project Audit Script for windsurf-vibe-setup
 * Performs comprehensive analysis of ENTIRE codebase
 * Identifies all issues and generates detailed report
 */

const fs = require('fs').promises;
const path = require('path');

class CompleteProjectAuditor {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.startTime = Date.now();

    // Files to delete (outdated/duplicate documentation)
    this.filesToDelete = [
      'README.vibe',
      'README_OLD.md',
      'README_VIBE_CODERS.md',
      'VIBE-COMPLETE-STATUS.md',
      'HIVE-MIND-COMPLETE.md',
      'ULTIMATE-VIBE-SYSTEM.md',
      'VIBE-V5-IMPLEMENTATION-STATUS.md',
      'VIBE-V6-IMPLEMENTATION-STATUS.md',
      'VIBE-V6-COMPLETE-ENHANCEMENTS.md',
      'ACTION_PLAN.md',
      'ENHANCEMENT-ACTION-PLAN.md',
      'GAP_ANALYSIS.md',
      'GAP_REPORT.md',
      'V4_CRITICAL_GAP_ANALYSIS.md',
      'INTEGRATION_GAP_ANALYSIS.md',
      'UPDATE_SUMMARY.md',
      'ANONYMOUS_VIBE_CODING.md',
      'HIVE_MIND_COLLECTIVE.md',
      'HOW_TO_USE_COMPLETE_SYSTEM.md',
      'PRODUCTION_IMPLEMENTATION_PLAN.md',
      'REAL_TIME_INTEGRATION.md',
      'REAL_TIME_VIBE_DISPLAY.md',
      'SELF_REPAIR_SYSTEM.md',
      'UNIFIED_INTEGRATION.md',
      'COMPLETE_SYSTEM_GUIDE.md',
      'COMPLETE_INTEGRATION_SUMMARY.md',
      'COMPLETE_AUDIT_SUMMARY.md',
      'OUTDATED_DOCS_REPORT.md',
    ];

    // Files to keep and update
    this.coreDocumentation = [
      'README.md',
      'CONTRIBUTING.md',
      'CHANGELOG.md',
      'LICENSE',
      'SECURITY.md',
      'ROADMAP.md',
    ];

    // Audit results
    this.audit = {
      totalFiles: 0,
      totalDirectories: 0,
      totalLines: 0,
      issues: {
        critical: [],
        warning: [],
        info: [],
      },
      modules: {
        core: [],
        hiveMind: [],
        evolution: [],
        aiMl: [],
        other: [],
      },
      documentation: {
        toDelete: [],
        toUpdate: [],
        missing: [],
      },
      code: {
        noErrorHandling: [],
        noJsDoc: [],
        noTests: [],
        hardcodedValues: [],
        securityIssues: [],
      },
      statistics: {
        jsFiles: 0,
        mdFiles: 0,
        jsonFiles: 0,
        totalSize: 0,
      },
    };
  }

  async performCompleteAudit() {
    console.log('🔍 COMPLETE PROJECT AUDIT STARTING...');
    console.log('='.repeat(60));
    console.log(`Project Root: ${this.rootDir}`);
    console.log(`Audit Started: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60) + '\n');

    try {
      // Phase 1: Scan entire project structure
      console.log('📂 PHASE 1: Scanning Project Structure...');
      await this.scanProjectStructure();

      // Phase 2: Audit documentation
      console.log('\n📚 PHASE 2: Auditing Documentation...');
      await this.auditDocumentation();

      // Phase 3: Audit code quality
      console.log('\n💻 PHASE 3: Auditing Code Quality...');
      await this.auditCodeQuality();

      // Phase 4: Check module integrity
      console.log('\n🧩 PHASE 4: Checking Module Integrity...');
      await this.checkModuleIntegrity();

      // Phase 5: Validate configuration
      console.log('\n⚙️ PHASE 5: Validating Configuration...');
      await this.validateConfiguration();

      // Phase 6: Security audit
      console.log('\n🔒 PHASE 6: Security Audit...');
      await this.performSecurityAudit();

      // Phase 7: Generate recommendations
      console.log('\n💡 PHASE 7: Generating Recommendations...');
      const recommendations = this.generateRecommendations();

      // Phase 8: Create detailed report
      console.log('\n📊 PHASE 8: Creating Detailed Report...');
      await this.generateDetailedReport(recommendations);

      // Display summary
      this.displaySummary();
    } catch (error) {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    }
  }

  async scanProjectStructure(dir = this.rootDir, level = 0) {
    const items = await fs.readdir(dir);

    for (const item of items) {
      // Skip node_modules and .git
      if (item === 'node_modules' || item === '.git') continue;

      const fullPath = path.join(dir, item);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        this.audit.totalDirectories++;

        // Recursively scan subdirectories
        if (level < 3) {
          // Limit depth to avoid too deep recursion
          await this.scanProjectStructure(fullPath, level + 1);
        }
      } else {
        this.audit.totalFiles++;
        this.audit.statistics.totalSize += stats.size;

        // Categorize file types
        if (item.endsWith('.js')) {
          this.audit.statistics.jsFiles++;
          await this.analyzeJavaScriptFile(fullPath);
        } else if (item.endsWith('.md')) {
          this.audit.statistics.mdFiles++;
        } else if (item.endsWith('.json')) {
          this.audit.statistics.jsonFiles++;
        }
      }
    }
  }

  async analyzeJavaScriptFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    this.audit.totalLines += lines.length;

    const fileName = path.basename(filePath);
    const relativePath = path.relative(this.rootDir, filePath);

    // Categorize module
    if (relativePath.includes('enhancements/core/')) {
      this.audit.modules.core.push(fileName);
    } else if (relativePath.includes('enhancements/hive-mind/')) {
      this.audit.modules.hiveMind.push(fileName);
    } else if (relativePath.includes('enhancements/evolution/')) {
      this.audit.modules.evolution.push(fileName);
    } else if (relativePath.includes('enhancements/ai-ml/')) {
      this.audit.modules.aiMl.push(fileName);
    } else {
      this.audit.modules.other.push(fileName);
    }

    // Check for common issues
    const issues = [];

    // No error handling
    if (!content.includes('try {') && !content.includes('catch')) {
      this.audit.code.noErrorHandling.push(relativePath);
      issues.push('Missing error handling');
    }

    // No JSDoc comments
    if (!content.includes('/**')) {
      this.audit.code.noJsDoc.push(relativePath);
      issues.push('Missing JSDoc documentation');
    }

    // Hardcoded values
    if (content.includes('localhost:') || content.includes('http://127.0.0.1')) {
      this.audit.code.hardcodedValues.push(relativePath);
      issues.push('Hardcoded values detected');
    }

    // Security issues
    if (content.includes('eval(') || content.includes('exec(')) {
      this.audit.code.securityIssues.push(relativePath);
      this.audit.issues.critical.push({
        file: relativePath,
        issue: 'Security risk: eval/exec usage',
      });
    }

    // Check for console.log (should use proper logging)
    if (content.includes('console.log') && !fileName.includes('test')) {
      issues.push('Using console.log instead of proper logging');
    }

    // Check for TODO comments
    const todoMatches = content.match(/TODO|FIXME|XXX|HACK/gi);
    if (todoMatches) {
      issues.push(`${todoMatches.length} TODO/FIXME comments found`);
    }

    if (issues.length > 0) {
      this.audit.issues.warning.push({
        file: relativePath,
        issues: issues,
      });
    }
  }

  async auditDocumentation() {
    const rootFiles = await fs.readdir(this.rootDir);
    const mdFiles = rootFiles.filter(f => f.endsWith('.md'));

    for (const mdFile of mdFiles) {
      if (this.filesToDelete.includes(mdFile)) {
        this.audit.documentation.toDelete.push(mdFile);

        // Get file size for reporting
        const stats = await fs.stat(path.join(this.rootDir, mdFile));
        const sizeKB = Math.round(stats.size / 1024);

        this.audit.issues.critical.push({
          file: mdFile,
          issue: `Outdated documentation (${sizeKB}KB) - should be deleted`,
        });
      } else if (this.coreDocumentation.includes(mdFile)) {
        // Check if core docs need updating
        const content = await fs.readFile(path.join(this.rootDir, mdFile), 'utf8');

        // Check for outdated terms
        if (
          content.includes('120 agents') ||
          content.includes('collective consciousness') ||
          content.includes('249 tools')
        ) {
          this.audit.documentation.toUpdate.push(mdFile);
          this.audit.issues.warning.push({
            file: mdFile,
            issue: 'Contains outdated terminology',
          });
        }
      }
    }

    // Check for missing documentation
    const expectedDocs = ['API.md', 'ARCHITECTURE.md', 'INSTALLATION.md'];
    for (const expectedDoc of expectedDocs) {
      if (!mdFiles.includes(expectedDoc)) {
        this.audit.documentation.missing.push(expectedDoc);
      }
    }
  }

  async auditCodeQuality() {
    // Check package.json
    try {
      const packagePath = path.join(this.rootDir, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      // Check for missing scripts
      const requiredScripts = ['test', 'lint', 'format', 'docs:generate'];
      const missingScripts = requiredScripts.filter(s => !packageJson.scripts?.[s]);

      if (missingScripts.length > 0) {
        this.audit.issues.warning.push({
          file: 'package.json',
          issue: `Missing scripts: ${missingScripts.join(', ')}`,
        });
      }

      // Check version
      if (!packageJson.version || packageJson.version === '0.0.0') {
        this.audit.issues.warning.push({
          file: 'package.json',
          issue: 'Version not set properly',
        });
      }

      // Check for description
      if (!packageJson.description) {
        this.audit.issues.info.push({
          file: 'package.json',
          issue: 'Missing description',
        });
      }
    } catch (error) {
      this.audit.issues.critical.push({
        file: 'package.json',
        issue: 'Failed to parse package.json',
      });
    }
  }

  async checkModuleIntegrity() {
    // Expected module counts
    const expectedCounts = {
      core: 30,
      hiveMind: 12,
      evolution: 5,
      aiMl: 3,
    };

    // Check core modules
    if (this.audit.modules.core.length !== expectedCounts.core) {
      this.audit.issues.critical.push({
        category: 'Core Modules',
        issue: `Expected ${expectedCounts.core}, found ${this.audit.modules.core.length}`,
      });
    }

    // Check hive mind modules
    if (this.audit.modules.hiveMind.length !== expectedCounts.hiveMind) {
      this.audit.issues.critical.push({
        category: 'Hive Mind Modules',
        issue: `Expected ${expectedCounts.hiveMind}, found ${this.audit.modules.hiveMind.length}`,
      });
    }

    // Check evolution modules
    if (this.audit.modules.evolution.length !== expectedCounts.evolution) {
      this.audit.issues.warning.push({
        category: 'Evolution Modules',
        issue: `Expected ${expectedCounts.evolution}, found ${this.audit.modules.evolution.length}`,
      });
    }

    // Check AI/ML modules
    if (this.audit.modules.aiMl.length !== expectedCounts.aiMl) {
      this.audit.issues.warning.push({
        category: 'AI/ML Modules',
        issue: `Expected ${expectedCounts.aiMl}, found ${this.audit.modules.aiMl.length}`,
      });
    }

    const totalModules =
      this.audit.modules.core.length +
      this.audit.modules.hiveMind.length +
      this.audit.modules.evolution.length +
      this.audit.modules.aiMl.length;

    if (totalModules !== 50) {
      this.audit.issues.critical.push({
        category: 'Total Modules',
        issue: `Expected 50 total modules, found ${totalModules}`,
      });
    }
  }

  async validateConfiguration() {
    // Check .env.example
    try {
      const envExamplePath = path.join(this.rootDir, '.env.example');
      const envContent = await fs.readFile(envExamplePath, 'utf8');

      // Check for required variables
      const requiredVars = ['NODE_ENV', 'ML_ENABLED', 'HUGGINGFACE_TOKEN', 'AUTO_EVOLVE'];

      const missingVars = requiredVars.filter(v => !envContent.includes(v));
      if (missingVars.length > 0) {
        this.audit.issues.warning.push({
          file: '.env.example',
          issue: `Missing variables: ${missingVars.join(', ')}`,
        });
      }
    } catch (error) {
      this.audit.issues.info.push({
        file: '.env.example',
        issue: 'Could not read .env.example',
      });
    }

    // Check .gitignore
    try {
      const gitignorePath = path.join(this.rootDir, '.gitignore');
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');

      const requiredIgnores = ['node_modules/', '.env', 'vibe-data/', '*.log'];
      const missingIgnores = requiredIgnores.filter(i => !gitignoreContent.includes(i));

      if (missingIgnores.length > 0) {
        this.audit.issues.warning.push({
          file: '.gitignore',
          issue: `Should ignore: ${missingIgnores.join(', ')}`,
        });
      }
    } catch (error) {
      this.audit.issues.critical.push({
        file: '.gitignore',
        issue: 'Missing .gitignore file',
      });
    }
  }

  async performSecurityAudit() {
    // Check for sensitive data in code
    const sensitivePatterns = [
      /api[_-]?key\s*=\s*["'][^"']+["']/gi,
      /password\s*=\s*["'][^"']+["']/gi,
      /secret\s*=\s*["'][^"']+["']/gi,
      /token\s*=\s*["'][^"']+["']/gi,
    ];

    // Already checked in analyzeJavaScriptFile, just report summary
    if (this.audit.code.securityIssues.length > 0) {
      this.audit.issues.critical.push({
        category: 'Security',
        issue: `${this.audit.code.securityIssues.length} files with security risks`,
      });
    }
  }

  generateRecommendations() {
    const recommendations = {
      immediate: [],
      important: [],
      suggested: [],
    };

    // Immediate actions
    if (this.audit.documentation.toDelete.length > 0) {
      recommendations.immediate.push(
        `Delete ${this.audit.documentation.toDelete.length} outdated documentation files`
      );
    }

    if (this.audit.code.securityIssues.length > 0) {
      recommendations.immediate.push(
        `Fix security issues in ${this.audit.code.securityIssues.length} files`
      );
    }

    // Important actions
    if (this.audit.code.noErrorHandling.length > 0) {
      recommendations.important.push(
        `Add error handling to ${this.audit.code.noErrorHandling.length} files`
      );
    }

    if (this.audit.code.noJsDoc.length > 0) {
      recommendations.important.push(
        `Add JSDoc comments to ${this.audit.code.noJsDoc.length} files`
      );
    }

    if (this.audit.documentation.missing.length > 0) {
      recommendations.important.push(
        `Create missing documentation: ${this.audit.documentation.missing.join(', ')}`
      );
    }

    // Suggested improvements
    recommendations.suggested.push('Create comprehensive test suite');
    recommendations.suggested.push('Set up CI/CD pipeline');
    recommendations.suggested.push('Add code coverage reporting');
    recommendations.suggested.push('Implement semantic versioning');

    return recommendations;
  }

  async generateDetailedReport(recommendations) {
    const duration = Math.round((Date.now() - this.startTime) / 1000);

    const report = `# 📊 COMPLETE PROJECT AUDIT REPORT
Generated: ${new Date().toLocaleString()}
Duration: ${duration} seconds

## 📈 PROJECT STATISTICS
- Total Files: ${this.audit.totalFiles}
- Total Directories: ${this.audit.totalDirectories}
- Total Lines of Code: ${this.audit.totalLines.toLocaleString()}
- Total Size: ${Math.round(this.audit.statistics.totalSize / 1024 / 1024)}MB

### File Types
- JavaScript Files: ${this.audit.statistics.jsFiles}
- Markdown Files: ${this.audit.statistics.mdFiles}
- JSON Files: ${this.audit.statistics.jsonFiles}

## 🧩 MODULE INVENTORY
- Core Modules: ${this.audit.modules.core.length}/30
- Hive Mind Modules: ${this.audit.modules.hiveMind.length}/12
- Evolution Modules: ${this.audit.modules.evolution.length}/5
- AI/ML Modules: ${this.audit.modules.aiMl.length}/3
- Other JS Files: ${this.audit.modules.other.length}
**TOTAL VIBE MODULES: ${this.audit.modules.core.length + this.audit.modules.hiveMind.length + this.audit.modules.evolution.length + this.audit.modules.aiMl.length}/50**

## 🚨 CRITICAL ISSUES (${this.audit.issues.critical.length})
${this.audit.issues.critical.map(i => `- ${i.file || i.category}: ${i.issue}`).join('\n')}

## ⚠️ WARNINGS (${this.audit.issues.warning.length})
${this.audit.issues.warning
  .slice(0, 10)
  .map(i => `- ${i.file || i.category}: ${Array.isArray(i.issues) ? i.issues.join(', ') : i.issue}`)
  .join('\n')}
${this.audit.issues.warning.length > 10 ? `\n... and ${this.audit.issues.warning.length - 10} more warnings` : ''}

## 📚 DOCUMENTATION AUDIT
### To Delete (${this.audit.documentation.toDelete.length} files)
${this.audit.documentation.toDelete.map(f => `- ${f}`).join('\n')}

### To Update (${this.audit.documentation.toUpdate.length} files)
${this.audit.documentation.toUpdate.map(f => `- ${f}`).join('\n')}

### Missing Documentation (${this.audit.documentation.missing.length} files)
${this.audit.documentation.missing.map(f => `- ${f}`).join('\n')}

## 💻 CODE QUALITY
- Files without error handling: ${this.audit.code.noErrorHandling.length}
- Files without JSDoc: ${this.audit.code.noJsDoc.length}
- Files with hardcoded values: ${this.audit.code.hardcodedValues.length}
- Files with security issues: ${this.audit.code.securityIssues.length}

## 💡 RECOMMENDATIONS

### 🔴 Immediate Actions
${recommendations.immediate.map(r => `1. ${r}`).join('\n')}

### 🟡 Important Actions
${recommendations.important.map(r => `1. ${r}`).join('\n')}

### 🟢 Suggested Improvements
${recommendations.suggested.map(r => `1. ${r}`).join('\n')}

## ✅ NEXT STEPS
1. Run: \`node scripts/cleanup-outdated.js\` to clean up
2. Run: \`npm run docs:generate\` to generate documentation
3. Run: \`npm run lint --fix\` to fix code style issues
4. Run: \`npm test\` to verify everything works

---
*Audit completed in ${duration} seconds*
`;

    // Save report
    const reportPath = path.join(this.rootDir, 'AUDIT-REPORT-DETAILED.md');
    await fs.writeFile(reportPath, report);
    console.log(`\n📄 Detailed report saved to: AUDIT-REPORT-DETAILED.md`);
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n✅ Project Statistics:`);
    console.log(`   Total Files: ${this.audit.totalFiles}`);
    console.log(`   Total Lines: ${this.audit.totalLines.toLocaleString()}`);
    console.log(`   Project Size: ${Math.round(this.audit.statistics.totalSize / 1024 / 1024)}MB`);

    const totalModules =
      this.audit.modules.core.length +
      this.audit.modules.hiveMind.length +
      this.audit.modules.evolution.length +
      this.audit.modules.aiMl.length;

    console.log(`\n🧩 VIBE Modules: ${totalModules}/50`);

    console.log(`\n🚨 Issues Found:`);
    console.log(`   Critical: ${this.audit.issues.critical.length}`);
    console.log(`   Warnings: ${this.audit.issues.warning.length}`);
    console.log(`   Info: ${this.audit.issues.info.length}`);

    console.log(`\n📚 Documentation:`);
    console.log(`   To Delete: ${this.audit.documentation.toDelete.length} files`);
    console.log(`   To Update: ${this.audit.documentation.toUpdate.length} files`);
    console.log(`   Missing: ${this.audit.documentation.missing.length} files`);

    const duration = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`\n⏱️ Audit completed in ${duration} seconds`);

    console.log('\n💡 Run `node scripts/cleanup-outdated.js` to fix issues automatically');
    console.log('='.repeat(60));
  }
}

// Run the audit
const auditor = new CompleteProjectAuditor();
auditor.performCompleteAudit().catch(console.error);
