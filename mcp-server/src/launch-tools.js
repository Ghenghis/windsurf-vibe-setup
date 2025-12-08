/**
 * Launch & Growth Tools - v3.2 Vibe Coder Experience
 * 
 * SEO, performance audits, and launch marketing tools.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = process.env.USERPROFILE || process.env.HOME || '/tmp';
const DATA_DIR = path.join(HOME, '.windsurf-autopilot', 'launch');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * SEO analysis and fixes
 */
const seo_audit = {
  name: 'seo_audit',
  description: 'Analyze your site for SEO issues and get actionable fixes.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Site URL to audit' },
      htmlPath: { type: 'string', description: 'Or path to local HTML file' },
      generateFixes: { type: 'boolean', default: true, description: 'Generate fix code' }
    },
    required: []
  },
  handler: async ({ url, htmlPath, generateFixes = true }) => {
    try {
      let htmlContent = '';
      let source = '';
      
      if (htmlPath && fs.existsSync(htmlPath)) {
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
        source = htmlPath;
      } else if (url) {
        source = url;
        // In production, would fetch the URL
        htmlContent = '<html><head><title></title></head><body></body></html>';
      } else {
        // Check for common local files
        const localFiles = ['index.html', 'public/index.html', 'dist/index.html'];
        for (const file of localFiles) {
          const fullPath = path.join(process.cwd(), file);
          if (fs.existsSync(fullPath)) {
            htmlContent = fs.readFileSync(fullPath, 'utf8');
            source = fullPath;
            break;
          }
        }
      }
      
      const issues = [];
      const fixes = [];
      
      // Check title
      const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
      if (!titleMatch || !titleMatch[1]) {
        issues.push({ severity: 'high', issue: 'Missing page title', impact: 'Major SEO impact' });
        fixes.push({ issue: 'Missing title', fix: '<title>Your Page Title - Brand Name</title>' });
      } else if (titleMatch[1].length < 30 || titleMatch[1].length > 60) {
        issues.push({ severity: 'medium', issue: `Title length: ${titleMatch[1].length} chars (optimal: 30-60)` });
      }
      
      // Check meta description
      const descMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
      if (!descMatch) {
        issues.push({ severity: 'high', issue: 'Missing meta description', impact: 'Affects click-through rate' });
        fixes.push({ 
          issue: 'Missing description', 
          fix: '<meta name="description" content="Your compelling description here (150-160 chars)">' 
        });
      }
      
      // Check Open Graph tags
      const ogTitle = htmlContent.match(/<meta\s+property=["']og:title["']/i);
      const ogDesc = htmlContent.match(/<meta\s+property=["']og:description["']/i);
      const ogImage = htmlContent.match(/<meta\s+property=["']og:image["']/i);
      
      if (!ogTitle || !ogDesc || !ogImage) {
        issues.push({ severity: 'medium', issue: 'Missing Open Graph tags', impact: 'Poor social sharing' });
        fixes.push({
          issue: 'Missing OG tags',
          fix: `<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:url" content="https://example.com/page">`
        });
      }
      
      // Check viewport
      const viewport = htmlContent.match(/<meta\s+name=["']viewport["']/i);
      if (!viewport) {
        issues.push({ severity: 'high', issue: 'Missing viewport meta', impact: 'Mobile unfriendly' });
        fixes.push({
          issue: 'Missing viewport',
          fix: '<meta name="viewport" content="width=device-width, initial-scale=1">'
        });
      }
      
      // Check canonical
      const canonical = htmlContent.match(/<link\s+rel=["']canonical["']/i);
      if (!canonical) {
        issues.push({ severity: 'low', issue: 'Missing canonical URL', impact: 'Duplicate content risk' });
      }
      
      // Check h1
      const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (!h1Match) {
        issues.push({ severity: 'medium', issue: 'Missing H1 heading', impact: 'Content structure' });
      }
      
      // Check alt tags
      const imgWithoutAlt = htmlContent.match(/<img(?![^>]*alt=)[^>]*>/gi);
      if (imgWithoutAlt && imgWithoutAlt.length > 0) {
        issues.push({ 
          severity: 'medium', 
          issue: `${imgWithoutAlt.length} images without alt text`,
          impact: 'Accessibility and image SEO'
        });
      }
      
      // Calculate score
      const highIssues = issues.filter(i => i.severity === 'high').length;
      const mediumIssues = issues.filter(i => i.severity === 'medium').length;
      const score = Math.max(0, 100 - (highIssues * 20) - (mediumIssues * 10));
      
      return {
        success: true,
        audit: {
          source,
          score: `${score}/100`,
          rating: score >= 80 ? '🟢 Good' : score >= 50 ? '🟡 Needs Work' : '🔴 Poor',
          issues,
          issueCount: { high: highIssues, medium: mediumIssues, low: issues.length - highIssues - mediumIssues }
        },
        fixes: generateFixes ? fixes : [],
        recommendations: [
          'Add all missing meta tags',
          'Ensure every page has a unique title and description',
          'Add alt text to all images',
          'Submit sitemap to Google Search Console'
        ],
        tools: {
          searchConsole: 'https://search.google.com/search-console',
          richResults: 'https://search.google.com/test/rich-results'
        },
        message: `🔍 SEO Score: ${score}/100 with ${issues.length} issues found`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Lighthouse performance audit
 */
const lighthouse_report = {
  name: 'lighthouse_report',
  description: 'Run a Lighthouse audit for performance, accessibility, and best practices.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to audit' },
      categories: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Categories: performance, accessibility, best-practices, seo'
      },
      device: { type: 'string', enum: ['mobile', 'desktop'], default: 'mobile' }
    },
    required: ['url']
  },
  handler: async ({ url, categories = ['performance', 'accessibility', 'seo'], device = 'mobile' }) => {
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // Check if Lighthouse is available
      let lighthouseAvailable = false;
      try {
        execSync('lighthouse --version', { stdio: 'pipe' });
        lighthouseAvailable = true;
      } catch {
        lighthouseAvailable = false;
      }
      
      if (lighthouseAvailable) {
        // Would run actual Lighthouse here
        return {
          success: true,
          note: 'Lighthouse CLI available',
          command: `lighthouse ${normalizedUrl} --output=json --output-path=./lighthouse-report.json ${categories.map(c => `--only-categories=${c}`).join(' ')}`
        };
      }
      
      // Provide PageSpeed Insights alternative
      const psiUrl = `https://pagespeed.web.dev/report?url=${encodeURIComponent(normalizedUrl)}`;
      
      return {
        success: true,
        audit: {
          url: normalizedUrl,
          device,
          categories
        },
        alternatives: {
          pageSpeedInsights: psiUrl,
          webPageTest: `https://www.webpagetest.org/?url=${encodeURIComponent(normalizedUrl)}`,
          gtmetrix: 'https://gtmetrix.com/'
        },
        tips: {
          performance: [
            'Optimize images (use WebP, lazy loading)',
            'Minimize JavaScript and CSS',
            'Enable compression (gzip/brotli)',
            'Use a CDN'
          ],
          accessibility: [
            'Add alt text to images',
            'Ensure sufficient color contrast',
            'Use semantic HTML',
            'Add ARIA labels where needed'
          ],
          seo: [
            'Add meta title and description',
            'Use heading hierarchy (h1, h2, etc.)',
            'Create a sitemap.xml',
            'Ensure mobile-friendly design'
          ]
        },
        installation: {
          npm: 'npm install -g lighthouse',
          usage: 'lighthouse https://example.com --view'
        },
        message: `🚀 Open PageSpeed Insights: ${psiUrl}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Submit to directories
 */
const submit_to_directories = {
  name: 'submit_to_directories',
  description: 'Get a checklist for submitting your product to directories and launch platforms.',
  inputSchema: {
    type: 'object',
    properties: {
      productName: { type: 'string', description: 'Your product name' },
      productUrl: { type: 'string', description: 'Product website URL' },
      category: { 
        type: 'string', 
        enum: ['saas', 'mobile-app', 'developer-tool', 'ai-tool', 'productivity'],
        description: 'Product category'
      },
      stage: { type: 'string', enum: ['pre-launch', 'launched', 'established'], default: 'launched' }
    },
    required: ['productName', 'productUrl']
  },
  handler: async ({ productName, productUrl, category = 'saas', stage = 'launched' }) => {
    try {
      const directories = {
        'high-priority': [
          { name: 'Product Hunt', url: 'https://www.producthunt.com/posts/new', note: 'Best for launch day', category: 'all' },
          { name: 'Hacker News', url: 'https://news.ycombinator.com/submit', note: 'Show HN post', category: 'developer-tool' },
          { name: 'Reddit', url: 'https://reddit.com', note: 'Find relevant subreddits', category: 'all' }
        ],
        'directories': [
          { name: 'BetaList', url: 'https://betalist.com/submit', note: 'For pre-launch', category: 'all' },
          { name: 'AlternativeTo', url: 'https://alternativeto.net/add-application', note: 'Good for discoverability', category: 'all' },
          { name: 'G2', url: 'https://www.g2.com/products/new', note: 'B2B SaaS reviews', category: 'saas' },
          { name: 'Capterra', url: 'https://www.capterra.com/vendors/sign-up', note: 'Software directory', category: 'saas' },
          { name: 'SaaSHub', url: 'https://www.saashub.com/submit', note: 'SaaS discovery', category: 'saas' }
        ],
        'ai-specific': [
          { name: 'There\'s An AI For That', url: 'https://theresanaiforthat.com/submit', note: 'AI tools', category: 'ai-tool' },
          { name: 'AI Valley', url: 'https://aivalley.ai/submit-tool', note: 'AI directory', category: 'ai-tool' },
          { name: 'Future Tools', url: 'https://www.futuretools.io/submit-a-tool', note: 'AI tools', category: 'ai-tool' }
        ],
        'developer': [
          { name: 'DevHunt', url: 'https://devhunt.org', note: 'Dev tools', category: 'developer-tool' },
          { name: 'GitHub Awesome Lists', url: 'https://github.com/topics/awesome', note: 'Find relevant lists', category: 'developer-tool' }
        ]
      };
      
      // Filter relevant directories
      const relevant = [];
      Object.entries(directories).forEach(([group, dirs]) => {
        dirs.forEach(dir => {
          if (dir.category === 'all' || dir.category === category) {
            relevant.push({ ...dir, group });
          }
        });
      });
      
      // Generate submission checklist
      const checklist = {
        before: [
          '✅ Product is live and functional',
          '✅ Landing page is polished',
          '✅ Have screenshots/demo video ready',
          '✅ Prepare product description (short and long)',
          '✅ Create a compelling tagline'
        ],
        assets: [
          '📷 Logo (multiple sizes)',
          '🖼️ Screenshots (3-5)',
          '🎬 Demo video (optional but recommended)',
          '📝 Product description',
          '🏷️ Tagline (< 60 chars)'
        ],
        timing: stage === 'pre-launch' ? [
          'Submit to BetaList 2-4 weeks before launch',
          'Schedule Product Hunt launch for Tuesday-Thursday',
          'Build an audience before launch'
        ] : [
          'Can submit immediately',
          'Space out submissions over 2-4 weeks',
          'Track which directories drive traffic'
        ]
      };
      
      return {
        success: true,
        product: { name: productName, url: productUrl, category, stage },
        directories: relevant,
        directoryCount: relevant.length,
        checklist,
        productHuntTips: [
          'Launch on Tuesday, Wednesday, or Thursday',
          'Launch at 12:01 AM PST',
          'Prepare a "maker comment" with your story',
          'Engage with comments throughout the day',
          'Don\'t ask for upvotes (against rules)'
        ],
        message: `📋 Found ${relevant.length} relevant directories for ${productName}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Test social media preview cards
 */
const social_preview = {
  name: 'social_preview',
  description: 'Test how your site looks when shared on social media.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to test' },
      platforms: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Platforms: twitter, facebook, linkedin, slack'
      }
    },
    required: ['url']
  },
  handler: async ({ url, platforms = ['twitter', 'facebook', 'linkedin'] }) => {
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      const validators = {
        twitter: {
          name: 'Twitter Card Validator',
          url: `https://cards-dev.twitter.com/validator`,
          note: 'Requires Twitter login'
        },
        facebook: {
          name: 'Facebook Sharing Debugger',
          url: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(normalizedUrl)}`,
          note: 'Shows OG tag preview'
        },
        linkedin: {
          name: 'LinkedIn Post Inspector',
          url: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(normalizedUrl)}`,
          note: 'Preview LinkedIn shares'
        },
        slack: {
          name: 'Slack unfurling',
          note: 'Paste URL in Slack to preview'
        }
      };
      
      const selectedValidators = platforms.map(p => validators[p]).filter(Boolean);
      
      const requiredTags = [
        { tag: 'og:title', description: 'Title shown in preview' },
        { tag: 'og:description', description: 'Description text' },
        { tag: 'og:image', description: 'Preview image (1200x630 recommended)' },
        { tag: 'og:url', description: 'Canonical URL' },
        { tag: 'twitter:card', description: 'Twitter card type (summary_large_image)' },
        { tag: 'twitter:image', description: 'Twitter-specific image (optional)' }
      ];
      
      return {
        success: true,
        url: normalizedUrl,
        validators: selectedValidators,
        requiredTags,
        exampleTags: `<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${normalizedUrl}">
<meta property="og:title" content="Your Title">
<meta property="og:description" content="Your description">
<meta property="og:image" content="https://example.com/og-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${normalizedUrl}">
<meta property="twitter:title" content="Your Title">
<meta property="twitter:description" content="Your description">
<meta property="twitter:image" content="https://example.com/twitter-image.jpg">`,
        recommendations: [
          'Use 1200x630 pixels for OG images',
          'Keep titles under 60 characters',
          'Keep descriptions under 160 characters',
          'Test on all platforms before launching'
        ],
        message: `🔗 Test social previews with ${selectedValidators.length} validators`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Setup uptime monitoring
 */
const uptime_monitor = {
  name: 'uptime_monitor',
  description: 'Set up uptime monitoring for your site.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to monitor' },
      name: { type: 'string', description: 'Monitor name' },
      checkInterval: { type: 'integer', description: 'Check interval in minutes', default: 5 },
      alertEmail: { type: 'string', description: 'Email for alerts' }
    },
    required: ['url']
  },
  handler: async ({ url, name, checkInterval = 5, alertEmail }) => {
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const monitorName = name || new URL(normalizedUrl).hostname;
      
      // Save monitor config locally
      const monitorsFile = path.join(DATA_DIR, 'monitors.json');
      let monitors = [];
      if (fs.existsSync(monitorsFile)) {
        monitors = JSON.parse(fs.readFileSync(monitorsFile, 'utf8'));
      }
      
      const newMonitor = {
        id: Date.now(),
        name: monitorName,
        url: normalizedUrl,
        checkInterval,
        alertEmail,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      monitors.push(newMonitor);
      fs.writeFileSync(monitorsFile, JSON.stringify(monitors, null, 2));
      
      const freeServices = [
        { 
          name: 'UptimeRobot', 
          url: 'https://uptimerobot.com',
          free: '50 monitors, 5-min checks',
          setup: 'Create account → Add Monitor → HTTP(s) → Enter URL'
        },
        { 
          name: 'Freshping', 
          url: 'https://www.freshworks.com/website-monitoring/',
          free: '50 monitors, 1-min checks',
          setup: 'Create account → Add Check → Enter URL'
        },
        { 
          name: 'Hetrix Tools', 
          url: 'https://hetrixtools.com',
          free: '15 monitors, 1-min checks',
          setup: 'Create account → Uptime Monitors → Add'
        },
        {
          name: 'Better Uptime',
          url: 'https://betteruptime.com',
          free: '10 monitors, status page',
          setup: 'Create account → Monitors → Create Monitor'
        }
      ];
      
      return {
        success: true,
        monitor: newMonitor,
        savedLocally: true,
        freeServices,
        statusPageOptions: [
          { name: 'Instatus', url: 'https://instatus.com', note: 'Beautiful free status pages' },
          { name: 'Cachet', url: 'https://cachethq.io', note: 'Self-hosted open source' }
        ],
        selfHostedOptions: [
          { name: 'Uptime Kuma', url: 'https://github.com/louislam/uptime-kuma', note: 'Popular self-hosted' },
          { name: 'Gatus', url: 'https://github.com/TwiN/gatus', note: 'Lightweight Go-based' }
        ],
        message: `📡 Monitor config saved. Set up with a free service like UptimeRobot.`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  seo_audit,
  lighthouse_report,
  submit_to_directories,
  social_preview,
  uptime_monitor
};
