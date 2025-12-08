/**
 * Quick Start Wizard Tools - v3.2 Vibe Coder Experience
 * 
 * One-command solutions for creating projects, web apps, APIs, and more.
 * Perfect for non-technical users who want to build quickly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Data directory
const HOME = process.env.USERPROFILE || process.env.HOME || '/tmp';
const TEMPLATES_DIR = path.join(HOME, '.windsurf-autopilot', 'templates');

// Ensure directories exist
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

/**
 * Interactive guided project setup
 */
const project_wizard = {
  name: 'project_wizard',
  description: 'Interactive guided project setup. Asks questions and creates the perfect project structure.',
  inputSchema: {
    type: 'object',
    properties: {
      answers: { 
        type: 'object', 
        description: 'Pre-filled answers: name, type, features, styling, database',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['web-app', 'api', 'mobile', 'cli', 'library'] },
          features: { type: 'array', items: { type: 'string' } },
          styling: { type: 'string', enum: ['tailwind', 'css', 'scss', 'styled-components'] },
          database: { type: 'string', enum: ['none', 'sqlite', 'postgres', 'mongodb'] }
        }
      },
      path: { type: 'string', description: 'Where to create the project' }
    },
    required: []
  },
  handler: async ({ answers = {}, path: projectPath }) => {
    try {
      // If no answers, return questions
      if (!answers.name || !answers.type) {
        return {
          success: true,
          stage: 'questions',
          questions: [
            {
              id: 'name',
              question: 'What would you like to call your project?',
              type: 'text',
              default: 'my-awesome-project'
            },
            {
              id: 'type',
              question: 'What type of project is this?',
              type: 'select',
              options: ['web-app', 'api', 'mobile', 'cli', 'library'],
              default: 'web-app'
            },
            {
              id: 'features',
              question: 'What features do you need?',
              type: 'multiselect',
              options: ['authentication', 'database', 'api', 'testing', 'deployment'],
              default: ['authentication', 'database']
            },
            {
              id: 'styling',
              question: 'How would you like to style it?',
              type: 'select',
              options: ['tailwind', 'css', 'scss', 'styled-components'],
              default: 'tailwind'
            }
          ],
          message: 'Please answer these questions to create your project.'
        };
      }
      
      // Generate project based on answers
      const targetPath = projectPath || path.join(process.cwd(), answers.name);
      
      // Define project structure based on type
      const structures = {
        'web-app': {
          folders: ['src', 'src/components', 'src/pages', 'src/styles', 'public'],
          files: {
            'package.json': JSON.stringify({
              name: answers.name,
              version: '1.0.0',
              scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start'
              },
              dependencies: {
                next: 'latest',
                react: 'latest',
                'react-dom': 'latest'
              }
            }, null, 2),
            'src/pages/index.js': `export default function Home() {
  return (
    <div>
      <h1>Welcome to ${answers.name}!</h1>
      <p>Your project is ready.</p>
    </div>
  );
}`,
            'README.md': `# ${answers.name}\n\nCreated with Windsurf Autopilot.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`
          }
        },
        'api': {
          folders: ['src', 'src/routes', 'src/middleware', 'tests'],
          files: {
            'package.json': JSON.stringify({
              name: answers.name,
              version: '1.0.0',
              scripts: {
                start: 'node src/index.js',
                dev: 'nodemon src/index.js'
              },
              dependencies: {
                express: 'latest',
                cors: 'latest'
              }
            }, null, 2),
            'src/index.js': `const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${answers.name} API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
            'README.md': `# ${answers.name} API\n\nREST API created with Windsurf Autopilot.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n`
          }
        },
        'mobile': {
          folders: ['src', 'src/screens', 'src/components', 'assets'],
          files: {
            'package.json': JSON.stringify({
              name: answers.name,
              version: '1.0.0',
              scripts: {
                start: 'expo start',
                android: 'expo start --android',
                ios: 'expo start --ios'
              }
            }, null, 2),
            'App.js': `import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ${answers.name}!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' }
});`,
            'README.md': `# ${answers.name}\n\nMobile app created with Windsurf Autopilot.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n`
          }
        },
        'cli': {
          folders: ['src', 'bin'],
          files: {
            'package.json': JSON.stringify({
              name: answers.name,
              version: '1.0.0',
              bin: { [answers.name]: './bin/cli.js' },
              dependencies: { commander: 'latest' }
            }, null, 2),
            'bin/cli.js': `#!/usr/bin/env node
const { program } = require('commander');

program
  .name('${answers.name}')
  .description('CLI created with Windsurf Autopilot')
  .version('1.0.0');

program
  .command('hello <name>')
  .description('Say hello')
  .action((name) => console.log(\`Hello, \${name}!\`));

program.parse();`,
            'README.md': `# ${answers.name}\n\nCLI tool created with Windsurf Autopilot.\n\n## Installation\n\n\`\`\`bash\nnpm install -g .\n\`\`\`\n`
          }
        },
        'library': {
          folders: ['src', 'tests', 'docs'],
          files: {
            'package.json': JSON.stringify({
              name: answers.name,
              version: '1.0.0',
              main: 'src/index.js',
              scripts: { test: 'jest' }
            }, null, 2),
            'src/index.js': `/**
 * ${answers.name}
 * Created with Windsurf Autopilot
 */

module.exports = {
  greet: (name) => \`Hello, \${name}!\`,
  version: '1.0.0'
};`,
            'README.md': `# ${answers.name}\n\nLibrary created with Windsurf Autopilot.\n\n## Usage\n\n\`\`\`javascript\nconst lib = require('${answers.name}');\nconsole.log(lib.greet('World'));\n\`\`\`\n`
          }
        }
      };
      
      const structure = structures[answers.type] || structures['web-app'];
      
      // Create project
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      
      // Create folders
      for (const folder of structure.folders) {
        const folderPath = path.join(targetPath, folder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      }
      
      // Create files
      for (const [file, content] of Object.entries(structure.files)) {
        const filePath = path.join(targetPath, file);
        fs.writeFileSync(filePath, content);
      }
      
      return {
        success: true,
        stage: 'complete',
        project: {
          name: answers.name,
          type: answers.type,
          path: targetPath,
          files: Object.keys(structure.files),
          folders: structure.folders
        },
        nextSteps: [
          `cd ${answers.name}`,
          'npm install',
          answers.type === 'web-app' ? 'npm run dev' : 'npm start'
        ],
        message: `🎉 Created ${answers.name} at ${targetPath}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * One-command full-stack web app
 */
const quick_web_app = {
  name: 'quick_web_app',
  description: 'Create a complete full-stack web application with one command. Includes frontend, API, and database.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Project name' },
      features: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Features to include: auth, database, api, file-upload'
      },
      style: { 
        type: 'string', 
        enum: ['modern', 'minimal', 'corporate', 'creative'],
        default: 'modern',
        description: 'Visual style'
      },
      path: { type: 'string', description: 'Where to create the project' }
    },
    required: ['name']
  },
  handler: async ({ name, features = ['auth', 'database'], style = 'modern', path: projectPath }) => {
    try {
      const targetPath = projectPath || path.join(process.cwd(), name);
      
      // Create project structure
      const folders = [
        'src', 'src/app', 'src/components', 'src/lib', 'src/api',
        'public', 'prisma'
      ];
      
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      
      folders.forEach(folder => {
        const folderPath = path.join(targetPath, folder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      });
      
      // Create package.json
      const packageJson = {
        name,
        version: '1.0.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint'
        },
        dependencies: {
          next: '^14',
          react: '^18',
          'react-dom': '^18',
          'lucide-react': '^0.300',
          'tailwindcss': '^3',
          autoprefixer: '^10',
          postcss: '^8'
        }
      };
      
      if (features.includes('database')) {
        packageJson.dependencies['@prisma/client'] = '^5';
        packageJson.devDependencies = { prisma: '^5' };
      }
      
      if (features.includes('auth')) {
        packageJson.dependencies['next-auth'] = '^4';
      }
      
      fs.writeFileSync(
        path.join(targetPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // Create main page
      const styleClasses = {
        modern: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
        minimal: 'bg-white text-gray-900',
        corporate: 'bg-slate-100 text-slate-900',
        creative: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white'
      };
      
      const pageContent = `export default function Home() {
  return (
    <main className="min-h-screen ${styleClasses[style]} flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-4">${name}</h1>
        <p className="text-xl opacity-90">Your web app is ready!</p>
        <div className="mt-8 space-x-4">
          <button className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100">
            Get Started
          </button>
          <button className="px-6 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white/10">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
}`;
      
      fs.writeFileSync(path.join(targetPath, 'src/app/page.js'), pageContent);
      
      // Create layout
      const layoutContent = `import './globals.css';

export const metadata = {
  title: '${name}',
  description: 'Created with Windsurf Autopilot'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`;
      
      fs.writeFileSync(path.join(targetPath, 'src/app/layout.js'), layoutContent);
      
      // Create globals.css
      const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground: 0 0% 3.9%;
  --background: 0 0% 98%;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}`;
      
      fs.writeFileSync(path.join(targetPath, 'src/app/globals.css'), cssContent);
      
      // Create tailwind.config.js
      const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: []
};`;
      
      fs.writeFileSync(path.join(targetPath, 'tailwind.config.js'), tailwindConfig);
      
      // Create README
      const readme = `# ${name}

Full-stack web application created with Windsurf Autopilot.

## Features
${features.map(f => `- ${f}`).join('\n')}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your app.
`;
      
      fs.writeFileSync(path.join(targetPath, 'README.md'), readme);
      
      return {
        success: true,
        project: {
          name,
          path: targetPath,
          style,
          features
        },
        files: ['package.json', 'src/app/page.js', 'src/app/layout.js', 'tailwind.config.js', 'README.md'],
        nextSteps: [
          `cd ${name}`,
          'npm install',
          'npm run dev',
          'Open http://localhost:3000'
        ],
        message: `🚀 Created full-stack web app "${name}" with ${features.join(', ')}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * One-command landing page
 */
const quick_landing = {
  name: 'quick_landing',
  description: 'Create a professional landing page in 30 seconds. Perfect for marketing and lead capture.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Project/product name' },
      headline: { type: 'string', description: 'Main headline' },
      subheadline: { type: 'string', description: 'Supporting text' },
      cta: { type: 'string', description: 'Call-to-action button text' },
      features: { type: 'array', items: { type: 'string' }, description: 'List of features' },
      path: { type: 'string', description: 'Where to create' }
    },
    required: ['name', 'headline']
  },
  handler: async ({ name, headline, subheadline = '', cta = 'Get Started', features = [], path: projectPath }) => {
    try {
      const targetPath = projectPath || path.join(process.cwd(), name.toLowerCase().replace(/\s+/g, '-'));
      
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      
      const featuresHtml = features.length > 0 
        ? `<section class="py-20 bg-gray-50">
          <div class="max-w-6xl mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-12">Features</h2>
            <div class="grid md:grid-cols-3 gap-8">
              ${features.map(f => `<div class="bg-white p-6 rounded-xl shadow-sm">
                <div class="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h3 class="font-semibold mb-2">${f}</h3>
                <p class="text-gray-600 text-sm">Lorem ipsum dolor sit amet consectetur.</p>
              </div>`).join('\n              ')}
            </div>
          </div>
        </section>`
        : '';
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
  <!-- Hero Section -->
  <header class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white">
    <div class="text-center px-4 max-w-4xl">
      <h1 class="text-5xl md:text-7xl font-bold mb-6">${headline}</h1>
      ${subheadline ? `<p class="text-xl md:text-2xl opacity-90 mb-8">${subheadline}</p>` : ''}
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="#signup" class="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 transition">
          ${cta}
        </a>
        <a href="#features" class="px-8 py-4 border-2 border-white rounded-full font-semibold hover:bg-white/10 transition">
          Learn More
        </a>
      </div>
    </div>
  </header>

  ${featuresHtml}

  <!-- CTA Section -->
  <section id="signup" class="py-20 bg-blue-600 text-white">
    <div class="max-w-2xl mx-auto text-center px-4">
      <h2 class="text-3xl font-bold mb-4">Ready to get started?</h2>
      <p class="mb-8 opacity-90">Join thousands of satisfied users today.</p>
      <form class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
        <input type="email" placeholder="Enter your email" 
          class="flex-1 px-4 py-3 rounded-lg text-gray-900" required>
        <button type="submit" class="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
          ${cta}
        </button>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-8 bg-gray-900 text-gray-400 text-center">
    <p>&copy; ${new Date().getFullYear()} ${name}. All rights reserved.</p>
  </footer>
</body>
</html>`;
      
      fs.writeFileSync(path.join(targetPath, 'index.html'), html);
      
      // Create README
      const readme = `# ${name} Landing Page

Created with Windsurf Autopilot.

## Preview

Open \`index.html\` in your browser.

## Deploy

Upload to any static hosting:
- Netlify
- Vercel
- GitHub Pages
- Any web server
`;
      
      fs.writeFileSync(path.join(targetPath, 'README.md'), readme);
      
      return {
        success: true,
        project: {
          name,
          path: targetPath,
          headline,
          features: features.length
        },
        files: ['index.html', 'README.md'],
        previewUrl: `file://${path.join(targetPath, 'index.html')}`,
        nextSteps: [
          'Open index.html in your browser to preview',
          'Customize colors and content as needed',
          'Deploy to Netlify or Vercel for free hosting'
        ],
        message: `🎨 Created landing page for "${name}"`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * One-command REST API
 */
const quick_api = {
  name: 'quick_api',
  description: 'Create a complete REST API with one command. Includes routes, middleware, and documentation.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'API project name' },
      resources: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Resources to create (e.g., users, posts, products)'
      },
      auth: { type: 'boolean', default: true, description: 'Include authentication' },
      path: { type: 'string', description: 'Where to create' }
    },
    required: ['name']
  },
  handler: async ({ name, resources = ['items'], auth = true, path: projectPath }) => {
    try {
      const targetPath = projectPath || path.join(process.cwd(), name);
      
      const folders = ['src', 'src/routes', 'src/middleware', 'src/models'];
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      folders.forEach(f => {
        const fp = path.join(targetPath, f);
        if (!fs.existsSync(fp)) fs.mkdirSync(fp, { recursive: true });
      });
      
      // Package.json
      const pkg = {
        name,
        version: '1.0.0',
        scripts: {
          start: 'node src/index.js',
          dev: 'nodemon src/index.js'
        },
        dependencies: {
          express: '^4.18',
          cors: '^2.8',
          helmet: '^7'
        }
      };
      if (auth) {
        pkg.dependencies['jsonwebtoken'] = '^9';
        pkg.dependencies['bcryptjs'] = '^2.4';
      }
      fs.writeFileSync(path.join(targetPath, 'package.json'), JSON.stringify(pkg, null, 2));
      
      // Main server file
      const serverCode = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    name: '${name}',
    version: '1.0.0',
    status: 'running',
    endpoints: [${resources.map(r => `'/api/${r}'`).join(', ')}]
  });
});

// Routes
${resources.map(r => `app.use('/api/${r}', require('./routes/${r}'));`).join('\n')}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`🚀 ${name} API running on port \${PORT}\`));
`;
      fs.writeFileSync(path.join(targetPath, 'src/index.js'), serverCode);
      
      // Create route files for each resource
      resources.forEach(resource => {
        const routeCode = `const express = require('express');
const router = express.Router();

// In-memory storage (replace with database)
let ${resource} = [];
let nextId = 1;

// GET all
router.get('/', (req, res) => {
  res.json(${resource});
});

// GET one
router.get('/:id', (req, res) => {
  const item = ${resource}.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST create
router.post('/', (req, res) => {
  const item = { id: nextId++, ...req.body, createdAt: new Date() };
  ${resource}.push(item);
  res.status(201).json(item);
});

// PUT update
router.put('/:id', (req, res) => {
  const index = ${resource}.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  ${resource}[index] = { ...${resource}[index], ...req.body, updatedAt: new Date() };
  res.json(${resource}[index]);
});

// DELETE
router.delete('/:id', (req, res) => {
  const index = ${resource}.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  ${resource}.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
`;
        fs.writeFileSync(path.join(targetPath, `src/routes/${resource}.js`), routeCode);
      });
      
      // README with API docs
      const readme = `# ${name} API

REST API created with Windsurf Autopilot.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Endpoints

${resources.map(r => `### ${r.charAt(0).toUpperCase() + r.slice(1)}

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/${r} | Get all ${r} |
| GET | /api/${r}/:id | Get one ${r} |
| POST | /api/${r} | Create ${r} |
| PUT | /api/${r}/:id | Update ${r} |
| DELETE | /api/${r}/:id | Delete ${r} |
`).join('\n')}
`;
      fs.writeFileSync(path.join(targetPath, 'README.md'), readme);
      
      return {
        success: true,
        project: { name, path: targetPath, resources, auth },
        endpoints: resources.map(r => ({
          resource: r,
          url: `/api/${r}`,
          methods: ['GET', 'POST', 'PUT', 'DELETE']
        })),
        nextSteps: ['npm install', 'npm start', 'Test with: curl http://localhost:3000'],
        message: `🔧 Created REST API "${name}" with ${resources.length} resource(s)`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * One-command mobile app
 */
const quick_mobile = {
  name: 'quick_mobile',
  description: 'Create a mobile app with one command using React Native/Expo.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'App name' },
      platform: { 
        type: 'string', 
        enum: ['ios', 'android', 'both'],
        default: 'both',
        description: 'Target platform'
      },
      template: {
        type: 'string',
        enum: ['blank', 'tabs', 'drawer'],
        default: 'blank',
        description: 'App template'
      },
      path: { type: 'string', description: 'Where to create' }
    },
    required: ['name']
  },
  handler: async ({ name, platform = 'both', template = 'blank', path: projectPath }) => {
    try {
      const targetPath = projectPath || path.join(process.cwd(), name);
      
      const folders = ['src', 'src/screens', 'src/components', 'src/navigation', 'assets'];
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      folders.forEach(f => {
        const fp = path.join(targetPath, f);
        if (!fs.existsSync(fp)) fs.mkdirSync(fp, { recursive: true });
      });
      
      // Package.json
      const pkg = {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        main: 'App.js',
        scripts: {
          start: 'expo start',
          android: 'expo start --android',
          ios: 'expo start --ios',
          web: 'expo start --web'
        },
        dependencies: {
          expo: '~49.0.0',
          'expo-status-bar': '~1.6.0',
          react: '18.2.0',
          'react-native': '0.72.0',
          '@react-navigation/native': '^6',
          '@react-navigation/native-stack': '^6'
        }
      };
      fs.writeFileSync(path.join(targetPath, 'package.json'), JSON.stringify(pkg, null, 2));
      
      // App.js
      const appJs = `import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '${name}' }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}`;
      fs.writeFileSync(path.join(targetPath, 'App.js'), appJs);
      
      // HomeScreen
      const homeScreen = `import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ${name}!</Text>
      <Text style={styles.subtitle}>Your mobile app is ready.</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});`;
      fs.writeFileSync(path.join(targetPath, 'src/screens/HomeScreen.js'), homeScreen);
      
      // app.json
      const appJson = {
        expo: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          orientation: 'portrait',
          platforms: platform === 'both' ? ['ios', 'android'] : [platform],
          ios: { supportsTablet: true },
          android: { adaptiveIcon: { backgroundColor: '#ffffff' } }
        }
      };
      fs.writeFileSync(path.join(targetPath, 'app.json'), JSON.stringify(appJson, null, 2));
      
      // README
      const readme = `# ${name}

Mobile app created with Windsurf Autopilot using React Native/Expo.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

Scan the QR code with Expo Go app on your phone.

## Build for Production

\`\`\`bash
expo build:android
expo build:ios
\`\`\`
`;
      fs.writeFileSync(path.join(targetPath, 'README.md'), readme);
      
      return {
        success: true,
        project: { name, path: targetPath, platform, template },
        runCommand: 'npx expo start',
        nextSteps: [
          'npm install',
          'npm start',
          'Scan QR code with Expo Go app',
          'Edit src/screens/HomeScreen.js'
        ],
        message: `📱 Created mobile app "${name}" for ${platform}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * One-command Chrome extension
 */
const quick_chrome_ext = {
  name: 'quick_chrome_ext',
  description: 'Create a Chrome extension with one command. Includes popup, background script, and storage.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Extension name' },
      description: { type: 'string', description: 'Extension description' },
      permissions: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Permissions: storage, tabs, activeTab, notifications'
      },
      path: { type: 'string', description: 'Where to create' }
    },
    required: ['name']
  },
  handler: async ({ name, description = 'Chrome extension created with Windsurf Autopilot', permissions = ['storage', 'activeTab'], path: projectPath }) => {
    try {
      const targetPath = projectPath || path.join(process.cwd(), name.toLowerCase().replace(/\s+/g, '-'));
      
      const folders = ['images', 'scripts'];
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      folders.forEach(f => {
        const fp = path.join(targetPath, f);
        if (!fs.existsSync(fp)) fs.mkdirSync(fp, { recursive: true });
      });
      
      // manifest.json (Manifest V3)
      const manifest = {
        manifest_version: 3,
        name,
        description,
        version: '1.0.0',
        permissions,
        action: {
          default_popup: 'popup.html',
          default_icon: { '16': 'images/icon16.png', '48': 'images/icon48.png', '128': 'images/icon128.png' }
        },
        background: { service_worker: 'scripts/background.js' },
        icons: { '16': 'images/icon16.png', '48': 'images/icon48.png', '128': 'images/icon128.png' }
      };
      fs.writeFileSync(path.join(targetPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
      
      // popup.html
      const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { width: 300px; padding: 15px; font-family: system-ui; }
    h1 { font-size: 18px; margin: 0 0 15px; }
    button { width: 100%; padding: 10px; background: #4285f4; color: white; border: none; border-radius: 5px; cursor: pointer; }
    button:hover { background: #3367d6; }
    #status { margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <button id="actionBtn">Click Me!</button>
  <div id="status">Ready</div>
  <script src="scripts/popup.js"></script>
</body>
</html>`;
      fs.writeFileSync(path.join(targetPath, 'popup.html'), popupHtml);
      
      // popup.js
      const popupJs = `document.getElementById('actionBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Working...';
  
  // Example: Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  status.textContent = 'Current tab: ' + tab.title;
  
  // Save to storage
  await chrome.storage.local.set({ lastAction: new Date().toISOString() });
});

// Load saved data on popup open
chrome.storage.local.get(['lastAction'], (result) => {
  if (result.lastAction) {
    console.log('Last action:', result.lastAction);
  }
});`;
      fs.writeFileSync(path.join(targetPath, 'scripts/popup.js'), popupJs);
      
      // background.js
      const backgroundJs = `// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('${name} installed!');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getData') {
    sendResponse({ data: 'Hello from background!' });
  }
  return true;
});`;
      fs.writeFileSync(path.join(targetPath, 'scripts/background.js'), backgroundJs);
      
      // README
      const readme = `# ${name}

Chrome extension created with Windsurf Autopilot.

## Installation

1. Open Chrome and go to \`chrome://extensions/\`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this folder

## Files

- \`manifest.json\` - Extension configuration
- \`popup.html/js\` - Popup UI and logic
- \`scripts/background.js\` - Background service worker
- \`images/\` - Extension icons (add your own!)

## Permissions

${permissions.map(p => `- ${p}`).join('\n')}
`;
      fs.writeFileSync(path.join(targetPath, 'README.md'), readme);
      
      return {
        success: true,
        project: { name, path: targetPath, permissions },
        loadInstructions: [
          'Open chrome://extensions/',
          'Enable "Developer mode"',
          'Click "Load unpacked"',
          `Select: ${targetPath}`
        ],
        nextSteps: [
          'Add icon images (16x16, 48x48, 128x128)',
          'Customize popup.html and popup.js',
          'Test by loading in Chrome'
        ],
        message: `🧩 Created Chrome extension "${name}"`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  project_wizard,
  quick_web_app,
  quick_landing,
  quick_api,
  quick_mobile,
  quick_chrome_ext
};
