import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DB_CONNECTION } from './../src/db/db.module';
import * as schema from './../src/db/schema';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;
  let jwtToken: string;
  let userId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    db = app.get(DB_CONNECTION);
    // Clean up
    await db.delete(schema.logs);
    await db.delete(schema.habits);
    await db.delete(schema.categories);
    await db.delete(schema.users);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(response.body.access_token).toBeDefined();
    jwtToken = response.body.access_token;
    const decoded: any = jwt.decode(jwtToken);
    userId = decoded.sub;
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(response.body.access_token).toBeDefined();
  });

  it('Setup Category', async () => {
    const [cat] = await db.insert(schema.categories).values({
      userId: userId,
      name: 'Health',
      color: 'red',
    }).returning();
    categoryId = cat.id;
  });

  it('/api/v1/sync (POST) - Push', async () => {
    const habitId = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        last_pulled_at: 0,
        changes: {
          habits: {
            created: [{
              id: habitId,
              user_id: userId,
              category_id: categoryId,
              title: 'Test Habit',
              type: 'BOOLEAN',
              frequency_json: {},
            }],
            updated: [],
            deleted: []
          },
          logs: { created: [], updated: [], deleted: [] }
        }
      })
      .expect(201);
      
    expect(response.body.changes).toBeDefined();
  });

  it('/api/v1/sync (POST) - Pull', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        last_pulled_at: 0,
        changes: {
          habits: { created: [], updated: [], deleted: [] },
          logs: { created: [], updated: [], deleted: [] }
        }
      })
      .expect(201);

    expect(response.body.changes.habits.updated.length).toBeGreaterThan(0);
    expect(response.body.changes.habits.updated[0].title).toBe('Test Habit');
  });

  it('/analytics/radar (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/radar')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body.labels).toContain('Health');
    expect(response.body.data).toBeDefined();
  });
});
