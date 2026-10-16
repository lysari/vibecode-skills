# Liquid Glass Wrapper & Directive

Physics-based optical glass shader for Angular applications. Re-creates the Apple WWDC 2025 "Liquid Glass" refraction look via runtime SVG filter displacement maps and specular rim highlights.

## Features

- **Physically Traced Refraction**: Uses vector Snell's law ray-tracing across custom dome profiles (`convex-squircle`, `convex-circle`, `concave`, `lip`).
- **Dynamic Specular Sheen**: Computes analytical surface normal to produce directional rim highlights with configurable intensity and sharpness.
- **Pointer-reactive Glow**: Tracks cursor movement with smooth radial illumination across the glass face.
- **Graceful Fallbacks**: Automatically falls back to high-fidelity CSS `backdrop-filter: blur(...) saturate(...)` on browsers that do not support SVG filter references in backdrop filters, or when running in test/headless environments.
- **Dual Delivery**:
  - `<x-liquid-glass>`: Wrapper component that nests projected content within layered DOM optical slices.
  - `[appLiquidGlass]`: Directive that injects optical layers directly into existing host elements without altering flex or CSS grid layouts.

## Inputs & Options

| Input | Type | Default | Description |
|---|---|---|---|
| `radius` / `lgRadius` | `number` | `24` | Outer corner radius in px. |
| `bezel` / `lgBezel` | `number` | `60` | Width of refracting rim zone in px. |
| `profile` / `lgProfile` | `LiquidGlassProfile` | `'convex-squircle'` | Cross-section dome curve profile. |
| `thickness` / `lgThickness` | `number` | `28` | Physical height of dome peak in px. |
| `depth` / `lgDepth` | `number` | `10` | Undertray gap distance in px. |
| `ior` / `lgIor` | `number` | `1.5` | Refractive index (1.5 window glass). |
| `tint` / `lgTint` | `string` | `'#ffffff'` | Color tint overlay. |
| `tintOpacity` / `lgTintOpacity` | `number` | `0.8` | Tint opacity (0..1). |
| `renderAs` / `lgRenderAs` | `'auto' \| 'blur' \| 'off'` | `'auto'` | Manual optical mode override. |
| `interactive` / `lgInteractive` | `boolean` | `true` | Enables pointer glow tracking. |
| `elevation` / `lgElevation` | `boolean` | `true` | Applies floating elevation drop shadow. |
| `disabled` / `lgDisabled` | `boolean` | `false` | Bypasses all glass layers completely. |

