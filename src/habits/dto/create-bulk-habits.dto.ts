import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

export class CategoryHabitsDto {
  @ApiProperty({ example: 'uuid-string', description: 'ID of the category' })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example: ['Morning Jog', 'Drink Water'],
    description: 'List of habit titles for this category',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  habits: string[];
}

export class CreateBulkHabitsDto {
  @ApiProperty({
    type: [CategoryHabitsDto],
    description: 'List of categories and their associated habits',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryHabitsDto)
  categories: CategoryHabitsDto[];
}
