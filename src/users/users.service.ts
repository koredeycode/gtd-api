import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../db/db.module';
import * as schema from '../db/schema';
import { users } from '../db/schema';
import { UpdateProfileDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async getProfile(userId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const [updatedUser] = await this.db.update(users)
      .set({
        firstName: dto.firstName,
        lastName: dto.lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
    };
  }

  async deleteProfile(userId: string, password: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.db.update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { message: 'Profile deleted successfully' };
  }
}
