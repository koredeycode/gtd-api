import { Body, Controller, Delete, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeleteProfileDto, UpdateProfileDto, UserProfileResponseDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully.',
    type: UserProfileResponseDto,
  })
  getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully.',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete user profile (Soft delete)' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized or Invalid password.' })
  deleteProfile(@Request() req: any, @Body() dto: DeleteProfileDto) {
    return this.usersService.deleteProfile(req.user.userId, dto.password);
  }
}
