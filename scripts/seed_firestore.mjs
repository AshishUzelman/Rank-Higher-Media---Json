#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCcOV3WOHZIebqtztwO1pwb6FQj1vqqfRI',
  authDomain: 'ashish-ares.firebaseapp.com',
  projectId: 'ashish-ares',
  storageBucket: 'ashish-ares.firebasestorage.app',
  messagingSenderId: '333169188273',
  appId: '1:333169188273:web:be103539e109e75701b190'
};

if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase config missing');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedFirestore() {
  console.log('🌱 Seeding Firestore with test data...\n');

  try {
    // Projects
    await setDoc(doc(db, 'projects', 'ares_dashboard_v1'), {
      name: 'ARES Dashboard',
      client: 'Internal',
      status: 'active',
      updated: new Date(),
      createdAt: new Date(),
      description: 'Main ARES agent orchestration dashboard'
    });
    console.log('✅ Added project: ARES Dashboard');

    await setDoc(doc(db, 'projects', 'ad_creator_v2'), {
      name: 'Ad Creator',
      client: 'Internal',
      status: 'active',
      updated: new Date(),
      createdAt: new Date(),
      description: 'Creative canvas tool with AI integration'
    });
    console.log('✅ Added project: Ad Creator');

    // Tasks
    await setDoc(doc(db, 'agent_inbox', 'task_dashboard_components'), {
      title: 'Build Dashboard Components',
      description: 'Create ArticleCard, BookManager, SEOWidget',
      status: 'completed',
      created: new Date(),
      priority: 'high',
      assignedTo: 'qwen3'
    });
    console.log('✅ Added task: Dashboard Components');

    await setDoc(doc(db, 'agent_inbox', 'task_firestore_seed'), {
      title: 'Seed Firestore Collections',
      description: 'Add sample data for dashboard testing',
      status: 'in-progress',
      created: new Date(),
      priority: 'medium',
      assignedTo: 'claude'
    });
    console.log('✅ Added task: Firestore Seed');

    // Agent Status
    await setDoc(doc(db, 'agent_state', 'qwen'), {
      status: 'idle',
      model: 'qwen3:30b-a3b',
      currentTask: null,
      lastUpdate: new Date(),
      tokensUsed: 45000
    });
    console.log('✅ Added agent: Qwen (idle)');

    await setDoc(doc(db, 'agent_state', 'gemma'), {
      status: 'idle',
      model: 'gemma3:12b',
      currentTask: null,
      lastUpdate: new Date(),
      tokensUsed: 12000
    });
    console.log('✅ Added agent: Gemma (idle)');

    await setDoc(doc(db, 'agent_state', 'claude'), {
      status: 'active',
      model: 'claude-sonnet-4-6',
      currentTask: 'task_firestore_seed',
      lastUpdate: new Date(),
      tokensUsed: 89000
    });
    console.log('✅ Added agent: Claude (active)');

    // Brainstorm History
    await setDoc(doc(db, 'brainstorm_history', 'brainstorm_ares_architecture'), {
      topic: 'ARES Agent Architecture',
      summary: 'Debated multi-tier agent system with supervisor pattern and local LLM routing.',
      date: new Date(),
      participants: ['qwen3', 'gemma3', 'claude'],
      rounds: 3,
      approved: true
    });
    console.log('✅ Added brainstorm: ARES Architecture');

    // Articles
    await setDoc(doc(db, 'articles', 'article_llm_routing'), {
      title: 'Optimizing LLM Routing in Multi-Agent Systems',
      author: 'Ashish Uzelman',
      tags: ['ai', 'agents', 'llm', 'architecture'],
      summary: 'Exploration of actor-critic patterns and MoE routing for agent coordination.',
      publishedAt: new Date('2026-04-10'),
      createdAt: new Date()
    });
    console.log('✅ Added article: LLM Routing');

    // Books
    await setDoc(doc(db, 'books', 'book_designing_agents'), {
      title: 'Designing Multi-Agent Systems',
      author: 'OpenAI Research Team',
      year: 2024,
      status: 'reading',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Added book: Designing Agents');

    // SEO Tool Data
    await setDoc(doc(db, 'seo_tool', 'seo_main'), {
      keywordsTracked: 145,
      keywordsTrend: 'up',
      backlinks: 312,
      backlinksTrend: 'up',
      organicTraffic: 4250,
      trafficTrend: 'up',
      domainAuthority: 42,
      authorityTrend: 'neutral',
      topKeywords: ['ai agents', 'llm routing', 'ares platform', 'local models', 'brainstorm ai'],
      insights: 'Organic traffic up 23% YoY. Strong growth in agent-related keywords.',
      lastUpdated: new Date()
    });
    console.log('✅ Added SEO data');

    console.log('\n✨ Seeding complete! Refresh dashboard to see data.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error.message);
    process.exit(1);
  }
}

seedFirestore();
