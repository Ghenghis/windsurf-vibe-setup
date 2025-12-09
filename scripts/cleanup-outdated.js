#!/usr/bin/env node

/**
 * Cleanup Script for VIBE System
 * Removes outdated documentation and organizes the codebase
 * Ensures only accurate, current documentation remains
 */

const fs = require('fs').promises;
const path = require('path');

class OutdatedFilesCleaner {
  constructor() {
    this.rootDir = path.join(__dirname, '..');

    // Files to DELETE (outdated/misleading)
    this.filesToDelete = [
      'README.vibe', // Non-standard format
      'VIBE-COMPLETE-STATUS.md', // Outdated module count
      'HIVE-MIND-COMPLETE.md', // Missing ML modules
      'ULTIMATE-VIBE-SYSTEM.md', // Superseded by new docs
      'package-lock.json.backup', // Backup files
      'npm-debug.log', // Debug logs
    ];

    // Files to UPDATE (keep but need changes)
    this.filesToUpdate = [
      '.env.example', // Needs ML variables
      'package.json', // Needs doc scripts
      '.gitignore', // Needs ML folders
    ];

    // Folders to organize
    this.foldersToOrganize = ['enhancements', 'docs', 'scripts'];

    this.stats = {
      deleted: 0,
      updated: 0,
      organized: 0,
      errors: [],
    };
  }

  async clean() {
    console.log('🧹 Starting Cleanup of Outdated Files...\n');

    try {
      // Delete outdated files
      await this.deleteOutdatedFiles();

      // Update configuration files
      await this.updateConfigFiles();

      // Organize folder structure
      await this.organizeFolders();

      // Generate cleanup report
      this.generateReport();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  }

  async deleteOutdatedFiles() {
    console.log('🗑️ Deleting outdated files...');

    for (const file of this.filesToDelete) {
      const filePath = path.join(this.rootDir, file);

      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`   ✅ Deleted: ${file}`);
        this.stats.deleted++;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.log(`   ⚠️ Error deleting ${file}: ${error.message}`);
          this.stats.errors.push(`Failed to delete ${file}`);
        }
      }
    }

    if (this.stats.deleted === 0) {
      console.log('   No outdated files found to delete');
    }
  }

  async updateConfigFiles() {
    console.log('\n📝 Updating configuration files...');

    // Update .env.example
    await this.updateEnvExample();

    // Update .gitignore
    await this.updateGitignore();

    // Update package.json
    await this.updatePackageJson();
  }

  async updateEnvExample() {
    const envPath = path.join(this.rootDir, '.env.example');

    const newEnvContent = `# VIBE System Configuration

# ML Configuration
ML_ENABLED=true
HUGGINGFACE_TOKEN=your_token_here
HUGGINGFACE_USERNAME=your_username
AUTO_TRAIN=true
AUTO_SYNC=true
TRAINING_INTERVAL=3600000

# System Configuration
AUTO_EVOLVE=true
AUTO_ENHANCE=true
AUTO_SPAWN=true
EVOLUTION_SPEED=adaptive

# Local Model Configuration
LMSTUDIO_PATH=C:\\Users\\Admin\\.lmstudio\\models
OLLAMA_PATH=C:\\Users\\Admin\\.ollama\\models
MODEL_SIZE=7B

# Data Storage
DATA_DIR=./vibe-data
ML_DATA_DIR=./vibe-data/ml
HUGGINGFACE_DATA_DIR=./vibe-data/huggingface

# Debug
DEBUG=false
LOG_LEVEL=info
`;

    try {
      await fs.writeFile(envPath, newEnvContent);
      console.log('   ✅ Updated .env.example');
      this.stats.updated++;
    } catch (error) {
      console.log('   ⚠️ Failed to update .env.example');
      this.stats.errors.push('Failed to update .env.example');
    }
  }

  async updateGitignore() {
    const gitignorePath = path.join(this.rootDir, '.gitignore');

    const gitignoreAdditions = `
# VIBE ML Data
vibe-data/
*.db
*.sqlite
*.parquet
*.jsonl

# Model Files  
*.onnx
*.pt
*.pth
*.safetensors
*.bin

# Documentation Build
docs/build/
docs/.cache/

# Temporary Files
*.backup
*.tmp
*.log

# Environment
.env.local
.env.production
`;

    try {
      const current = await fs.readFile(gitignorePath, 'utf8').catch(() => '');

      if (!current.includes('vibe-data/')) {
        await fs.writeFile(gitignorePath, current + gitignoreAdditions);
        console.log('   ✅ Updated .gitignore');
        this.stats.updated++;
      } else {
        console.log('   ℹ️ .gitignore already up to date');
      }
    } catch (error) {
      console.log('   ⚠️ Failed to update .gitignore');
      this.stats.errors.push('Failed to update .gitignore');
    }
  }

  async updatePackageJson() {
    const packagePath = path.join(this.rootDir, 'package.json');

    try {
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));

      // Add documentation scripts
      packageJson.scripts = packageJson.scripts || {};

      const newScripts = {
        // Documentation
        'docs:generate': 'node scripts/generate-docs.js',
        'docs:validate': 'node scripts/validate-docs.js',
        'docs:clean': 'node scripts/cleanup-outdated.js',
        'docs:serve': 'npx docsify serve docs',

        // VIBE System
        'vibe:start': 'node enhancements/core/index.js',
        'vibe:ml': 'node enhancements/ai-ml/vibe-ml-core.js',
        'vibe:cloud': 'node enhancements/ai-ml/huggingface-integrator.js',
        'vibe:status': 'node scripts/system-status.js',
        'vibe:check': 'npm run docs:validate',

        // Development
        lint: 'eslint enhancements/**/*.js',
        format: 'prettier --write enhancements/**/*.js',
        test: 'jest',

        // Maintenance
        clean: 'npm run docs:clean',
        build: 'npm run docs:generate',
        postinstall: 'npm run docs:generate',
      };

      // Merge scripts
      packageJson.scripts = { ...packageJson.scripts, ...newScripts };

      // Add dependencies if missing
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.devDependencies = packageJson.devDependencies || {};

      // Add documentation dependencies
      if (!packageJson.devDependencies.docsify) {
        packageJson.devDependencies.docsify = '^4.13.0';
      }
      if (!packageJson.devDependencies.jsdoc) {
        packageJson.devDependencies.jsdoc = '^4.0.0';
      }
      if (!packageJson.devDependencies.mermaid) {
        packageJson.devDependencies.mermaid = '^10.0.0';
      }

      // Add ML dependencies
      if (!packageJson.dependencies['@xenova/transformers']) {
        packageJson.dependencies['@xenova/transformers'] = '^2.0.0';
      }
      if (!packageJson.dependencies['@huggingface/hub']) {
        packageJson.dependencies['@huggingface/hub'] = '^0.12.0';
      }

      // Update package info
      packageJson.name = 'vibe-system';
      packageJson.version = '1.0.0';
      packageJson.description = 'Self-evolving AI system with 50 modules and true machine learning';
      packageJson.author = 'Ghenghis';
      packageJson.license = 'MIT';
      packageJson.repository = {
        type: 'git',
        url: 'https://github.com/Ghenghis/windsurf-vibe-setup',
      };

      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('   ✅ Updated package.json with documentation scripts');
      this.stats.updated++;
    } catch (error) {
      console.log('   ⚠️ Failed to update package.json');
      this.stats.errors.push('Failed to update package.json');
    }
  }

  async organizeFolders() {
    console.log('\n📁 Organizing folder structure...');

    // Create necessary directories
    const requiredDirs = [
      'docs',
      'docs/modules',
      'docs/modules/core',
      'docs/modules/hive-mind',
      'docs/modules/evolution',
      'docs/modules/ai-ml',
      'docs/api',
      'docs/guides',
      'docs/diagrams',
      'scripts',
      'enhancements/core',
      'enhancements/hive-mind',
      'enhancements/evolution',
      'enhancements/ai-ml',
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.rootDir, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        this.stats.organized++;
      } catch (error) {
        // Directory exists
      }
    }

    console.log(`   ✅ Organized ${this.stats.organized} directories`);
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP REPORT');
    console.log('='.repeat(60));

    console.log('\n✅ Actions Completed:');
    console.log(`   Files Deleted: ${this.stats.deleted}`);
    console.log(`   Files Updated: ${this.stats.updated}`);
    console.log(`   Directories Organized: ${this.stats.organized}`);

    if (this.stats.errors.length > 0) {
      console.log('\n⚠️ Errors Encountered:');
      this.stats.errors.forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Run: npm install (to install new dependencies)');
    console.log('   2. Run: npm run docs:generate (to create documentation)');
    console.log('   3. Run: npm run docs:validate (to verify accuracy)');
    console.log('   4. Run: npm run vibe:start (to start the system)');

    console.log('\n' + '='.repeat(60));

    if (this.stats.errors.length === 0) {
      console.log('\n🎉 Cleanup completed successfully!');
    } else {
      console.log('\n⚠️ Cleanup completed with some warnings');
    }
  }
}

// Run the cleaner
const cleaner = new OutdatedFilesCleaner();
cleaner.clean().catch(console.error);
