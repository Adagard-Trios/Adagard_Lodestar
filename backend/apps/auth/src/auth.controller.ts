import { Controller, Post, Get, Body, UseGuards, Request, Query, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Request() req) {
    return this.authService.me(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  getUsers(@Query('depot') depot?: string, @Query('role') role?: Role) {
    return this.authService.getUsers(depot, role);
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'auth' };
  }
}
