# Scalability Rules

- No N+1 queries — eager load or batch
- Cache expensive operations
- Paginate large datasets
- Proper DB indexes
- Separation of concerns
- Dependency injection for testability
- Stateless services
- APIs designed for horizontal scaling
- Connection pooling
- Read replicas for read-heavy ops
- Background jobs for long-running tasks
- Message queues for async communication
- Retry with exponential backoff
