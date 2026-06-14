# Security Rules

- No secrets/keys/tokens in code — env vars only
- Least privilege for all permissions
- Auth on all protected endpoints
- Validate + sanitize all user inputs
- Parameterized queries (prevent SQL injection)
- Escape output (prevent XSS)
- CSRF on state-changing ops
- Never log passwords/tokens/PII
- Encrypt sensitive data at rest + in transit
- Secure hashing: bcrypt/argon2
- Proper session management
- Keep deps updated, audit for vulnerabilities
