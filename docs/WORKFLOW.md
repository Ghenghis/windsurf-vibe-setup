# Vibe Coding Workflow Guide

> Your daily guide to productive AI-assisted development

---

## What is Vibe Coding?

**Vibe coding** is a development approach coined by Andrej Karpathy where you:

1. **Describe** what you want in natural language
2. **Let AI** generate the code
3. **Review** and iterate
4. **Test** to verify it works

You focus on **WHAT** you want, AI handles **HOW** to build it.

---

## Daily Workflow

### Morning Setup (2 minutes)

```powershell
# 1. Open your project in Windsurf
cd C:\Users\YourName\Projects\my-project
windsurf .

# 2. Sync with remote (if using git)
git pull origin main
```

### Starting a New Feature

#### Step 1: Plan First (Don't Code Yet)

Open Cascade (`Ctrl+L`) and say:
```
Tell me your plan first; don't code.

I want to add a user login system with:
- Email/password authentication
- Remember me checkbox
- Forgot password flow
```

**Why**: Getting a plan first prevents wasted effort on wrong approaches.

#### Step 2: Ask for Options

```
Give me a few options for implementing this, starting with the simplest first.
Don't code yet.
```

**Why**: Simple solutions are easier to maintain.

#### Step 3: Build Vertically

Build one complete feature at a time:
```
Let's start with just the login form. Create:
1. The form component
2. The API endpoint
3. Basic validation

Show me the code for the form first.
```

**Why**: Complete features are testable; partial ones aren't.

#### Step 4: Review Before Applying

When AI shows code:
- **Read it** - Understand what it does
- **Check for issues** - Security, edge cases
- **Ask questions** - "What happens if the email is invalid?"

Then say:
```
Apply this change
```

#### Step 5: Test Immediately

After each change:
```powershell
# Run the app
npm run dev

# Check browser console (F12)
# Test the feature manually
```

If something breaks:
```
I'm getting this error: [paste error]
The login form shows but submitting does nothing.
```

---

## Effective Prompting

### Be Specific

**❌ Bad**:
```
Make a website
```

**✅ Good**:
```
Create a landing page for a dog grooming business with:
- Hero section with headline and CTA button
- Services section showing 3 services with prices
- Contact form at the bottom
- Mobile responsive design
- Use Tailwind CSS
```

### Provide Context

**❌ Bad**:
```
Add a button
```

**✅ Good**:
```
In the UserProfile component (src/components/UserProfile.tsx),
add a "Save Changes" button that:
- Appears at the bottom of the form
- Is disabled until the user makes changes
- Shows a loading spinner while saving
- Uses the existing Button component from our UI library
```

### Use Role Prompts

```
Act as a Senior React Engineer who is obsessed with performance.
Review this component and suggest optimizations.
```

```
Act as a Security Expert.
Review this authentication code for vulnerabilities.
```

---

## Keyboard Shortcuts

| Action | Shortcut | When to Use |
|--------|----------|-------------|
| Open Cascade | `Ctrl+L` | Ask AI anything |
| New Conversation | `Ctrl+Shift+L` | Start fresh topic |
| Accept Suggestion | `Tab` | Accept AI autocomplete |
| Fast Context | `Ctrl+Enter` | Faster AI responses |
| Toggle Write/Chat | `Ctrl+.` | Switch AI modes |
| Accept Diff | `Alt+Enter` | Apply code changes |
| Reject Diff | `Alt+Shift+Backspace` | Discard changes |

---

## Common Scenarios

### Fixing Bugs

```
I have a bug where [describe behavior].

Expected: [what should happen]
Actual: [what actually happens]

Here's the error from the console:
[paste error]

The relevant code is in [file path].
```

### Refactoring

```
This function is getting too long and complex.
Refactor it into smaller, well-named functions.
Keep the same external behavior.

[paste code]
```

### Adding Tests

```
Write unit tests for this function:
- Test the happy path
- Test edge cases (empty input, null values)
- Test error handling

[paste code]
```

### Understanding Code

```
Explain what this code does line by line.
I'm confused about [specific part].

[paste code]
```

### Converting Formats

```
Convert this Python code to JavaScript:

[paste Python code]
```

---

## Git Workflow with AI

### Commit Messages

```
Based on my changes, write a commit message following conventional commits format.
```

### Pull Request Description

```
Write a PR description for the changes I just made.
Include:
- Summary of changes
- Testing done
- Breaking changes (if any)
```

### Code Review

```
Review this pull request diff and point out:
- Potential bugs
- Security issues
- Performance concerns
- Code style issues

[paste diff]
```

---

## Project Organization

### When Starting New Projects

```
Set up a new [Python/Node.js/React] project with:
- Standard folder structure
- Git initialization
- Basic config files (eslint, prettier, etc.)
- README template
- .gitignore for [language]
```

### When Joining Existing Projects

```
I just joined this project. Help me understand:
1. What does this project do?
2. What's the folder structure?
3. How do I run it locally?
4. What are the main technologies used?

Look at the package.json and README.
```

---

## Safety Practices

### Always Do

- ✅ **Read AI-generated code** before applying
- ✅ **Test after every change**
- ✅ **Commit frequently** with meaningful messages
- ✅ **Check the browser console** for frontend work
- ✅ **Ask for explanations** when confused

### Never Do

- ❌ **Blindly accept** all changes
- ❌ **Skip testing** "just this once"
- ❌ **Commit secrets** (API keys, passwords)
- ❌ **Ignore error messages**
- ❌ **Delete files** without understanding why

---

## Using MCP Tools

### GitHub Operations

```
use github - List my recent repositories
use github - Create an issue titled "Bug: Login not working"
use github - Show me open pull requests
```

### Documentation Lookup

```
use context7 - How do I use React useEffect?
use context7 - Show me FastAPI route examples
```

### File Operations

```
Read the file at src/config/database.ts
List all Python files in the project
```

---

## Troubleshooting During Development

### AI Gives Wrong Code

```
That's not quite right. The issue is:
[explain the problem]

Try again with this constraint:
[add specific requirement]
```

### AI Forgets Context

```
Let me remind you:
- This is a React project using TypeScript
- We're building a user dashboard
- I already have authentication set up
- I need you to [continue task]
```

### Code Doesn't Work

```
The code you provided gives this error:
[paste exact error]

Looking at line [number], I think the issue is [your guess].
How should we fix this?
```

---

## End of Day Checklist

- [ ] Commit all changes with clear messages
- [ ] Push to remote repository
- [ ] Close any debugging browser tabs
- [ ] Note tomorrow's first task (optional)

```powershell
# Quick commit and push
git add .
git commit -m "feat: add user login functionality"
git push origin main
```

---

## Pro Tips

### 1. Use the "Rubber Duck" Method

Explain the problem to AI like you would to a rubber duck:
```
I'm trying to [goal], but [obstacle].
I've already tried [what you did].
I think the issue might be [your theory].
```

### 2. Iterative Refinement

Don't try to get perfect code in one prompt. Iterate:
```
Good start, but can you:
- Add error handling
- Make the function async
- Add TypeScript types
```

### 3. Save Good Prompts

When a prompt works well, save it for reuse:
```powershell
# Create a prompts folder
New-Item -ItemType Directory -Path ".\prompts"

# Save useful prompts
"Act as a Senior React Engineer..." > .\prompts\react-review.txt
```

### 4. Learn from AI

Ask AI to explain its decisions:
```
Why did you choose to use useReducer instead of useState here?
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                  VIBE CODING QUICK REF                  │
├─────────────────────────────────────────────────────────┤
│  PLAN   │ "Tell me your plan first; don't code"        │
│  BUILD  │ "Create [feature] with [requirements]"       │
│  FIX    │ "I get this error: [error]. Fix it."         │
│  REVIEW │ "Act as Security Expert. Review this."       │
│  TEST   │ "Write tests for this function"              │
│  LEARN  │ "Explain what this code does"                │
├─────────────────────────────────────────────────────────┤
│  Ctrl+L │ Open Cascade                                  │
│  Tab    │ Accept suggestion                            │
│  Ctrl+. │ Toggle Write/Chat mode                       │
└─────────────────────────────────────────────────────────┘
```

---

Happy vibe coding! 🚀
