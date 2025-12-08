#!/usr/bin/env node
/**
 * Windsurf Autopilot - Team Tools v3.0
 * 
 * Team collaboration features.
 * Create teams, invite members, share settings and templates.
 * 
 * Tools:
 * - create_team: Create team workspace
 * - invite_member: Invite team members
 * - share_settings: Share configurations
 * - team_templates: Shared templates
 * - activity_log: Team activity tracking
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Team data directory
const TEAM_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot', 'teams')
  : path.join(process.env.HOME || '', '.windsurf-autopilot', 'teams');

// Ensure team directory exists
if (!fs.existsSync(TEAM_DIR)) {
  fs.mkdirSync(TEAM_DIR, { recursive: true });
}

// Current user (simulated)
const currentUser = {
  id: crypto.randomUUID().substring(0, 8),
  name: process.env.USER || process.env.USERNAME || 'developer',
  email: `${process.env.USER || 'dev'}@local`
};

/**
 * Team Tools Export
 */
const teamTools = {

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: create_team
  // ═══════════════════════════════════════════════════════════════════════════
  create_team: {
    name: 'create_team',
    description: 'Create a new team workspace for collaboration',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Team name'
        },
        description: {
          type: 'string',
          description: 'Team description'
        },
        settings: {
          type: 'object',
          description: 'Initial team settings',
          properties: {
            visibility: { type: 'string', enum: ['private', 'public'] },
            allowInvites: { type: 'boolean' },
            defaultRole: { type: 'string', enum: ['member', 'admin', 'viewer'] }
          }
        }
      },
      required: ['name']
    },
    handler: async (args) => {
      try {
        const teamId = crypto.randomUUID().substring(0, 8);
        const team = {
          id: teamId,
          name: args.name,
          description: args.description || '',
          createdAt: new Date().toISOString(),
          createdBy: currentUser.id,
          settings: {
            visibility: args.settings?.visibility || 'private',
            allowInvites: args.settings?.allowInvites !== false,
            defaultRole: args.settings?.defaultRole || 'member'
          },
          members: [
            {
              userId: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              role: 'owner',
              joinedAt: new Date().toISOString()
            }
          ],
          sharedSettings: {},
          sharedTemplates: [],
          activityLog: [
            {
              action: 'team_created',
              userId: currentUser.id,
              timestamp: new Date().toISOString(),
              details: { teamName: args.name }
            }
          ]
        };

        // Create team directory
        const teamPath = path.join(TEAM_DIR, teamId);
        fs.mkdirSync(teamPath, { recursive: true });

        // Save team data
        fs.writeFileSync(path.join(teamPath, 'team.json'), JSON.stringify(team, null, 2));

        return {
          success: true,
          teamId,
          teamName: team.name,
          teamPath,
          inviteCode: generateInviteCode(teamId),
          message: `Team "${team.name}" created successfully`
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: invite_member
  // ═══════════════════════════════════════════════════════════════════════════
  invite_member: {
    name: 'invite_member',
    description: 'Invite a member to join the team',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Team ID'
        },
        email: {
          type: 'string',
          description: 'Email address to invite'
        },
        name: {
          type: 'string',
          description: 'Member name'
        },
        role: {
          type: 'string',
          enum: ['admin', 'member', 'viewer'],
          description: 'Role for the new member',
          default: 'member'
        },
        message: {
          type: 'string',
          description: 'Personal message with invitation'
        }
      },
      required: ['teamId', 'email']
    },
    handler: async (args) => {
      try {
        const teamPath = path.join(TEAM_DIR, args.teamId);
        const teamFile = path.join(teamPath, 'team.json');

        if (!fs.existsSync(teamFile)) {
          return { success: false, error: `Team not found: ${args.teamId}` };
        }

        const team = JSON.parse(fs.readFileSync(teamFile, 'utf8'));

        // Check if already a member
        if (team.members.some(m => m.email === args.email)) {
          return { success: false, error: 'User is already a team member' };
        }

        // Check invite permissions
        const currentMember = team.members.find(m => m.userId === currentUser.id);
        if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
          return { success: false, error: 'You do not have permission to invite members' };
        }

        // Create invitation
        const invitation = {
          id: crypto.randomUUID().substring(0, 8),
          email: args.email,
          name: args.name || args.email.split('@')[0],
          role: args.role || team.settings.defaultRole,
          invitedBy: currentUser.id,
          invitedAt: new Date().toISOString(),
          message: args.message,
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };

        // Store invitation
        const invitationsFile = path.join(teamPath, 'invitations.json');
        let invitations = [];
        if (fs.existsSync(invitationsFile)) {
          invitations = JSON.parse(fs.readFileSync(invitationsFile, 'utf8'));
        }
        invitations.push(invitation);
        fs.writeFileSync(invitationsFile, JSON.stringify(invitations, null, 2));

        // Log activity
        team.activityLog.push({
          action: 'member_invited',
          userId: currentUser.id,
          timestamp: new Date().toISOString(),
          details: { email: args.email, role: invitation.role }
        });
        fs.writeFileSync(teamFile, JSON.stringify(team, null, 2));

        return {
          success: true,
          invitationId: invitation.id,
          email: args.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          inviteLink: `autopilot://join/${args.teamId}/${invitation.id}`,
          message: `Invitation sent to ${args.email}`
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: share_settings
  // ═══════════════════════════════════════════════════════════════════════════
  share_settings: {
    name: 'share_settings',
    description: 'Share configuration settings with the team',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Team ID'
        },
        action: {
          type: 'string',
          enum: ['share', 'get', 'list', 'remove'],
          description: 'Action to perform',
          default: 'list'
        },
        settingName: {
          type: 'string',
          description: 'Setting name'
        },
        settingValue: {
          type: 'object',
          description: 'Setting value to share'
        },
        category: {
          type: 'string',
          description: 'Setting category',
          enum: ['editor', 'linting', 'formatting', 'tools', 'custom']
        }
      },
      required: ['teamId']
    },
    handler: async (args) => {
      try {
        const teamPath = path.join(TEAM_DIR, args.teamId);
        const teamFile = path.join(teamPath, 'team.json');

        if (!fs.existsSync(teamFile)) {
          return { success: false, error: `Team not found: ${args.teamId}` };
        }

        const team = JSON.parse(fs.readFileSync(teamFile, 'utf8'));
        const action = args.action || 'list';

        if (action === 'list') {
          const settings = Object.entries(team.sharedSettings).map(([name, data]) => ({
            name,
            category: data.category,
            sharedBy: data.sharedBy,
            sharedAt: data.sharedAt
          }));

          return {
            success: true,
            teamId: args.teamId,
            teamName: team.name,
            count: settings.length,
            settings
          };
        }

        if (action === 'get') {
          if (!args.settingName || !team.sharedSettings[args.settingName]) {
            return { 
              success: false, 
              error: `Setting not found: ${args.settingName}`,
              availableSettings: Object.keys(team.sharedSettings)
            };
          }

          return {
            success: true,
            settingName: args.settingName,
            ...team.sharedSettings[args.settingName]
          };
        }

        if (action === 'share') {
          if (!args.settingName || !args.settingValue) {
            return { success: false, error: 'settingName and settingValue required' };
          }

          team.sharedSettings[args.settingName] = {
            value: args.settingValue,
            category: args.category || 'custom',
            sharedBy: currentUser.id,
            sharedAt: new Date().toISOString()
          };

          team.activityLog.push({
            action: 'settings_shared',
            userId: currentUser.id,
            timestamp: new Date().toISOString(),
            details: { settingName: args.settingName }
          });

          fs.writeFileSync(teamFile, JSON.stringify(team, null, 2));

          return {
            success: true,
            settingName: args.settingName,
            message: `Setting "${args.settingName}" shared with team`
          };
        }

        if (action === 'remove') {
          if (!args.settingName || !team.sharedSettings[args.settingName]) {
            return { success: false, error: `Setting not found: ${args.settingName}` };
          }

          delete team.sharedSettings[args.settingName];

          team.activityLog.push({
            action: 'settings_removed',
            userId: currentUser.id,
            timestamp: new Date().toISOString(),
            details: { settingName: args.settingName }
          });

          fs.writeFileSync(teamFile, JSON.stringify(team, null, 2));

          return {
            success: true,
            message: `Setting "${args.settingName}" removed`
          };
        }

        return { success: false, error: 'Invalid action' };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: team_templates
  // ═══════════════════════════════════════════════════════════════════════════
  team_templates: {
    name: 'team_templates',
    description: 'Manage shared project templates within the team',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Team ID'
        },
        action: {
          type: 'string',
          enum: ['list', 'add', 'use', 'remove'],
          description: 'Action to perform',
          default: 'list'
        },
        templateName: {
          type: 'string',
          description: 'Template name'
        },
        templateData: {
          type: 'object',
          description: 'Template data for add action'
        },
        projectPath: {
          type: 'string',
          description: 'Path to project for creating from template'
        }
      },
      required: ['teamId']
    },
    handler: async (args) => {
      try {
        const teamPath = path.join(TEAM_DIR, args.teamId);
        const teamFile = path.join(teamPath, 'team.json');

        if (!fs.existsSync(teamFile)) {
          return { success: false, error: `Team not found: ${args.teamId}` };
        }

        const team = JSON.parse(fs.readFileSync(teamFile, 'utf8'));
        const action = args.action || 'list';

        if (action === 'list') {
          return {
            success: true,
            teamId: args.teamId,
            count: team.sharedTemplates.length,
            templates: team.sharedTemplates.map(t => ({
              name: t.name,
              description: t.description,
              type: t.type,
              sharedBy: t.sharedBy,
              sharedAt: t.sharedAt
            }))
          };
        }

        if (action === 'add') {
          if (!args.templateName || !args.templateData) {
            return { success: false, error: 'templateName and templateData required' };
          }

          const template = {
            id: crypto.randomUUID().substring(0, 8),
            name: args.templateName,
            description: args.templateData.description || '',
            type: args.templateData.type || 'project',
            files: args.templateData.files || [],
            config: args.templateData.config || {},
            sharedBy: currentUser.id,
            sharedAt: new Date().toISOString()
          };

          team.sharedTemplates.push(template);

          team.activityLog.push({
            action: 'template_shared',
            userId: currentUser.id,
            timestamp: new Date().toISOString(),
            details: { templateName: args.templateName }
          });

          fs.writeFileSync(teamFile, JSON.stringify(team, null, 2));

          return {
            success: true,
            templateId: template.id,
            templateName: template.name,
            message: `Template "${template.name}" added to team`
          };
        }

        if (action === 'use') {
          if (!args.templateName) {
            return { success: false, error: 'templateName required' };
          }

          const template = team.sharedTemplates.find(t => t.name === args.templateName || t.id === args.templateName);
          if (!template) {
            return {
              success: false,
              error: `Template not found: ${args.templateName}`,
              availableTemplates: team.sharedTemplates.map(t => t.name)
            };
          }

          return {
            success: true,
            template: {
              name: template.name,
              description: template.description,
              type: template.type,
              files: template.files,
              config: template.config
            },
            message: `Template "${template.name}" retrieved. Use create_project to apply.`
          };
        }

        if (action === 'remove') {
          if (!args.templateName) {
            return { success: false, error: 'templateName required' };
          }

          const index = team.sharedTemplates.findIndex(t => t.name === args.templateName || t.id === args.templateName);
          if (index === -1) {
            return { success: false, error: `Template not found: ${args.templateName}` };
          }

          team.sharedTemplates.splice(index, 1);

          team.activityLog.push({
            action: 'template_removed',
            userId: currentUser.id,
            timestamp: new Date().toISOString(),
            details: { templateName: args.templateName }
          });

          fs.writeFileSync(teamFile, JSON.stringify(team, null, 2));

          return {
            success: true,
            message: `Template "${args.templateName}" removed from team`
          };
        }

        return { success: false, error: 'Invalid action' };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: activity_log
  // ═══════════════════════════════════════════════════════════════════════════
  activity_log: {
    name: 'activity_log',
    description: 'View team activity history',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Team ID'
        },
        limit: {
          type: 'number',
          description: 'Number of activities to return',
          default: 50
        },
        filter: {
          type: 'string',
          description: 'Filter by action type'
        },
        userId: {
          type: 'string',
          description: 'Filter by user ID'
        },
        since: {
          type: 'string',
          description: 'ISO timestamp to filter from'
        }
      },
      required: ['teamId']
    },
    handler: async (args) => {
      try {
        const teamPath = path.join(TEAM_DIR, args.teamId);
        const teamFile = path.join(teamPath, 'team.json');

        if (!fs.existsSync(teamFile)) {
          return { success: false, error: `Team not found: ${args.teamId}` };
        }

        const team = JSON.parse(fs.readFileSync(teamFile, 'utf8'));
        let activities = [...team.activityLog];

        // Apply filters
        if (args.filter) {
          activities = activities.filter(a => a.action === args.filter);
        }

        if (args.userId) {
          activities = activities.filter(a => a.userId === args.userId);
        }

        if (args.since) {
          const sinceDate = new Date(args.since);
          activities = activities.filter(a => new Date(a.timestamp) >= sinceDate);
        }

        // Sort by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Limit
        const limit = args.limit || 50;
        activities = activities.slice(0, limit);

        // Enrich with user names
        const enriched = activities.map(activity => {
          const member = team.members.find(m => m.userId === activity.userId);
          return {
            ...activity,
            userName: member?.name || 'Unknown'
          };
        });

        return {
          success: true,
          teamId: args.teamId,
          teamName: team.name,
          count: enriched.length,
          activities: enriched,
          actionTypes: [...new Set(team.activityLog.map(a => a.action))]
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Bonus: list_teams
  // ═══════════════════════════════════════════════════════════════════════════
  list_teams: {
    name: 'list_teams',
    description: 'List all teams you belong to',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      try {
        const teams = [];
        
        if (!fs.existsSync(TEAM_DIR)) {
          return { success: true, count: 0, teams: [] };
        }

        const dirs = fs.readdirSync(TEAM_DIR, { withFileTypes: true });

        for (const dir of dirs) {
          if (dir.isDirectory()) {
            const teamFile = path.join(TEAM_DIR, dir.name, 'team.json');
            if (fs.existsSync(teamFile)) {
              const team = JSON.parse(fs.readFileSync(teamFile, 'utf8'));
              const membership = team.members.find(m => m.userId === currentUser.id);
              
              if (membership) {
                teams.push({
                  id: team.id,
                  name: team.name,
                  description: team.description,
                  role: membership.role,
                  memberCount: team.members.length,
                  createdAt: team.createdAt
                });
              }
            }
          }
        }

        return {
          success: true,
          count: teams.length,
          teams
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Get tool definitions
  getToolDefinitions: function() {
    return [
      { name: this.create_team.name, description: this.create_team.description, inputSchema: this.create_team.inputSchema },
      { name: this.invite_member.name, description: this.invite_member.description, inputSchema: this.invite_member.inputSchema },
      { name: this.share_settings.name, description: this.share_settings.description, inputSchema: this.share_settings.inputSchema },
      { name: this.team_templates.name, description: this.team_templates.description, inputSchema: this.team_templates.inputSchema },
      { name: this.activity_log.name, description: this.activity_log.description, inputSchema: this.activity_log.inputSchema },
      { name: this.list_teams.name, description: this.list_teams.description, inputSchema: this.list_teams.inputSchema }
    ];
  },

  getHandler: function(toolName) {
    const tool = this[toolName];
    return tool ? tool.handler : null;
  }
};

// Helper: Generate invite code
function generateInviteCode(teamId) {
  return Buffer.from(`${teamId}-${Date.now()}`).toString('base64').substring(0, 12);
}

module.exports = teamTools;
