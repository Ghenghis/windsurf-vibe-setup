/**
 * Business & Analytics Tools - v3.2 Vibe Coder Experience
 * 
 * Cost estimation, productivity tracking, and business analytics.
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME || '/tmp';
const DATA_DIR = path.join(HOME, '.windsurf-autopilot', 'business');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Preview cloud/API costs
 */
const cost_estimate = {
  name: 'cost_estimate',
  description: 'Estimate cloud hosting and API costs before you commit.',
  inputSchema: {
    type: 'object',
    properties: {
      projectType: { 
        type: 'string', 
        enum: ['web-app', 'api', 'static-site', 'mobile-backend', 'full-stack'],
        description: 'Type of project'
      },
      expectedUsers: { type: 'integer', description: 'Expected monthly active users' },
      features: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Features: database, storage, auth, email, sms, ai'
      },
      provider: { 
        type: 'string', 
        enum: ['vercel', 'netlify', 'railway', 'aws', 'gcp', 'azure'],
        description: 'Preferred cloud provider'
      }
    },
    required: ['projectType']
  },
  handler: async ({ projectType, expectedUsers = 1000, features = [], provider }) => {
    try {
      // Cost estimation models (simplified)
      const baseCosts = {
        'static-site': { hosting: 0, bandwidth: 0.01 },
        'web-app': { hosting: 0, bandwidth: 0.02, compute: 0.01 },
        'api': { hosting: 5, bandwidth: 0.02, compute: 0.02 },
        'mobile-backend': { hosting: 10, bandwidth: 0.03, compute: 0.03 },
        'full-stack': { hosting: 15, bandwidth: 0.03, compute: 0.03 }
      };
      
      const featureCosts = {
        database: { monthly: 0, perUser: 0.001 },
        storage: { monthly: 0, perGB: 0.023 },
        auth: { monthly: 0, perUser: 0 },
        email: { monthly: 0, perEmail: 0.0001 },
        sms: { monthly: 0, perSMS: 0.01 },
        ai: { monthly: 0, perRequest: 0.002 }
      };
      
      const providerFreeTeirs = {
        vercel: { hosting: 'Free', bandwidth: '100GB', note: 'Great for Next.js' },
        netlify: { hosting: 'Free', bandwidth: '100GB', note: 'Great for static + functions' },
        railway: { hosting: '$5 credit', bandwidth: 'Included', note: 'Simple deployment' },
        aws: { hosting: 'Free tier 12mo', bandwidth: '15GB', note: 'Most flexible' },
        gcp: { hosting: 'Free tier', bandwidth: '1GB', note: 'Good for AI/ML' },
        azure: { hosting: 'Free tier', bandwidth: '15GB', note: 'Enterprise focused' }
      };
      
      // Calculate estimates
      const base = baseCosts[projectType] || baseCosts['web-app'];
      let monthlyEstimate = base.hosting;
      let perUserCost = base.bandwidth + (base.compute || 0);
      
      const breakdown = [{
        item: 'Base Hosting',
        monthly: base.hosting,
        note: 'Platform base cost'
      }];
      
      features.forEach(feature => {
        const fc = featureCosts[feature];
        if (fc) {
          monthlyEstimate += fc.monthly;
          perUserCost += fc.perUser || 0;
          breakdown.push({
            item: feature.charAt(0).toUpperCase() + feature.slice(1),
            monthly: fc.monthly,
            perUser: fc.perUser,
            note: `${feature} service`
          });
        }
      });
      
      const totalMonthly = monthlyEstimate + (perUserCost * expectedUsers);
      
      return {
        success: true,
        estimate: {
          monthly: `$${totalMonthly.toFixed(2)}`,
          yearly: `$${(totalMonthly * 12).toFixed(2)}`,
          perUser: `$${perUserCost.toFixed(4)}/user`,
          breakdown
        },
        freeTier: provider ? providerFreeTeirs[provider] : providerFreeTeirs.vercel,
        recommendations: [
          totalMonthly < 5 ? '✅ Your project can likely run free!' : null,
          totalMonthly < 20 ? '💡 Consider Vercel/Netlify free tier' : null,
          totalMonthly > 50 ? '💰 Consider reserved instances for savings' : null,
          features.includes('ai') ? '🤖 AI costs can vary significantly based on usage' : null
        ].filter(Boolean),
        assumptions: {
          users: expectedUsers,
          avgRequestsPerUser: 100,
          avgStoragePerUser: '10MB'
        },
        message: `💰 Estimated cost: $${totalMonthly.toFixed(2)}/month for ${expectedUsers} users`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Personal productivity metrics
 */
const usage_analytics = {
  name: 'usage_analytics',
  description: 'Track your productivity and tool usage patterns.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { 
        type: 'string', 
        enum: ['view', 'record', 'reset'],
        default: 'view'
      },
      category: { type: 'string', description: 'Category to record (for record action)' },
      duration: { type: 'integer', description: 'Duration in minutes (for record action)' }
    },
    required: []
  },
  handler: async ({ action = 'view', category, duration }) => {
    try {
      const analyticsFile = path.join(DATA_DIR, 'usage-analytics.json');
      let analytics = {
        sessions: [],
        totalTime: 0,
        byCategory: {},
        streak: 0,
        lastActive: null
      };
      
      if (fs.existsSync(analyticsFile)) {
        analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
      }
      
      if (action === 'record' && category && duration) {
        const session = {
          date: new Date().toISOString(),
          category,
          duration
        };
        analytics.sessions.push(session);
        analytics.totalTime += duration;
        analytics.byCategory[category] = (analytics.byCategory[category] || 0) + duration;
        analytics.lastActive = session.date;
        
        // Update streak
        const today = new Date().toDateString();
        const lastDate = analytics.lastActive ? new Date(analytics.lastActive).toDateString() : null;
        if (lastDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          analytics.streak = lastDate === yesterday ? analytics.streak + 1 : 1;
        }
        
        fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
      }
      
      if (action === 'reset') {
        analytics = { sessions: [], totalTime: 0, byCategory: {}, streak: 0, lastActive: null };
        fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
      }
      
      // Calculate insights
      const totalHours = (analytics.totalTime / 60).toFixed(1);
      const topCategory = Object.entries(analytics.byCategory)
        .sort(([,a], [,b]) => b - a)[0];
      
      return {
        success: true,
        analytics: {
          totalTime: `${totalHours} hours`,
          totalSessions: analytics.sessions.length,
          streak: `${analytics.streak} days`,
          byCategory: analytics.byCategory,
          topCategory: topCategory ? { name: topCategory[0], minutes: topCategory[1] } : null,
          lastActive: analytics.lastActive
        },
        insights: [
          analytics.streak >= 7 ? '🔥 Great streak! Keep it up!' : null,
          totalHours > 10 ? '💪 You\'ve been productive!' : null,
          topCategory ? `📊 Most time spent on: ${topCategory[0]}` : null
        ].filter(Boolean),
        message: `📈 Total: ${totalHours} hours across ${analytics.sessions.length} sessions`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Automatic time tracking
 */
const time_tracker = {
  name: 'time_tracker',
  description: 'Track time spent on tasks automatically.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { 
        type: 'string', 
        enum: ['start', 'stop', 'status', 'report'],
        description: 'Timer action'
      },
      task: { type: 'string', description: 'Task name/description' },
      project: { type: 'string', description: 'Project name' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' }
    },
    required: ['action']
  },
  handler: async ({ action, task, project, tags = [] }) => {
    try {
      const timerFile = path.join(DATA_DIR, 'time-tracker.json');
      let tracker = {
        current: null,
        entries: []
      };
      
      if (fs.existsSync(timerFile)) {
        tracker = JSON.parse(fs.readFileSync(timerFile, 'utf8'));
      }
      
      if (action === 'start') {
        if (tracker.current) {
          // Stop existing timer first
          const elapsed = Date.now() - new Date(tracker.current.startTime).getTime();
          tracker.entries.push({
            ...tracker.current,
            endTime: new Date().toISOString(),
            duration: Math.round(elapsed / 60000)
          });
        }
        
        tracker.current = {
          task: task || 'Unnamed task',
          project: project || 'Default',
          tags,
          startTime: new Date().toISOString()
        };
        fs.writeFileSync(timerFile, JSON.stringify(tracker, null, 2));
        
        return {
          success: true,
          status: 'started',
          timer: tracker.current,
          message: `⏱️ Timer started for "${task || 'Unnamed task'}"`
        };
      }
      
      if (action === 'stop') {
        if (!tracker.current) {
          return { success: false, error: 'No timer running' };
        }
        
        const elapsed = Date.now() - new Date(tracker.current.startTime).getTime();
        const entry = {
          ...tracker.current,
          endTime: new Date().toISOString(),
          duration: Math.round(elapsed / 60000)
        };
        tracker.entries.push(entry);
        tracker.current = null;
        fs.writeFileSync(timerFile, JSON.stringify(tracker, null, 2));
        
        return {
          success: true,
          status: 'stopped',
          entry,
          message: `⏹️ Timer stopped. Duration: ${entry.duration} minutes`
        };
      }
      
      if (action === 'status') {
        if (!tracker.current) {
          return { success: true, status: 'idle', message: 'No timer running' };
        }
        
        const elapsed = Date.now() - new Date(tracker.current.startTime).getTime();
        return {
          success: true,
          status: 'running',
          current: {
            ...tracker.current,
            elapsed: Math.round(elapsed / 60000)
          },
          message: `⏱️ Running: ${tracker.current.task} (${Math.round(elapsed / 60000)} min)`
        };
      }
      
      if (action === 'report') {
        const today = new Date().toDateString();
        const todayEntries = tracker.entries.filter(e => 
          new Date(e.startTime).toDateString() === today
        );
        const todayMinutes = todayEntries.reduce((sum, e) => sum + e.duration, 0);
        
        const byProject = {};
        tracker.entries.forEach(e => {
          byProject[e.project] = (byProject[e.project] || 0) + e.duration;
        });
        
        return {
          success: true,
          report: {
            today: `${(todayMinutes / 60).toFixed(1)} hours`,
            todayEntries: todayEntries.length,
            totalEntries: tracker.entries.length,
            totalTime: `${(tracker.entries.reduce((s, e) => s + e.duration, 0) / 60).toFixed(1)} hours`,
            byProject
          },
          message: `📊 Today: ${(todayMinutes / 60).toFixed(1)} hours across ${todayEntries.length} tasks`
        };
      }
      
      return { success: false, error: 'Invalid action' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * ROI calculator
 */
const roi_calculator = {
  name: 'roi_calculator',
  description: 'Calculate return on investment for your project.',
  inputSchema: {
    type: 'object',
    properties: {
      investment: { type: 'number', description: 'Total investment (time or money)' },
      investmentType: { type: 'string', enum: ['money', 'hours'], default: 'money' },
      expectedRevenue: { type: 'number', description: 'Expected monthly revenue' },
      timeframe: { type: 'integer', description: 'Months to calculate', default: 12 },
      hourlyRate: { type: 'number', description: 'Your hourly rate (if time investment)', default: 50 }
    },
    required: ['investment', 'expectedRevenue']
  },
  handler: async ({ investment, investmentType = 'money', expectedRevenue, timeframe = 12, hourlyRate = 50 }) => {
    try {
      // Convert time to money if needed
      const monetaryInvestment = investmentType === 'hours' 
        ? investment * hourlyRate 
        : investment;
      
      const totalRevenue = expectedRevenue * timeframe;
      const profit = totalRevenue - monetaryInvestment;
      const roi = ((profit / monetaryInvestment) * 100).toFixed(1);
      const breakEvenMonths = Math.ceil(monetaryInvestment / expectedRevenue);
      
      return {
        success: true,
        calculation: {
          investment: `$${monetaryInvestment.toFixed(2)}`,
          investmentBreakdown: investmentType === 'hours' 
            ? `${investment} hours × $${hourlyRate}/hr` 
            : 'Direct investment',
          monthlyRevenue: `$${expectedRevenue.toFixed(2)}`,
          totalRevenue: `$${totalRevenue.toFixed(2)}`,
          profit: `$${profit.toFixed(2)}`,
          roi: `${roi}%`,
          breakEvenMonths,
          timeframe: `${timeframe} months`
        },
        analysis: {
          profitable: profit > 0,
          roiRating: roi > 100 ? '🚀 Excellent' : roi > 50 ? '👍 Good' : roi > 0 ? '📊 Moderate' : '⚠️ Negative',
          breakEven: breakEvenMonths <= timeframe 
            ? `✅ Break even in ${breakEvenMonths} months` 
            : `⚠️ Won't break even in ${timeframe} months`
        },
        message: `📈 ROI: ${roi}% | Break even: ${breakEvenMonths} months`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Competitor analysis
 */
const competitor_scan = {
  name: 'competitor_scan',
  description: 'Analyze competitor websites for tech stack, features, and insights.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Competitor website URL' },
      aspects: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'What to analyze: tech, features, seo, performance'
      }
    },
    required: ['url']
  },
  handler: async ({ url, aspects = ['tech', 'features'] }) => {
    try {
      // Normalize URL
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const domain = new URL(normalizedUrl).hostname;
      
      // In production, would actually fetch and analyze the site
      // This provides a framework for what the analysis would include
      
      const analysis = {
        url: normalizedUrl,
        domain,
        scannedAt: new Date().toISOString()
      };
      
      if (aspects.includes('tech')) {
        analysis.techStack = {
          note: 'Tech detection requires actual site scanning',
          commonIndicators: [
            'Check for /_next/ (Next.js)',
            'Check for /static/js/main (React CRA)',
            'Check X-Powered-By header',
            'Look at script sources'
          ],
          tools: ['Wappalyzer', 'BuiltWith', 'WhatRuns']
        };
      }
      
      if (aspects.includes('features')) {
        analysis.features = {
          note: 'Manual review recommended',
          checkFor: [
            'Authentication/Login',
            'Pricing page',
            'API documentation',
            'Blog/Content',
            'Support/Help center'
          ]
        };
      }
      
      if (aspects.includes('seo')) {
        analysis.seo = {
          note: 'SEO analysis requires page content',
          checkFor: [
            'Meta title and description',
            'Open Graph tags',
            'Structured data',
            'Sitemap.xml',
            'Robots.txt'
          ]
        };
      }
      
      if (aspects.includes('performance')) {
        analysis.performance = {
          note: 'Run through PageSpeed Insights',
          url: `https://pagespeed.web.dev/report?url=${encodeURIComponent(normalizedUrl)}`,
          metrics: ['FCP', 'LCP', 'CLS', 'TTI']
        };
      }
      
      return {
        success: true,
        analysis,
        recommendations: [
          `Visit ${normalizedUrl} and note key features`,
          'Use browser DevTools Network tab for tech detection',
          `Check PageSpeed: ${analysis.performance?.url || 'N/A'}`,
          'Sign up for their product to understand user flow'
        ],
        message: `🔍 Analysis framework ready for ${domain}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  cost_estimate,
  usage_analytics,
  time_tracker,
  roi_calculator,
  competitor_scan
};
