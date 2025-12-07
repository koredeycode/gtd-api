import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class GenerateHabitsDto {
  @ApiProperty({ description: 'The goal for which habits should be generated', example: 'Improve physical health' })
  @IsString()
  @IsNotEmpty()
  goal: string;

  @ApiProperty({ description: 'List of categories to generate habits for', example: ['Fitness', 'Nutrition'] })
  @IsArray()
  @IsString({ each: true })
  categories: string[];
}
