# RPC types

## `src/shared/skills-rpc.interface.ts`

- `SkillsRPC`: the Electrobun RPC schema between the processes. `bun.requests` are the requests the webview sends to the main process; `webview.messages` are the messages the main process sends to the webview.
- `SessionRef`: the project and id that name a session in a request.
- `RunEventMessage`: a run event of a session, streamed from the main process to the webview.
