# Electrobun configuration

## `electrobun.config.ts`

- `app`: the display name, bundle identifier and version.
- `build.bun.entrypoint`: the main process, `src/bun/index.ts`.
- `build.copy`: Vite builds the webview to `dist/`, and Electrobun copies it from there into `views/mainview`.
- `build.watchIgnore`: Vite's output is ignored in watch mode; HMR handles view rebuilds separately.
- CEF is not bundled on any platform; the app uses the system webview.
