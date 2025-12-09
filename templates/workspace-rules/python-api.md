# Python API Project Rules

## Project Type

This is a Python backend API application.

## Tech Stack

- Python 3.11+
- FastAPI or Django REST Framework
- SQLAlchemy or Django ORM
- Pydantic for validation
- Poetry or pip for dependencies

## Code Standards

### File Structure

```
src/
├── api/           # API routes/endpoints
│   └── v1/        # API versioning
├── core/          # Core configuration
├── models/        # Database models
├── schemas/       # Pydantic schemas
├── services/      # Business logic
├── repositories/  # Data access layer
└── utils/         # Helper functions
tests/
├── unit/          # Unit tests
├── integration/   # Integration tests
└── fixtures/      # Test data
```

### Naming Conventions

- Files: snake_case (`user_service.py`)
- Classes: PascalCase (`UserService`)
- Functions: snake_case (`get_user_by_id`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Type Hints

- Always use type hints for function parameters and returns
- Use `Optional[]` for nullable values
- Use Pydantic models for request/response schemas

## Best Practices

- Separate concerns: routes → services → repositories
- Use dependency injection
- Write docstrings for all public functions
- Handle exceptions gracefully
- Use async/await for I/O operations
- Log important operations

## Testing

- Aim for 80%+ test coverage
- Use pytest with fixtures
- Mock external dependencies
- Test edge cases and error paths

## Don't Do

- No business logic in route handlers
- No raw SQL without parameterization
- No hardcoded secrets
- No print statements (use logging)
- No global mutable state
