#!/usr/bin/env node
/**
 * Windsurf Autopilot - Package Publishing Tools v3.1
 *
 * npm, PyPI, Docker, and GitHub Packages publishing.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot')
  : path.join(process.env.HOME || '', '.windsurf-autopilot');

const publishTools = {

  // Publish to npm registry
  npm_publish: {
    name: 'npm_publish',
    description: 'Publish package to npm registry',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Package path' },
        tag: { type: 'string', description: 'npm tag (latest, beta, next)' },
        access: { type: 'string', enum: ['public', 'restricted'], description: 'Package access' },
        dryRun: { type: 'boolean', description: 'Dry run mode' },
        otp: { type: 'string', description: '2FA one-time password' },
        bump: { type: 'string', enum: ['patch', 'minor', 'major', 'prerelease'], description: 'Version bump' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const tag = args.tag || 'latest';
      const access = args.access || 'public';
      const dryRun = args.dryRun || false;
      const otp = args.otp;
      const bump = args.bump;

      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return { success: false, error: 'No package.json found' };
      }

      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Version bump if requested
      if (bump) {
        try {
          execSync(`npm version ${bump} --no-git-tag-version`, { cwd: projectPath, encoding: 'utf8' });
          const updatedPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          pkg.version = updatedPkg.version;
        } catch (error) {
          return { success: false, error: `Version bump failed: ${error.message}` };
        }
      }

      // Build command
      let cmd = 'npm publish';
      cmd += ` --tag ${tag}`;
      cmd += ` --access ${access}`;
      if (dryRun) {
        cmd += ' --dry-run';
      }
      if (otp) {
        cmd += ` --otp=${otp}`;
      }

      try {
        const output = execSync(cmd, { cwd: projectPath, encoding: 'utf8', timeout: 120000 });

        return {
          success: true,
          package: pkg.name,
          version: pkg.version,
          tag,
          access,
          dryRun,
          registry: 'https://registry.npmjs.org',
          url: `https://www.npmjs.com/package/${pkg.name}`,
          message: dryRun
            ? `Dry run completed for ${pkg.name}@${pkg.version}`
            : `Published ${pkg.name}@${pkg.version} to npm`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          hint: error.message.includes('ENEEDAUTH')
            ? 'Run: npm login'
            : error.message.includes('E403')
              ? 'Package name may be taken or you lack permissions'
              : null
        };
      }
    }
  },

  // Publish to PyPI
  pypi_publish: {
    name: 'pypi_publish',
    description: 'Publish package to PyPI',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Package path' },
        repository: { type: 'string', enum: ['pypi', 'testpypi'], description: 'Target repository' },
        username: { type: 'string', description: 'PyPI username or __token__' },
        password: { type: 'string', description: 'PyPI password or API token' },
        build: { type: 'boolean', description: 'Build before publishing' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const repository = args.repository || 'pypi';
      const username = args.username || '__token__';
      const password = args.password;
      const build = args.build !== false;

      // Check for setup.py or pyproject.toml
      const hasSetupPy = fs.existsSync(path.join(projectPath, 'setup.py'));
      const hasPyproject = fs.existsSync(path.join(projectPath, 'pyproject.toml'));

      if (!hasSetupPy && !hasPyproject) {
        return { success: false, error: 'No setup.py or pyproject.toml found' };
      }

      // Check for twine
      try {
        execSync('python -m twine --version', { encoding: 'utf8' });
      } catch {
        return {
          success: false,
          error: 'twine is not installed',
          hint: 'Run: pip install twine build'
        };
      }

      // Build if requested
      if (build) {
        try {
          // Clean old builds
          const distDir = path.join(projectPath, 'dist');
          if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true });
          }

          execSync('python -m build', { cwd: projectPath, encoding: 'utf8', timeout: 120000 });
        } catch (error) {
          return { success: false, error: `Build failed: ${error.message}` };
        }
      }

      // Check dist directory
      const distDir = path.join(projectPath, 'dist');
      if (!fs.existsSync(distDir)) {
        return { success: false, error: 'No dist directory. Run build first.' };
      }

      const distFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.whl') || f.endsWith('.tar.gz'));
      if (distFiles.length === 0) {
        return { success: false, error: 'No distribution files found in dist/' };
      }

      // Build upload command
      const repoUrl = repository === 'testpypi'
        ? 'https://test.pypi.org/legacy/'
        : 'https://upload.pypi.org/legacy/';

      let cmd = `python -m twine upload --repository-url ${repoUrl}`;
      if (username) {
        cmd += ` -u ${username}`;
      }
      if (password) {
        cmd += ` -p ${password}`;
      }
      cmd += ' dist/*';

      if (!password) {
        return {
          success: false,
          error: 'PyPI password/token required',
          hint: 'Get API token from https://pypi.org/manage/account/token/',
          command: cmd.replace(/-p\s*\S+/, '-p YOUR_TOKEN')
        };
      }

      try {
        execSync(cmd, { cwd: projectPath, encoding: 'utf8', timeout: 120000 });

        // Get package name from pyproject.toml or setup.py
        let packageName = 'unknown';
        if (hasPyproject) {
          const content = fs.readFileSync(path.join(projectPath, 'pyproject.toml'), 'utf8');
          const match = content.match(/name\s*=\s*["']([^"']+)["']/);
          if (match) {
            packageName = match[1];
          }
        }

        return {
          success: true,
          package: packageName,
          repository,
          files: distFiles,
          url: repository === 'testpypi'
            ? `https://test.pypi.org/project/${packageName}/`
            : `https://pypi.org/project/${packageName}/`,
          message: `Published to ${repository}`
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Docker release (tag and push)
  docker_release: {
    name: 'docker_release',
    description: 'Tag and push Docker release images',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Image name' },
        tag: { type: 'string', description: 'Version tag' },
        registry: { type: 'string', description: 'Registry (default: docker.io)' },
        platforms: { type: 'array', items: { type: 'string' }, description: 'Platforms (linux/amd64, linux/arm64)' },
        latest: { type: 'boolean', description: 'Also tag as latest' },
        buildPath: { type: 'string', description: 'Build context path' }
      },
      required: ['image', 'tag']
    },
    handler: async (args) => {
      const image = args.image;
      const tag = args.tag;
      const registry = args.registry || 'docker.io';
      const platforms = args.platforms || ['linux/amd64'];
      const latest = args.latest || false;
      const buildPath = args.buildPath || '.';

      // Check Docker
      try {
        execSync('docker --version', { encoding: 'utf8' });
      } catch {
        return { success: false, error: 'Docker is not installed or not running' };
      }

      const fullImage = registry === 'docker.io' ? image : `${registry}/${image}`;
      const tags = [`${fullImage}:${tag}`];
      if (latest) {
        tags.push(`${fullImage}:latest`);
      }

      try {
        // Build with multiple platforms if specified
        if (platforms.length > 1) {
          // Multi-platform requires buildx
          const platformStr = platforms.join(',');
          let buildCmd = `docker buildx build --platform ${platformStr}`;
          for (const t of tags) {
            buildCmd += ` -t ${t}`;
          }
          buildCmd += ` --push ${buildPath}`;

          execSync(buildCmd, { encoding: 'utf8', timeout: 600000 });
        } else {
          // Single platform - standard build and push
          let buildCmd = 'docker build';
          for (const t of tags) {
            buildCmd += ` -t ${t}`;
          }
          buildCmd += ` ${buildPath}`;

          execSync(buildCmd, { encoding: 'utf8', timeout: 300000 });

          // Push each tag
          for (const t of tags) {
            execSync(`docker push ${t}`, { encoding: 'utf8', timeout: 300000 });
          }
        }

        return {
          success: true,
          image: fullImage,
          tags: tags.map(t => t.split(':')[1]),
          platforms,
          registry,
          message: `Released ${fullImage}:${tag}${latest ? ' and :latest' : ''}`
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Publish to GitHub Packages
  github_package: {
    name: 'github_package',
    description: 'Publish to GitHub Packages (npm, containers, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Package path' },
        type: { type: 'string', enum: ['npm', 'container', 'maven', 'nuget'], description: 'Package type' },
        repo: { type: 'string', description: 'GitHub repo (owner/repo)' },
        token: { type: 'string', description: 'GitHub token with packages:write' }
      },
      required: ['path', 'type', 'repo']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const type = args.type;
      const repo = args.repo;
      const token = args.token || process.env.GITHUB_TOKEN;

      if (!token) {
        return {
          success: false,
          error: 'GitHub token required',
          hint: 'Set GITHUB_TOKEN or provide token parameter'
        };
      }

      const [owner, repoName] = repo.split('/');

      if (type === 'npm') {
        // Configure npm for GitHub Packages
        const npmrcContent = `//npm.pkg.github.com/:_authToken=${token}
@${owner}:registry=https://npm.pkg.github.com
`;
        const npmrcPath = path.join(projectPath, '.npmrc');
        fs.writeFileSync(npmrcPath, npmrcContent);

        // Update package.json if needed
        const packageJsonPath = path.join(projectPath, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (!pkg.name.startsWith(`@${owner}/`)) {
          return {
            success: false,
            error: `Package name must be scoped: @${owner}/package-name`,
            current: pkg.name
          };
        }

        pkg.publishConfig = { registry: 'https://npm.pkg.github.com' };
        fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

        try {
          execSync('npm publish', { cwd: projectPath, encoding: 'utf8' });
          return {
            success: true,
            type: 'npm',
            package: pkg.name,
            version: pkg.version,
            url: `https://github.com/${repo}/packages`,
            message: `Published ${pkg.name} to GitHub Packages`
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      } else if (type === 'container') {
        const image = `ghcr.io/${owner}/${repoName}`;

        // Login to ghcr.io
        try {
          execSync(`echo ${token} | docker login ghcr.io -u ${owner} --password-stdin`, { encoding: 'utf8' });
        } catch (error) {
          return { success: false, error: `Login failed: ${error.message}` };
        }

        // Get version from package.json if exists
        let version = 'latest';
        const pkgPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          version = pkg.version || 'latest';
        }

        try {
          execSync(`docker build -t ${image}:${version} ${projectPath}`, { encoding: 'utf8', timeout: 300000 });
          execSync(`docker push ${image}:${version}`, { encoding: 'utf8', timeout: 300000 });

          return {
            success: true,
            type: 'container',
            image,
            version,
            url: `https://github.com/${repo}/pkgs/container/${repoName}`,
            message: `Published container to ghcr.io/${owner}/${repoName}:${version}`
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: false, error: `Package type ${type} not yet supported` };
    }
  }
};

module.exports = publishTools;
