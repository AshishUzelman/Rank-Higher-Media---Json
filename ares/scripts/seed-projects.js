/**
 * Seed the Firestore `projects` collection.
 * Safe to re-run — uses setDoc with merge so existing fields are preserved.
 * Run: node scripts/seed-projects.js
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const db = admin.firestore()
const Timestamp = admin.firestore.Timestamp
const now = Timestamp.now()

const PROJECTS = [
  // ── Products ────────────────────────────────────────────────────────────────
  {
    id: 'ares',
    name: 'ARES Platform',
    slug: 'ares',
    category: 'product',
    status: 'active',
    stack: 'Next.js 16, Tailwind 4, Firebase Web SDK v12, Ollama',
    firebase: 'ashish-ares',
    github: 'ashish-ares',
    localPath: '~/rank-higher-media/ares',
    description: 'Agentic Resource & Execution System — multi-agent orchestration dashboard with local LLMs.',
    notes: 'Dashboard live. Phase C pipeline verified. Phase B (dreaming) next.',
    openBlockers: ['Drive OAuth credentials.json pending'],
    taskCount: 0,
    startDate: Timestamp.fromDate(new Date('2026-01-01')),
    updatedAt: now,
  },
  {
    id: 'ad-creator',
    name: 'Ad Creator',
    slug: 'ad-creator',
    category: 'product',
    status: 'in-progress',
    stack: 'Next.js 15, Tailwind 3, Firebase (Auth/Firestore/Storage)',
    firebase: 'ashish-ad-creator',
    github: 'ashish-ad-creator',
    localPath: '~/ad-creator',
    description: 'AI-powered creative tool with canvas editor for generating ad assets.',
    notes: 'Deploy to Vercel (not Firebase Hosting).',
    openBlockers: ['Canvas editor implementation in progress'],
    taskCount: 0,
    startDate: Timestamp.fromDate(new Date('2026-02-01')),
    updatedAt: now,
  },
  {
    id: 'rank-higher-media',
    name: 'Rank Higher Media',
    slug: 'rank-higher-media',
    category: 'product',
    status: 'active',
    stack: 'Next.js 15, React 19, Tailwind, JS',
    firebase: 'rank-high-media',
    github: 'Rank-Higher-Media---Json',
    localPath: '~/rank-higher-media',
    description: 'Marketing site and hub monorepo for all Rank Higher Media products.',
    notes: 'rankhighermedia.com registered but DNS not yet configured.',
    openBlockers: ['DNS: add Vercel A/CNAME at registrar'],
    taskCount: 0,
    startDate: Timestamp.fromDate(new Date('2025-06-01')),
    updatedAt: now,
  },
  {
    id: 'mind-challenger-ai',
    name: 'Mind Challenger AI',
    slug: 'mind-challenger-ai',
    category: 'product',
    status: 'in-progress',
    stack: 'TBD',
    firebase: 'mindchallengeai',
    github: 'mind-challenger-ai',
    localPath: '~/mind-challenger-ai',
    description: 'AI-powered cognitive challenge and learning app.',
    notes: 'Separate Firebase account: mindchallengerai@gmail.com.',
    openBlockers: ['Stack not yet decided'],
    taskCount: 0,
    startDate: Timestamp.fromDate(new Date('2026-03-01')),
    updatedAt: now,
  },
  {
    id: 'pricing-saas',
    name: 'Pricing SaaS',
    slug: 'pricing-saas',
    category: 'product',
    status: 'concept',
    stack: 'TBD',
    firebase: 'ashish-pricing-saas',
    github: '',
    localPath: '',
    description: 'SaaS pricing management tool — concept stage.',
    notes: 'No spec yet.',
    openBlockers: ['Needs product spec'],
    taskCount: 0,
    startDate: Timestamp.fromDate(new Date('2026-04-01')),
    updatedAt: now,
  },

  // ── Agents ──────────────────────────────────────────────────────────────────
  {
    id: 'seo-report-agent',
    name: 'SEO Report Agent',
    slug: 'seo-report-agent',
    category: 'agent',
    status: 'in-progress',
    stack: 'ARES agent pipeline, qwen2.5-coder:7b, Firestore',
    firebase: 'ashish-ares',
    github: '',
    localPath: '~/rank-higher-media/ares/scripts',
    description: 'Automated SEO reporting agent — crawls rankings, pulls analytics, generates client-ready reports.',
    notes: 'Runs inside ARES. Claude plans the workflow, local models execute.',
    openBlockers: ['Needs workflow spec', 'GSC/GA4 API credentials'],
    taskCount: 0,
    startDate: Timestamp.fromDate(new Date('2026-04-19')),
    updatedAt: now,
  },

  // ── Solutions ────────────────────────────────────────────────────────────────
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    slug: 'web-scraper',
    category: 'solution',
    status: 'concept',
    stack: 'Node.js, Playwright or Puppeteer, Firestore',
    firebase: 'ashish-ares',
    github: '',
    localPath: '~/rank-higher-media/ares/scripts',
    description: 'Reusable web scraper solution — feeds data into ARES workflows and knowledge base.',
    notes: 'Built and maintained by local models. Claude defines the architecture.',
    openBlockers: ['Needs target site list and schema design'],
    taskCount: 0,
    startDate: Timestamp.fromDate(new Date('2026-04-19')),
    updatedAt: now,
  },
  {
    id: 'maze-generator',
    name: 'Maze Generator',
    slug: 'maze-generator',
    category: 'solution',
    status: 'parked',
    stack: 'Phaser.js, Firebase',
    firebase: 'TBD',
    github: '',
    localPath: '',
    description: 'Procedural maze generator with TikTok automation pipeline for content publishing.',
    notes: 'P3 — parked. Resume after core ARES pipeline is complete.',
    openBlockers: ['Parked — resume after ARES Phase B'],
    taskCount: 0,
    startDate: Timestamp.fromDate(new Date('2025-01-01')),
    updatedAt: now,
  },
]

async function seed() {
  console.log(`Seeding ${PROJECTS.length} projects...`)
  for (const project of PROJECTS) {
    const { id, ...data } = project
    await db.collection('projects').doc(id).set(data, { merge: true })
    const cat = data.category.padEnd(8)
    console.log(`  ✓ [${cat}] ${project.name} (${project.status})`)
  }
  console.log('\nDone.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
