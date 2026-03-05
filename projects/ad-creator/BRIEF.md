# Ad Creator Web App — BRIEF

## Status: 🟡 Ready to Build
## Firebase Project: `ashish-ad-creator` ✅ Created 2026-03-04
## Priority: P1 — Build next

---

## What It Is
A web-based ad creative editor. Users upload images, layer text/logos, apply effects, and export to platform-specific sizes (Facebook, Instagram, etc.). Subscription + token system gates features and usage.

---

## Tech Stack (Ashish defaults)
- **Framework:** Next.js 15 (App Router) + React
- **Language:** JavaScript (no TypeScript — ignore TS interfaces in spec, translate to JS)
- **Styling:** Tailwind CSS only
- **Auth:** Firebase Auth (Google SSO)
- **Database:** Firestore (user profiles, projects, token transactions, subscriptions)
- **Storage:** Firebase Storage (uploaded images, exported creatives)
- **Image processing:** HTML5 Canvas API (browser-side) + sharp (server-side via Next.js API routes)
- **Icons:** lucide-react
- **Payments:** Stripe (for subscription plans)
- **Hosting:** Vercel

---

## Core Features

### 1. Canvas Editor
- Multi-layer canvas (HTML5 Canvas — each layer its own canvas element)
- Layer types: `image`, `text`, `logo`
- Per-layer controls: position, opacity, blend mode, effects
- Layer reordering (z-index management)
- Undo/redo (limited history stack — memory management)

### 2. Image Processing
- Input: JPEG, PNG, WebP — max 10MB
- Adjustments: brightness, contrast, saturation
- Resize with aspect ratio lock (Lanczos3 algorithm)
- Output formats: JPG, PNG
- Platform presets:
  - Facebook: 1200×628
  - Instagram: 1080×1080
  - (expandable)

### 3. User & Subscription System
- Roles: `admin` | `tester` | `free` | `premium`
- Plans:
  | Plan | Price | Monthly Tokens | Projects | Features |
  |---|---|---|---|---|
  | Free | $0 | 5 | 1 | Basic editing, single export |
  | Basic | $9.99 | 50 | 10 | Basic editing, bulk export, templates |
  | Premium | $29.99 | 200 | Unlimited | All features + API access |

### 4. Token System
- Token costs:
  - Single image: 1 token
  - Bulk generation: 3 tokens
  - Custom size: 2 tokens
  - Advanced editing: 2 tokens
- Transactions stored in Firestore: `credit` | `debit` with reason + timestamp

### 5. Admin / Testing Environment
- Invite testers by email (with token allowance + expiry)
- Revoke/adjust tester access
- View token usage reports
- Testing metrics dashboard

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profile, role, token balance, subscription status |
| `projects` | Canvas state, layers, export settings per project |
| `token_transactions` | Full token ledger (credit/debit history) |
| `subscriptions` | Plan, active status, start/end date, token allowance |
| `testing_access` | Tester invites, limits, expiry |

---

## API Routes (Next.js `/app/api/`)

```
POST   /api/images/upload
POST   /api/images/process
GET    /api/images/presets
POST   /api/projects/save
GET    /api/projects/[id]
GET    /api/users/me
PUT    /api/users/me
GET    /api/subscriptions/plans
POST   /api/subscriptions/subscribe
PUT    /api/subscriptions/cancel
GET    /api/subscriptions/status
GET    /api/tokens/balance
POST   /api/tokens/purchase
GET    /api/tokens/history
POST   /api/testing/invite
PUT    /api/testing/access
GET    /api/testing/metrics
```

---

## Performance Rules
- Lazy load project assets
- Clear canvas on project switch
- Limit undo stack (e.g. 20 steps max)
- Cache processed images in IndexedDB
- Use WebP output with JPG/PNG fallback

---

## Security Rules
- RBAC: validate role before every privileged operation
- Check token balance before any token-debit operation
- Sanitize all image file inputs before processing
- Rate limit per user (Firebase rules + server-side)
- Stripe handles payment data — never store card info

---

## Error Codes
| Code | Meaning |
|---|---|
| ERR_IMG_PROC | Image processing failure |
| ERR_INVALID_DIM | Invalid dimensions |
| ERR_STORAGE_FULL | Storage quota exceeded |
| ERR_INSUFFICIENT_TOKENS | Not enough tokens |
| ERR_EXPIRED_TESTING | Tester access expired |
| ERR_INVALID_SUBSCRIPTION | Subscription invalid/expired |
| ERR_EXCEEDED_LIMITS | Plan limit hit |

---

## Project Structure (target)
```
/ad-creator/              ← separate GitHub repo
  src/
    app/
      layout.js
      page.js             ← landing / login
      dashboard/          ← project list
      editor/[id]/        ← canvas editor
      admin/              ← admin + testing controls
      api/                ← all API routes
    components/
      canvas/             ← Canvas, Layer, Toolbar
      editor/             ← controls, effects panel
      ui/                 ← shared UI components
    lib/
      firebase.js         ← Firebase init
      tokens.js           ← token logic
      imageProcessor.js   ← canvas utilities
    hooks/                ← useAuth, useTokens, useCanvas
```

---

## Build Order (MVP first)
1. Auth (Firebase Google SSO) + user creation in Firestore
2. Project CRUD (create, save, load from Firestore)
3. Canvas editor — image upload + basic layer system
4. Export to platform sizes (Facebook, Instagram)
5. Token deduction on export
6. Subscription plans UI + Stripe integration
7. Admin dashboard (tester invites, token management)
8. Testing environment controls

---

## Open Items
- [ ] Create GitHub repo: `ashish-ad-creator`
- [ ] Scaffold Next.js project with Firebase
- [ ] Set up Stripe account + webhook endpoint
- [ ] Design canvas component architecture before coding
