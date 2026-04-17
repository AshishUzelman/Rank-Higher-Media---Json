const admin = require('firebase-admin');
const serviceAccount = require('./ashish-ares-firebase-adminsdk-fbsvc-c7bbbbb37e.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ashish-ares.firebaseio.com'
});

const db = admin.firestore();
const collections = ['articles', 'books', 'seo_tool', 'projects'];
const seedData = {
  articles: [
    {
      id: 'article_1',
      title: 'Understanding Firestore',
      content: 'Firestore is a NoSQL document database...',
      author: 'Alex Johnson',
      publishedAt: admin.firestore.Timestamp.fromDate(new Date('2023-01-15')),
      tags: ['database', 'firebase', 'NoSQL']
    },
    {
      id: 'article_2',
      title: 'Optimizing Queries',
      content: 'Best practices for efficient Firestore queries...',
      author: 'Maria Garcia',
      publishedAt: admin.firestore.Timestamp.fromDate(new Date('2023-02-20')),
      tags: ['performance', 'optimization', 'firebase']
    }
  ],
  books: [
    {
      id: 'book_1',
      title: 'The Art of Data Modeling',
      author: 'Robert Chen',
      genre: 'Technology',
      publishedYear: 2021,
      pages: 342
    },
    {
      id: 'book_2',
      title: 'Firebase for Web Development',
      author: 'Sarah Williams',
      genre: 'Programming',
      publishedYear: 2022,
      pages: 415
    }
  ],
  seo_tool: [
    {
      id: 'seo_tool_1',
      toolName: 'Keyword Analyzer',
      description: 'Comprehensive keyword research tool',
      lastUsed: admin.firestore.Timestamp.fromDate(new Date('2023-03-10')),
      version: '2.3.1'
    }
  ],
  projects: [
    {
      id: 'project_1',
      name: 'Customer Portal',
      description: 'Web-based customer management system',
      status: 'active',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2022-11-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2023-06-30'))
    },
    {
      id: 'project_2',
      name: 'Analytics Dashboard',
      description: 'Real-time business analytics platform',
      status: 'completed',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2022-08-15')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2023-02-28'))
    }
  ]
};

async function seedCollections() {
  try {
    for (const collection of collections) {
      // Check if collection is already seeded (via 'seeded' marker document)
      const markerDoc = await db.collection(collection).doc('seed').get();

      if (!markerDoc.exists) {
        console.log(`Seeding collection: ${collection}`);

        // Write seed data
        for (const item of seedData[collection]) {
          await db.collection(collection).doc(item.id).set(item);
        }

        // Create seeding marker
        await db.collection(collection).doc('seed').set({
          seeded: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Successfully seeded ${collection} collection`);
      } else {
        console.log(`⏭️ Collection ${collection} already seeded, skipping`);
      }
    }
    console.log('✅ All collections seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding collections:', error);
    process.exit(1);
  }
}

// Execute seeding
seedCollections();
