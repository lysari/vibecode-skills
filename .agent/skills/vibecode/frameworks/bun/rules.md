# Bun Rules

Apply these on top of the generic rules when the project root has a `bunfig.toml` or `bun.lockb` / `bun.lock`.

## Runtime and native APIs
- Use Bun's native high-performance APIs instead of importing third-party or Node.js polyfill libraries where available: use `Bun.file()` for file reads, `Bun.write()` for writes, `Bun.password` for hashing, and `Bun.serve()` for HTTP servers.
- Use `bun:test` (`describe`, `test`, `expect`) as the test runner; do not install Jest or Mocha for Bun projects.
- Run TypeScript files directly via `bun run` or `bun <file>.ts`; do not introduce intermediate build or transpile steps unless bundling a frontend distribution.

## Server architecture
- Structure `Bun.serve()` applications into route handlers, services, and repositories under `src/`; never write database logic or business rules directly inside `fetch(req)`.
- Use `URL` and `req.method` pattern matching or dedicated lightweight routers (e.g. Hono on Bun) for endpoint dispatching.
- Return native `Response.json(payload, { status })` instances with explicit HTTP status codes for all API endpoints.

## Process and error handling
- Handle unhandled promise rejections with `process.on('unhandledRejection')` in server entry points; never let uncaught errors terminate the server silently.
- Type incoming JSON payloads using schema validation (e.g. TypeBox or Zod) before passing them to service functions.

