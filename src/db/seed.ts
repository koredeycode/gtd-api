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

async function seed() {
  console.log('Seeding database...');

  // Cleanup
  await db.delete(schema.logs);
  await db.delete(schema.habits);
  await db.delete(schema.categories);
  await db.delete(schema.users);

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create 3 Users
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

    // Create Predefined Categories (if not exist)
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
    // If returning is empty (conflict), fetch them
    const allCategories = await db.select().from(schema.categories);

    // Create 2-3 Habits per category for this user
    for (const cat of allCategories) {
      const numHabits = faker.number.int({ min: 2, max: 3 });
      const habitsData = Array.from({ length: numHabits }).map(() => {
        const type = faker.helpers.arrayElement(['BOOLEAN', 'NUMERIC', 'TEXT', 'RATING', 'DURATION'] as const);
        let targetValue: number | null = null;
        if (type === 'NUMERIC') targetValue = faker.number.int({ min: 10, max: 100 });
        if (type === 'RATING') targetValue = 10;
        if (type === 'DURATION') targetValue = faker.number.int({ min: 15, max: 120 }); // minutes

        return {
          userId: user.id,
          categoryId: cat.id,
          title: faker.lorem.words(3),
          type,
          targetValue,
          frequencyJson: { type: 'daily' },
        };
      });

      const habits = await db.insert(schema.habits).values(habitsData).returning();

      // Create Logs for last 30 days
      for (const habit of habits) {
        const logsData: any[] = [];
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          // 70% chance of logging
          if (faker.datatype.boolean(0.7)) {
            let valNumeric: number | null = null;
            let valBool: boolean | null = null;
            let valText: string | null = null;

            if (habit.type === 'NUMERIC') {
              valNumeric = faker.number.int({ min: 0, max: (habit.targetValue || 100) + 20 });
            } else if (habit.type === 'BOOLEAN') {
              valBool = faker.datatype.boolean();
            } else if (habit.type === 'RATING') {
              valNumeric = faker.number.int({ min: 1, max: 10 });
            } else if (habit.type === 'DURATION') {
              valNumeric = faker.number.int({ min: 0, max: (habit.targetValue || 60) + 30 });
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
