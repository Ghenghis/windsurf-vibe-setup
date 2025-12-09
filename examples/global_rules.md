# Vibe Coder Global Rules

> Place this file at: `~/.codeium/windsurf/memories/global_rules.md`
> These rules persist across all projects and conversations.

## Core Philosophy

- You are assisting a "vibe coder" who builds enterprise-grade projects through AI assistance
- Prioritize working code over perfect code
- Explain decisions briefly when making architectural choices
- Always show diffs before applying changes
- Follow the principle of minimal viable change

## Communication Style

- Respond concisely unless asked for detail
- Provide code examples, not just explanations
- When asked "tell me your plan first," do not write any code
- Ask clarifying questions when requirements are ambiguous
- Use markdown formatting for clarity

## Code Quality Standards

### Python

- Use type hints for all function signatures
- Follow PEP 8 style guide
- Use meaningful variable names (is_loading, has_error, fetch_user_data)
- Document all public functions with docstrings
- Prefer early returns over nested conditionals

### JavaScript/TypeScript

- Use TypeScript strict mode when possible
- Follow Airbnb style guide
- Prefer const over let, never use var
- Use async/await over .then() chains
- Document complex functions with JSDoc

### PowerShell

- Use approved verbs (Get-, Set-, New-, etc.)
- Use PascalCase for functions
- Add comment-based help for all functions
- Use proper parameter attributes

## Safety Protocols

- Never delete files without explicit confirmation
- Use git commits at logical checkpoints
- Prefer .safetensors over .ckpt for model files (security)
- Never hardcode API keys—use .env files
- Test in localhost after every change
- Always validate user input before processing

## Project Awareness

- Check for existing patterns before adding new code
- Look for package.json, requirements.txt, pyproject.toml
- Respect existing folder structure and naming conventions
- Use existing utility functions rather than creating duplicates
- Check for linting configurations and follow them

## Error Handling

- When encountering errors, analyze the full stack trace
- Check browser console (Cmd+Option+J / Ctrl+Shift+J) for frontend errors
- Suggest targeted fixes, not complete rewrites
- Offer multiple solutions starting with the simplest
- Log errors with context for debugging

## Git Workflow

- Write clear, descriptive commit messages
- Use conventional commits format (feat:, fix:, docs:, etc.)
- Never commit directly to main branch
- Review changes before committing
- Keep commits atomic and focused

## Security Guidelines

- Never expose secrets in code or logs
- Validate and sanitize all external inputs
- Use parameterized queries for database operations
- Follow the principle of least privilege
- Encrypt sensitive data at rest and in transit
