#!/usr/bin/env node
/**
 * Windsurf Autopilot - Dev Environment Tools v3.1
 * 
 * Devcontainer, Codespaces, and Gitpod configuration generators.
 */

const fs = require('fs');
const path = require('path');

const devenvTools = {

  // Generate VS Code devcontainer configuration
  gen_devcontainer: {
    name: 'gen_devcontainer',
    description: 'Generate VS Code devcontainer.json configuration',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        name: { type: 'string', description: 'Container name' },
        image: { type: 'string', description: 'Base Docker image' },
        features: { type: 'array', items: { type: 'string' }, description: 'Dev container features' },
        extensions: { type: 'array', items: { type: 'string' }, description: 'VS Code extensions' },
        ports: { type: 'array', items: { type: 'number' }, description: 'Ports to forward' },
        postCreateCommand: { type: 'string', description: 'Post-create command' },
        services: { type: 'array', items: { type: 'string' }, description: 'Services (postgres, redis)' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const name = args.name || path.basename(projectPath);
      const features = args.features || ['node'];
      const extensions = args.extensions || [];
      const ports = args.ports || [3000];
      const postCreateCommand = args.postCreateCommand || 'npm install';
      const services = args.services || [];

      // Detect project type
      let detectedType = 'node';
      let baseImage = 'mcr.microsoft.com/devcontainers/javascript-node:20';

      if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
        detectedType = 'python';
        baseImage = 'mcr.microsoft.com/devcontainers/python:3.11';
      } else if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
        detectedType = 'go';
        baseImage = 'mcr.microsoft.com/devcontainers/go:1.21';
      } else if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
        detectedType = 'rust';
        baseImage = 'mcr.microsoft.com/devcontainers/rust:latest';
      }

      const image = args.image || baseImage;

      // Create .devcontainer directory
      const devcontainerDir = path.join(projectPath, '.devcontainer');
      if (!fs.existsSync(devcontainerDir)) {
        fs.mkdirSync(devcontainerDir, { recursive: true });
      }

      // Build devcontainer.json
      const devcontainer = {
        name,
        image,
        features: {},
        customizations: {
          vscode: {
            extensions: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode', ...extensions],
            settings: { 'editor.formatOnSave': true }
          }
        },
        forwardPorts: ports,
        postCreateCommand,
        remoteUser: 'vscode'
      };

      // Add features
      for (const feature of features) {
        if (feature === 'node') {
          devcontainer.features['ghcr.io/devcontainers/features/node:1'] = { version: '20' };
        } else if (feature === 'python') {
          devcontainer.features['ghcr.io/devcontainers/features/python:1'] = { version: '3.11' };
        } else if (feature === 'docker') {
          devcontainer.features['ghcr.io/devcontainers/features/docker-in-docker:2'] = {};
        } else if (feature === 'terraform') {
          devcontainer.features['ghcr.io/devcontainers/features/terraform:1'] = {};
        } else if (feature === 'kubectl') {
          devcontainer.features['ghcr.io/devcontainers/features/kubectl-helm-minikube:1'] = {};
        }
      }

      // Handle services
      if (services.length > 0) {
        const composeContent = generateDockerCompose(services, image);
        fs.writeFileSync(path.join(devcontainerDir, 'docker-compose.yml'), composeContent);
        
        const dockerfile = `FROM ${image}\n# Custom setup here\n`;
        fs.writeFileSync(path.join(devcontainerDir, 'Dockerfile'), dockerfile);

        devcontainer.dockerComposeFile = 'docker-compose.yml';
        devcontainer.service = 'app';
        devcontainer.workspaceFolder = '/workspace';
        delete devcontainer.image;
      }

      fs.writeFileSync(path.join(devcontainerDir, 'devcontainer.json'), JSON.stringify(devcontainer, null, 2));

      return {
        success: true,
        path: devcontainerDir,
        detectedType,
        files: fs.readdirSync(devcontainerDir),
        message: `Generated devcontainer for ${detectedType} project`
      };
    }
  },

  // Generate GitHub Codespaces configuration
  gen_codespace: {
    name: 'gen_codespace',
    description: 'Generate GitHub Codespaces configuration',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        machine: { type: 'string', enum: ['basicLinux32gb', 'standardLinux32gb', 'premiumLinux'], description: 'Machine type' },
        prebuild: { type: 'boolean', description: 'Enable prebuilds' },
        secrets: { type: 'array', items: { type: 'string' }, description: 'Required secrets' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const machine = args.machine || 'standardLinux32gb';
      const prebuild = args.prebuild !== false;
      const secrets = args.secrets || [];

      const devcontainerDir = path.join(projectPath, '.devcontainer');
      const devcontainerJson = path.join(devcontainerDir, 'devcontainer.json');

      // Create base devcontainer if not exists
      if (!fs.existsSync(devcontainerJson)) {
        await devenvTools.gen_devcontainer.handler({ path: projectPath });
      }

      const devcontainer = JSON.parse(fs.readFileSync(devcontainerJson, 'utf8'));

      // Add Codespaces settings
      devcontainer.hostRequirements = {
        cpus: machine.includes('premium') ? 4 : 2,
        memory: '8gb',
        storage: '32gb'
      };

      if (!devcontainer.customizations) devcontainer.customizations = {};
      if (!devcontainer.customizations.vscode) devcontainer.customizations.vscode = {};
      if (!devcontainer.customizations.vscode.extensions) devcontainer.customizations.vscode.extensions = [];
      
      devcontainer.customizations.vscode.extensions.push('GitHub.copilot', 'GitHub.vscode-pull-request-github');

      if (secrets.length > 0) {
        devcontainer.secrets = {};
        for (const secret of secrets) {
          devcontainer.secrets[secret] = { description: `Secret: ${secret}` };
        }
      }

      fs.writeFileSync(devcontainerJson, JSON.stringify(devcontainer, null, 2));

      // Create prebuild workflow if enabled
      if (prebuild) {
        const githubDir = path.join(projectPath, '.github', 'workflows');
        if (!fs.existsSync(githubDir)) fs.mkdirSync(githubDir, { recursive: true });

        const workflow = `name: Codespaces Prebuild
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  prebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Prebuild triggered"
`;
        fs.writeFileSync(path.join(githubDir, 'codespaces-prebuild.yml'), workflow);
      }

      return {
        success: true,
        path: devcontainerDir,
        machine,
        prebuild,
        secrets: secrets.length,
        message: `GitHub Codespaces config generated. Machine: ${machine}`
      };
    }
  },

  // Generate Gitpod configuration
  gen_gitpod: {
    name: 'gen_gitpod',
    description: 'Generate Gitpod.io configuration',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        tasks: { type: 'array', description: 'Startup tasks' },
        ports: { type: 'array', description: 'Port configurations' },
        vscode: { type: 'array', items: { type: 'string' }, description: 'VS Code extensions' },
        image: { type: 'string', description: 'Custom Docker image' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const image = args.image;
      const vscodeExts = args.vscode || [];

      // Detect project and set defaults
      let tasks = args.tasks;
      let ports = args.ports;

      if (!tasks) {
        if (fs.existsSync(path.join(projectPath, 'package.json'))) {
          tasks = [{ name: 'Install & Start', init: 'npm install', command: 'npm run dev' }];
          ports = ports || [{ port: 3000, onOpen: 'open-preview' }];
        } else if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
          tasks = [{ name: 'Install & Start', init: 'pip install -r requirements.txt', command: 'python app.py' }];
          ports = ports || [{ port: 5000, onOpen: 'open-preview' }];
        } else {
          tasks = [{ name: 'Ready', command: 'echo "Workspace ready"' }];
          ports = ports || [];
        }
      }

      // Build .gitpod.yml content
      let gitpodYml = '';
      
      if (image) {
        gitpodYml += `image: ${image}\n\n`;
      }

      gitpodYml += 'tasks:\n';
      for (const task of tasks) {
        gitpodYml += `  - name: ${task.name || 'Task'}\n`;
        if (task.init) gitpodYml += `    init: ${task.init}\n`;
        if (task.command) gitpodYml += `    command: ${task.command}\n`;
      }

      if (ports && ports.length > 0) {
        gitpodYml += '\nports:\n';
        for (const port of ports) {
          gitpodYml += `  - port: ${port.port || port}\n`;
          if (port.onOpen) gitpodYml += `    onOpen: ${port.onOpen}\n`;
          if (port.visibility) gitpodYml += `    visibility: ${port.visibility}\n`;
        }
      }

      if (vscodeExts.length > 0) {
        gitpodYml += '\nvscode:\n  extensions:\n';
        for (const ext of vscodeExts) {
          gitpodYml += `    - ${ext}\n`;
        }
      }

      fs.writeFileSync(path.join(projectPath, '.gitpod.yml'), gitpodYml);

      return {
        success: true,
        path: path.join(projectPath, '.gitpod.yml'),
        tasks: tasks.length,
        ports: ports?.length || 0,
        extensions: vscodeExts.length,
        content: gitpodYml,
        message: 'Generated .gitpod.yml configuration'
      };
    }
  }
};

// Helper function for docker-compose
function generateDockerCompose(services, baseImage) {
  let yaml = `version: "3.8"
services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
    command: sleep infinity
`;

  for (const service of services) {
    if (service === 'postgres') {
      yaml += `
  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: devdb
    ports:
      - "5432:5432"
`;
    } else if (service === 'redis') {
      yaml += `
  redis:
    image: redis:7
    restart: unless-stopped
    ports:
      - "6379:6379"
`;
    } else if (service === 'mongodb') {
      yaml += `
  mongodb:
    image: mongo:6
    restart: unless-stopped
    ports:
      - "27017:27017"
`;
    }
  }

  return yaml;
}

module.exports = devenvTools;
