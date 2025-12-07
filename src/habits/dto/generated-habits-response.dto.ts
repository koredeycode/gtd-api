import { ApiProperty } from '@nestjs/swagger';

export class GeneratedHabitDto {
  @ApiProperty({ description: 'The title of the generated habit', example: 'Drink 2L of water' })
  title: string;
}

export class GeneratedCategoryDto {
  @ApiProperty({ description: 'The name of the category', example: 'Health' })
  name: string;

  @ApiProperty({ type: [GeneratedHabitDto], description: 'List of habits for this category' })
  habits: GeneratedHabitDto[];
}

export class GeneratedHabitsResponseDto {
  @ApiProperty({ type: [GeneratedCategoryDto], description: 'List of categories with generated habits' })
  categories: GeneratedCategoryDto[];
}
