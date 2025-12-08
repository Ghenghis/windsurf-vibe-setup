# React/Next.js Project Rules

## Project Type
This is a React/Next.js frontend application.

## Tech Stack
- React 18+ with hooks
- Next.js 14+ (App Router preferred)
- TypeScript strict mode
- TailwindCSS for styling
- Shadcn/ui for components

## Code Standards

### Components
- Use functional components with hooks
- Prefer named exports over default exports
- Keep components small and focused
- Use TypeScript interfaces for props

### File Structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
│   ├── ui/        # Base components (button, input, etc.)
│   └── features/  # Feature-specific components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── types/         # TypeScript type definitions
└── styles/        # Global styles
```

### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Types: PascalCase with descriptive names (`UserProfileProps`)

## Best Practices
- Always handle loading and error states
- Use React Query or SWR for data fetching
- Implement proper error boundaries
- Use Suspense for code splitting
- Memoize expensive computations
- Keep state as local as possible

## Don't Do
- No class components
- No inline styles (use Tailwind)
- No `any` types
- No console.log in production code
- No direct DOM manipulation
