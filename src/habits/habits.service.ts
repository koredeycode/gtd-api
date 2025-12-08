import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { CreateBulkHabitsDto } from './dto/create-bulk-habits.dto';

export interface GeneratedHabit {
  title: string;
}

export interface GeneratedCategory {
  name: string;
  habits: GeneratedHabit[];
}

export interface GeneratedHabitsResponse {
  categories: GeneratedCategory[];
}

@Injectable()
export class HabitsService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateHabits(
    goal: string,
    categories: string[],
  ): Promise<GeneratedHabitsResponse> {
    if (!this.genAI) {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');

      if (!apiKey) {
        throw new InternalServerErrorException(
          'GEMINI_API_KEY is not configured',
        );
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are a helpful habit coach. The user has the following goal: "${goal}".
      They want to build habits in these categories: ${categories.join(', ')}.

      Please generate a list of 2-3 specific, actionable habits for each category that will help the user achieve their goal.
      
      For each habit, specify:
      - title: A short, clear name for the habit.

      Return the response as a valid JSON object with the following structure:
      {
        "categories": [
          {
            "name": "Category Name",
            "habits": [
              { "title": "Habit Title" }
            ]
          }
        ]
      }
      
      Do not include any markdown formatting (like \`\`\`json) in the response. Return strictly the raw JSON string.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text();

      // Clean up markdown code blocks if present (just in case)
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');

      return JSON.parse(text) as GeneratedHabitsResponse;
    } catch (error) {
      console.error('Error generating habits:', error);
      throw new InternalServerErrorException('Failed to generate habits');
    }
  }

  async createBulkHabits(userId: string, dto: CreateBulkHabitsDto) {
    console.log('Creating bulk habits for user:', userId, 'with data:', dto);
    const createdHabits: (typeof schema.habits.$inferSelect)[] = [];

    for (const catData of dto.categories) {
      for (const title of catData.habits) {
        const [habit] = await this.db
          .insert(schema.habits)
          .values({
            userId,
            categoryId: catData.categoryId,
            title,
            frequencyJson: {
              type: 'daily',
              days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
          })
          .returning();
        createdHabits.push(habit);
      }
    }

    return createdHabits;
  }
}
