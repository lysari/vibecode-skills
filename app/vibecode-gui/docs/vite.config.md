# Vite configuration

## `vite.config.ts`

Builds the webview from `src/mainview` into `dist/` with the React plugin and the Electrobun aliases from the hutch devkit. The dev server runs on port 5173 (`strictPort`), the port `src/bun/index.ts` looks for in the `dev` channel.

## `src/mainview/vite-env.d.ts`

Loads Vite's client types (`vite/client`), which declare stylesheet and asset imports such as `import "./index.scss"` in `main.tsx`, and `import.meta.env`. Without it, editors whose TypeScript checks side-effect imports (`noUncheckedSideEffectImports`) report that `./index.scss` cannot be found. It sits in `src/mainview/` rather than in `tsconfig.json` `types`, which would stop `@types/bun` from loading for `src/bun/` and the tests.
