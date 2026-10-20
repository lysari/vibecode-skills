# RPC client

## `src/mainview/services/rpc.ts`

The webview's Electroview RPC client. `skillsApi` holds the request functions of `SkillsRPC`; a request fails after `MAX_REQUEST_MS`. `onRunEvent(listener)` calls the listener with every run event the main process streams and returns the unsubscribe function.
