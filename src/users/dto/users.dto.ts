import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class DeleteProfileDto {
  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John', nullable: true })
  firstName: string | null;

  @ApiProperty({ example: 'Doe', nullable: true })
  lastName: string | null;
}
