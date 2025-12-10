import { Body, Controller, Get, Post, Query, ValidationPipe } from '@nestjs/common';
import { Public } from '@/features/auth/decorators/public.decorator';
import { BukService, type BukUsersDebugPayload, type BukUsersPaginatedResponse } from './buk.service';
import { CreateBukUserDto } from './dto/create-buk-user.dto';

@Controller('buk')
export class BukController {
  constructor(private readonly bukService: BukService) {}

  @Get('users')
  @Public()
  getUsers(@Query('page') page?: string, @Query('pageSize') pageSize?: string): Promise<BukUsersPaginatedResponse> {
    const parsedPage = Number(page);
    const parsedPageSize = Number(pageSize);
    return this.bukService.fetchUsers(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedPageSize) ? parsedPageSize : 10,
    );
  }

  @Get('users/debug')
  @Public()
  getUsersDebug(): Promise<BukUsersDebugPayload> {
    return this.bukService.fetchUsersDebug();
  }

  @Post('users/register')
  @Public()
  registerUser(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) createDto: CreateBukUserDto,
  ): Promise<unknown> {
    return this.bukService.registerBukUser(createDto);
  }
}
