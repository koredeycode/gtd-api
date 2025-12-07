import { ApiProperty } from '@nestjs/swagger';

export class HabitResponseDto {
  @ApiProperty({ description: 'The unique identifier of the habit' })
  id: string;

  @ApiProperty({ description: 'The user ID the habit belongs to' })
  userId: string;

  @ApiProperty({ description: 'The category ID the habit belongs to' })
  categoryId: string;

  @ApiProperty({ description: 'The title of the habit', example: 'Morning Jog' })
  title: string;

  @ApiProperty({ 
    description: 'The frequency configuration of the habit',
    example: { type: 'daily', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
  })
  frequencyJson: Record<string, any>;

  @ApiProperty({ description: 'The creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'The last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'The deletion timestamp', required: false, nullable: true })
  deletedAt: Date | null;
}
