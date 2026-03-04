# Rank Higher Media — CLAUDE.md

## Project Overview
Marketing website for **Rank Higher Media**, a digital SEM/PPC agency. Built with Next.js 15 App Router, React 19, and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 15 (App Router, standalone output)
- **UI**: React 19 + Tailwind CSS 3
- **Icons**: lucide-react
- **Language**: JavaScript (no TypeScript, jsconfig.json with `@/*` → `src/*` path alias)
- **Linting**: ESLint with eslint-config-next
- **Image processing**: sharp

## Project Structure
```
src/
  app/
    layout.js        # Root layout (imports globals.css)
    page.js          # Home page entry
    globals.css      # Global styles
  components/
    RankHigherMedia.js  # Main marketing page component
```

## Dev Commands
```bash
npm run dev    # Start dev server (Next.js)
npm run build  # Production build
npm run start  # Serve production build
```

## Key Conventions
- **App Router only** — no `pages/` directory
- **JavaScript** (`.js`), not TypeScript — do not add `.ts`/`.tsx` files
- **No TypeScript** — jsconfig.json handles path aliases, not tsconfig
- Path alias: `@/` maps to `src/`
- `next.config.js` sets `output: 'standalone'` and `trailingSlash: true` — keep both
- Tailwind classes only for styling — no CSS Modules or inline styles unless absolutely necessary
- Components live in `src/components/`

## Deployment
- Vercel (standalone output mode configured)
- Environment: Node.js

## Notes
- `package.json` lists all dependencies (including transitive) directly — avoid restructuring without reason
- `src/app/page.js.save` is a scratch file — ignore it
- The main component `RankHigherMedia.js` is a single-file React component; keep it self-contained
