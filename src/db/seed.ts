import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

const HABIT_TEMPLATES: Record<string, any[]> = {
  'Health & Fitness': [
    { title: 'Drink 2L Water', type: 'NUMERIC', targetValue: 2000, unit: 'ml' },
    { title: 'Morning Jog', type: 'DURATION', targetValue: 30, unit: 'mins' },
    { title: 'No Sugar', type: 'BOOLEAN' },
    { title: 'Sleep 8 Hours', type: 'DURATION', targetValue: 480, unit: 'mins' },
    { title: 'Gym Workout', type: 'BOOLEAN' },
  ],
  'Work & Career': [
    { title: 'Deep Work Session', type: 'DURATION', targetValue: 120, unit: 'mins' },
    { title: 'Clear Inbox', type: 'BOOLEAN' },
    { title: 'Networking', type: 'TEXT' },
    { title: 'Learn New Skill', type: 'DURATION', targetValue: 45, unit: 'mins' },
  ],
  'Personal Development': [
    { title: 'Read Book', type: 'DURATION', targetValue: 30, unit: 'mins' },
    { title: 'Journaling', type: 'TEXT' },
    { title: 'Meditation', type: 'DURATION', targetValue: 15, unit: 'mins' },
  ],
  'Finance': [
    { title: 'Track Expenses', type: 'BOOLEAN' },
    { title: 'No Impulse Buy', type: 'BOOLEAN' },
    { title: 'Savings Contribution', type: 'NUMERIC', targetValue: 100, unit: '$' },
  ],
  'Social & Relationships': [
    { title: 'Call Parents', type: 'BOOLEAN' },
    { title: 'Date Night', type: 'BOOLEAN' },
    { title: 'Hangout with Friends', type: 'TEXT' },
  ],
  'Mindfulness & Spirituality': [
    { title: 'Morning Gratitude', type: 'TEXT' },
    { title: 'Prayer/Meditation', type: 'DURATION', targetValue: 20, unit: 'mins' },
  ],
  'Hobbies & Creativity': [
    { title: 'Play Guitar', type: 'DURATION', targetValue: 30, unit: 'mins' },
    { title: 'Painting', type: 'BOOLEAN' },
    { title: 'Coding Side Project', type: 'DURATION', targetValue: 60, unit: 'mins' },
  ],
  'Home & Environment': [
    { title: 'Tidy Room', type: 'BOOLEAN' },
    { title: 'Water Plants', type: 'BOOLEAN' },
    { title: 'Laundry', type: 'BOOLEAN' },
  ],
};

async function seed() {
  console.log('Seeding database with realistic data...');

  // Cleanup
  await db.delete(schema.feedback);
  await db.delete(schema.logs);
  await db.delete(schema.habits);
  await db.delete(schema.categories);
  await db.delete(schema.users);

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users
  const usersData = [
    { email: 'user1@example.com', firstName: 'Alice', lastName: 'Smith' },
    { email: 'user2@example.com', firstName: 'Bob', lastName: 'Jones' },
    { email: 'user3@example.com', firstName: 'Charlie', lastName: 'Brown' },
  ];

  for (const uData of usersData) {
    const [user] = await db.insert(schema.users).values({
      email: uData.email,
      passwordHash: hashedPassword,
      firstName: uData.firstName,
      lastName: uData.lastName,
    }).returning();

    console.log(`Created user: ${user.email}`);

    // Create Predefined Categories
    const predefinedCategories = [
      { name: 'Health & Fitness', color: '#FF5733' },
      { name: 'Work & Career', color: '#33FF57' },
      { name: 'Personal Development', color: '#3357FF' },
      { name: 'Finance', color: '#F1C40F' },
      { name: 'Social & Relationships', color: '#9B59B6' },
      { name: 'Mindfulness & Spirituality', color: '#1ABC9C' },
      { name: 'Hobbies & Creativity', color: '#E67E22' },
      { name: 'Home & Environment', color: '#34495E' },
    ];

    const categories = await db.insert(schema.categories).values(predefinedCategories).onConflictDoNothing().returning();
    const allCategories = await db.select().from(schema.categories);

    // Create Habits for this user
    for (const cat of allCategories) {
      const templates = HABIT_TEMPLATES[cat.name] || [];
      // Pick 2-4 random templates for this category
      const selectedTemplates = faker.helpers.arrayElements(templates, faker.number.int({ min: 2, max: 4 }));

      for (const template of selectedTemplates) {
        const [habit] = await db.insert(schema.habits).values({
          userId: user.id,
          categoryId: cat.id,
          title: template.title,
          type: template.type,
          targetValue: template.targetValue,
          frequencyJson: { type: 'daily' },
        }).returning();

        // Generate Logs for 6-12 months
        const daysToLog = faker.number.int({ min: 180, max: 365 });
        const logsData: any[] = [];

        for (let i = 0; i < daysToLog; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          // 60-80% consistency
          if (faker.datatype.boolean(0.7)) {
            let valNumeric: number | null = null;
            let valBool: boolean | null = null;
            let valText: string | null = null;

            if (habit.type === 'NUMERIC') {
              // Variance around target
              const variance = faker.number.int({ min: -20, max: 20 });
              valNumeric = Math.max(0, (habit.targetValue || 100) + variance);
            } else if (habit.type === 'BOOLEAN') {
              valBool = true; // Usually if they log, they did it. Or could be mixed.
            } else if (habit.type === 'RATING') {
              valNumeric = faker.number.int({ min: 3, max: 10 });
            } else if (habit.type === 'DURATION') {
              const variance = faker.number.int({ min: -10, max: 30 });
              valNumeric = Math.max(5, (habit.targetValue || 30) + variance);
            } else {
              valText = faker.lorem.sentence();
            }

            logsData.push({
              habitId: habit.id,
              userId: user.id,
              date: dateStr,
              valNumeric,
              valBool,
              valText,
            });
          }
        }

        // Batch insert logs (chunking to avoid query size limits if needed, but 365 is fine)
        if (logsData.length > 0) {
          await db.insert(schema.logs).values(logsData);
        }
      }
    }
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
