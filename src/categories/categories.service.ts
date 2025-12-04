import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { categories } from '../db/schema';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(categories);
  }
}
