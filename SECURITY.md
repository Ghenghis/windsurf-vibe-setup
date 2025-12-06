# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### Do NOT

- Open a public GitHub issue
- Disclose the vulnerability publicly before it's fixed
- Exploit the vulnerability

### Do

1. **Email**: Send details to the repository owner via GitHub
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Action | Timeframe |
|--------|-----------|
| Initial Response | 48 hours |
| Vulnerability Assessment | 7 days |
| Fix Development | 14-30 days |
| Public Disclosure | After fix released |

## Security Best Practices

### Configuration Security

This project includes security-focused configurations:

#### Command Deny List
```json
"windsurf.cascadeCommandsDenyList": [
    "rm -rf /",
    "rm -rf ~",
    "rm -rf *",
    "sudo rm",
    "del /s /q",
    "format",
    "DROP TABLE",
    "DROP DATABASE",
    "TRUNCATE",
    "DELETE FROM",
    "shutdown",
    "reboot",
    "mkfs",
    "dd if="
]
```

#### Safe Command Allow List
```json
"windsurf.cascadeCommandsAllowList": [
    "git",
    "npm",
    "yarn",
    "pnpm",
    "pip",
    "python",
    "node",
    "docker",
    "docker-compose",
    "pytest",
    "make",
    "cargo",
    "dotnet"
]
```

### File Exclusions

Sensitive files are excluded from indexing:
- `.env` files
- Credential files
- Private keys
- API tokens

### Recommendations

1. **Never commit secrets** to the repository
2. **Use environment variables** for sensitive data
3. **Review command deny lists** before making changes
4. **Keep configurations updated** with security patches
5. **Audit extensions** before installing

## Security Features

### Implemented

- [x] Command execution deny list
- [x] Safe command allow list
- [x] File watcher exclusions for sensitive patterns
- [x] Search exclusions for credential files
- [x] Security-focused CI/CD checks

### Planned

- [x] Automated secret scanning (`npm run scan:secrets`)
- [x] Dependency vulnerability alerts (`npm run scan:deps`)
- [ ] Security audit logging

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve our security.
