# Sajau

**Make your screenshots shine with frame.**

Sajau is a browser-based tool for decorating and beautifying screenshots and short animations with clean, branded borders. Upload a PNG, video, or GIF, pick a layout style, and export a polished asset in seconds — all client-side, with no server upload required.

**Live site:** [https://sajau.netlify.app/](https://sajau.netlify.app/)

## Features

- **PNG export** — Add branded frames to static screenshots and download or copy to clipboard
- **GIF & video export** — Convert videos (up to 30 seconds) or existing GIFs into branded animations using FFmpeg in the browser
- **Style presets** — Centered, top-left, top-right, bottom-left, and bottom-right layouts
- **Padding options** — 11px, 22px, and 44px border sizes with matching rounded corners
- **Quality presets** — High, balanced, and optimized settings for GIF output (resolution, FPS, and color palette)
- **Drag, drop, and paste** — Quick upload from the file picker, drag-and-drop, or clipboard paste
- **Brand variants** — Dedicated routes for partner/product branding (Docs-to-Help, Tigg, Programiz)

## Routes

| Path                   | Description                  |
| ---------------------- | ---------------------------- |
| `/`                    | Reduct landing page          |
| `/editor`              | Main editor (PNG by default) |
| `/editor?format=gif`   | Editor in GIF/video mode     |
| `/gif-editor`          | Redirects to GIF mode        |
| `/docs-to-help`        | Docs-to-Help branded landing |
| `/docs-to-help/editor` | Docs-to-Help editor          |
| `/tigg`                | Tigg branded landing         |
| `/tigg/editor`         | Tigg editor                  |
| `/programiz`           | Programiz branded editor     |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm

### Install and run

```sh
git clone https://github.com/reduct-nepal/sajau.git
cd sajau
npm install
npm run dev
```

The dev server starts with Vite. Open the URL shown in the terminal (typically `http://localhost:5173`).

### Other scripts

```sh
npm run build        # Production build
npm run build:dev    # Development-mode build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

## Deployment

The app is hosted on [Netlify](https://www.netlify.com/) at [https://sajau.netlify.app/](https://sajau.netlify.app/).

## How it works

**PNG mode** renders a live preview with your chosen style preset and exports the framed result using `html-to-image`.

**GIF mode** loads [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) in the browser to transcode uploaded video or GIF input, then applies rounded-corner branding with `gifenc`. Media is validated client-side (max 100 MB; videos max 30 seconds).

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [React Router](https://reactrouter.com/) for routing
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) for in-browser video/GIF conversion
- [html-to-image](https://github.com/bubkoo/html-to-image) for PNG export
- [gifenc](https://github.com/mattdesl/gifenc) for GIF post-processing

## Project structure

```
src/
├── pages/          # Landing pages and editors
├── components/     # UI, preview, and control panels
├── hooks/          # FFmpeg loading and conversion logic
└── lib/            # Export, styling, and validation utilities
```
