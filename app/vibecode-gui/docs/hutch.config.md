# hutch configuration

## `hutch.config.ts`

- The `// @hutch cli=… cottontail=…` first line is the hutch template's stamp of the CLI and cottontail versions the project was generated with; it stays as hutch wrote it.
- `scripts` are the `hutch run` scripts listed in the README; every one that builds the webview runs `vite build` first, and `dev:hmr` runs the Vite dev server (`hmr`) beside the app (`start`).
- `electrobun.version` pins the Electrobun version.
