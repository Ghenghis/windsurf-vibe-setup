#!/usr/bin/env node
/**
 * Windsurf Autopilot - Project Management Tools v3.1
 * 
 * Jira, Linear, GitHub Issues, Changelog, and Release automation.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Data directory
const DATA_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot')
  : path.join(process.env.HOME || '', '.windsurf-autopilot');

const PM_DIR = path.join(DATA_DIR, 'project-management');
const CONFIG_FILE = path.join(PM_DIR, 'config.json');

// Ensure directories exist
if (!fs.existsSync(PM_DIR)) {
  fs.mkdirSync(PM_DIR, { recursive: true });
}

// Load/save config
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// HTTP helper
function httpRequest(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Windsurf-Autopilot/3.1',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

const pmTools = {

  // Create Jira issue
  jira_create_issue: {
    name: 'jira_create_issue',
    description: 'Create a Jira issue/ticket',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Jira project key (e.g., PROJ)' },
        type: { type: 'string', description: 'Issue type (Bug, Task, Story, Epic)' },
        summary: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description' },
        priority: { type: 'string', description: 'Priority (Highest, High, Medium, Low, Lowest)' },
        assignee: { type: 'string', description: 'Assignee account ID' },
        labels: { type: 'array', items: { type: 'string' } },
        // Auth
        domain: { type: 'string', description: 'Jira domain (e.g., company.atlassian.net)' },
        email: { type: 'string', description: 'Jira email' },
        apiToken: { type: 'string', description: 'Jira API token' }
      },
      required: ['project', 'summary']
    },
    handler: async (args) => {
      const config = loadConfig();
      
      const domain = args.domain || config.jiraDomain;
      const email = args.email || config.jiraEmail;
      const apiToken = args.apiToken || config.jiraApiToken;

      if (!domain || !email || !apiToken) {
        return {
          success: false,
          error: 'Jira credentials not configured',
          hint: 'Provide domain, email, and apiToken (get token from https://id.atlassian.com/manage-profile/security/api-tokens)'
        };
      }

      // Save config
      if (args.domain) config.jiraDomain = args.domain;
      if (args.email) config.jiraEmail = args.email;
      if (args.apiToken) config.jiraApiToken = args.apiToken;
      saveConfig(config);

      const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
      
      const payload = {
        fields: {
          project: { key: args.project },
          summary: args.summary,
          issuetype: { name: args.type || 'Task' }
        }
      };

      if (args.description) payload.fields.description = {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: args.description }]
        }]
      };
      if (args.priority) payload.fields.priority = { name: args.priority };
      if (args.assignee) payload.fields.assignee = { accountId: args.assignee };
      if (args.labels) payload.fields.labels = args.labels;

      try {
        const response = await httpRequest(
          `https://${domain}/rest/api/3/issue`,
          'POST',
          payload,
          { 'Authorization': `Basic ${auth}` }
        );

        if (response.statusCode === 201) {
          return {
            success: true,
            key: response.data.key,
            id: response.data.id,
            url: `https://${domain}/browse/${response.data.key}`,
            message: `Created issue ${response.data.key}`
          };
        } else {
          return {
            success: false,
            statusCode: response.statusCode,
            error: response.data?.errors || response.data
          };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Create Linear task
  linear_create_task: {
    name: 'linear_create_task',
    description: 'Create a Linear issue/task',
    inputSchema: {
      type: 'object',
      properties: {
        team: { type: 'string', description: 'Team key or ID' },
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description (Markdown)' },
        priority: { type: 'number', description: 'Priority (0=none, 1=urgent, 2=high, 3=medium, 4=low)' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Label names' },
        projectId: { type: 'string', description: 'Project ID' },
        apiKey: { type: 'string', description: 'Linear API key' }
      },
      required: ['title']
    },
    handler: async (args) => {
      const config = loadConfig();
      const apiKey = args.apiKey || config.linearApiKey;

      if (!apiKey) {
        return {
          success: false,
          error: 'Linear API key not configured',
          hint: 'Get API key from https://linear.app/settings/api'
        };
      }

      if (args.apiKey) {
        config.linearApiKey = args.apiKey;
        saveConfig(config);
      }

      // GraphQL mutation
      const mutation = `
        mutation CreateIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              identifier
              title
              url
            }
          }
        }
      `;

      const variables = {
        input: {
          title: args.title,
          description: args.description,
          priority: args.priority,
          teamId: args.team,
          projectId: args.projectId,
          labelIds: args.labels
        }
      };

      // Remove undefined values
      Object.keys(variables.input).forEach(key => {
        if (variables.input[key] === undefined) delete variables.input[key];
      });

      try {
        const response = await httpRequest(
          'https://api.linear.app/graphql',
          'POST',
          { query: mutation, variables },
          { 'Authorization': apiKey }
        );

        if (response.data?.data?.issueCreate?.success) {
          const issue = response.data.data.issueCreate.issue;
          return {
            success: true,
            id: issue.id,
            identifier: issue.identifier,
            url: issue.url,
            message: `Created Linear issue ${issue.identifier}`
          };
        } else {
          return {
            success: false,
            error: response.data?.errors || 'Failed to create issue'
          };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Create GitHub issue
  github_create_issue: {
    name: 'github_create_issue',
    description: 'Create a GitHub issue',
    inputSchema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository (owner/repo)' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body (Markdown)' },
        labels: { type: 'array', items: { type: 'string' } },
        assignees: { type: 'array', items: { type: 'string' } },
        milestone: { type: 'number', description: 'Milestone number' },
        token: { type: 'string', description: 'GitHub token' }
      },
      required: ['repo', 'title']
    },
    handler: async (args) => {
      const config = loadConfig();
      const token = args.token || config.githubToken || process.env.GITHUB_TOKEN;

      if (!token) {
        return {
          success: false,
          error: 'GitHub token not configured',
          hint: 'Provide token or set GITHUB_TOKEN environment variable'
        };
      }

      if (args.token) {
        config.githubToken = args.token;
        saveConfig(config);
      }

      const [owner, repo] = args.repo.split('/');
      
      const payload = {
        title: args.title,
        body: args.body,
        labels: args.labels,
        assignees: args.assignees,
        milestone: args.milestone
      };

      // Remove undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
      });

      try {
        const response = await httpRequest(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          'POST',
          payload,
          { 'Authorization': `Bearer ${token}` }
        );

        if (response.statusCode === 201) {
          return {
            success: true,
            number: response.data.number,
            url: response.data.html_url,
            message: `Created GitHub issue #${response.data.number}`
          };
        } else {
          return {
            success: false,
            statusCode: response.statusCode,
            error: response.data?.message || response.data
          };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Auto-generate changelog from commits
  auto_changelog: {
    name: 'auto_changelog',
    description: 'Generate changelog from conventional commits',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path' },
        from: { type: 'string', description: 'Starting tag/commit' },
        to: { type: 'string', description: 'Ending tag/commit (default: HEAD)' },
        format: { type: 'string', enum: ['md', 'json'], description: 'Output format' },
        output: { type: 'string', description: 'Output file path' },
        types: {
          type: 'object',
          description: 'Commit type to section mapping',
          default: {
            feat: 'Features',
            fix: 'Bug Fixes',
            perf: 'Performance',
            refactor: 'Refactoring',
            docs: 'Documentation',
            test: 'Tests',
            chore: 'Maintenance'
          }
        }
      }
    },
    handler: async (args) => {
      const repoPath = args.path || process.cwd();
      const from = args.from;
      const to = args.to || 'HEAD';
      const format = args.format || 'md';
      const output = args.output;
      const types = args.types || {
        feat: 'Features',
        fix: 'Bug Fixes',
        perf: 'Performance',
        refactor: 'Refactoring',
        docs: 'Documentation',
        test: 'Tests',
        chore: 'Maintenance'
      };

      try {
        // Get commits
        let range = to;
        if (from) range = `${from}..${to}`;
        
        const logCmd = `git log ${range} --pretty=format:"%H|%s|%an|%ad" --date=short`;
        const logOutput = execSync(logCmd, { cwd: repoPath, encoding: 'utf8' });
        
        const commits = logOutput.split('\n').filter(Boolean).map(line => {
          const [hash, message, author, date] = line.split('|');
          // Parse conventional commit
          const match = message.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
          return {
            hash: hash.slice(0, 7),
            message,
            author,
            date,
            type: match?.[1] || 'other',
            scope: match?.[2] || null,
            description: match?.[3] || message
          };
        });

        // Group by type
        const grouped = {};
        for (const commit of commits) {
          const section = types[commit.type] || 'Other';
          if (!grouped[section]) grouped[section] = [];
          grouped[section].push(commit);
        }

        // Generate output
        let changelog;
        if (format === 'json') {
          changelog = JSON.stringify({
            from,
            to,
            generated: new Date().toISOString(),
            sections: grouped,
            totalCommits: commits.length
          }, null, 2);
        } else {
          // Markdown format
          const date = new Date().toISOString().split('T')[0];
          changelog = `# Changelog\n\n## [Unreleased] - ${date}\n\n`;
          
          for (const [section, sectionCommits] of Object.entries(grouped)) {
            changelog += `### ${section}\n\n`;
            for (const commit of sectionCommits) {
              const scope = commit.scope ? `**${commit.scope}:** ` : '';
              changelog += `- ${scope}${commit.description} (${commit.hash})\n`;
            }
            changelog += '\n';
          }
        }

        // Write output
        if (output) {
          const outputPath = path.isAbsolute(output) ? output : path.join(repoPath, output);
          fs.writeFileSync(outputPath, changelog);
        }

        return {
          success: true,
          format,
          commits: commits.length,
          sections: Object.keys(grouped),
          output: output || null,
          changelog: changelog.slice(0, 3000),
          message: `Generated changelog with ${commits.length} commits`
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Create GitHub release
  create_release: {
    name: 'create_release',
    description: 'Create a GitHub release with assets',
    inputSchema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository (owner/repo)' },
        tag: { type: 'string', description: 'Git tag for release' },
        name: { type: 'string', description: 'Release name' },
        notes: { type: 'string', description: 'Release notes (Markdown)' },
        draft: { type: 'boolean', description: 'Create as draft' },
        prerelease: { type: 'boolean', description: 'Mark as pre-release' },
        generateNotes: { type: 'boolean', description: 'Auto-generate release notes' },
        assets: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Paths to assets to upload'
        },
        token: { type: 'string', description: 'GitHub token' }
      },
      required: ['repo', 'tag']
    },
    handler: async (args) => {
      const config = loadConfig();
      const token = args.token || config.githubToken || process.env.GITHUB_TOKEN;

      if (!token) {
        return {
          success: false,
          error: 'GitHub token not configured'
        };
      }

      const [owner, repo] = args.repo.split('/');
      
      const payload = {
        tag_name: args.tag,
        name: args.name || args.tag,
        body: args.notes || '',
        draft: args.draft || false,
        prerelease: args.prerelease || false,
        generate_release_notes: args.generateNotes || false
      };

      try {
        const response = await httpRequest(
          `https://api.github.com/repos/${owner}/${repo}/releases`,
          'POST',
          payload,
          { 'Authorization': `Bearer ${token}` }
        );

        if (response.statusCode === 201) {
          const release = response.data;
          
          // Upload assets (simplified - full implementation would use upload_url)
          const assetCount = args.assets?.length || 0;

          return {
            success: true,
            id: release.id,
            tag: release.tag_name,
            name: release.name,
            url: release.html_url,
            draft: release.draft,
            prerelease: release.prerelease,
            assetsToUpload: assetCount,
            message: `Created release ${release.name}`,
            hint: assetCount > 0 ? 'Use GitHub CLI or API to upload assets' : null
          };
        } else {
          return {
            success: false,
            statusCode: response.statusCode,
            error: response.data?.message || response.data
          };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }
};

module.exports = pmTools;
