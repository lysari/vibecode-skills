# Node.js Server Rules

Apply these on top of the generic rules when the project root has a `package.json` with `"express"`, `"fastify"`, or `"hono"`.

## Architecture and layering
- Separate the application into 3 distinct layers: HTTP routes and controllers (`src/controllers/` or `src/routes/`), business services (`src/services/`), and data access (`src/repositories/` or `src/models/`); never write database queries directly inside an HTTP route handler.
- Put shared middleware (authentication, rate limiting, request logging, error handling) in `src/middlewares/`, e.g. `src/middlewares/auth.middleware.ts`.
- Separate app configuration from network listener: export the app instance in `src/app.ts` and call `app.listen()` in `src/server.ts` or `src/index.ts` so test suites can mount the app without binding network ports.

## Error handling
- Pass all caught errors from async route handlers to the centralized error middleware via `next(err)` or an async wrapper; never leave unhandled Promise rejections.
- Return consistent JSON error envelopes from the central error middleware, e.g. `{ error: 'NOT_FOUND', message: 'Item not found', statusCode: 404 }`.
- Never expose internal database stack traces or SQL errors in HTTP responses sent to external clients.

## Request validation
- Validate all incoming route params, query strings, and request bodies at the route boundary using a schema validator (Zod, TypeBox, or Joi) before passing control to services, e.g. `schema.parse(req.body)`.
- Type request objects with the parsed schema output instead of casting with `as unknown as RequestBody`.

## Outbound requests
- Block internal addresses for user-supplied URLs with a `net.BlockList` checked inside the request's `lookup` option, so the address checked is the address the connection uses.
- Never add `::ffff:0:0/96` to a `net.BlockList`; Node matches it against every IPv4 address and blocks all of them. IPv4-mapped addresses such as `::ffff:127.0.0.1` are already caught by the IPv4 subnets.

