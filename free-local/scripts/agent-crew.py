#!/usr/bin/env python3
"""
============================================================================
CrewAI Agent Crew - Windsurf Vibe Free-Local
============================================================================
Multi-agent system for complex development tasks.
All agents use local Ollama models - no cloud APIs required.

Agents:
- Architect: System design, patterns, architecture
- Coder: Implementation, code generation
- Tester: Test writing, QA, edge cases
- Reviewer: Code review, security, best practices
- Researcher: Web search, documentation lookup
- DocWriter: Documentation, README, comments
============================================================================
"""

import os
import sys
import json
import argparse
from typing import List, Optional

# Check for crewai installation
try:
    from crewai import Agent, Task, Crew, Process
    from langchain_community.llms import Ollama
except ImportError:
    print("Installing required packages...")
    os.system("pip install crewai langchain langchain-community langchain-ollama --quiet")
    from crewai import Agent, Task, Crew, Process
    from langchain_community.llms import Ollama

# ============================================================================
# CONFIGURATION
# ============================================================================

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

MODELS = {
    "architect": "llama3.1:70b",      # Complex reasoning
    "coder": "qwen2.5-coder:32b",     # Primary coding
    "tester": "deepseek-coder-v2:16b", # Fast, good for tests
    "reviewer": "qwen2.5-coder:32b",  # Thorough review
    "researcher": "deepseek-coder-v2:16b",  # Fast lookups
    "docwriter": "deepseek-coder-v2:16b"    # Documentation
}

# Fallback if large models unavailable
FALLBACK_MODEL = "qwen2.5-coder:7b"

# ============================================================================
# AGENT DEFINITIONS
# ============================================================================

def get_llm(model_name: str) -> Ollama:
    """Get Ollama LLM with fallback."""
    try:
        return Ollama(model=model_name, base_url=OLLAMA_HOST)
    except Exception:
        print(f"Warning: {model_name} not available, using fallback")
        return Ollama(model=FALLBACK_MODEL, base_url=OLLAMA_HOST)

def create_architect() -> Agent:
    """Software Architect agent - designs systems."""
    return Agent(
        role="Software Architect",
        goal="Design scalable, maintainable, and elegant system architectures",
        backstory="""You are a seasoned software architect with 15+ years experience.
        You've designed systems handling millions of users. You think in terms of
        patterns, trade-offs, scalability, and long-term maintainability.
        You prefer pragmatic solutions over theoretical perfection.""",
        llm=get_llm(MODELS["architect"]),
        verbose=True,
        allow_delegation=True
    )

def create_coder() -> Agent:
    """Senior Developer agent - writes code."""
    return Agent(
        role="Senior Developer",
        goal="Write clean, efficient, well-tested code that solves problems elegantly",
        backstory="""You are a senior developer with deep expertise in Python, TypeScript,
        React, and system programming. You write code that is readable, maintainable,
        and follows best practices. You always consider edge cases and error handling.""",
        llm=get_llm(MODELS["coder"]),
        verbose=True,
        allow_delegation=False
    )

def create_tester() -> Agent:
    """QA Engineer agent - writes tests."""
    return Agent(
        role="QA Engineer",
        goal="Ensure code quality through comprehensive testing and edge case coverage",
        backstory="""You are a QA engineer who believes in test-driven development.
        You think about edge cases others miss. You write tests that catch bugs
        before they reach production. You know Jest, pytest, and testing patterns.""",
        llm=get_llm(MODELS["tester"]),
        verbose=True,
        allow_delegation=False
    )

def create_reviewer() -> Agent:
    """Code Reviewer agent - reviews code quality."""
    return Agent(
        role="Code Reviewer",
        goal="Ensure code quality, security, and adherence to best practices",
        backstory="""You are a meticulous code reviewer focused on security and quality.
        You catch potential bugs, security vulnerabilities, and suggest improvements.
        You know OWASP, SOLID principles, and clean code practices.""",
        llm=get_llm(MODELS["reviewer"]),
        verbose=True,
        allow_delegation=False
    )

def create_researcher() -> Agent:
    """Researcher agent - finds information."""
    return Agent(
        role="Technical Researcher",
        goal="Find relevant documentation, examples, and best practices",
        backstory="""You are a technical researcher who knows where to find information.
        You can quickly locate documentation, examples, and solutions.
        You synthesize information from multiple sources into actionable insights.""",
        llm=get_llm(MODELS["researcher"]),
        verbose=True,
        allow_delegation=False
    )

def create_docwriter() -> Agent:
    """Documentation Writer agent - writes docs."""
    return Agent(
        role="Technical Writer",
        goal="Create clear, comprehensive documentation that helps users succeed",
        backstory="""You are a technical writer who makes complex things simple.
        You write documentation that is clear, well-structured, and helpful.
        You know Markdown, JSDoc, docstrings, and documentation best practices.""",
        llm=get_llm(MODELS["docwriter"]),
        verbose=True,
        allow_delegation=False
    )

# Agent factory
AGENT_FACTORY = {
    "architect": create_architect,
    "coder": create_coder,
    "tester": create_tester,
    "reviewer": create_reviewer,
    "researcher": create_researcher,
    "docwriter": create_docwriter
}

# ============================================================================
# CREW ORCHESTRATION
# ============================================================================

def create_crew(task_description: str, agent_names: List[str]) -> Crew:
    """Create a crew for a specific task."""
    
    # Create requested agents
    agents = []
    for name in agent_names:
        if name in AGENT_FACTORY:
            agents.append(AGENT_FACTORY[name]())
        else:
            print(f"Warning: Unknown agent '{name}', skipping")
    
    if not agents:
        print("Error: No valid agents specified")
        sys.exit(1)
    
    # Create tasks for each agent
    tasks = []
    
    if "architect" in agent_names:
        tasks.append(Task(
            description=f"Analyze and design the architecture for: {task_description}",
            expected_output="Architecture design with components, data flow, and rationale",
            agent=next(a for a in agents if a.role == "Software Architect")
        ))
    
    if "coder" in agent_names:
        tasks.append(Task(
            description=f"Implement the solution for: {task_description}",
            expected_output="Working code with proper structure and error handling",
            agent=next(a for a in agents if a.role == "Senior Developer")
        ))
    
    if "tester" in agent_names:
        tasks.append(Task(
            description=f"Write tests for: {task_description}",
            expected_output="Comprehensive test suite covering edge cases",
            agent=next(a for a in agents if a.role == "QA Engineer")
        ))
    
    if "reviewer" in agent_names:
        tasks.append(Task(
            description=f"Review the code/design for: {task_description}",
            expected_output="Code review with security analysis and improvement suggestions",
            agent=next(a for a in agents if a.role == "Code Reviewer")
        ))
    
    if "researcher" in agent_names:
        tasks.append(Task(
            description=f"Research and gather information for: {task_description}",
            expected_output="Research findings with relevant documentation and examples",
            agent=next(a for a in agents if a.role == "Technical Researcher")
        ))
    
    if "docwriter" in agent_names:
        tasks.append(Task(
            description=f"Write documentation for: {task_description}",
            expected_output="Clear, comprehensive documentation in Markdown format",
            agent=next(a for a in agents if a.role == "Technical Writer")
        ))
    
    return Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,
        verbose=True
    )

def run_crew(task: str, agents: List[str]) -> str:
    """Execute a crew for a task."""
    print(f"\n{'='*60}")
    print(f"  CREWAI AGENT CREW")
    print(f"  Task: {task[:50]}...")
    print(f"  Agents: {', '.join(agents)}")
    print(f"{'='*60}\n")
    
    crew = create_crew(task, agents)
    result = crew.kickoff()
    
    print(f"\n{'='*60}")
    print(f"  CREW COMPLETED")
    print(f"{'='*60}\n")
    
    return str(result)

# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="CrewAI Agent Crew for Windsurf Vibe",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Available Agents:
  architect   - System design and architecture
  coder       - Code implementation
  tester      - Test writing and QA
  reviewer    - Code review and security
  researcher  - Documentation research
  docwriter   - Technical writing

Examples:
  python agent-crew.py --task "Create a REST API" --agents coder,tester
  python agent-crew.py --task "Design auth system" --agents architect,coder,reviewer
  python agent-crew.py --task "Document the API" --agents researcher,docwriter
        """
    )
    
    parser.add_argument("--task", required=True, help="Task description")
    parser.add_argument("--agents", required=True, help="Comma-separated agent names")
    parser.add_argument("--output", help="Output file for results")
    
    args = parser.parse_args()
    
    agents = [a.strip() for a in args.agents.split(",")]
    result = run_crew(args.task, agents)
    
    if args.output:
        with open(args.output, "w") as f:
            f.write(result)
        print(f"Results saved to {args.output}")
    else:
        print(result)
    
    return result

if __name__ == "__main__":
    main()
