import React, { useState } from 'react';
import { Check, X, Server, Brain, Database, Search, Code, Cloud, Shield, Zap } from 'lucide-react';

export default function FreeLocalComparison() {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: Server },
    { id: 'llm', name: 'LLM Runtime', icon: Brain },
    { id: 'vector', name: 'Vector DB', icon: Database },
    { id: 'search', name: 'Web Search', icon: Search },
    { id: 'code', name: 'Code Assist', icon: Code },
    { id: 'deploy', name: 'Deployment', icon: Cloud },
  ];

  const tools = [
    // LLM Runtime
    { category: 'llm', name: 'Ollama', free: true, local: true, paidAlt: 'OpenAI API', savings: '$20+/mo', quality: 95, ease: 90, note: 'Run 70B+ models locally with your GPU' },
    { category: 'llm', name: 'LM Studio', free: true, local: true, paidAlt: 'Claude API', savings: '$20+/mo', quality: 95, ease: 95, note: 'Beautiful GUI, supports GGUF models' },
    { category: 'llm', name: 'vLLM', free: true, local: true, paidAlt: 'Cloud LLM', savings: '$100+/mo', quality: 98, ease: 70, note: 'Production-grade serving' },
    { category: 'llm', name: 'llama.cpp', free: true, local: true, paidAlt: 'Any API', savings: '$50+/mo', quality: 90, ease: 60, note: 'Maximum performance, C++' },
    // Vector DB
    { category: 'vector', name: 'ChromaDB', free: true, local: true, paidAlt: 'Pinecone', savings: '$70+/mo', quality: 85, ease: 95, note: 'Perfect for prototyping' },
    { category: 'vector', name: 'Milvus', free: true, local: true, paidAlt: 'Pinecone Pro', savings: '$200+/mo', quality: 98, ease: 70, note: 'Billion-scale vectors' },
    { category: 'vector', name: 'Qdrant', free: true, local: true, paidAlt: 'Weaviate Cloud', savings: '$100+/mo', quality: 95, ease: 80, note: 'Rust-based, fast' },
    { category: 'vector', name: 'LanceDB', free: true, local: true, paidAlt: 'Any cloud', savings: '$50+/mo', quality: 90, ease: 90, note: 'Embedded, serverless' },
    // Web Search
    { category: 'search', name: 'SearXNG', free: true, local: true, paidAlt: 'Perplexity API', savings: '$20/mo', quality: 90, ease: 75, note: 'Privacy-first, self-hosted' },
    { category: 'search', name: 'DuckDuckGo MCP', free: true, local: false, paidAlt: 'Google Search API', savings: '$100+/mo', quality: 85, ease: 95, note: 'No API key needed' },
    { category: 'search', name: 'Brave Search MCP', free: true, local: false, paidAlt: 'Bing API', savings: '$50/mo', quality: 90, ease: 90, note: 'Free tier available' },
    // Code Assistant
    { category: 'code', name: 'Continue.dev', free: true, local: true, paidAlt: 'GitHub Copilot', savings: '$10/mo', quality: 90, ease: 95, note: 'Uses your local LLM' },
    { category: 'code', name: 'Windsurf Autopilot', free: true, local: true, paidAlt: 'Cursor Pro', savings: '$20/mo', quality: 95, ease: 85, note: '250+ tools included' },
    { category: 'code', name: 'Codeium', free: true, local: false, paidAlt: 'Copilot', savings: '$10/mo', quality: 88, ease: 95, note: 'Free cloud option' },
    // Deployment
    { category: 'deploy', name: 'Docker + Nginx', free: true, local: true, paidAlt: 'Vercel Pro', savings: '$20/mo', quality: 95, ease: 70, note: 'Full control' },
    { category: 'deploy', name: 'Coolify', free: true, local: true, paidAlt: 'Railway', savings: '$20/mo', quality: 90, ease: 85, note: 'Self-hosted PaaS' },
    { category: 'deploy', name: 'n8n', free: true, local: true, paidAlt: 'Zapier', savings: '$20+/mo', quality: 95, ease: 80, note: 'Workflow automation' },
  ];

  const filtered = activeCategory === 'all' ? tools : tools.filter(t => t.category === activeCategory);
  const totalSavings = tools.reduce((acc, t) => acc + parseInt(t.savings.replace(/[^0-9]/g, '')), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🚀 Free & Local Alternatives</h1>
          <p className="text-purple-200 text-lg">Everything you need for AI development — without paid subscriptions</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-6 py-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">Potential Monthly Savings: ${totalSavings}+</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeCategory === cat.id ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>
                <Icon className="w-4 h-4" />{cat.name}
              </button>
            );
          })}
        </div>

        {/* Tools Grid */}
        <div className="grid gap-4">
          {filtered.map((tool, idx) => (
            <div key={idx} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4 hover:border-purple-500/50 transition-all">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                    <div className="flex gap-1">
                      {tool.free && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">FREE</span>}
                      {tool.local && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">LOCAL</span>}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{tool.note}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Replaces:</span>
                    <span className="text-red-400 line-through">{tool.paidAlt}</span>
                    <span className="text-green-400 font-semibold">Save {tool.savings}</span>
                  </div>
                </div>
                <div className="flex gap-6 min-w-[250px]">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Quality</span><span>{tool.quality}%</span></div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${tool.quality}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Ease</span><span>{tool.ease}%</span></div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${tool.ease}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Your Hardware Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />Your Hardware Advantage
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">24GB</div>
              <div className="text-sm text-slate-400">RTX 3090 Ti VRAM</div>
              <div className="text-xs text-green-400 mt-1">Can run 70B+ models</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">128GB</div>
              <div className="text-sm text-slate-400">System RAM</div>
              <div className="text-xs text-green-400 mt-1">Massive context windows</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-pink-400">254</div>
              <div className="text-sm text-slate-400">Local AI Models</div>
              <div className="text-xs text-green-400 mt-1">1.16TB model library</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">$0</div>
              <div className="text-sm text-slate-400">Monthly API Costs</div>
              <div className="text-xs text-green-400 mt-1">100% self-hosted</div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">⚡ Quick Start Commands</h2>
          <div className="font-mono text-sm space-y-2">
            <div className="bg-slate-900 rounded p-3 text-green-400">
              <span className="text-slate-500"># Install Ollama</span><br />winget install Ollama.Ollama
            </div>
            <div className="bg-slate-900 rounded p-3 text-green-400">
              <span className="text-slate-500"># Pull your first model</span><br />ollama pull qwen2.5-coder:32b
            </div>
            <div className="bg-slate-900 rounded p-3 text-green-400">
              <span className="text-slate-500"># Start coding!</span><br />ollama run qwen2.5-coder:32b "Create a React component"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
