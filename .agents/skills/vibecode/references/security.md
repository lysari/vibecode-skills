# Security

## Secrets
- Keep secrets, tokens, API keys, and chat or account ids out of source files, tests, fixtures, and logs. Read them from the project's environment or config mechanism.
- Commit an example file (`.env.example`) with placeholder values, never the real values.
- Keep secrets on the server. Never ship one in code or config that runs on the user's device or in their browser.
- When a real secret was committed, tell the user to rotate it. Deleting it in a new commit leaves it in the history.

## Untrusted input
- Treat everything from outside the process as untrusted: request bodies, query strings, headers, cookies, uploaded files, webhooks, third-party responses, and stored data that users wrote.
- Validate input where it enters, against the expected type, shape, length, and allowed values, and reject what does not match. Never only strip the characters you think are bad.
- Never paste raw, untrusted input directly into database queries, system commands, file paths, HTML templates, or code evaluation. Use safe parameters or built-in escaping instead.
- Resolve a file path built from untrusted input and check it stays inside the allowed directory before using it, e.g. reject `../../etc/passwd`.
- Check an uploaded file's type from its content and enforce a size limit. Store it outside the served code directory under a generated name, never the name the user sent.
- Never deserialize untrusted data with a format that can create arbitrary objects or run code. Use a plain data format such as JSON.

## Access control
- Enforce every permission on the server. Hiding a button, link, or route in the UI is not a check.
- Check user permissions on the record or resource itself (such as verifying who owns it), not just on the page or route.
- Take the current user's identity from the verified session, never from a field the client sends, e.g. ignore a `userId` in the request body.
- Write access rules as narrow as the feature needs. Never add a blanket allow.
- Start every new endpoint, rule, or role with no access, and grant only what the feature needs.

## Authentication and sessions
- Use the project's existing auth library or provider. Never write your own password hashing, token signing, or encryption.
- Store passwords only as a slow, salted hash from a maintained library. Never store them in plain text or with reversible encryption.
- Compare secrets and tokens with a constant-time comparison.
- Give session, reset, and invite tokens an expiry, and invalidate session tokens on logout and password change.
- Mark session cookies `HttpOnly`, `Secure`, and `SameSite`, and protect state-changing requests that rely on cookies against cross-site request forgery.
- Rate limit login, signup, password reset, and any other endpoint that can be guessed or abused.
- Return the same error for an unknown account and a wrong password.

## Outbound requests and user data
- Never send user content (text, files, messages, copied data, URLs) to a third-party service, or fetch it automatically, unless the request needs it. Tell the user when a change starts sending data out.
- Fetch a URL that came from a user only over an allowed scheme, and refuse private, loopback, link-local, and internal addresses. Check the address the connection actually uses, and check again on every redirect. Limit hosts to an allow-list only when the feature targets known hosts, e.g. a webhook to one provider, never for a feature that must open any public page.
- Never put secrets, tokens, or personal data in URLs or query strings.
- Use encrypted transport for every network call that carries credentials or user data. Never disable certificate verification.

## Logging and errors
- Never log secrets, tokens, passwords, payment details, or personal data. Log an id or a redacted value instead.
- Show users a generic error message. Keep stack traces and internal details in server logs.

## Dependencies and config
- Check runtime versions, system interpreters, and container base images against security advisories for known critical or high severity CVEs before pinning them. Never specify an end-of-life runtime or unpatched version with known remote code execution vulnerabilities, e.g. check advisories before declaring runtime constraints or base images.
- Never expose script interpreters, runtime CLI binaries, or CGI handlers directly to external network input without sanitizing command-line arguments.
- Verify a new dependency's name, maintainer activity, and authenticity on its official registry before installing. Never install a guessed, unverified, or hallucinated package name.
- Inspect install scripts (such as preinstall, postinstall, or build hooks) for arbitrary command execution, network calls, or binary downloads before running them. Disable lifecycle scripts during initial install when evaluating an unfamiliar dependency, e.g. install with `--ignore-scripts`.
- Check lockfile diffs after adding or upgrading a dependency to confirm no unexpected transitive packages or modified download sources were added.
- Run the project's dependency audit after adding or upgrading a dependency when the project has one, and report the advisories it finds.
- Keep debug modes, verbose errors, and test accounts out of production config.
- Allow cross-origin access only from the origins the feature needs. Never combine a wildcard origin with credentials.
