#!/usr/bin/env node
/**
 * Seed missing Firestore collections with one example document each.
 * Uses firestore-client.js getDb() — same env loading, no duplicate config.
 *
 * Run: node scripts/seed_missing_collections.js
 */

const path = require('path')

// Reuse the existing db singleton from firestore-client
const { getDb } = require('./firestore-client')

const SEEDS = {
  articles: {
    title: 'Example Article — ARES Genesis',
    url: 'https://github.com/AshishUzelman/ashish-ares',
    source: 'manual',
    summary: 'Placeholder article used to initialize the articles collection.',
    tags: ['ai', 'ares', 'seed'],
    status: 'draft',
  },
  books: {
    title: 'Example Book',
    author: 'Seed Author',
    notes: 'Placeholder book document for the books collection.',
    tags: ['strategy', 'seed'],
  },
  seo_tool: {
    tool: 'ahrefs',
    dataType: 'keywords',
    client: 'example-client',
    data: { placeholder: true },
  },
  projects: {
    name: 'ARES Platform',
    status: 'active',
    stack: 'Next.js 16, Tailwind 4, Firebase Web SDK v12, JavaScript',
    localPath: '~/rank-higher-media/ares',
  },
}

const TIMESTAMP_FIELDS = {
  articles: 'createdAt',
  books: 'addedAt',
  seo_tool: 'fetchedAt',
  projects: 'updatedAt',
}

async function seedCollection(db, collectionName, payload, firestore) {
  const { collection, addDoc, serverTimestamp } = firestore
  const tsField = TIMESTAMP_FIELDS[collectionName]
  const doc = { ...payload, [tsField]: serverTimestamp() }

  try {
    const ref = await addDoc(collection(db, collectionName), doc)
    console.log(`  ✅ ${collectionName}: seeded doc ${ref.id}`)
    return true
  } catch (err) {
    console.error(`  ❌ ${collectionName}: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('\n🌱 Seeding missing Firestore collections...\n')

  const db = await getDb()
  if (!db) {
    console.error('❌ Firestore unavailable — check ares/.env.local has Firebase credentials')
    process.exit(1)
  }

  const firestore = await import('firebase/firestore')

  let success = 0
  let failed = 0

  for (const [name, payload] of Object.entries(SEEDS)) {
    const ok = await seedCollection(db, name, payload, firestore)
    if (ok) success++
    else failed++
  }

  console.log(`\n📊 Done: ${success} seeded, ${failed} failed`)
  console.log('   Collections: articles, books, seo_tool, projects\n')

  // Firestore SDK keeps connection open; exit cleanly.
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message)
  process.exit(1)
})
