# Go Rules

Apply these on top of the generic rules when the project root has a `go.mod`.

## Directory structure (Standard Go layout)
- Put application entry points in `cmd/<app-name>/main.go`; keep `main.go` minimal (parse environment flags, wire dependencies, and start servers).
- Put private application code in `internal/<package>/`; never place application business logic in the root directory or in `pkg/` unless intended as an imported public library.
- Organize packages by domain responsibility (`internal/order/`, `internal/user/`), keeping HTTP/gRPC handlers, service logic, and repository interfaces together in the domain package.

## Error handling
- Check `if err != nil` immediately after every function call that returns an error; never discard errors with `_`.
- Wrap errors with context before propagating up the call stack using `fmt.Errorf("fetching user %d: %w", id, err)`.
- Use custom error types or sentinel errors (`var ErrNotFound = errors.New(...)`) for conditions callers must inspect, and check them using `errors.Is()` or `errors.As()`.

## Interfaces and structs
- Accept interfaces, return structs: declare interfaces in the client package where they are consumed, not in the package that implements them.
- Keep interfaces small (1 to 3 methods), e.g. `type UserFinder interface { Find(ctx context.Context, id string) (*User, error) }`.
- Return pointers for large structs or mutable state (`*User`); return value types for small immutable objects and primitives.

## Concurrency and context
- Pass `context.Context` as the first argument in all functions performing I/O, database queries, or external network requests (`ctx context.Context`).
- Never start a goroutine without a deterministic cancellation path; manage goroutine lifecycles using `sync.WaitGroup`, channels, or `ctx.Done()`.

