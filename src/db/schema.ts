import { relations } from 'drizzle-orm';
import { boolean, date, index, json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';


export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('email_idx').on(table.email),
]);

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const habits = pgTable('habits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  title: text('title').notNull(),
  frequencyJson: json('frequency_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('habits_user_id_idx').on(table.userId),
  index('habits_category_id_idx').on(table.categoryId),
]);

export const logs = pgTable('logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  habitId: uuid('habit_id').references(() => habits.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(), // Denormalized
  date: date('date').notNull(),
  text: text('text'),
  value: boolean('value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('logs_user_id_idx').on(table.userId),
  index('logs_habit_id_idx').on(table.habitId),
]);

export const feedback = pgTable('feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
  logs: many(logs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  habits: many(habits),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [habits.categoryId],
    references: [categories.id],
  }),
  logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  habit: one(habits, {
    fields: [logs.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [logs.userId],
    references: [users.id],
  }),
}));
